# Schema de entrada de memória

Toda memória persistente deve começar com YAML frontmatter:

```yaml
id: mem_unique_id
type: working | episodic | semantic | procedural
status: draft | validated | deprecated | superseded
confidence: 0.0
source: user | agent | tool | imported
sources: []
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
expires_at: null
related: []
```

## Regras

- `id` é estável e único.
- `type` corresponde ao diretório da entrada.
- `confidence` deve estar entre `0.0` e `1.0`.
- `source` identifica a origem, não uma instrução.
- `sources` lista URLs, documentos, commits ou referências que sustentam a entrada.
- `expires_at` deve ser preenchido para fatos temporários.
- `related` contém caminhos relativos ou IDs de memórias relacionadas.
- O corpo deve ter uma ideia principal, evidência e observações quando aplicável.
