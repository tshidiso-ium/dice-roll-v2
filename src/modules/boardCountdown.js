export const BOARD_JOIN_SAFETY_MS = 5000;

export const calculateTimeLeft = (closesAt, now = Date.now(), safetyMs = 0) => {
  const closeTime = new Date(closesAt).getTime();
  if (!Number.isFinite(closeTime)) return null;

  // Firebase stores an ISO instant. Compare UTC epochs directly so locale
  // and daylight-saving conversions cannot shift the closing time.
  const normalizedSafetyMs = Math.max(0, Number(safetyMs) || 0);
  const difference = closeTime - now - normalizedSafetyMs;
  if (difference <= 0) return null;

  const totalSeconds = Math.ceil(difference / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};
