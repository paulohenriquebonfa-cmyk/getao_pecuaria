import { describe, expect, it, beforeEach } from "vitest";
import { EventoTipo } from "@gp/shared";
import { resetStore, store } from "../src/core/data-store";
import { SyncService } from "../src/modules/sync/sync.service";

describe("SyncService", () => {
  const service = new SyncService({} as never);

  beforeEach(() => {
    resetStore();
  });

  it("deve aplicar evento uma vez e ignorar reenvio (idempotencia)", async () => {
    const event = {
      eventId: "evt-1",
      deviceId: "dev-1",
      sequence: 1,
      type: EventoTipo.LOTE_CRIADO,
      loteId: "lote-1",
      payload: {
        codigo: "L001",
        dataEntrada: "2026-05-01",
        cabecas: 10,
        pesoMedioEntradaKg: 360
      },
      occurredAt: "2026-05-01T10:00:00.000Z"
    };

    const first = await service.applyEvents([event]);
    const second = await service.applyEvents([event]);

    expect(first.accepted).toEqual(["evt-1"]);
    expect(second.duplicates).toEqual(["evt-1"]);
    expect(store.lotes.size).toBe(1);
  });

  it("deve retornar mudancas incrementais por cursor", async () => {
    await service.applyEvents([
      {
        eventId: "evt-1",
        deviceId: "dev-1",
        sequence: 1,
        type: EventoTipo.LOTE_CRIADO,
        loteId: "lote-1",
        payload: {
          codigo: "L001",
          dataEntrada: "2026-05-01",
          cabecas: 10,
          pesoMedioEntradaKg: 360
        },
        occurredAt: "2026-05-01T10:00:00.000Z"
      },
      {
        eventId: "evt-2",
        deviceId: "dev-1",
        sequence: 2,
        type: EventoTipo.TRATO_REGISTRADO,
        loteId: "lote-1",
        payload: {
          quantidadeKg: 150
        },
        occurredAt: "2026-05-02T10:00:00.000Z"
      }
    ]);

    const firstPull = await service.getChanges(0);
    const secondPull = await service.getChanges(firstPull.cursor);

    expect(firstPull.changes.length).toBe(2);
    expect(secondPull.changes.length).toBe(0);
  });
});
