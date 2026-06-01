---
name: api-contract-e2e-playbook
description: Padroniza testes end-to-end de contratos HTTP da API NestJS com foco em estabilidade de integracao entre mobile offline, backend e dashboard web. Use quando criar, revisar ou depurar endpoints, payloads, codigos de status, idempotencia, cursor incremental e regressao de contrato.
---

# API Contract E2E Playbook

Use esta skill para garantir que contratos da API continuem confiaveis.

## Fluxo padrao

1. Levantar app Nest em ambiente de teste isolado.
2. Popular dados de cenario via endpoints publicos ou fixtures.
3. Validar contrato completo:
   - status HTTP
   - shape do JSON
   - semantica de negocio
4. Cobrir casos de sucesso e de borda.
5. Rodar suite em pipeline local antes de merge.

## Endpoints criticos do projeto

- `POST /api/v1/sync/events`
- `GET /api/v1/sync/changes?cursor=...`
- `GET /api/v1/lotes/:id/kpis`
- `POST /api/v1/cotacoes-arroba`
- `GET /api/v1/cotacoes-arroba`

## Regras obrigatorias

- Testar idempotencia com reenvio do mesmo evento.
- Testar pull incremental com cursor avançando sem repeticao.
- Testar KPI com dados minimos reproduziveis.
- Testar validacao minima de payload invalido.
