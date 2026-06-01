import { beforeEach, describe, expect, it } from "vitest";
import { resetStore, store } from "../src/core/data-store";
import { LotesService } from "../src/modules/lotes/lotes.service";

describe("LotesService KPI", () => {
  const service = new LotesService({} as never);

  beforeEach(() => {
    resetStore();
  });

  it("calcula GMD, eficiencia e break-even", async () => {
    store.lotes.set("l1", {
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

    store.pesagens.set("p1", {
      id: "p1",
      loteId: "l1",
      dataPesagem: "2026-05-11T00:00:00.000Z",
      pesoKg: 390
    });

    store.tratos.set("t1", {
      id: "t1",
      loteId: "l1",
      data: "2026-05-02T00:00:00.000Z",
      insumoId: "i1",
      quantidadeKg: 200
    });

    const kpis = await service.getKpis("l1");
    expect(kpis.gmdKgDia).toBeCloseTo(3, 3);
    expect(kpis.eficienciaAlimentar).toBeCloseTo(6.666, 2);
    expect(kpis.breakEvenArroba).toBeGreaterThan(0);
  });

  it("marca bloqueio por carencia ativa", async () => {
    store.lotes.set("l1", {
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

    store.tratamentos.set("s1", {
      id: "s1",
      loteId: "l1",
      medicamento: "produto-x",
      dataAplicacao: new Date().toISOString(),
      diasCarencia: 30
    });

    const kpis = await service.getKpis("l1");
    expect(kpis.bloqueadoPorCarencia).toBe(true);
  });
});
