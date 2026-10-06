
## SEARCH_LOCALE (final)

| Store | Locale antigo | Locale novo | Query antiga | Query nova |
|---|---|---|---|---|
| Shopping China | es-PY | en-US | apple iphone 17 256gb negro 5g | apple iphone 17 256gb black |
| Visão VIP | es-PY | en-US | … negro 5g | apple iphone 17 256gb black |
| Nissei | es-PY | en-US | … negro 5g | apple iphone 17 256gb black |
| Best Buy | en-US | en-US (explicit) | en | apple iphone 17 256gb black |
| Amazon US | en-US | en-US (explicit) | en | apple iphone 17 256gb black |
| Amazon BR / KaBuM | pt-BR | pt-BR (explicit) | pt | apple iphone 17 256gb preto |

Live Shopping China quick_search 2026-10-05:
- `apple iphone 17 256gb black` → CELULAR APPLE IPHONE 17 256GB BLACK (+ E/JP)
- `apple iphone 17 256gb negro` → wrong sibling (iPhone 17E WHITE)

## RENEWED_CONDITION (final)

- Renewed/Refurbished → match + offer_condition reason (not reject)
- Used/Open-box → still condition_reject vs new
- Storage/Pro blockers unchanged
- Frontend: Renovado / Renovado Premium labels; New ranks above Renewed

## IPHONE17_LIVE_REGRESSION

- Shopping China SERP JSON: validated (black finds ground-truth title)
- Visão VIP / Best Buy / Amazon US full MatchRun: not executed live in this session (browser/WAF); unit + locale evidence complete
