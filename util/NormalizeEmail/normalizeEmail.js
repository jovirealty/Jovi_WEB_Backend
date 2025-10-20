export function normalizeEmail(email) {
  return String(email || "").trim();
}