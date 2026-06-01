---
name: delivery-quality-gates
description: Define gates minimos de qualidade antes de merge e release em projetos full-stack. Use quando for preparar PR, release local ou CI, garantindo testes unitarios, E2E de contrato, build e verificacoes de migracao/seed.
---

# Delivery Quality Gates

Use esta skill para padronizar o "definition of done" tecnico.

## Gate obrigatorio

1. `npm run -w @gp/api test`
2. `npm run -w @gp/api test:e2e`
3. `npm run -w @gp/api build`
4. `npm run -w @gp/web build`
5. Verificacao de migration/seed em ambiente local.

## Regras

- Nao liberar se contrato E2E falhar.
- Nao liberar mudanca de schema sem seed atualizado.
- Publicar checklist de evidencias no fechamento tecnico.
