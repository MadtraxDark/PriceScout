# Memória do PriceScout

Esta pasta contém a memória persistente do agente. Leia `../AGENTS.md` antes de criar ou alterar entradas.

## Diretórios

- `working/`: estado temporário da sessão.
- `episodic/`: eventos e interações históricas.
- `semantic/`: fatos e preferências consolidados.
- `procedural/`: procedimentos validados.
- `inbox/`: candidatos aguardando validação.
- `archive/`: memórias antigas ou substituídas.
- `schema/`: contrato dos arquivos de memória.

Uma memória não é permanente apenas por estar escrita. Ela precisa de procedência, classificação e ciclo de vida.

Processos em andamento devem usar um registro em `working/`, preferencialmente baseado em `working/execution-log-template.md`. O registro deve ser atualizado continuamente e deixar claras todas as pendências antes do encerramento.

Para dados de produto, diferencie sempre o fato canônico da observação que o originou. Uma falha de coleta é memória de evento ou evidência, não um novo valor de produto.
