import { describe, it, expect } from "vitest";
import { resolveScheduleInterval, SCHEDULE_MAP } from "../../../../src/tools/ci/schedule-map.js";

describe("resolveScheduleInterval", () => {
  it("translates friendly aliases to PascalCase", () => {
    expect(resolveScheduleInterval("daily")).toBe("TwentyFour");
    expect(resolveScheduleInterval("24h")).toBe("TwentyFour");
    expect(resolveScheduleInterval("12h")).toBe("Twelve");
    expect(resolveScheduleInterval("6h")).toBe("Six");
    expect(resolveScheduleInterval("1h")).toBe("One");
    expect(resolveScheduleInterval("none")).toBe("NotScheduled");
    expect(resolveScheduleInterval("off")).toBe("NotScheduled");
  });

  it("passes PascalCase API values through unchanged", () => {
    expect(resolveScheduleInterval("TwentyFour")).toBe("TwentyFour");
    expect(resolveScheduleInterval("Twelve")).toBe("Twelve");
    expect(resolveScheduleInterval("Six")).toBe("Six");
    expect(resolveScheduleInterval("One")).toBe("One");
    expect(resolveScheduleInterval("NotScheduled")).toBe("NotScheduled");
  });

  it("returns the input unchanged when not in the map", () => {
    expect(resolveScheduleInterval("UnknownValue")).toBe("UnknownValue");
  });

  it("exports SCHEDULE_MAP with all expected keys", () => {
    expect(Object.keys(SCHEDULE_MAP)).toEqual(
      expect.arrayContaining([
        "daily",
        "24h",
        "12h",
        "6h",
        "1h",
        "none",
        "off",
        "TwentyFour",
        "Twelve",
        "Six",
        "One",
        "NotScheduled"
      ])
    );
  });
});
