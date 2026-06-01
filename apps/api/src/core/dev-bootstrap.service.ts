import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { useDatabasePersistence } from "./persistence";
import { PrismaService } from "./prisma.service";
import { store } from "./data-store";

@Injectable()
export class DevBootstrapService implements OnModuleInit {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (process.env.BOOTSTRAP_DEMO !== "true") return;
    if (useDatabasePersistence()) {
      await this.bootstrapDatabaseDevData();
      return;
    }
    if (store.lotes.size > 0) return;

    store.lotes.set("lote-1", {
      id: "lote-1",
      codigo: "L001-DEMO",
      dataEntrada: "2026-05-01T00:00:00.000Z",
      cabecas: 20,
      pesoMedioEntradaKg: 360,
      custoAquisicaoTotal: 160000,
      freteTotal: 6000,
      pesoIdealAbateKg: 520,
      status: "ATIVO"
    });

    store.pesagens.set("pesagem-demo-1", {
      id: "pesagem-demo-1",
      loteId: "lote-1",
      dataPesagem: "2026-05-11T00:00:00.000Z",
      pesoKg: 390
    });

    store.tratos.set("trato-demo-1", {
      id: "trato-demo-1",
      loteId: "lote-1",
      data: "2026-05-10T00:00:00.000Z",
      insumoId: "insumo-demo",
      quantidadeKg: 300
    });

    store.custosOperacionais.set("custo-demo-1", {
      id: "custo-demo-1",
      loteId: "lote-1",
      data: "2026-05-10T00:00:00.000Z",
      valor: 4500,
      tipo: "FIXO",
      descricao: "Custo operacional demo"
    });
  }

  private async bootstrapDatabaseDevData() {
    const lote = await this.prisma.lote.upsert({
      where: { id: "lote-1" },
      update: {},
      create: {
        id: "lote-1",
        codigo: "L001-DEMO",
        dataEntrada: new Date("2026-05-01T00:00:00.000Z"),
        cabecas: 20,
        pesoMedioEntradaKg: 360,
        pesoIdealAbateKg: 520,
        custoAquisicaoTotal: new Prisma.Decimal(160000),
        freteTotal: new Prisma.Decimal(6000),
        status: "ATIVO"
      }
    });

    await this.prisma.insumo.upsert({
      where: { id: "insumo-demo" },
      update: {},
      create: {
        id: "insumo-demo",
        nome: "Milho Demo",
        categoria: "ENERGETICO",
        estoqueKg: 10000,
        pontoReposicaoKg: 3000
      }
    });

    await this.prisma.pesagem.upsert({
      where: { id: "pesagem-demo-1" },
      update: {},
      create: {
        id: "pesagem-demo-1",
        loteId: lote.id,
        dataPesagem: new Date("2026-05-11T00:00:00.000Z"),
        pesoKg: 390
      }
    });

    await this.prisma.tratoDiario.upsert({
      where: { id: "trato-demo-1" },
      update: {},
      create: {
        id: "trato-demo-1",
        loteId: lote.id,
        insumoId: "insumo-demo",
        data: new Date("2026-05-10T00:00:00.000Z"),
        quantidadeKg: 300
      }
    });

    await this.prisma.custoOperacional.upsert({
      where: { id: "custo-demo-1" },
      update: {},
      create: {
        id: "custo-demo-1",
        loteId: lote.id,
        data: new Date("2026-05-10T00:00:00.000Z"),
        valor: new Prisma.Decimal(4500),
        tipo: "FIXO",
        descricao: "Custo operacional demo"
      }
    });
  }
}
