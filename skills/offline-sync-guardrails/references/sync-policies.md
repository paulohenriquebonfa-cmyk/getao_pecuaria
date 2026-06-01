# Sync Policies (v1)

## Contrato de evento

Campos obrigatorios:
- `eventId`: UUID do evento no dispositivo
- `deviceId`: identificador estavel do dispositivo
- `sequence`: inteiro incremental por dispositivo
- `type`: tipo de evento de dominio
- `occurredAt`: timestamp de ocorrencia (apenas informativo)
- `payload`: dados de negocio do evento

## Idempotencia

- Chave de idempotencia: `deviceId + eventId`
- Se chave existir, retornar sucesso com status `duplicate_ignored`
- Nao reexecutar efeito colateral

## Ordenacao e retries

- `sequence` deve crescer sem regressao por `deviceId`
- Evento com `sequence` menor ou igual ao ultimo confirmado: tratar como duplicado
- Falha transiente de rede/timeout: cliente deve retry exponencial com jitter

## Conflitos

Regra v1 recomendada:
- Entidades operacionais de campo: `last-write-wins` por `server_received_at`
- Entidades financeiras/sanitarias sensiveis: rejeitar em conflito e exigir resolucao manual

Sempre registrar:
- valor anterior
- valor novo
- regra aplicada
- usuario/dispositivo de origem

## Pull incremental por cursor

- Cliente envia `cursor_atual`
- Servidor retorna apenas alterações com cursor maior
- Resposta inclui `nextCursor`
- Cliente confirma `nextCursor` apenas apos aplicar lote local

## Observabilidade minima

Metrica por dia:
- taxa de duplicidade
- taxa de rejeicao
- tempo medio de convergencia offline->online
- numero de conflitos por tipo de entidade
