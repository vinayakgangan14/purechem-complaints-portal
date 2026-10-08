import assert from "node:assert";

function calculateDuration(startTime, endTime = new Date()) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (isNaN(start) || isNaN(end) || end < start) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMinutes: 0, totalHours: 0, formatted: "0 Seconds" };
  }

  const diffMs = end - start;
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = parseFloat((totalMinutes / 60).toFixed(2));

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "Day" : "Days"}`);
  if (hours > 0 || days > 0) parts.push(`${hours} ${hours === 1 ? "Hour" : "Hours"}`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`);
  parts.push(`${seconds} ${seconds === 1 ? "Second" : "Seconds"}`);

  return { days, hours, minutes, seconds, totalMinutes, totalHours, formatted: parts.join(" ") };
}

function formatWAT(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

console.log("Running Resolution Timer & WAT Tests...");

// Test 1: Example from Prompt: 2 Days 4 Hours 13 Minutes 07 Seconds
const testStart = new Date("2026-10-08T11:32:15.000Z");
// + 2 days (172800s) + 4 hours (14400s) + 13 minutes (780s) + 7 seconds (7s) = 187987 seconds
const testEnd = new Date(testStart.getTime() + 187987 * 1000);
const duration = calculateDuration(testStart, testEnd);

console.log("Calculated:", duration);
assert.strictEqual(duration.days, 2);
assert.strictEqual(duration.hours, 4);
assert.strictEqual(duration.minutes, 13);
assert.strictEqual(duration.seconds, 7);
assert.strictEqual(duration.formatted, "2 Days 4 Hours 13 Minutes 7 Seconds");
assert.strictEqual(duration.totalMinutes, 3133);

// Test 2: Timezone WAT check (Lagos is UTC+1)
const watCheck = formatWAT("2026-10-08T11:32:15.000Z");
console.log("WAT Formatted:", watCheck);
// UTC 11:32 should be 12:32 in WAT
assert.ok(watCheck.includes("12:32:15"));

console.log("All Timer and WAT tests passed with 100% precision!");
