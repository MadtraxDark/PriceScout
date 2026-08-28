---
id: work_remove_preview_manufacturer_code_2026_08_27
type: working
status: draft
confidence: 0.99
source: user
sources:
  - app/admin/page.tsx
  - utils/api/contracts.ts
created_at: 2026-08-27
updated_at: 2026-08-27
expires_at: null
related: []
---

# Remoção do código do fabricante da prévia

## Objetivo

Remover somente a apresentação visual de `manufacturer_code`/MPN na prévia do produto, mantendo o dado disponível para contratos, coleta, identificação e persistência.

## Checklist

- [completed] Localizar a renderização visual do campo e as referências internas.
- [completed] Remover o chip do preview sem alterar o modelo de dados.
- [completed] Validar ausência visual e executar lint/build.
- [completed] Revisar limitações e concluir o registro.

## Decisão

Excluir apenas o bloco JSX condicional que renderiza `product.mpn` em `.review-identity-tags`. Não alterar `utils/api/contracts.ts` nem a lógica de coleta/persistência.

## Próximo passo

Aplicar a remoção pontual e validar as referências restantes.

## Validação

- `rg` não encontra mais o texto “Código do fabricante” nem `product.mpn` na superfície de preview.
- `utils/api/contracts.ts` continua declarando `mpn?: string | null`.
- `npm run lint`: concluído sem erros.
- `npm run build`: executado na validação final da alteração.

## Resultado

O campo deixou de ser exibido visualmente na prévia. A estrutura e o contrato interno permanecem disponíveis para processamento da API.
