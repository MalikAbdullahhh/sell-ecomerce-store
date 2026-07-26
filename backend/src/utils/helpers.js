export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function makeOrderNumber() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `APT-${n}`;
}

const DEFAULT_NAMES = [
  "A. Khan",
  "S. Ahmed",
  "M. Ali",
  "R. Malik",
  "H. Fatima",
  "N. Hassan",
  "Z. Iqbal",
  "Guest Reviewer",
];

export function defaultReviewerName() {
  return DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
}

export function estimatedDeliveryLabel(days = 4) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
