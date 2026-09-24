# Presentation Labels Implementation Plan

> **For agentic workers:** Execute task-by-task. Spec: `docs/superpowers/specs/2026-09-22-presentation-labels-design.md`

**Goal:** Nunca exibir identificadores internos (snake_case/enums) na UI do PriceScout; usar mappings tipados centralizados.

**Architecture:** `utils/display/` com helpers por domínio; UI chama só os helpers; API permanece language-neutral.

**Tech Stack:** TypeScript, Next.js, node:test via tsx.

## Global Constraints

- Sem `.replace("_", " ")` / humanize genérico como solução
- Labels pt-BR deliberados; unknown → fallback neutro + warn em dev
- Não renomear enums do ScoutApiV2

---

### Task 1: Camada display + testes

**Files:**
- Create: `utils/display/labels.ts`, `match-decision.ts`, `match-run-status.ts`, `match-store-status.ts`, `notification-type.ts`, `index.ts`
- Test: `utils/display/display-labels.test.ts`

### Task 2: Wire UI + store-display

**Files:**
- Modify: `components/MatchRunHistory.tsx`, `utils/store-display.ts`
- Test: store-display fallback se houver teste; senão cobrir no display-labels / auditoria

### Task 3: Auditoria + governança + verify

**Files:** AGENTS.md, `.cursor/rules/presentation-labels.mdc`, DESIGN.md, ScoutApiV2 `docs/integration/pricescout.md`

Run: `npm run test` scripts + lint + typecheck + build
