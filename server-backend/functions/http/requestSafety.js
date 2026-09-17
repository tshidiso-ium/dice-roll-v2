"use strict";

const crypto = require("crypto");

const extractBearerToken = (authorization) => {
  if (typeof authorization !== "string") return null;
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] || null;
};

const requestContext = (req, res, next) => {
  const supplied = req.get("x-request-id");
  const requestId = typeof supplied === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
  req.requestId = requestId;
  res.set("x-request-id", requestId);
  res.set("x-content-type-options", "nosniff");
  res.set("referrer-policy", "no-referrer");
  next();
};

const createRateLimiter = ({windowMs, max, scope}) => {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const token = extractBearerToken(req.headers.authorization);
    const identity = token
      ? crypto.createHash("sha256").update(token).digest("hex")
      : req.ip || req.socket?.remoteAddress || "unknown";
    const key = `${scope}:${identity}`;
    const current = buckets.get(key);

    if (!current || now >= current.resetAt) {
      buckets.set(key, {count: 1, resetAt: now + windowMs});
    } else if (current.count >= max) {
      res.set("retry-after", String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))));
      return res.status(429).json({
        error: {code: "RATE_LIMITED", message: "Too many requests. Please try again shortly."},
        requestId: req.requestId,
      });
    } else {
      current.count += 1;
    }

    if (buckets.size > 5000) {
      for (const [bucketKey, bucket] of buckets) {
        if (now >= bucket.resetAt) buckets.delete(bucketKey);
      }
    }
    return next();
  };
};

const safeErrorResponse = (req, res, error) => {
  const status = Number(error?.status);
  const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  const code = typeof error?.code === "string" ? error.code : "INTERNAL_ERROR";
  const message = safeStatus >= 500
    ? "An unexpected error occurred"
    : error?.message || "Request failed";

  console.error("Request failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    code,
    message: error?.message || "Unknown error",
  });

  return res.status(safeStatus).json({error: {code, message}, requestId: req.requestId});
};

module.exports = {createRateLimiter, extractBearerToken, requestContext, safeErrorResponse};
