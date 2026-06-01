---
name: bug-fix-triage-playbook
description: Conduz triagem, reproducao, diagnostico e correcao de bugs em projetos full-stack com API e frontend, com foco em evidencias e regressao zero. Use quando houver erro em runtime, falha de rota, quebra de formulario, inconsistencias de dados, instabilidade de dev server ou testes quebrados.
---

# Bug Fix Triage Playbook

Use esta skill para reduzir tempo de resposta e evitar correcoes parciais.

## Fluxo obrigatorio

1. Reproduzir o bug com passos objetivos.
2. Capturar evidencias:
   - status HTTP
   - mensagem de erro
   - stacktrace
   - endpoint/arquivo afetado
3. Isolar camada:
   - frontend (renderizacao/formulario)
   - backend (rota/servico)
   - dados (seed/migration/cache)
   - runtime (processo/porta/build antigo)
4. Aplicar menor correcao segura.
5. Validar:
   - reproduzir fluxo original com sucesso
   - rodar testes relevantes
   - confirmar que nao houve regressao visivel
6. Registrar causa raiz e acao preventiva.

## Regras de qualidade

- Nunca corrigir no escuro: sempre confirmar o sintoma antes.
- Priorizar correcoes idempotentes e reversiveis.
- Evitar workaround sem documentar causa raiz.
- Em erro de ambiente, corrigir tambem o script de inicializacao para nao reincidir.

## Entrega esperada

- Sintoma reproduzido
- Causa raiz confirmada
- Correcao aplicada
- Validacao executada
- Proxima prevencao recomendada
