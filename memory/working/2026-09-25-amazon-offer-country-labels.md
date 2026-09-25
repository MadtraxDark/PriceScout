---
id: working_2026_09_25_amazon_offer_country_labels
type: working
status: draft
confidence: 0.95
source: agent
sources:
  - app/admin/produtos/[id]/page.tsx
  - utils/store-display.ts
  - utils/api/contracts.ts
created_at: 2026-09-25
updated_at: 2026-09-25
expires_at: null
related: []
---

# Amazon offer country labels

## Objective
Differentiate Amazon Brazil and Amazon United States on persisted offer cards using structured offer country, with domain fallback. Preserve pricing and canonical URLs.

## Checklist
- [completed] Inspect offer rendering, contracts, and existing display naming.
- [completed] Add Amazon country labels and discreet country badges; keep other stores unchanged.
- [completed] Validate country/domain scenarios, typecheck, and review whitespace/diff.

## Findings and decisions
- `CatalogOffer` contains `country`, `canonical_url`, and nested `store.hostname`.
- Persisted offer cards use `getStoreDisplayName` and already render a store logo.
- Use offer country first for Amazon (`BR` -> Amazon Brasil, `US` -> Amazon EUA); use recognized Amazon hostnames if country is unavailable. Existing API display names remain in use for non-Amazon shops.
- Add a small BR/US badge only when the resolved label is Amazon Brasil/EUA.
- Keep the canonical URL passed to the existing store link unchanged.

## Tools and sources
- Local searches with `rg` and file reads.
- Next.js installed docs: `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`.
- Skills checked: frontend design skill available; this focused card refinement did not require a broad redesign workflow.
- `node node_modules/typescript/bin/tsc --noEmit` passed.
- Direct Node scenarios passed for Brazil by country, US by country, each domain fallback, and unchanged Best Buy naming.
- `git diff --check` passed (Git only reported line-ending normalization warnings).
- The package's `test:display` runner uses `npx tsx`, which is not locally installed; network-dependent invocation stalled and was stopped. Running the TS test directly with Node failed because the existing test imports an extensionless TS module. The direct behavior assertions above cover the changed helper without downloading dependencies.

## Results and limitations
The two Amazon markets now render as Amazon Brasil / Amazon EUA and receive a compact BR / US badge. Offer price fields and the `href={offer.canonical_url}` expression are unchanged. Other store badges are not added. The test-runner limitation is recorded above. Several unrelated modified files were visible in the working tree during validation and were left untouched.
