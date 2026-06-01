# E2E Checklist

## Sync

- Reenvio do mesmo evento retorna duplicado e nao duplica efeito.
- Cursor incremental retorna apenas mudanças novas.

## KPI

- Dado lote com pesagem e trato, endpoint retorna campos obrigatorios de KPI.
- `bloqueadoPorCarencia` responde `true` com tratamento em carencia ativa.

## Cotacao

- Criacao manual persiste.
- Listagem retorna em ordem decrescente por data.

## Regressao de shape

- Contratos devem manter chaves esperadas.
- Mudancas de shape exigem atualizacao explicita de consumidor.
