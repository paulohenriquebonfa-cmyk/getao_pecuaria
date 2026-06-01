"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const data_store_1 = require("../src/core/data-store");
const lotes_service_1 = require("../src/modules/lotes/lotes.service");
(0, vitest_1.describe)("LotesService KPI", () => {
    const service = new lotes_service_1.LotesService({});
    (0, vitest_1.beforeEach)(() => {
        (0, data_store_1.resetStore)();
    });
    (0, vitest_1.it)("calcula GMD, eficiencia e break-even", async () => {
        data_store_1.store.lotes.set("l1", {
            id: "l1",
            codigo: "L001",
            dataEntrada: "2026-05-01T00:00:00.000Z",
            cabecas: 10,
            pesoMedioEntradaKg: 360,
            custoAquisicaoTotal: 80000,
            freteTotal: 3000,
            pesoIdealAbateKg: 520,
            status: "ATIVO"
        });
        data_store_1.store.pesagens.set("p1", {
            id: "p1",
            loteId: "l1",
            dataPesagem: "2026-05-11T00:00:00.000Z",
            pesoKg: 390
        });
        data_store_1.store.tratos.set("t1", {
            id: "t1",
            loteId: "l1",
            data: "2026-05-02T00:00:00.000Z",
            insumoId: "i1",
            quantidadeKg: 200
        });
        const kpis = await service.getKpis("l1");
        (0, vitest_1.expect)(kpis.gmdKgDia).toBeCloseTo(3, 3);
        (0, vitest_1.expect)(kpis.eficienciaAlimentar).toBeCloseTo(6.666, 2);
        (0, vitest_1.expect)(kpis.breakEvenArroba).toBeGreaterThan(0);
    });
    (0, vitest_1.it)("marca bloqueio por carencia ativa", async () => {
        data_store_1.store.lotes.set("l1", {
            id: "l1",
            codigo: "L001",
            dataEntrada: "2026-05-01T00:00:00.000Z",
            cabecas: 10,
            pesoMedioEntradaKg: 360,
            custoAquisicaoTotal: 80000,
            freteTotal: 3000,
            pesoIdealAbateKg: 520,
            status: "ATIVO"
        });
        data_store_1.store.tratamentos.set("s1", {
            id: "s1",
            loteId: "l1",
            medicamento: "produto-x",
            dataAplicacao: new Date().toISOString(),
            diasCarencia: 30
        });
        const kpis = await service.getKpis("l1");
        (0, vitest_1.expect)(kpis.bloqueadoPorCarencia).toBe(true);
    });
});
