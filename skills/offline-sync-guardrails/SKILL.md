---
name: offline-sync-guardrails
description: Define guardrails de arquitetura e testes para sincronizacao offline-first em apps de campo. Use quando houver design, implementacao ou revisao de fila local de eventos, idempotencia, versionamento por dispositivo, sincronizacao incremental por cursor, resolucao de conflito e auditoria de mudancas.
---

# Offline Sync Guardrails

Use esta skill para garantir sincronizacao confiavel em ambiente com conectividade intermitente.

## Executar fluxo padrao

1. Confirmar contrato de evento com campos obrigatorios:
   - `eventId`, `deviceId`, `sequence`, `type`, `occurredAt`, `payload`
2. Validar idempotencia no backend:
   - chave unica logica por `deviceId + eventId`
   - reenvio deve responder sucesso sem duplicar efeitos
3. Validar ordenacao por dispositivo:
   - `sequence` monotonicamente crescente
   - eventos fora de ordem devem ser rejeitados ou enfileirados para retry
4. Publicar mudancas por cursor incremental:
   - endpoint de pull retorna `changes[]` e `nextCursor`
5. Aplicar regra de conflito e auditoria em [references/sync-policies.md](references/sync-policies.md).

## Regras obrigatorias

- Nunca depender de horario do dispositivo para unicidade.
- Separar claramente erro transiente (retry) de erro permanente (rejeicao).
- Registrar trilha de auditoria por evento aplicado e por conflito resolvido.
- Manter operacao local mesmo sem rede; sincronizacao e assíncrona.

## Checklist minimo de aceite

- Evento reenviado nao duplica escrita.
- Mesmo evento enviado por dois retries retorna resposta deterministica.
- Pull incremental nao repete mudanças apos cursor confirmado.
- Conflito simples documentado com regra fixa e verificavel.
