const USER_ID_KEY = "userId";
const LEGACY_USER_ID_KEY = "userID";
const ID_TOKEN_KEY = "idToken";

const readItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Unable to read session key: ${key}`, error);
    return null;
  }
};

export const getUserId = () => {
  const userId = readItem(USER_ID_KEY);
  if (userId) return userId;

  // One-time compatibility migration for sessions created by older builds.
  const legacyUserId = readItem(LEGACY_USER_ID_KEY);
  if (!legacyUserId) return null;

  try {
    localStorage.setItem(USER_ID_KEY, legacyUserId);
    localStorage.removeItem(LEGACY_USER_ID_KEY);
  } catch (error) {
    console.error("Unable to migrate the legacy user ID", error);
  }

  return legacyUserId;
};

export const setUserId = (userId) => {
  if (!userId) return;

  localStorage.setItem(USER_ID_KEY, userId);
  localStorage.removeItem(LEGACY_USER_ID_KEY);
};

export const setAuthSession = ({ userId }) => {
  setUserId(userId);
  localStorage.removeItem(ID_TOKEN_KEY);
};

export const clearAuthSession = () => {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(LEGACY_USER_ID_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
};
