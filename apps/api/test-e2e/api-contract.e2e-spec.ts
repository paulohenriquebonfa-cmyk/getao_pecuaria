import { describe, expect, beforeEach, it } from "vitest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { resetStore, store } from "../src/core/data-store";
import { EventoTipo } from "@gp/shared";

describe("API Contract E2E", () => {
  let app: INestApplication;

  beforeEach(async () => {
    resetStore();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
  });

  it("sync/events deve aceitar evento e ignorar duplicado", async () => {
    const event = {
      eventId: "evt-e2e-1",
      deviceId: "dev-e2e",
      sequence: 1,
      type: EventoTipo.LOTE_CRIADO,
      loteId: "lote-e2e",
      occurredAt: "2026-05-01T00:00:00.000Z",
      payload: {
        codigo: "L-E2E-001",
        dataEntrada: "2026-05-01T00:00:00.000Z",
        cabecas: 10,
        pesoMedioEntradaKg: 360,
        custoAquisicaoTotal: 100000,
        freteTotal: 3000
      }
    };

    const first = await request(app.getHttpServer())
      .post("/api/v1/sync/events")
      .send({ events: [event] });
    expect(first.status).toBe(201);
    expect(first.body.accepted).toContain("evt-e2e-1");

    const second = await request(app.getHttpServer())
      .post("/api/v1/sync/events")
      .send({ events: [event] });
    expect(second.status).toBe(201);
    expect(second.body.duplicates).toContain("evt-e2e-1");
  });

  it("sync/changes deve respeitar cursor incremental", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/sync/events")
      .send({
        events: [
          {
            eventId: "evt-e2e-2",
            deviceId: "dev-e2e",
            sequence: 2,
            type: EventoTipo.LOTE_CRIADO,
            loteId: "lote-e2e-2",
            occurredAt: "2026-05-01T00:00:00.000Z",
            payload: {
              codigo: "L-E2E-002",
              dataEntrada: "2026-05-01T00:00:00.000Z"
            }
          }
        ]
      });

    const pull1 = await request(app.getHttpServer()).get("/api/v1/sync/changes?cursor=0");
    expect(pull1.status).toBe(200);
    expect(Array.isArray(pull1.body.changes)).toBe(true);
    const cursor = pull1.body.cursor as number;

    const pull2 = await request(app.getHttpServer()).get(`/api/v1/sync/changes?cursor=${cursor}`);
    expect(pull2.status).toBe(200);
    expect(pull2.body.changes.length).toBe(0);
  });

  it("lotes/:id/kpis deve retornar contrato de KPI", async () => {
    store.lotes.set("lote-kpi", {
      id: "lote-kpi",
      codigo: "L-KPI-001",
      dataEntrada: "2026-05-01T00:00:00.000Z",
      cabecas: 10,
      pesoMedioEntradaKg: 360,
      custoAquisicaoTotal: 100000,
      freteTotal: 3000,
      pesoIdealAbateKg: 520,
      status: "ATIVO"
    });
    store.pesagens.set("pk1", {
      id: "pk1",
      loteId: "lote-kpi",
      dataPesagem: "2026-05-11T00:00:00.000Z",
      pesoKg: 390
    });

    const response = await request(app.getHttpServer()).get("/api/v1/lotes/lote-kpi/kpis");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      loteId: "lote-kpi"
    });
    expect(typeof response.body.gmdKgDia).toBe("number");
    expect(typeof response.body.breakEvenArroba).toBe("number");
    expect(typeof response.body.diasProjetadosVenda).toBe("number");
    expect(typeof response.body.bloqueadoPorCarencia).toBe("boolean");
  });

  it("lotes GET/POST deve criar e listar lote", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/lotes")
      .send({
        codigo: "L-E2E-CREATE-001",
        dataEntrada: "2026-05-31",
        cabecas: 8,
        pesoMedioEntradaKg: 345,
        pesoMetaVendaKg: 500,
        custoAquisicaoTotal: 50000,
        freteTotal: 1800
      });
    expect(created.status).toBe(201);
    expect(created.body.codigo).toBe("L-E2E-CREATE-001");
    expect(typeof created.body.id).toBe("string");

    const listed = await request(app.getHttpServer()).get("/api/v1/lotes");
    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect(listed.body.some((x: { codigo: string }) => x.codigo === "L-E2E-CREATE-001")).toBe(true);
  });

  it("lotes POST inválido deve retornar 400 legível", async () => {
    const invalid = await request(app.getHttpServer())
      .post("/api/v1/lotes")
      .send({
        codigo: "",
        dataEntrada: "",
        cabecas: 0,
        pesoMedioEntradaKg: 0,
        pesoMetaVendaKg: 0,
        custoAquisicaoTotal: 0,
        freteTotal: 0
      });
    expect(invalid.status).toBe(400);
    expect(typeof invalid.body.message).toBe("string");
  });

  it("cotacoes-arroba create/list deve funcionar", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/cotacoes-arroba")
      .send({
        data: "2026-05-31T00:00:00.000Z",
        regiao: "Cuiaba-MT",
        valor: 285.5,
        usuarioId: "user-e2e"
      });
    expect(created.status).toBe(201);

    const list = await request(app.getHttpServer()).get("/api/v1/cotacoes-arroba");
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThan(0);
  });
});
