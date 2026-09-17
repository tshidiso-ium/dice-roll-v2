import {buildApiUrl} from "./apiClient";

jest.mock("./firebase", () => ({auth: {currentUser: null}}));

test("buildApiUrl encodes query values and normalizes slashes", () => {
  const url = buildApiUrl("app", "/joinBoard", {userId: "a b", empty: null});
  expect(url.pathname).toBe("/joinBoard");
  expect(url.searchParams.get("userId")).toBe("a b");
  expect(url.searchParams.has("empty")).toBe(false);
});
