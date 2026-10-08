# Alterações do catálogo

Página: `/admin/catalogo/alteracoes`, acessível pelo menu administrativo e pelo
link Pesquisar alterações no resumo de atividade recente.

Consulta a API externa `GET /products/changes`, por `catalogApi.listChanges`.
Contrato e decisão canônicos no ScoutApiV2: `docs/matching/catalog-changes.md`
e ADR 0052. Autenticação e autorização permanecem na API externa.

Busca por produto, marca, modelo, loja e vendedor, com até oito termos literais.
Cada termo precisa ocorrer em algum campo. Labels, evidências históricas e
correspondências são apresentados por componentes separados. `<mark>` recebe
texto escapado pelo React, sem `dangerouslySetInnerHTML` ou regex do usuário.

Filtros e datas são preservados na URL. Datas usam horário local e incluem
todo o dia final; `changeQuery` converte os limites para timestamps UTC.
Paginação tem 25 registros por página. A busca aplica texto e filtros 300 ms
após a última alteração; Enter/Pesquisar aplica imediatamente. Composição IME
aguarda confirmação. Critérios inválidos não enviam requests. Limpar filtros
cancela também o texto ainda pendente.

Formulário e resultados permanecem montados, preservando foco e posição do
cursor. O hook reinicia a consulta e aborta requests anteriores ao trocar
critérios, sem limpar os dados exibidos. Lista, contador, cursor de paginação e
destaques pertencem à última resposta aceita até a nova resposta substituí-los
atomicamente. Respostas obsoletas são ignoradas. Loading inicial é separado de
refetch; falha de atualização mantém dados anteriores com aviso e retry.
Empty state só aparece após resposta concluída e realmente vazia. Durante a
espera, carregar mais fica desabilitado; seu espaço permanece reservado.
O indicador ocupa linhas reservadas, sem inserir parágrafos a cada tecla.
O corpo tem apenas min-height moderado de 160px para estados sem dados; listas
mantêm altura natural. Nenhuma altura fixa, animação ou scroll automático.
Atualizações automáticas usam `history.replaceState`, sem criar uma entrada
por tecla; envio explícito usa `pushState`. Voltar/avançar restaura o formulário.

Valores antes/depois ausentes são identificados. Identidade e imagem usam o
catálogo atual; evidência comercial é histórica. Erros e JSON brutos nunca
são exibidos. Não há dados fictícios na aplicação.

Verificação: `npm run typecheck`, `npm run lint` e
`npm exec -- tsx --test utils/display/change-search.test.ts utils/display/activity.test.tsx`.
O harness Chrome/PostgreSQL isolado pertence ao backend:
`tests/e2e/catalog_changes_browser.py`.

Regressão de estabilidade com catálogo local populado, frontend em 3000 e API
em 8000: `python tests/e2e/catalog_changes_stability_browser.py` no ScoutApiV2.
Chrome dedicado usa respostas reais, controlando apenas timing/erro de transporte.
Confere retenção, loading inicial, empty, erro/retry, identidade dos containers,
contador, highlights, altura/scroll, sequência 580 até 5800x3d e mobile.
Evidência: `.tmp/catalog-changes-browser/stability-result.json` no backend.
