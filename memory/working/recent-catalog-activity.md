---
id: mem_recent_catalog_activity_20261007
type: working
status: validated
confidence: 1.0
source: user
sources:
  - https://docs.sqlalchemy.org/en/20/core/selectable.html
  - https://react.dev/reference/react/useEffect
created_at: 2026-10-07
updated_at: 2026-10-07
expires_at: null
related:
  - docs/recent-activity.md
---

Objetivo: implementar Atividade recente persistente com ScoutApiV2.

- completed: investigar ambos os projetos, eventos, ownership, imagem e seção vazia.
- completed: backend com leitura de created_at + OfferEvent, cursor e evidência histórica.
- completed: frontend compacto com imagem, hora local, textos semânticos e paginação.
- completed: 37 unitários novos e integração PostgreSQL; suíte backend 1183 passed/9 skipped; 94 frontend; cenário persistente e navegador passaram.
- completed: falhas globais anteriores reproduzidas em HEAD e corrigidas com tipos/imports/formato; Ruff, formato e mypy verdes.
- completed: Docker API e workers atualizados; migration 0033 head aplicada; feed real confirmado no navegador.
- completed: ADR 0051, contrato canônico, matriz de integração e docs frontend atualizados.

Ferramentas: PowerShell e Python locais; ferramentas do Cursor não utilizadas.
Erro original: shell sandbox falhou com helper_unknown_error/setup refresh had errors.
Alternativa comprovada: execução fora do sandbox, autorizada pelo auto-review.
Fontes: código local, documentação oficial SQLAlchemy e React, guia local de Link do Next.js.
Decisão: reutilizar histórico; não criar nova tabela. A UI usa helpers/componentes atuais.
Contrato visual: miniatura 46px, linhas compactas, divisões leves, horário discreto,
seta de navegação, texto truncado e responsividade sem cards grandes.
Próximo passo: concluir implementação e validar cenários isolados de teste.

Validação visual: rows de 70px no desktop e 78px no mobile; sem overflow.
Navegador: reload, paginação, clique, loading, vazio e retry aprovados.
Media fixture isolada; nenhum upload ou contato com Drive no cenário de teste.

Erro de teste corrigido: colisão de basename entre unit/integration; integrado renomeado para test_catalog_activity_postgres.py e suíte completa aprovada.
Build inicial: Camoufox pinned download/extract 100,6s; export da imagem 82,8s.
Próximo passo: confirmar API/worker Docker e feed com o catálogo existente, limpar ambiente isolado.

Revisão em catálogo real identificou amazon histórico e preço numericamente igual; corrigidos no SQL antes da paginação. Testes adicionais passaram, inclusive PostgreSQL. API Docker sendo reconstruída com esses ajustes finais.

Conclusão: implementação, testes, checks, documentação e ativação local concluídos.
Todos os 94 testes frontend passaram; backend 1183 passed, 9 skips condicionais.
API real: HTTP 200, 15 linhas/imagens, nomes regionais corretos, preço igual omitido,
F5 preserva a lista. Banco e API isolados de teste foram removidos/encerrados.
Falha de execução corrigida: npx PowerShell interpretou array como um único path;
argumentos individuais executaram todos os testes com sucesso.
Última conferência de navegador perdeu a aba e expirou em about:blank; nova aba
explícita no admin permitiu repetir a conferência sem interceptações, aprovada.
Nenhuma etapa pendente. Alterações mantidas nos dois repositórios para revisão.
