import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { LotesService } from "./lotes.service";

@Controller("lotes")
export class LotesController {
  constructor(@Inject(LotesService) private readonly lotesService: LotesService) {}

  @Get()
  async listLotes() {
    return this.lotesService.listLotes();
  }

  @Post()
  async createLote(
    @Body()
    payload: {
      codigo: string;
      dataEntrada: string;
      cabecas: number;
      pesoMedioEntradaKg: number;
      pesoIdealAbateKg?: number;
      pesoMetaVendaKg?: number;
      custoAquisicaoTotal: number;
      freteTotal: number;
      insumos?: Array<{
        id: string;
        nome: string;
        categoria: string;
        estoqueKg: number;
        pontoReposicaoKg: number;
      }>;
    }
  ) {
    return this.lotesService.createLote(payload);
  }

  @Post(":id")
  async updateLote(
    @Param("id") id: string,
    @Body()
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
    return this.lotesService.updateLote(id, payload);
  }

  @Post("reset/all")
  async resetAllData() {
    return this.lotesService.resetAllData();
  }

  @Get(":id/kpis")
  async getKpis(@Param("id") id: string) {
    return this.lotesService.getKpis(id);
  }

  @Get(":id/timeline")
  async getTimeline(@Param("id") id: string) {
    return this.lotesService.getTimeline(id);
  }

  @Get(":id/snapshots")
  async getSnapshots(@Param("id") id: string) {
    return this.lotesService.listSnapshots(id);
  }

  @Post(":id/snapshots")
  async captureSnapshot(@Param("id") id: string) {
    return this.lotesService.captureSnapshot(id);
  }

  @Post(":id/lancamentos")
  async createLancamento(
    @Param("id") id: string,
    @Body()
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
    return this.lotesService.createLancamento(id, payload);
  }

  @Get(":id/lancamentos")
  async listLancamentos(@Param("id") id: string) {
    return this.lotesService.listLancamentos(id);
  }

  @Post(":id/lancamentos/:lancamentoId")
  async updateLancamento(
    @Param("id") id: string,
    @Param("lancamentoId") lancamentoId: string,
    @Body()
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
    return this.lotesService.updateLancamento(id, lancamentoId, payload);
  }

  @Get(":id/estoque")
  async getEstoque(@Param("id") _id: string) {
    return this.lotesService.getEstoqueResumo();
  }
}
