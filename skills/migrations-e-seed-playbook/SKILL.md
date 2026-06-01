---
name: migrations-e-seed-playbook
description: Padroniza fluxo de evolucao de schema Prisma, geracao de migrations, seed de dados de referencia e reset local seguro. Use quando houver alteracao de entidades, necessidade de dados de teste reproduziveis, preparacao de ambiente local, troubleshooting de migration ou validacao de KPIs com base persistida.
---

# Migrations e Seed Playbook

Use esta skill para manter ambiente reprodutivel durante evolucao do backend.

## Fluxo padrao

1. Atualizar schema em `apps/api/prisma/schema.prisma`.
2. Gerar cliente Prisma.
3. Criar migration nomeada com escopo claro.
4. Aplicar migration no banco local.
5. Rodar seed padrao do projeto.
6. Validar endpoints-chave (`/sync/events`, `/sync/changes`, `/lotes/:id/kpis`, `/cotacoes-arroba`).

## Regras obrigatorias

- Nomear migration pelo comportamento de negocio (ex.: `add_cursor_to_evento_sync`).
- Nunca editar migration aplicada manualmente; criar migration corretiva.
- Manter seed idempotente com `upsert` sempre que possivel.
- Versionar seed com cenarios minimos para KPI e sincronizacao.

## Comandos operacionais

Consultar [references/prisma-workflow.md](references/prisma-workflow.md) para comandos oficiais do projeto.
