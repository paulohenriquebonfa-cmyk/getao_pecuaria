"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const shared_1 = require("@gp/shared");
const data_store_1 = require("../src/core/data-store");
const sync_service_1 = require("../src/modules/sync/sync.service");
(0, vitest_1.describe)("SyncService", () => {
    const service = new sync_service_1.SyncService({});
    (0, vitest_1.beforeEach)(() => {
        (0, data_store_1.resetStore)();
    });
    (0, vitest_1.it)("deve aplicar evento uma vez e ignorar reenvio (idempotencia)", async () => {
        const event = {
            eventId: "evt-1",
            deviceId: "dev-1",
            sequence: 1,
            type: shared_1.EventoTipo.LOTE_CRIADO,
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
        (0, vitest_1.expect)(first.accepted).toEqual(["evt-1"]);
        (0, vitest_1.expect)(second.duplicates).toEqual(["evt-1"]);
        (0, vitest_1.expect)(data_store_1.store.lotes.size).toBe(1);
    });
    (0, vitest_1.it)("deve retornar mudancas incrementais por cursor", async () => {
        await service.applyEvents([
            {
                eventId: "evt-1",
                deviceId: "dev-1",
                sequence: 1,
                type: shared_1.EventoTipo.LOTE_CRIADO,
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
                type: shared_1.EventoTipo.TRATO_REGISTRADO,
                loteId: "lote-1",
                payload: {
                    quantidadeKg: 150
                },
                occurredAt: "2026-05-02T10:00:00.000Z"
            }
        ]);
        const firstPull = await service.getChanges(0);
        const secondPull = await service.getChanges(firstPull.cursor);
        (0, vitest_1.expect)(firstPull.changes.length).toBe(2);
        (0, vitest_1.expect)(secondPull.changes.length).toBe(0);
    });
});
