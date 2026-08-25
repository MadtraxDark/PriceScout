---
type: working
status: completed
created: 2026-08-25
updated: 2026-08-25
confidence: high
---

# Assets de identidade nas entidades comerciais

## Objetivo

Usar logo, símbolo ou ícone para marca, loja, vendedor e responsável pela entrega quando a API fornecer um asset confiável, sem duplicar nomes ou deformar imagens.

## Checklist

- [completed] Auditar contratos e assets existentes
- [completed] Definir prioridade de seleção por contexto
- [completed] Criar componente reutilizável com fallback acessível
- [completed] Integrar nas quatro entidades da prévia
- [completed] Validar lint, build e diff

## Decisão

O repositório não possui assets locais confiáveis e o contrato anterior não expunha assets de entidades. Foram adicionados campos opcionais `brand_assets`, `store_assets`, `seller_assets` e `delivery_assets`, com tipos `logo`, `symbol`, `icon` e `alt`. A interface usa texto quando esses campos não chegam da API.

## Regras implementadas

- Modo amplo: `logo`, depois `symbol`, depois `icon`, depois texto.
- Modo compacto: `symbol`, depois `icon`, depois `logo`, depois texto.
- Wordmark usa `alt` com o nome e não duplica o nome em texto.
- Símbolo/ícone exibe o nome ao lado.
- Falha de carregamento tenta o próximo asset e termina em texto.
- Aspect ratio preservado por `object-fit: contain` e limites de largura/altura.

## Validação

- `npm run lint`: concluído sem erros.
- `npm run build`: concluído com sucesso.
- `git diff --check`: concluído sem erros de whitespace.
