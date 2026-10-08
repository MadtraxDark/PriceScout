---
id: mem_catalog_change_explorer_20261007
type: working
status: validated
confidence: 1.0
source: user
sources:
  - https://nextjs.org/docs/app/api-reference/functions/use-search-params
  - https://react.dev/reference/react-dom/components/common
  - https://docs.sqlalchemy.org/en/20/core/sqlelement.html
created_at: 2026-10-07
updated_at: 2026-10-07
expires_at: null
related:
  - docs/recent-activity.md
---

Objetivo: página dedicada de investigação do histórico de produtos e ofertas.

- completed: ler regras, frontend, contratos, histórico e documentação oficial/local.
- completed: consulta paginada com filtros no backend, preservando registros originais.
- completed: página /admin/catalogo/alteracoes com filtros persistidos na URL e destaque.
- completed: validação direcionada de ownership, pesquisa, paginação e UI.
- completed: documentação canônica e revisão final.
- completed: disponibilizar endpoint na API Docker local e confirmar saúde.

Ferramentas: PowerShell direto, apply_patch e pesquisa web; Cursor não utilizado.
Erro original do ambiente: helper_unknown_error: setup refresh had errors no sandbox.
Alternativa validada: terminal direto com require_escalated aprovado pela ferramenta.
Não há novos serviços, dependências ou alterações em schema/scraping.
Decisão: consulta própria /products/changes, mantendo resumo /products/activity.
Busca por termos literais em produto, marca, modelo, loja e seller, sem acentos
ou diferença de caixa. Cada termo precisa corresponder a algum desses campos.
Destaque usa texto escapado pelo React e índices no texto original, sem HTML bruto.
Contrato visual: controles compactos, resultados em linhas, evidências expansíveis,
loading, vazio, erro/retry, mobile sem overflow e labels explícitos.
Validação inicial: 47 testes de histórico/API, 26 de segurança, 21 de apresentação.
Typecheck e lint direcionado frontend aprovados; mypy dos quatro módulos aprovado.
Gates globais: backend 1191 passed, 11 skipped (serviços opcionais), em 28,52s;
Ruff, formato e mypy src aprovados. Frontend lint, typecheck e build aprovados.
Chrome dedicado: PostgreSQL real, paginação 25 para 34, filtros combinados,
destaque, detalhes, F5, vazio, voltar, link de produto, erro/retry e viewports
320/768/1024/1440 aprovados. Sem erro JavaScript. Consulta fria de cinco termos
no cenário pequeno: 95,52ms; não representa benchmark de catálogo grande.
Banco e API de teste removidos/encerrados após a conferência.
Erros corrigidos: timestamp ocupava 100% mais margem e causava overflow a 320px;
seletores get_by_label em selects substituídos por combobox com nome acessível;
asserção de falha ajustada ao erro sanitizado do client existente.
Fontes: ADR 0052 e docs/matching/catalog-changes.md no ScoutApiV2;
docs/catalog-changes.md no frontend. Sem alterações em secrets/configuração/schema.
Docker: dependências instaladas em 40,6s, Camoufox pinned instalado em 88,6s,
export/unpack em 80,8s. Somente a API local foi recriada.
Runtime: health 200; OpenAPI registra /products/changes; 25 eventos reais,
Cache-Control private/no-store e pesquisa no catálogo existente aprovados.
A verificação inicial esperava 401, mas a configuração local existente é
development com AUTH_REQUIRED=false. A asserção foi corrigida para esse modo;
auth obrigatória foi validada separadamente nos testes (401 sem credenciais).
Conclusão: implementação, validação, documentação e API Docker local concluídas.
Alterações disponíveis para revisão nos dois repositórios. Nenhuma etapa pendente.

Conferência adicional no catálogo real: 25 destaques, navegação pelo menu,
foco por Tab do campo de busca ao filtro de tipo e ausência de erro JavaScript.
Screenshot: ScoutApiV2/.tmp/catalog-changes-browser/real-local.png.
Perda de acentos em script Python passado por stdin do PowerShell afetou o label
do menu e um seletor temporário; corrigidos com escrita UTF-8 e script em arquivo.
O menu Alterações foi verificado no navegador após a correção.
