---
title: Favoritos e alertas de queda de preço
created: 2026-10-11
updated: 2026-10-11
kind: working
status: completed_with_pending
confidence: high
sources: [user-request, local-repositories, official-google-docs, python-docs, github, reddit]
---

# Objetivo
Implementar favoritos por usuário, alertas persistentes de queda de preço e entrega SMTP via outbox/workers no ScoutApiV2 e PriceScout.

# Checklist
- [x] Ler escopo, AGENTS e estado inicial dos dois repositórios.
- [x] Confirmar remotes; os repositórios locais apontam aos projetos esperados.
- [x] Pesquisar docs oficiais atuais de Google App Password, SMTP, SMTP Relay/limites e Python smtplib; pesquisar padrões de outbox e BackgroundTasks.
- [ ] Mapear modelos, preço efetivo, fluxo OfferEvent e API/UX atual.
- [x] Backend: models, migration, service/router, evaluator e outbox.
- [ ] Backend: transport SMTP genérico, worker, settings e Compose.
- [ ] Backend: testes unitários/integração para favoritos, avaliação e worker.
- [ ] Frontend: contrato/API, estado de favorito e página, painel de notificações.
- [ ] Documentação: ADR, configuração operacional, README e impacto.
- [ ] Executar verificações solicitadas; medir impacto no refresh.
- [ ] Smoke SMTP real, se credenciais estiverem configuradas sem expor seu conteúdo.

# Estado inicial
Backend está limpo na branch main, remote ScoutApiV2. Frontend local PriceScout está limpo na branch main, remote PriceScout. O backend tem monitor PostgreSQL persistente (`OfferRefreshService` + `OfferEvent`) e `UserNotification`, atualmente com idempotência de notificações de Product Match. Compose possui workers separados. PriceScout contém painel NotificationPanel e catálogo em /admin; seu AGENTS descreve memória de agentes, mas o código ativo é o frontend PriceScout.

# Decisões de pesquisa preliminares
Google documenta App Password apenas com 2-Step Verification e recomenda Sign in with Google quando possível; SMTP autenticado documenta smtp.gmail.com com TLS STARTTLS em 587. Workspace SMTP Relay exige configuração do Admin, TLS em 587 recomendado e tem limites específicos; modalidade efetiva deve vir do ambiente, não foi inferida do repositório.
Python stdlib smtplib suporta timeout explícito, SMTP_SSL com SSLContext e STARTTLS seguido de EHLO. PostgreSQL com claims e SKIP LOCKED já é aderente ao projeto; outbox e atualização de negócio compartilham transação. Outbox fornece at-least-once, com janela de possível duplicação após SMTP aceitar antes do commit.

# Próximo passo
Mapear com precisão payload de snapshots, sessões/commit do monitor, contratos PriceScout e configuração Docker antes de desenhar mudanças.
# Atualização de progresso
- Mapeamento: `OfferRefreshService._refresh_listing` usa snapshot anterior e persiste snapshot/eventos via `MatchingRepository`; `OfferEvent` retorna id e tudo segue na transação do worker/API. `ProductOffer` tem price, pix_price, original_price; a UI apresenta pix como preço principal em `services.ts`. Model UserNotification está em matching.models e possui idempotência de Match Run; esquema será ampliado com chaves opcionais de evento/favorito.
- Decisão: outbox PostgreSQL própria sem Redis/biblioteca SMTP extra; efetivo = PIX positivo disponível, fallback price; apenas evento price_changed; moeda igual; sem processar evento removido, scrape_failed, sem estoque ou primeiro snapshot.
- Implementado até aqui: branches feature em ambos os repositórios; migration 0034 e modelos ProductFavorite/UserNotificationPreference/EmailDelivery; domínio evaluator e fanout inicial.
- Próximo: conectar fanout no refresh, fechar router/frontend/worker e adicionar testes; revisar nested transaction/idempotência.
- Pesquisa externa: Google App Passwords, conta/workspace, Gmail SMTP, SMTP Relay/limites; Python 3.12 smtplib; SQLAlchemy SKIP LOCKED; FastAPI BackgroundTasks; exemplos e relatos GitHub/Reddit considerados apenas evidência prática secundária.

# Resultado final

Implementa??o em branches `feature/product-favorites-price-alerts` nos dois reposit?rios. Migration Alembic 0034, endpoints privados idempotentes, avalia??o decimal vinculada ao `price_changed`, notifica??o persistente e outbox transacional com worker SMTP gen?rico. PriceScout tem bot?o otimista com rollback, p?gina de favoritos, ajuste individual de alertas e tipo de notifica??o no painel existente. N?o foi criado monitor/polling de notifica??es adicional.

Valida??es: backend r?pido 1276 passed / 11 skipped; 17 testes novos passaram; ruff nos arquivos novos passou; mypy nos m?dulos novos passou (mypy global ainda aponta 6 erros em arquivos n?o relacionados: `matching/identity.py`, `images/optimizer.py`, `crawler/services/akamai_sec_cpt.py`). Frontend typecheck, lint e build passaram. `make test` falhou apenas porque o Makefile usou Python global sem pytest; o comando equivalente no `.venv` passou.

Pendente: migration upgrade/downgrade em staging, rein?cio live, benchmark comparativo do refresh e smoke Gmail/Workspace. N?o h? configura??o SMTP no ambiente. Ver backend `docs/pending/PENDING-035-favorites-email-live-validation.md`.
