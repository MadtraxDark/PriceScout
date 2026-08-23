# Decisão 0006 — Armazenamento de imagens de produtos no Google Drive

## Contexto

O PriceScout precisa armazenar as imagens em alta resolução retornadas pelo scraper, reutilizar arquivos iguais e manter a relação entre produto e arquivo sem expor credenciais no navegador.

## Decisão

- Usar OAuth 2.0 de servidor com `access_type=offline` e o escopo mínimo `https://www.googleapis.com/auth/drive.file`.
- Armazenar somente o refresh token criptografado com AES-256-GCM no PostgreSQL. O access token é obtido sob demanda e não é persistido.
- Assinar o estado OAuth e protegê-lo com cookie `HttpOnly`, `SameSite=Lax` e expiração curta.
- Exigir uma sessão válida do Supabase nas rotas de autorização, status e upload.
- Ler a sessão do administrador no backend por cookies `@supabase/ssr`; o frontend não envia Bearer tokens às rotas do Drive e não participa do OAuth Google.
- Organizar os arquivos em `Produtos / <marca-slug> / <produto-id> / Imagens`.
- Consultar o cache de pastas por usuário, pai, tipo e chave antes de chamar a criação no Drive.
- Baixar cada imagem no servidor, validar HTTPS e `content-type` de imagem, limitar o arquivo a 25 MB e calcular SHA-256 sobre os bytes.
- Consultar `google_drive_files(user_id, sha256)` antes do upload. Em caso de hash existente, reutilizar o `drive_file_id`; em caso de corrida, remover o upload recém-criado quando a restrição única identificar o arquivo concorrente.
- Usar upload resumable da Drive API para suportar imagens grandes e falhas de rede.
- Persistir os metadados em `google_drive_connections`, `google_drive_folders`, `google_drive_files` e `google_drive_product_files`, com RLS por `auth.uid()` e escrita exclusiva pelo backend com service role.

## Fontes

- Google OAuth 2.0 para aplicações web: https://developers.google.com/identity/protocols/oauth2/web-server
- Escopos da Drive API: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- Busca de arquivos e pastas: https://developers.google.com/workspace/drive/api/guides/search-files
- Upload resumable: https://developers.google.com/workspace/drive/api/guides/manage-uploads
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

## Limitação atual

O fluxo está implementado, mas o ambiente precisa definir `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY` antes da primeira autorização. O valor deve ser um segredo de 32 bytes em base64 ou hexadecimal e permanecer somente no ambiente do servidor.
