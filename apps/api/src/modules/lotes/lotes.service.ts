import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { KPIResponse } from "@gp/shared";
import { Prisma } from "@prisma/client";
import { resetStore, store } from "../../core/data-store";
import { newId } from "../../core/id";
import { calculateKpis } from "../../core/kpi-calculator";
import { useDatabasePersistence } from "../../core/persistence";
import { PrismaService } from "../../core/prisma.service";

@Injectable()
export class LotesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listLotes() {
    if (!useDatabasePersistence()) {
      return [...store.lotes.values()].map((l) => ({
        id: l.id,
        codigo: l.codigo,
        cabecas: l.cabecas,
        dataEntrada: l.dataEntrada,
        status: l.status
      }));
    }
    const lotes = await this.prisma.lote.findMany({ orderBy: { createdAt: "desc" } });
    return lotes.map((l) => ({
      id: l.id,
      codigo: l.codigo,
      cabecas: l.cabecas,
      dataEntrada: l.dataEntrada.toISOString(),
      status: l.status
    }));
  }

  async createLote(payload: {
    codigo: string;
    dataEntrada: string;
    cabecas: number;
    pesoMedioEntradaKg: number;
    pesoIdealAbateKg?: number;
    pesoMetaVendaKg?: number;
    custoAquisicaoTotal: number;
    freteTotal: number;
    insumos?: Array<{ id: string; nome: string; categoria: string; estoqueKg: number; pontoReposicaoKg: number }>;
  }) {
    const pesoMetaVendaKg = Number(
      payload.pesoMetaVendaKg ?? payload.pesoIdealAbateKg ?? 0
    );
    if (!payload.codigo || !payload.dataEntrada) {
      throw new BadRequestException("codigo e dataEntrada são obrigatórios");
    }
    if (!Number.isFinite(Number(payload.cabecas)) || Number(payload.cabecas) <= 0) {
      throw new BadRequestException("cabecas deve ser maior que zero");
    }
    if (!Number.isFinite(Number(payload.pesoMedioEntradaKg)) || Number(payload.pesoMedioEntradaKg) <= 0) {
      throw new BadRequestException("pesoMedioEntradaKg deve ser maior que zero");
    }
    if (!Number.isFinite(pesoMetaVendaKg) || pesoMetaVendaKg <= 0) {
      throw new BadRequestException("pesoMetaVendaKg deve ser maior que zero");
    }

    if (!useDatabasePersistence()) {
      const id = newId();
      store.lotes.set(id, {
        id,
        codigo: payload.codigo,
        dataEntrada: payload.dataEntrada,
        cabecas: Number(payload.cabecas),
        pesoMedioEntradaKg: Number(payload.pesoMedioEntradaKg),
        pesoIdealAbateKg: pesoMetaVendaKg,
        custoAquisicaoTotal: Number(payload.custoAquisicaoTotal),
        freteTotal: Number(payload.freteTotal),
        status: "ATIVO"
      });
      return { id, codigo: payload.codigo };
    }

    let lote: { id: string; codigo: string };
    try {
      lote = await this.prisma.lote.create({
        data: {
          id: newId(),
          codigo: payload.codigo,
          dataEntrada: new Date(payload.dataEntrada),
          cabecas: Number(payload.cabecas),
          pesoMedioEntradaKg: Number(payload.pesoMedioEntradaKg),
          pesoIdealAbateKg: pesoMetaVendaKg,
          custoAquisicaoTotal: new Prisma.Decimal(Number(payload.custoAquisicaoTotal)),
          freteTotal: new Prisma.Decimal(Number(payload.freteTotal)),
          status: "ATIVO"
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Código do lote já cadastrado. Use outro código.");
      }
      throw error;
    }

    for (const insumo of payload.insumos ?? []) {
      await this.prisma.insumo.upsert({
        where: { id: insumo.id },
        update: {
          nome: insumo.nome,
          categoria: insumo.categoria,
          estoqueKg: Number(insumo.estoqueKg),
          pontoReposicaoKg: Number(insumo.pontoReposicaoKg)
        },
        create: {
          id: insumo.id,
          nome: insumo.nome,
          categoria: insumo.categoria,
          estoqueKg: Number(insumo.estoqueKg),
          pontoReposicaoKg: Number(insumo.pontoReposicaoKg)
        }
      });
    }

    return { id: lote.id, codigo: lote.codigo };
  }

  async updateLote(
    loteId: string,
    payload: {
      codigo?: string;
      dataEntrada?: string;
      cabecas?: number;
      pesoMedioEntradaKg?: number;
      pesoMetaVendaKg?: number;
      custoAquisicaoTotal?: number;
      freteTotal?: number;
      status?: "ATIVO" | "ENCERRADO";
    }
  ) {
    if (!useDatabasePersistence()) {
      const lote = store.lotes.get(loteId);
      if (!lote) throw new NotFoundException("Lote nao encontrado");
      if (payload.codigo && payload.codigo !== lote.codigo) {
        const duplicated = [...store.lotes.values()].some(
          (x) => x.id !== loteId && x.codigo === payload.codigo
        );
        if (duplicated) throw new ConflictException("Código do lote já cadastrado. Use outro código.");
      }
      lote.codigo = payload.codigo ?? lote.codigo;
      lote.dataEntrada = payload.dataEntrada ?? lote.dataEntrada;
      lote.cabecas = payload.cabecas ?? lote.cabecas;
      lote.pesoMedioEntradaKg = payload.pesoMedioEntradaKg ?? lote.pesoMedioEntradaKg;
      lote.pesoIdealAbateKg = payload.pesoMetaVendaKg ?? lote.pesoIdealAbateKg;
      lote.custoAquisicaoTotal = payload.custoAquisicaoTotal ?? lote.custoAquisicaoTotal;
      lote.freteTotal = payload.freteTotal ?? lote.freteTotal;
      lote.status = payload.status ?? lote.status;
      store.lotes.set(loteId, lote);
      return { id: lote.id, codigo: lote.codigo };
    }

    await this.ensureLoteExistsDb(loteId);
    try {
      const lote = await this.prisma.lote.update({
        where: { id: loteId },
        data: {
          codigo: payload.codigo,
          dataEntrada: payload.dataEntrada ? new Date(payload.dataEntrada) : undefined,
          cabecas: payload.cabecas !== undefined ? Number(payload.cabecas) : undefined,
          pesoMedioEntradaKg:
            payload.pesoMedioEntradaKg !== undefined ? Number(payload.pesoMedioEntradaKg) : undefined,
          pesoIdealAbateKg:
            payload.pesoMetaVendaKg !== undefined ? Number(payload.pesoMetaVendaKg) : undefined,
          custoAquisicaoTotal:
            payload.custoAquisicaoTotal !== undefined
              ? new Prisma.Decimal(Number(payload.custoAquisicaoTotal))
              : undefined,
          freteTotal:
            payload.freteTotal !== undefined ? new Prisma.Decimal(Number(payload.freteTotal)) : undefined,
          status: payload.status
        }
      });
      return { id: lote.id, codigo: lote.codigo };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Código do lote já cadastrado. Use outro código.");
      }
      throw error;
    }
  }

  async resetAllData() {
    if (!useDatabasePersistence()) {
      resetStore();
      return { ok: true, mode: "memory" };
    }

    await this.prisma.$transaction([
      this.prisma.eventoSync.deleteMany(),
      this.prisma.pesagem.deleteMany(),
      this.prisma.tratoDiario.deleteMany(),
      this.prisma.tratamentoSanitario.deleteMany(),
      this.prisma.custoOperacional.deleteMany(),
      this.prisma.vendaEmbarque.deleteMany(),
      this.prisma.animal.deleteMany(),
      this.prisma.movimentoEstoque.deleteMany(),
      this.prisma.insumo.deleteMany(),
      this.prisma.cotacaoArroba.deleteMany(),
      this.prisma.lote.deleteMany()
    ]);
    store.kpiSnapshots.clear();
    return { ok: true, mode: "database" };
  }

  async getKpis(loteId: string): Promise<KPIResponse> {
    if (!useDatabasePersistence()) return this.getKpisMemory(loteId);

    const lote = await this.prisma.lote.findUnique({ where: { id: loteId } });
    if (!lote) throw new NotFoundException("Lote nao encontrado");

    const [pesagens, tratos, custos, tratamentos] = await Promise.all([
      this.prisma.pesagem.findMany({ where: { loteId }, orderBy: { dataPesagem: "asc" } }),
      this.prisma.tratoDiario.findMany({ where: { loteId } }),
      this.prisma.custoOperacional.findMany({ where: { loteId } }),
      this.prisma.tratamentoSanitario.findMany({ where: { loteId } })
    ]);

    return calculateKpis({
      loteId,
      dataEntrada: lote.dataEntrada.toISOString(),
      cabecas: lote.cabecas,
      pesoMedioEntradaKg: lote.pesoMedioEntradaKg,
      pesoIdealAbateKg: lote.pesoIdealAbateKg,
      custoAquisicaoTotal: Number(lote.custoAquisicaoTotal),
      freteTotal: Number(lote.freteTotal),
      pesagens: pesagens.map((p) => ({
        dataPesagem: p.dataPesagem.toISOString(),
        pesoKg: p.pesoKg
      })),
      tratos: tratos.map((t) => ({ quantidadeKg: t.quantidadeKg })),
      custosOperacionais: custos.map((c) => ({ valor: Number(c.valor) })),
      tratamentos: tratamentos.map((t) => ({
        dataAplicacao: t.dataAplicacao.toISOString(),
        diasCarencia: t.diasCarencia
      }))
    });
  }

  async getTimeline(loteId: string) {
    if (!useDatabasePersistence()) {
      const lote = store.lotes.get(loteId);
      if (!lote) throw new NotFoundException("Lote nao encontrado");
      const pesagens = [...store.pesagens.values()]
        .filter((p) => p.loteId === loteId)
        .sort((a, b) => a.dataPesagem.localeCompare(b.dataPesagem));
      let prevPeso = lote.pesoMedioEntradaKg;
      let prevDate = lote.dataEntrada;
      return pesagens.map((p) => {
        const days = Math.max(1, this.diffDays(prevDate, p.dataPesagem));
        const gmd = (p.pesoKg - prevPeso) / days;
        prevPeso = p.pesoKg;
        prevDate = p.dataPesagem;
        return {
          date: p.dataPesagem,
          pesoKg: p.pesoKg,
          gmdParcial: Number(gmd.toFixed(4))
        };
      });
    }

    const lote = await this.prisma.lote.findUnique({ where: { id: loteId } });
    if (!lote) throw new NotFoundException("Lote nao encontrado");
    const pesagens = await this.prisma.pesagem.findMany({
      where: { loteId },
      orderBy: { dataPesagem: "asc" }
    });
    let prevPeso = lote.pesoMedioEntradaKg;
    let prevDate = lote.dataEntrada.toISOString();
    return pesagens.map((p) => {
      const iso = p.dataPesagem.toISOString();
      const days = Math.max(1, this.diffDays(prevDate, iso));
      const gmd = (p.pesoKg - prevPeso) / days;
      prevPeso = p.pesoKg;
      prevDate = iso;
      return {
        date: iso,
        pesoKg: p.pesoKg,
        gmdParcial: Number(gmd.toFixed(4))
      };
    });
  }

  async captureSnapshot(loteId: string) {
    const kpi = await this.getKpis(loteId);
    const current = store.kpiSnapshots.get(loteId) ?? [];
    current.push({ capturedAt: new Date().toISOString(), kpi });
    store.kpiSnapshots.set(loteId, current);
    return current[current.length - 1];
  }

  async listSnapshots(loteId: string) {
    return store.kpiSnapshots.get(loteId) ?? [];
  }

  async createLancamento(
    loteId: string,
    payload: {
      tipo: "TRATO" | "PESAGEM" | "SANITARIO" | "CUSTO";
      data: string;
      quantidadeKg?: number;
      pesoKg?: number;
      medicamento?: string;
      diasCarencia?: number;
      valor?: number;
      descricao?: string;
      insumoId?: string;
    }
  ) {
    if (!useDatabasePersistence()) {
      return this.createLancamentoMemory(loteId, payload);
    }
    await this.ensureLoteExistsDb(loteId);
    const date = new Date(payload.data);
    if (payload.tipo === "TRATO") {
      const insumoId = payload.insumoId ?? "insumo-manual";
      await this.prisma.insumo.upsert({
        where: { id: insumoId },
        update: {},
        create: {
          id: insumoId,
          nome: "Insumo Manual",
          categoria: "SUPLEMENTO",
          estoqueKg: 0,
          pontoReposicaoKg: 0
        }
      });
      const trato = await this.prisma.tratoDiario.create({
        data: {
          id: newId(),
          loteId,
          insumoId,
          data: date,
          quantidadeKg: Number(payload.quantidadeKg ?? 0)
        }
      });
      return { tipo: payload.tipo, id: trato.id };
    }
    if (payload.tipo === "PESAGEM") {
      const pesagem = await this.prisma.pesagem.create({
        data: {
          id: newId(),
          loteId,
          dataPesagem: date,
          pesoKg: Number(payload.pesoKg ?? 0)
        }
      });
      return { tipo: payload.tipo, id: pesagem.id };
    }
    if (payload.tipo === "SANITARIO") {
      const san = await this.prisma.tratamentoSanitario.create({
        data: {
          id: newId(),
          loteId,
          medicamento: String(payload.medicamento ?? "nao-informado"),
          dataAplicacao: date,
          diasCarencia: Number(payload.diasCarencia ?? 0)
        }
      });
      return { tipo: payload.tipo, id: san.id };
    }
    const custo = await this.prisma.custoOperacional.create({
      data: {
        id: newId(),
        loteId,
        data: date,
        valor: new Prisma.Decimal(Number(payload.valor ?? 0)),
        tipo: "VARIAVEL",
        descricao: String(payload.descricao ?? "Lancamento manual")
      }
    });
    return { tipo: payload.tipo, id: custo.id };
  }

  async listLancamentos(loteId: string) {
    if (!useDatabasePersistence()) {
      const tratos = [...store.tratos.values()]
        .filter((x) => x.loteId === loteId)
        .map((x) => ({
          id: x.id,
          tipo: "TRATO" as const,
          data: x.data,
          quantidadeKg: x.quantidadeKg,
          insumoId: x.insumoId
        }));
      const pesagens = [...store.pesagens.values()]
        .filter((x) => x.loteId === loteId)
        .map((x) => ({
          id: x.id,
          tipo: "PESAGEM" as const,
          data: x.dataPesagem,
          pesoKg: x.pesoKg
        }));
      const sanitarios = [...store.tratamentos.values()]
        .filter((x) => x.loteId === loteId)
        .map((x) => ({
          id: x.id,
          tipo: "SANITARIO" as const,
          data: x.dataAplicacao,
          medicamento: x.medicamento,
          diasCarencia: x.diasCarencia
        }));
      const custos = [...store.custosOperacionais.values()]
        .filter((x) => x.loteId === loteId)
        .map((x) => ({
          id: x.id,
          tipo: "CUSTO" as const,
          data: x.data,
          valor: x.valor,
          descricao: x.descricao
        }));
      return [...tratos, ...pesagens, ...sanitarios, ...custos].sort((a, b) =>
        b.data.localeCompare(a.data)
      );
    }

    await this.ensureLoteExistsDb(loteId);
    const [tratos, pesagens, sanitarios, custos] = await Promise.all([
      this.prisma.tratoDiario.findMany({ where: { loteId } }),
      this.prisma.pesagem.findMany({ where: { loteId } }),
      this.prisma.tratamentoSanitario.findMany({ where: { loteId } }),
      this.prisma.custoOperacional.findMany({ where: { loteId } })
    ]);
    return [
      ...tratos.map((x) => ({
        id: x.id,
        tipo: "TRATO" as const,
        data: x.data.toISOString(),
        quantidadeKg: x.quantidadeKg,
        insumoId: x.insumoId
      })),
      ...pesagens.map((x) => ({
        id: x.id,
        tipo: "PESAGEM" as const,
        data: x.dataPesagem.toISOString(),
        pesoKg: x.pesoKg
      })),
      ...sanitarios.map((x) => ({
        id: x.id,
        tipo: "SANITARIO" as const,
        data: x.dataAplicacao.toISOString(),
        medicamento: x.medicamento,
        diasCarencia: x.diasCarencia
      })),
      ...custos.map((x) => ({
        id: x.id,
        tipo: "CUSTO" as const,
        data: x.data.toISOString(),
        valor: Number(x.valor),
        descricao: x.descricao
      }))
    ].sort((a, b) => b.data.localeCompare(a.data));
  }

  async updateLancamento(
    loteId: string,
    lancamentoId: string,
    payload: {
      tipo: "TRATO" | "PESAGEM" | "SANITARIO" | "CUSTO";
      data?: string;
      quantidadeKg?: number;
      pesoKg?: number;
      medicamento?: string;
      diasCarencia?: number;
      valor?: number;
      descricao?: string;
      insumoId?: string;
    }
  ) {
    if (!useDatabasePersistence()) {
      return this.updateLancamentoMemory(loteId, lancamentoId, payload);
    }
    await this.ensureLoteExistsDb(loteId);
    if (payload.tipo === "TRATO") {
      await this.prisma.tratoDiario.update({
        where: { id: lancamentoId },
        data: {
          data: payload.data ? new Date(payload.data) : undefined,
          quantidadeKg:
            payload.quantidadeKg !== undefined ? Number(payload.quantidadeKg) : undefined,
          insumoId: payload.insumoId
        }
      });
      return { id: lancamentoId, tipo: payload.tipo };
    }
    if (payload.tipo === "PESAGEM") {
      await this.prisma.pesagem.update({
        where: { id: lancamentoId },
        data: {
          dataPesagem: payload.data ? new Date(payload.data) : undefined,
          pesoKg: payload.pesoKg !== undefined ? Number(payload.pesoKg) : undefined
        }
      });
      return { id: lancamentoId, tipo: payload.tipo };
    }
    if (payload.tipo === "SANITARIO") {
      await this.prisma.tratamentoSanitario.update({
        where: { id: lancamentoId },
        data: {
          dataAplicacao: payload.data ? new Date(payload.data) : undefined,
          medicamento: payload.medicamento,
          diasCarencia:
            payload.diasCarencia !== undefined ? Number(payload.diasCarencia) : undefined
        }
      });
      return { id: lancamentoId, tipo: payload.tipo };
    }
    await this.prisma.custoOperacional.update({
      where: { id: lancamentoId },
      data: {
        data: payload.data ? new Date(payload.data) : undefined,
        valor: payload.valor !== undefined ? new Prisma.Decimal(Number(payload.valor)) : undefined,
        descricao: payload.descricao
      }
    });
    return { id: lancamentoId, tipo: payload.tipo };
  }

  async getEstoqueResumo() {
    if (!useDatabasePersistence()) {
      const byInsumo = new Map<string, number>();
      for (const t of store.tratos.values()) {
        byInsumo.set(t.insumoId, (byInsumo.get(t.insumoId) ?? 0) - t.quantidadeKg);
      }
      return [...byInsumo.entries()].map(([insumoId, saldoKg]) => ({
        insumoId,
        nome: insumoId,
        estoqueKg: Number(saldoKg.toFixed(2)),
        pontoReposicaoKg: 500,
        alertaReposicao: saldoKg <= 500
      }));
    }
    const items = await this.prisma.insumo.findMany({ orderBy: { nome: "asc" } });
    return items.map((i) => ({
      insumoId: i.id,
      nome: i.nome,
      estoqueKg: i.estoqueKg,
      pontoReposicaoKg: i.pontoReposicaoKg,
      alertaReposicao: i.estoqueKg <= i.pontoReposicaoKg
    }));
  }

  private createLancamentoMemory(
    loteId: string,
    payload: {
      tipo: "TRATO" | "PESAGEM" | "SANITARIO" | "CUSTO";
      data: string;
      quantidadeKg?: number;
      pesoKg?: number;
      medicamento?: string;
      diasCarencia?: number;
      valor?: number;
      descricao?: string;
      insumoId?: string;
    }
  ) {
    const lote = store.lotes.get(loteId);
    if (!lote) throw new NotFoundException("Lote nao encontrado");
    if (payload.tipo === "TRATO") {
      const id = newId();
      store.tratos.set(id, {
        id,
        loteId,
        data: payload.data,
        insumoId: payload.insumoId ?? "insumo-manual",
        quantidadeKg: Number(payload.quantidadeKg ?? 0)
      });
      return { tipo: payload.tipo, id };
    }
    if (payload.tipo === "PESAGEM") {
      const id = newId();
      store.pesagens.set(id, {
        id,
        loteId,
        dataPesagem: payload.data,
        pesoKg: Number(payload.pesoKg ?? 0)
      });
      return { tipo: payload.tipo, id };
    }
    if (payload.tipo === "SANITARIO") {
      const id = newId();
      store.tratamentos.set(id, {
        id,
        loteId,
        medicamento: String(payload.medicamento ?? "nao-informado"),
        dataAplicacao: payload.data,
        diasCarencia: Number(payload.diasCarencia ?? 0)
      });
      return { tipo: payload.tipo, id };
    }
    const id = newId();
    store.custosOperacionais.set(id, {
      id,
      loteId,
      data: payload.data,
      valor: Number(payload.valor ?? 0),
      tipo: "VARIAVEL",
      descricao: String(payload.descricao ?? "Lancamento manual")
    });
    return { tipo: payload.tipo, id };
  }

  private updateLancamentoMemory(
    loteId: string,
    lancamentoId: string,
    payload: {
      tipo: "TRATO" | "PESAGEM" | "SANITARIO" | "CUSTO";
      data?: string;
      quantidadeKg?: number;
      pesoKg?: number;
      medicamento?: string;
      diasCarencia?: number;
      valor?: number;
      descricao?: string;
      insumoId?: string;
    }
  ) {
    const lote = store.lotes.get(loteId);
    if (!lote) throw new NotFoundException("Lote nao encontrado");
    if (payload.tipo === "TRATO") {
      const x = store.tratos.get(lancamentoId);
      if (!x) throw new NotFoundException("Lançamento não encontrado");
      x.data = payload.data ?? x.data;
      x.quantidadeKg = payload.quantidadeKg ?? x.quantidadeKg;
      x.insumoId = payload.insumoId ?? x.insumoId;
      store.tratos.set(lancamentoId, x);
      return { id: lancamentoId, tipo: payload.tipo };
    }
    if (payload.tipo === "PESAGEM") {
      const x = store.pesagens.get(lancamentoId);
      if (!x) throw new NotFoundException("Lançamento não encontrado");
      x.dataPesagem = payload.data ?? x.dataPesagem;
      x.pesoKg = payload.pesoKg ?? x.pesoKg;
      store.pesagens.set(lancamentoId, x);
      return { id: lancamentoId, tipo: payload.tipo };
    }
    if (payload.tipo === "SANITARIO") {
      const x = store.tratamentos.get(lancamentoId);
      if (!x) throw new NotFoundException("Lançamento não encontrado");
      x.dataAplicacao = payload.data ?? x.dataAplicacao;
      x.medicamento = payload.medicamento ?? x.medicamento;
      x.diasCarencia = payload.diasCarencia ?? x.diasCarencia;
      store.tratamentos.set(lancamentoId, x);
      return { id: lancamentoId, tipo: payload.tipo };
    }
    const x = store.custosOperacionais.get(lancamentoId);
    if (!x) throw new NotFoundException("Lançamento não encontrado");
    x.data = payload.data ?? x.data;
    x.valor = payload.valor ?? x.valor;
    x.descricao = payload.descricao ?? x.descricao;
    store.custosOperacionais.set(lancamentoId, x);
    return { id: lancamentoId, tipo: payload.tipo };
  }

  private async ensureLoteExistsDb(loteId: string) {
    const lote = await this.prisma.lote.findUnique({ where: { id: loteId } });
    if (!lote) throw new NotFoundException("Lote nao encontrado");
  }

  private diffDays(fromIso: string, toIso: string) {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    const diff = to.getTime() - from.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private getKpisMemory(loteId: string): KPIResponse {
    const lote = store.lotes.get(loteId);
    if (!lote) throw new NotFoundException("Lote nao encontrado");

    const pesagens = [...store.pesagens.values()].filter((p) => p.loteId === loteId);
    const tratos = [...store.tratos.values()].filter((t) => t.loteId === loteId);
    const custos = [...store.custosOperacionais.values()].filter((c) => c.loteId === loteId);
    const tratamentos = [...store.tratamentos.values()].filter((t) => t.loteId === loteId);

    return calculateKpis({
      loteId,
      dataEntrada: lote.dataEntrada,
      cabecas: lote.cabecas,
      pesoMedioEntradaKg: lote.pesoMedioEntradaKg,
      pesoIdealAbateKg: lote.pesoIdealAbateKg,
      custoAquisicaoTotal: lote.custoAquisicaoTotal,
      freteTotal: lote.freteTotal,
      pesagens: pesagens.map((p) => ({ dataPesagem: p.dataPesagem, pesoKg: p.pesoKg })),
      tratos: tratos.map((t) => ({ quantidadeKg: t.quantidadeKg })),
      custosOperacionais: custos.map((c) => ({ valor: c.valor })),
      tratamentos: tratamentos.map((t) => ({
        dataAplicacao: t.dataAplicacao,
        diasCarencia: t.diasCarencia
      }))
    });
  }
}
