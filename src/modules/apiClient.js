import { auth } from "./firebase";

const DEFAULT_ENDPOINTS = {
  app: "https://app-2wtihj5jvq-uc.a.run.app",
  payments: "https://payments-2wtihj5jvq-uc.a.run.app",
  uploader: "https://uploader-2wtihj5jvq-uc.a.run.app",
};

const ENDPOINTS = {
  app: process.env.REACT_APP_API_BASE_URL || DEFAULT_ENDPOINTS.app,
  payments: process.env.REACT_APP_PAYMENTS_API_BASE_URL || DEFAULT_ENDPOINTS.payments,
  uploader: process.env.REACT_APP_UPLOAD_API_BASE_URL || DEFAULT_ENDPOINTS.uploader,
};

export class ApiError extends Error {
  constructor(message, { status = 0, code = "REQUEST_FAILED", requestId = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export const buildApiUrl = (service, path, query = {}) => {
  const baseUrl = ENDPOINTS[service];
  if (!baseUrl) throw new Error(`Unknown API service: ${service}`);
  const url = new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
};

const currentSession = async () => {
  if (typeof auth.authStateReady === "function") await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    throw new ApiError("Your session has expired. Please log in again.", {
      status: 401,
      code: "SESSION_REQUIRED",
    });
  }
  return {userId: user.uid, idToken: await user.getIdToken()};
};

export const apiRequest = async (
  service,
  path,
  {method = "GET", query = {}, body, headers = {}, authenticated = true, includeUserId = false} = {}
) => {
  const session = authenticated ? await currentSession() : null;
  const requestQuery = includeUserId && session
    ? {...query, userId: session.userId}
    : query;
  const requestHeaders = new Headers(headers);
  if (session) requestHeaders.set("Authorization", `Bearer ${session.idToken}`);

  let requestBody = body;
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(buildApiUrl(service, path, requestQuery), {
    method,
    headers: requestHeaders,
    body: requestBody,
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const serverError = payload?.error;
    throw new ApiError(
      serverError?.message ||
        (typeof serverError === "string" && serverError) ||
        payload?.message ||
        (typeof payload === "string" && payload) ||
        "Request failed",
      {
        status: response.status,
        code: serverError?.code || "REQUEST_FAILED",
        requestId: payload?.requestId || response.headers.get("x-request-id"),
      }
    );
  }

  return {data: payload, session, response};
};
