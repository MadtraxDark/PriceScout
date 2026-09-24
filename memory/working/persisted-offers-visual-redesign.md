---
id: work_persisted_offers_visual_redesign
type: working
status: draft
confidence: 1.0
source: user
sources:
  - app/admin/produtos/[id]/page.tsx
  - components/OfferPrice.tsx
  - app/globals.css
  - DESIGN.md
created_at: 2026-09-24
updated_at: 2026-09-24
expires_at: null
related: []
---
# Reformulação visual de ofertas persistidas

Objetivo: reorganizar o cabeçalho e a lista de ofertas para leitura mais rápida, mantendo os dados, os cálculos, os links e as interações existentes.

## Checklist
- [completed] Ler prompt e skills indicadas.
- [completed] Inspecionar dados e componentes que compõem cada oferta.
- [completed] Reformular hierarquia visual e comportamento responsivo.
- [completed] Conferir render desktop/mobile e rodar verificações solicitadas.
- [completed] Revisar diff e registrar limitações.

## Registro
- Início: 2026-09-24.
- Fontes consultadas: prompt anexado, `DESIGN.md`, `app/admin/produtos/[id]/page.tsx`, `components/OfferPrice.tsx`, `app/globals.css` e contexto do Impeccable.
- Skills usadas: `impeccable` (context e layout), `design-taste-frontend`, `frontend-design`.
- Ferramentas: PowerShell, `rg`, `impeccable.cmd context`, `impeccable.cmd detect`, navegador local via CUA e Playwright.
- Achados: preço vem de `OfferPrice`, ofertas/loja de `PersistedOffersList`, e horários de `OfferMonitoringMeta`. A lista deixava loja e ação isoladas; horários ficavam sem agrupamento explícito.
- Direção: manter paleta e tipografia PriceScout; preço como primeiro foco, selo depois do valor, condição e dados auxiliares em linhas secundárias, identidade e ação juntas, monitoramento em faixa própria. Desktop usa coluna lateral contida para a loja; abaixo de 760px a oferta passa a uma coluna e a loja ocupa uma faixa inferior; abaixo de 520px essa faixa empilha nome e ação.
- Alteração: somente `app/globals.css`; nenhuma lógica de preço, persistência, link ou coleta foi tocada.
- Validação visual: a tela de produto local apresentou quatro ofertas reais. Conferido em desktop (captura do Chrome, 1920px) e em mobile (Playwright, 390x844). No mobile, valor, selo, conversão, horários e ação continuam legíveis e dentro do card. Os dados atuais também cobriram nomes de loja com comprimentos variados, preço original ausente/presente e condições Pix/cartão.
- Detector Impeccable layout: sem apontamentos (`[]`). `git diff --check`: limpo.
- `npm run typecheck`: aprovado. `npm run build`: aprovado.
- `npm run lint`: falhou com três erros de `react-hooks/set-state-in-effect` em `app/admin/page.tsx:132`, `app/admin/page.tsx:191` e `components/ImageViewer.tsx:25`, além de avisos de variáveis não usadas. Esses arquivos não foram alterados nesta tarefa.
- Próximo passo: nenhum; lint existente é a única limitação registrada.
