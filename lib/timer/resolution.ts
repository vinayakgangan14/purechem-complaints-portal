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
 * SLA Constants as per Purechem Quality Management Policy:
 * - Response SLA: 48 Hours to acknowledge/validate by Rajesh Poojari (QC Manager)
 * - Resolution SLA: 7 Working Days to investigate and close
 */
export const SLA_RESPONSE_HOURS = 48; // 2 days
export const SLA_RESOLUTION_WORKING_DAYS = 7; // 7 working days

/**
 * Calculates working days (excluding Saturdays and Sundays) between two dates
 */
export function getWorkingDays(startDate: string | Date, endDate: string | Date = new Date()): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
  }
  return count;
}

/**
 * Checks if response/acknowledgement is overdue (> 48 hours without QC validation)
 */
export function isResponseOverdue(
  createdAt: string,
  acknowledgedAt?: string | null,
  status?: string
): boolean {
  if (status === "REJECTED" || status === "RESOLVED" || status === "CLOSED") return false;
  if (acknowledgedAt) {
    const start = new Date(createdAt).getTime();
    const ack = new Date(acknowledgedAt).getTime();
    return (ack - start) / (1000 * 3600) > SLA_RESPONSE_HOURS;
  }
  const dur = calculateDuration(createdAt, new Date());
  return dur.totalHours > SLA_RESPONSE_HOURS;
}

/**
 * Checks if resolution is overdue (> 7 working days from acceptance)
 */
export function isResolutionOverdue(
  timerStartTime: string,
  resolvedAt?: string | null,
  status?: string
): boolean {
  if (status === "REJECTED") return false;
  const endTime = resolvedAt || (status === "RESOLVED" || status === "CLOSED" ? resolvedAt : new Date());
  if (!endTime) return false;
  const workingDays = getWorkingDays(timerStartTime, endTime);
  return workingDays > SLA_RESOLUTION_WORKING_DAYS;
}

/**
 * Returns comprehensive SLA status for badges and notifications
 */
export function getComplaintSlaStatus(complaint: any): {
  isResponseOverdue: boolean;
  isResolutionOverdue: boolean;
  isCritical: boolean;
  workingDaysElapsed: number;
  hoursElapsed: number;
} {
  const openTime = complaint.complaint_open_time || complaint.created_at;
  const ackTime = complaint.acknowledged_at;
  const resolvedTime = complaint.resolved_at || complaint.closed_at;
  const status = complaint.status;

  const respOverdue = isResponseOverdue(openTime, ackTime, status);
  // Resolution timer begins when accepted (acknowledged_at) or falls back to open time if accepted
  const timerStart = ackTime || openTime;
  const isAcceptedOrUnderway = ["ACCEPTED", "UNDER_INVESTIGATION", "UNDER_FINAL_REVIEW", "RESOLVED", "CLOSED"].includes(status);
  const resolOverdue = isAcceptedOrUnderway ? isResolutionOverdue(timerStart, resolvedTime, status) : false;

  const workingDays = getWorkingDays(timerStart, resolvedTime || new Date());
  const hours = calculateDuration(openTime, resolvedTime || new Date()).totalHours;

  return {
    isResponseOverdue: respOverdue,
    isResolutionOverdue: resolOverdue,
    isCritical: respOverdue || resolOverdue,
    workingDaysElapsed: workingDays,
    hoursElapsed: hours,
  };
}

/**
 * Checks if a complaint is overdue based on target SLA hours (Legacy compatibility)
 */
export function isComplaintOverdue(
  createdAt: string,
  targetHours: number,
  status: string,
  resolvedAt?: string | null
): boolean {
  if (status === "REJECTED") return false;
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
  Normal: 168,  // 7 working days ~ 168 business hours
  Urgent: 48,   // 2 days
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
