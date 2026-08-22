# Arquitetura de memória

## Princípio

O armazenamento é Markdown-first: cada memória é legível por pessoas, versionável com Git e recuperável por ferramentas simples. SQLite, BM25 e embeddings são apenas índices derivados.

## Backend

Supabase é o backend oficial. O PostgreSQL armazena a projeção operacional da memória, enquanto os arquivos Markdown continuam sendo a fonte portátil e auditável. Auth, RLS, Data API, Realtime e Edge Functions serão adicionados conforme cada requisito for implementado.

O banco não deve receber uma entidade sem `id` estável, procedência, estado de ciclo de vida e timestamps compatíveis com a entrada Markdown correspondente.

## Fonte única para produtos e preços

O produto possui um registro canônico no PostgreSQL. Para cada produto e atributo canônico, como preço atual, nome ou disponibilidade normalizada, existe apenas um valor atual oficial.

O scraper trabalha em duas etapas:

```text
página externa → observação bruta → validação → atualização do produto canônico
                                      ↓
                                  alerta/revisão
```

Uma página que não encontrou o preço, informa indisponibilidade ou retorna um valor incompatível gera uma observação com estado `not_found`, `unavailable` ou `invalid`. Ela não apaga nem substitui o último valor canônico confirmado.

A interface de venda lê exclusivamente o produto canônico do banco. A observação raspada pode ser exibida como evidência ou status de coleta, mas nunca como uma segunda origem concorrente do preço.

O histórico pode guardar mudanças anteriores, mas deve haver uma única linha ou projeção identificável como valor atual por produto e atributo. A implementação deverá usar chaves estáveis, restrições de unicidade, validações de domínio e transações para impedir duplicidade e atualizações parciais.

Todo o projeto deve usar texto simples. Emojis são estritamente proibidos em arquivos, memória, código, comentários e mensagens do agente.

## Registro de execução

Processos longos ou com múltiplas etapas devem manter um diário operacional em `memory/working/`. O diário deve conter objetivo, checklist, estado atual, decisões, ferramentas e fontes utilizadas, resultados, falhas, bloqueios e próximo passo. A atualização ocorre depois de cada etapa relevante e antes de uma nova etapa.

Uma tarefa só pode ser considerada concluída quando a checklist estiver revisada. Itens não concluídos devem permanecer marcados como `pending` ou `blocked`, com a razão registrada.

## Camadas

```text
entrada → working → inbox → episodic → consolidação → semantic/procedural
                                             ↓
                                      índice de recuperação
```

### Working

Estado transitório da tarefa atual. Pode ser reescrito e deve permanecer pequeno.

### Episodic

Registro cronológico do que aconteceu, com contexto suficiente para auditoria e consolidação posterior.

### Semantic

Fatos, preferências e entidades consolidados. Uma entrada deve expressar uma ideia principal e informar sua procedência.

### Procedural

Passos, estratégias e regras que já funcionaram. Promoção para este nível exige validação explícita.

### Inbox

Área de triagem para observações candidatas. Nada em `inbox/` deve ser tratado como verdade permanente.

## Ciclo de vida

1. Capturar a observação em `working/` ou `episodic/`.
2. Classificar como fato, hipótese, preferência, decisão ou procedimento.
3. Validar, deduplicar e relacionar com fontes.
4. Promover para `semantic/` ou `procedural/`.
5. Recuperar usando o índice e reforçar memórias úteis.
6. Marcar como `deprecated` quando estiver desatualizada, preservando o histórico.

## Recuperação progressiva

1. `memory/INDEX.md` e caminhos conhecidos.
2. Busca textual por título, tags e conteúdo.
3. Índice FTS/BM25 local.
4. Busca semântica, somente quando o volume justificar.

O resultado recuperado deve incluir o caminho da fonte e a confiança da memória.

## Política de pesquisa e ferramentas

Decisões técnicas devem ser baseadas em pesquisa atual. O agente deve consultar documentação oficial e, quando trouxer valor, complementar com repositórios, fóruns, Stack Overflow e Reddit. Fontes práticas devem ser tratadas como evidência de experiência, não como autoridade automática.

Skills, MCPs e CLIs disponíveis fazem parte da arquitetura operacional do agente. Antes de executar uma tarefa, o agente deve descobrir as ferramentas aplicáveis, usar as que forem relevantes e registrar limitações de disponibilidade. A pesquisa e as ferramentas utilizadas devem ser registradas junto da decisão para manter a memória auditável.
