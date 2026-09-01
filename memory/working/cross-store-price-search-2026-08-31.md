---
type: working
title: Busca de preços do mesmo produto em outras lojas
date: 2026-08-31
status: completed
confidence: medium
source: solicitação do usuário e inspeção do repositório
---

# Objetivo

Criar endpoint específico na API externa para consultar somente preços do mesmo produto em lojas com scraper específico e integrar a ação à tela de edição de produto.

# Checklist

- [completed] Mapear frontend, cliente HTTP e contrato atual.
- [completed] Confirmar localização e capacidade de alteração da API externa.
- [completed] Definir estratégia de identificação e contrato somente-preço.
- [completed] Implementar backend/API.
- [completed] Integrar botão e estado de resultados no frontend.
- [completed] Validar lint, build e comportamento.
- [completed] Registrar decisões, fontes e limitações.

# Decisões e evidências

- Endpoint: `POST /api/v1/catalog/products/{product_id}/other-store-prices`.
- A API usa apenas scrapers registrados e retorna somente os cinco campos de preço.
- A identificação rejeita GTIN/MPN/marca conflitantes; nome isolado não confirma variante.
- A primeira versão reconsulta URLs de outras lojas já presentes no catálogo; descoberta de páginas de resultados requer extratores específicos por loja.

# Ferramentas e fontes

- Skills locais: council, research, control-chrome e control-in-app-browser lidas.
- Pesquisa externa: documentação oficial FastAPI `response_model`, GS1 GTIN e Next.js App Router/Client Components.

# Próximo passo

Implementação concluída; evolução futura: adicionar busca por páginas de resultados com extratores específicos e testes Python dedicados.
