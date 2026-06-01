# Debug Checklist (Projeto)

## 1) Confirmar runtime

- Porta web ativa (`3000`)
- Porta api ativa (`3001`)
- Processo atual corresponde ao build atual

## 2) Confirmar contrato API

- Endpoint existe (GET/POST)
- Payload valido
- Status esperado (2xx/4xx/5xx)

## 3) Confirmar build e cache

- `@gp/shared` compilado
- API compilada (`dist` atualizado)
- limpar `.next` em falhas de readlink no OneDrive

## 4) Confirmar fluxo de usuario

- formulario envia payload correto
- estado da tela apos submit
- mensagem de erro acionavel

## 5) Fechar com prevencao

- adicionar teste de regressao (unit/e2e)
- ajustar script de start/build se houve erro operacional
