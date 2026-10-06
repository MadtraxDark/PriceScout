import type { ImageAvailabilityStatus } from "@/utils/api/contracts";

export type ImageAvailabilityView = {
  status: ImageAvailabilityStatus;
  message: string;
  retryable: boolean;
};

const messages: Record<ImageAvailabilityStatus, string> = {
  ready: "Imagem carregada.",
  missing: "Nenhuma imagem disponível para este produto.",
  processing: "A imagem está sendo processada e ficará disponível em breve.",
  temporarily_unavailable:
    "Não foi possível carregar a imagem no momento. Tente novamente mais tarde.",
  permission_denied: "A imagem existe, mas o sistema não conseguiu acessá-la.",
  not_found: "A imagem cadastrada não foi encontrada no armazenamento.",
  storage_error: "Não foi possível acessar a imagem cadastrada.",
  invalid_reference: "A referência desta imagem está inválida.",
  load_failed: "O navegador não conseguiu exibir esta imagem.",
};

export function imageAvailabilityView(
  status: ImageAvailabilityStatus,
  retryable = false,
): ImageAvailabilityView {
  return {
    status,
    message: messages[status] ?? "Não foi possível exibir esta imagem.",
    retryable:
      retryable &&
      (status === "temporarily_unavailable" || status === "storage_error"),
  };
}
