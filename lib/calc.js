export function calc({ totalDays, currentDay, courses }) {
  const expected = Math.min(100, Math.max(0, (currentDay / totalDays) * 100));
  const tw = courses.reduce((s, c) => s + c.weight, 0) || 1;
  const actual = courses.reduce((s, c) => s + c.weight * c.pct, 0) / tw;
  const left = Math.max(1, totalDays - currentDay + 1);
  return {
    expected,
    actual,
    delta: actual - expected,
    left,
    perDay: (c) => (100 - c.pct) / left,
  };
}
