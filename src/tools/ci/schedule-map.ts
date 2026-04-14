export const SCHEDULE_MAP: Record<string, string> = {
  daily: "TwentyFour",
  "24h": "TwentyFour",
  "12h": "Twelve",
  "6h": "Six",
  "1h": "One",
  none: "NotScheduled",
  off: "NotScheduled",
  TwentyFour: "TwentyFour",
  Twelve: "Twelve",
  Six: "Six",
  One: "One",
  NotScheduled: "NotScheduled"
};

/**
 * Resolve a friendly or API-native schedule interval to the PascalCase value
 * required by the Data Cloud POST/PATCH API.
 *
 * Returns the input unchanged if it's not in the map.
 */
export function resolveScheduleInterval(input: string): string {
  return SCHEDULE_MAP[input] ?? input;
}
