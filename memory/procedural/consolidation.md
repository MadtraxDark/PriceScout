---
id: proc_memory_consolidation
type: procedural
status: validated
confidence: 0.8
source: agent
created_at: 2026-08-22
updated_at: 2026-08-22
expires_at: null
related:
  - ../schema/memory-entry.md
---

# Consolidação de memória

1. Leia as entradas candidatas em `inbox/` e os eventos relevantes em `episodic/`.
2. Separe fatos, hipóteses, preferências, decisões e procedimentos.
3. Verifique se já existe uma memória equivalente ou conflitante.
4. Exija fonte e confiança antes de promover uma entrada.
5. Escreva uma entrada pequena em `semantic/` ou `procedural/`.
6. Adicione a origem em `related` ou na seção `## Evidência`.
7. Marque entradas substituídas como `superseded` ou `deprecated`.
8. Atualize `memory/INDEX.md` se a entrada for importante para recuperação direta.

Nunca apague o evento episódico usado como evidência durante a consolidação.
