---
id: mem_drive_image_recovery_20261005
type: working
status: validated
confidence: 1.0
source: agent
sources:
  - ../../AGENTS.md
  - https://developers.google.com/identity/protocols/oauth2#expiration
created_at: 2026-10-05
updated_at: 2026-10-05
expires_at: null
related: []
---

# Recuperação das imagens do catálogo

Objetivo: investigar e corrigir imagens indisponíveis no PriceScout.

- [completed] Diagnóstico: API retornava HTTP 502; refresh OAuth do Drive retornava invalid_grant (token expirado ou revogado). API e worker tinham configuração igual ao .env.
- [completed] Pesquisa: documentação oficial do Google sobre expiração/revogação. Modo Testing pode expirar tokens Drive em sete dias; modo real do projeto não foi inspecionado.
- [completed] Correção: consentimento concluído pelo operador; novo token salvo no .env do ScoutApiV2 sem exposição, pasta existente preservada; api e image-optimizer recriados.
- [completed] Recuperação de cadastro: mesma imagem do celular anteriormente selecionada, cujo POST falhou com 502, reenviada pela galeria. UI confirmou imagem adicionada.
- [completed] Validação: quatro capas carregadas no navegador, incluindo celular em AVIF; leitura backend de 17 arquivos válida; logo Magazine Luiza carregado; 39 testes de imagens/renovação e Ruff passaram.

Ferramentas: PowerShell, Docker Compose, Python, pytest, Ruff, navegador conectado e busca web. Playwright MCP encontrou conflito de perfil; validação realizada pelo navegador conectado. Python da venv bloqueado por política local; Python instalado executou dependências da venv.

Alterações: script de bootstrap OAuth, teste de escrita segura de .env e playbook canônico de imagens no ScoutApiV2. Nenhuma alteração em componentes do frontend foi necessária.

Resultado final: quatro cards com imagens carregadas (complete=true, naturalWidth>0), upload e AVIF do celular concluídos. Pendências desta correção: nenhuma. Observação operacional: conferir estado de publicação do app OAuth dedicado para reduzir recorrência; não foi confirmado se Testing causou este incidente.

