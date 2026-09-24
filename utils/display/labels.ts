/**
 * Shared helpers for user-facing presentation labels.
 * Never render raw API enums / snake_case identifiers in the UI.
 */

export function warnUnknownLabel(domain: string, value: string): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[display] Unknown ${domain} label:`, value);
}

export function isBlank(value: string | null | undefined): value is null | undefined | "" {
  return value == null || value.trim() === "";
}
