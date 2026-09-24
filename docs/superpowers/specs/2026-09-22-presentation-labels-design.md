# Design: Labels de apresentação (sem snake_case na UI)

**Data:** 2026-09-22  
**Repositório principal:** PriceScout (frontend)  
**Repositório relacionado:** ScoutApiV2 (contrato API; sem mudança de enums)  
**Status:** aprovado para implementação após review desta spec

## Problema

Identificadores internos da API (ex.: `auto_match`) estão sendo renderizados diretamente na UI do PriceScout. O usuário final nunca deve ver snake_case / enums / IDs técnicos.

Bug reproduzido: Histórico de Match Run → candidatos → `{candidate.decision}` exibe `auto_match`.

## Princípio permanente

```text
INTERNAL IDENTIFIER  ≠  DISPLAY LABEL
```

Valores como `auto_match`, `amazon_br`, `PRODUCT_MATCH_COMPLETED`, `in_progress` podem existir em backend, banco, API, logs técnicos e TypeScript. Nunca devem ser despejados na interface.

## Abordagem escolhida

Camada centralizada `utils/display/` com mappings explícitos e tipados por domínio. Sem:

- `.replace("_", " ")` / `.replaceAll("_", " ")` como solução
- `humanizeSnakeCase` genérico
- renomear enums do backend só por estética
- traduzir a API para pt-BR

## Arquitetura

```text
utils/display/
  labels.ts               # fallback neutro + warnUnknownLabel (dev)
  match-decision.ts       # auto_match | review | reject
  match-run-status.ts     # pending | running | completed | failed | cancelled
  match-store-status.ts   # pending | running | match | no_match | error
  notification-type.ts    # PRODUCT_MATCH_COMPLETED | PRODUCT_MATCH_FAILED
  index.ts                # reexports

utils/store-display.ts    # já existe; remover fallback .replace(/_/g, …)
```

### Contrato de helper

```ts
// Conceitual — cada domínio exporta:
export function matchDecisionLabel(value: string | null | undefined): string
```

- Known union → label pt-BR deliberado (`Record<Union, string>` exhaustivo)
- Unknown / null / empty → fallback neutro (“Status desconhecido”, “Tipo desconhecido”, “Loja desconhecida”, ou “—” quando o contexto já usa travessão)
- Em desenvolvimento: `console.warn` com o valor interno (observabilidade; não UI)

### Type safety

Tipos de domínio reutilizam unions já existentes em `utils/api/contracts.ts` (`MatchHit["decision"]`, `MatchRunStatus`, `MatchStoreRunStatus`). Novo membro no union sem entrada no `Record` quebra o typecheck.

## Labels finais (pt-BR)

### Match decision

| Interno | Display |
|---|---|
| `auto_match` | Correspondência automática |
| `review` | Revisão necessária |
| `reject` | Não corresponde |

### Match run status

| Interno | Display |
|---|---|
| `pending` | Aguardando |
| `running` | Em andamento |
| `completed` | Concluída |
| `failed` | Falhou |
| `cancelled` | Cancelada |

### Match store status

| Interno | Display |
|---|---|
| `pending` | Aguardando |
| `running` | Em andamento |
| `match` | Correspondência encontrada |
| `no_match` | Sem correspondência |
| `error` | Erro durante a busca |

### Notification type (defensivo)

| Interno | Display |
|---|---|
| `PRODUCT_MATCH_COMPLETED` | Busca concluída |
| `PRODUCT_MATCH_FAILED` | Busca não concluída |

`NotificationPanel` hoje renderiza `title` / `message` (já amigáveis no backend). O mapping existe para não vazar `type` se/quando for exibido, e como fallback se `title` estiver ausente.

### Stores

Manter `getStoreDisplayName` + mapa existente (`amazon_br` → Amazon Brasil, etc.). Preferir `display_name` / `store_display_name` da API. Fallback desconhecido: **Loja desconhecida** (nunca beautify por underscore).

## Correções de UI

1. **`components/MatchRunHistory.tsx`**
   - Substituir `{candidate.decision}` por `matchDecisionLabel(candidate.decision)`
   - Remover maps locais `storeStatusLabel` / `runStatusLabel`; importar de `utils/display/`
2. **`utils/store-display.ts`**
   - Remover `normalizedId.replace(/_/g, " ")…` no fallback
3. **Auditoria estática do frontend**
   - Buscar renderizações de `.decision`, `.status`, `.type`, store IDs, enums conhecidos
   - Corrigir vazamentos user-facing encontrados
   - `special_status`: só mapear se for enum técnico; se for texto livre de crawl, manter (não inventar mapping)
4. **Logs / histórico / notificações**
   - Labels amigáveis por padrão
   - Código interno só se houver área técnica explícita de diagnóstico (fora do escopo mínimo desta entrega)

## Fora de escopo

- Alterar enums / persistência / OpenAPI do ScoutApiV2
- i18n multi-idioma (pt-BR hard-coded nos maps é aceitável agora)
- CSS para esconder `_`
- Traduzir logs técnicos do backend

## Governança (permanente)

1. **`AGENTS.md` (PriceScout)** — regra curta: identificadores internos / snake_case / enums nunca renderizados diretamente; todo valor técnico user-facing exige label explícito.
2. **`.cursor/rules/presentation-labels.mdc`** — checklist operacional antes de renderizar valores da API.
3. **`DESIGN.md`** — anti-pattern curto: UI usa labels legíveis; nunca snake_case/system IDs crus.
4. **`docs/integration/pricescout.md` (ScoutApiV2)** — nota curta: ownership dos display labels é do frontend.

## Testes e verificação

- Unit: cada helper (known values + unknown + null)
- Garantir ausência de solução baseada só em `.replace("_"` nos helpers de display
- lint / typecheck / build no PriceScout
- Validação visual: Product Detail → Match Run history → candidatos não mostram `auto_match`

## Done when

- `auto_match` / `review` / `reject` com labels definidos
- Run / store statuses com labels
- Store IDs e notification types não aparecem crus na UI
- Unknown → fallback seguro
- Mappings centralizados e tipados
- Sem hack genérico de replace
- Auditoria principal + histórico + notificações
- Testes, lint, typecheck, build OK
- Regra registrada em AGENTS.md + cursor rule + DESIGN.md (+ nota ScoutApiV2)
