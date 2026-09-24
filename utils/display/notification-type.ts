import { isBlank, warnUnknownLabel } from "./labels";

export type NotificationType =
  | "PRODUCT_MATCH_COMPLETED"
  | "PRODUCT_MATCH_FAILED";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  PRODUCT_MATCH_COMPLETED: "Busca concluída",
  PRODUCT_MATCH_FAILED: "Busca não concluída",
};

const UNKNOWN = "Tipo desconhecido";

/**
 * User-facing label for notification `type` identifiers.
 * Prefer API `title` when present; use this when type itself must be shown.
 */
export function notificationTypeLabel(value: string | null | undefined): string {
  if (isBlank(value)) return "—";
  const key = value.trim() as NotificationType;
  if (key in NOTIFICATION_TYPE_LABELS) {
    return NOTIFICATION_TYPE_LABELS[key];
  }
  warnUnknownLabel("notificationType", value);
  return UNKNOWN;
}
