import { BOARD_JOIN_SAFETY_MS, calculateTimeLeft } from "./boardCountdown";

describe("calculateTimeLeft", () => {
  const now = Date.parse("2026-09-11T10:00:00.000Z");

  test("keeps a board visible throughout its 20-second join window", () => {
    expect(
      calculateTimeLeft("2026-09-11T10:00:20.000Z", now)
    ).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 20 });
  });

  test("rounds a partial final second up", () => {
    expect(
      calculateTimeLeft("2026-09-11T10:00:00.100Z", now)
    ).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1 });
  });

  test("hides expired or invalid boards", () => {
    expect(calculateTimeLeft("2026-09-11T10:00:00.000Z", now)).toBeNull();
    expect(calculateTimeLeft("not-a-date", now)).toBeNull();
  });

  test("hides boards inside the join safety window", () => {
    expect(
      calculateTimeLeft(
        "2026-09-11T10:00:05.000Z",
        now,
        BOARD_JOIN_SAFETY_MS
      )
    ).toBeNull();
    expect(
      calculateTimeLeft(
        "2026-09-11T10:00:06.000Z",
        now,
        BOARD_JOIN_SAFETY_MS
      )
    ).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1 });
  });
});
