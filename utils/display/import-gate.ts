import type { ProductResolutionKind } from "@/utils/api/contracts";

/**
 * Estado da consulta de identidade (POST /products/resolve).
 * - unavailable: sem resposta (rede, timeout, 5xx).
 * - error: recusa da API (4xx) ou resposta inesperada.
 * - conflict: a API informou conflito de identidade (GTIN de outro produto).
 */
export type ResolutionStatus = "idle" | "loading" | "ready" | "error" | "unavailable" | "conflict";

export type ImportGateState =
  | "allowed"
  | "review_required"
  | "already_registered"
  | "checking"
  | "unavailable"
  | "conflict"
  | "not_checked";

export type ImportGateReason =
  | "ok_new_product"
  | "ok_new_listing"
  | "ok_reviewed"
  | "review_pending"
  | "already_registered"
  | "checking"
  | "unavailable"
  | "refused"
  | "conflict"
  | "not_checked"
  | "duplicate_known"
  | "unknown_resolution";

export type ImportGateInput = {
  resolutionStatus: ResolutionStatus;
  resolution: { kind: ProductResolutionKind } | null;
  duplicateProduct: unknown | null;
  reviewDecision: unknown | null;
};

export type ImportGate = { canApprove: boolean; state: ImportGateState; reason: ImportGateReason };

const block = (state: ImportGateState, reason: ImportGateReason): ImportGate => ({ canApprove: false, state, reason });

/**
 * Fonte única da liberação do botão "Aprovar prévia". Falha fechada: só libera
 * com consulta concluída e resultado explicitamente aprovável.
 */
export function evaluateImportGate(input: ImportGateInput): ImportGate {
  const { resolutionStatus, resolution, duplicateProduct, reviewDecision } = input;
  if (duplicateProduct) return block("already_registered", "duplicate_known");
  switch (resolutionStatus) {
    case "idle": return block("not_checked", "not_checked");
    case "loading": return block("checking", "checking");
    case "unavailable": return block("unavailable", "unavailable");
    case "conflict": return block("conflict", "conflict");
    case "error": return block("unavailable", "refused");
    case "ready": break;
    default: return block("not_checked", "not_checked");
  }
  if (!resolution) return block("not_checked", "not_checked");
  switch (resolution.kind) {
    case "new_product": return { canApprove: true, state: "allowed", reason: "ok_new_product" };
    case "existing_product_new_listing": return { canApprove: true, state: "allowed", reason: "ok_new_listing" };
    case "existing_listing": return block("already_registered", "already_registered");
    case "needs_review":
      return reviewDecision
        ? { canApprove: true, state: "allowed", reason: "ok_reviewed" }
        : block("review_required", "review_pending");
    default: return block("not_checked", "unknown_resolution");
  }
}

export const IMPORT_GATE_MESSAGES: Record<ImportGateReason, string> = {
  ok_new_product: "Produto novo: pode ser aprovado.",
  ok_new_listing: "Produto já cadastrado: a oferta desta loja será adicionada.",
  ok_reviewed: "Decisão registrada: pode ser aprovado.",
  review_pending: "Escolha se é o mesmo produto antes de aprovar.",
  already_registered: "Produto já cadastrado. A importação está bloqueada.",
  duplicate_known: "Produto já cadastrado. A importação está bloqueada.",
  checking: "Verificando o catálogo. Aguarde para aprovar.",
  unavailable: "Não foi possível verificar o catálogo agora, então a aprovação está bloqueada. Tente novamente quando a API estiver disponível.",
  refused: "A verificação do catálogo foi recusada pela API. A aprovação está bloqueada até que a verificação seja concluída.",
  conflict: "Este produto conflita com outro já cadastrado (o código de barras pertence a outro produto). A importação está bloqueada; revise o catálogo.",
  not_checked: "A verificação do catálogo ainda não foi concluída. A aprovação está bloqueada.",
  unknown_resolution: "A situação do cadastro não foi reconhecida. A aprovação está bloqueada.",
};

/** Mensagem de apresentação do motivo do gate. Nunca devolve o código cru. */
export function importGateMessage(reason: ImportGateReason | null | undefined): string {
  return (reason && IMPORT_GATE_MESSAGES[reason]) || IMPORT_GATE_MESSAGES.not_checked;
}

export const IMPORT_RETRY_LABEL = "Tentar novamente";
export const IMPORT_RETRYING_LABEL = "Verificando...";
export const IMPORT_RECHECK_NOTICE = "O banco de dados reportou uma inconsistência. Revalidando o cadastro antes de nova tentativa.";
export const IMPORT_CONFLICT_ERROR = "Este produto conflita com outro já cadastrado. Nenhum registro foi criado.";
