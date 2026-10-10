/**
 * Server-Side Resolution Timer & WAT (West Africa Time / UTC+1) Utilities
 * Strictly calculates durations from server timestamps to prevent client-side manipulation.
 */

export interface DurationBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  totalHours: number;
  formatted: string;
}

/**
 * Returns current server timestamp in ISO UTC format
 */
export function getServerTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculates exact elapsed duration between two UTC timestamps
 */
export function calculateDuration(startTime: string | Date, endTime: string | Date = new Date()): DurationBreakdown {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (isNaN(start) || isNaN(end) || end < start) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMinutes: 0,
      totalHours: 0,
      formatted: "0 Seconds",
    };
  }

  const diffMs = end - start;
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = parseFloat((totalMinutes / 60).toFixed(2));

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "Day" : "Days"}`);
  if (hours > 0 || days > 0) parts.push(`${hours} ${hours === 1 ? "Hour" : "Hours"}`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`);
  parts.push(`${seconds} ${seconds === 1 ? "Second" : "Seconds"}`);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMinutes,
    totalHours,
    formatted: parts.join(" "),
  };
}

/**
 * Converts a UTC timestamp into West Africa Time (WAT: UTC+1) format
 * Example: "08 Oct 2026, 11:32:15 WAT"
 */
export function formatWAT(dateInput: string | Date | null | undefined, includeSeconds = true): string {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  // Use Intl.DateTimeFormat with Africa/Lagos timezone (UTC+1)
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: includeSeconds ? "2-digit" : undefined,
    hour12: true,
  }).format(date);
}

/**
 * Checks if a complaint is overdue based on target SLA hours
 */
export function isComplaintOverdue(
  createdAt: string,
  targetHours: number,
  status: string,
  resolvedAt?: string | null
): boolean {
  if (status === "RESOLVED" || status === "CLOSED") {
    if (!resolvedAt) return false;
    const dur = calculateDuration(createdAt, resolvedAt);
    return dur.totalHours > targetHours;
  }
  const currentDur = calculateDuration(createdAt, new Date());
  return currentDur.totalHours > targetHours;
}

/**
 * SLA Target hours default map
 */
export const SLA_TARGETS = {
  Normal: 72,   // 3 days
  Urgent: 48,   // 2 days
  Low: 96,      // 4 days
  Medium: 72,   // 3 days
  High: 48,     // 2 days
  Critical: 24, // 1 day
};

export function formatDurationMinutes(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  return parts.join(" ");
}
