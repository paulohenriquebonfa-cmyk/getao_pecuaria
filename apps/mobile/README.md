# Mobile Operacional (Expo)

Base para fluxo offline-first:
- fila local de eventos
- sync incremental com `/api/v1/sync/events` e `/api/v1/sync/changes`
- telas iniciais: entrada de lote, trato, pesagem e sanitario

Arquivos de referencia:
- `src/offline/event-queue.ts`: persistencia da fila local e cursor
- `src/offline/sync-client.ts`: push de eventos e pull incremental

## Conexao com mesmo backend do PC/Web

Para PC, iOS e Android se atualizarem pelo mesmo backend, configure:

- `EXPO_PUBLIC_API_BASE_URL=http://SEU_IP_OU_DOMINIO:3001`

Exemplo em rede local:

- `EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:3001`

Se o backend estiver publicado, use a URL HTTPS publica da API.
