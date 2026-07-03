export const MAIL_BRAND = "FRBS";

export function buildSenderName(firstName?: string, fullName?: string) {
  return `s${MAIL_BRAND} ${firstName || fullName || "Agent"}`;
}