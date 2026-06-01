# Prisma Workflow (Projeto)

## Sequencia recomendada

1. `npm run -w @gp/api prisma:generate`
2. `npm run -w @gp/api prisma:migrate:dev -- --name <nome_migration>`
3. `npm run -w @gp/api prisma:seed`
4. `npm run -w @gp/api test`

## Reset local seguro

- `npm run -w @gp/api prisma:reset:dev`

Esse comando deve:
- resetar banco local de desenvolvimento
- reaplicar migrations
- rodar seed automaticamente

## Dados minimos de seed

- 1 lote ativo com peso de entrada e custo de aquisicao
- 1 insumo para trato
- 2 pesagens para permitir GMD
- 1 registro de trato para eficiencia alimentar
- 1 custo operacional
- 1 cotacao de arroba manual

## Critico para idempotencia

- Seed deve ser reproduzivel sem duplicar chaves unicas (`codigo` de lote, `identificacao` de animal, etc).
