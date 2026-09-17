import {
  clearAuthSession,
  getUserId,
  setAuthSession,
} from "./sessionStorage";

beforeEach(() => localStorage.clear());

test("migrates the legacy userID key to userId", () => {
  localStorage.setItem("userID", "legacy-user");

  expect(getUserId()).toBe("legacy-user");
  expect(localStorage.getItem("userId")).toBe("legacy-user");
  expect(localStorage.getItem("userID")).toBeNull();
});

test("stores only the canonical user ID and clears legacy credentials", () => {
  localStorage.setItem("idToken", "legacy-token");
  setAuthSession({ userId: "current-user", idToken: "token" });

  expect(getUserId()).toBe("current-user");
  expect(localStorage.getItem("idToken")).toBeNull();

  clearAuthSession();
  expect(getUserId()).toBeNull();
  expect(localStorage.getItem("idToken")).toBeNull();
});
