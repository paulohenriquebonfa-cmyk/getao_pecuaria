# Gestao Pecuaria - Engorda/Semi-Confinamento

MVP tecnico do sistema hibrido:
- `apps/mobile`: operacao offline-first no curral com fila local de eventos
- `apps/api`: API de dominio (NestJS) + motor de KPIs + persistencia Prisma/PostgreSQL
- `apps/web`: dashboard gerencial (Next.js) consumindo KPIs
- `packages/shared`: tipos e contratos compartilhados

## Contratos v1 (API)

- `POST /api/v1/sync/events`
- `GET /api/v1/sync/changes?cursor=0`
- `GET /api/v1/lotes/:id/kpis`
- `POST /api/v1/cotacoes-arroba`
- `GET /api/v1/cotacoes-arroba`

## Regras implementadas

- Idempotencia de eventos por `deviceId + eventId` (persistido em `EventoSync`)
- Versionamento por `sequence` por dispositivo
- Cursor incremental para sync de mudancas (campo monotono `cursor`)
- KPIs: GMD, eficiencia alimentar, custo diaria/cabeca, custo arroba produzida,
  break-even, projecao de abate e bloqueio por carencia

## Como rodar (Banco + API + Web)

1. `npm install`
2. Subir Postgres local: `npm run db:up`
3. Criar `apps/api/.env` a partir de [apps/api/.env.example](/C:/Users/paulo/OneDrive/Documentos/Gestao_Pecuaria/apps/api/.env.example)
4. Criar `apps/web/.env.local` a partir de [apps/web/.env.local.example](/C:/Users/paulo/OneDrive/Documentos/Gestao_Pecuaria/apps/web/.env.local.example)
5. `npm run -w @gp/api prisma:generate`
6. `npm run -w @gp/api prisma:migrate:dev`
7. `npm run -w @gp/api prisma:seed`
8. `npm run -w @gp/api start:dev`
9. `npm run -w @gp/web dev`

Com isso, tudo que voce cadastrar na web sera persistido no PostgreSQL.

### Reset de ambiente local

- `npm run -w @gp/api prisma:reset:dev`
- `npm run dev:restart` (reinicia API/Web e limpa cache `.next`)
- `npm run db:down` (desliga o Postgres local)

## Quality Gates recomendados

1. `npm run -w @gp/api test`
2. `npm run -w @gp/api test:e2e`
3. `npm run -w @gp/api build`
4. `npm run -w @gp/web build`
5. Atalho único: `npm run quality:gate`
