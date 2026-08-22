# PriceScout

O PriceScout é uma memória persistente para agentes de IA, organizada como Markdown-first.

O backend planejado é Supabase, usando o PostgreSQL gerenciado como armazenamento operacional. Markdown continua sendo a fonte de verdade portátil e auditável.

## Organização

- `AGENTS.md`: regras operacionais do projeto.
- `memory/working`: contexto temporário.
- `memory/episodic`: eventos e sessões.
- `memory/semantic`: fatos consolidados.
- `memory/procedural`: procedimentos validados.
- `memory/inbox`: memórias aguardando validação.
- `docs/architecture.md`: arquitetura e ciclo de vida.
- `docs/decisions/`: decisões arquiteturais registradas.
- `supabase/`: regras e planejamento do backend Supabase/PostgreSQL.

Markdown versionado é a fonte de verdade. Índices locais e embeddings, quando adicionados, serão derivados e recriáveis.

Emojis são estritamente proibidos em todo o projeto.

## Política operacional

Decisões técnicas devem ser pesquisadas na internet e comparadas com documentação oficial e fontes práticas relevantes. Skills, MCPs e CLIs disponíveis devem ser descobertos e usados quando aplicáveis. Limitações de acesso ou de ferramenta devem ser registradas, nunca ocultadas.

## Docker

O projeto pode ser executado usando apenas a Docker CLI:

```bash
docker build -t pricescout:local .
docker run --rm --name pricescout -p 8080:80 pricescout:local
```

Acesse http://localhost:8080. Para executar em segundo plano:

```bash
docker run -d --name pricescout -p 8080:80 pricescout:local
docker logs -f pricescout
docker stop pricescout
docker rm pricescout
```

Verificação rápida da imagem:

```bash
docker image inspect pricescout:local
docker run --rm pricescout:local nginx -t
```

O `Dockerfile` usa Nginx Alpine como servidor HTTP para o conteúdo em `public/`. Quando a aplicação principal for adicionada, esse arquivo pode ser ajustado para o runtime e o comando de inicialização correspondentes.
