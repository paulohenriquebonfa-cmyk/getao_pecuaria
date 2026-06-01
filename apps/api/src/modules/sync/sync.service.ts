import { Inject, Injectable } from "@nestjs/common";
import { EventoTipo, Lote, Pesagem, TratoDiario, TratamentoSanitario } from "@gp/shared";
import { Prisma } from "@prisma/client";
import { store } from "../../core/data-store";
import { newId } from "../../core/id";
import { PrismaService } from "../../core/prisma.service";
import { useDatabasePersistence } from "../../core/persistence";
import { SyncEventDto } from "./dto/sync-events.dto";

@Injectable()
export class SyncService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async applyEvents(events: SyncEventDto[]) {
    if (!useDatabasePersistence()) return this.applyEventsInMemory(events);

    const accepted: string[] = [];
    const duplicates: string[] = [];
    const rejected: string[] = [];

    for (const event of events) {
      const existing = await this.prisma.eventoSync.findUnique({
        where: {
          deviceId_eventId: {
            deviceId: event.deviceId,
            eventId: event.eventId
          }
        }
      });
      if (existing) {
        duplicates.push(event.eventId);
        continue;
      }

      const ok = await this.applySingleEventDb(event);
      if (!ok) {
        rejected.push(event.eventId);
        continue;
      }

      await this.prisma.eventoSync.create({
        data: {
          eventId: event.eventId,
          deviceId: event.deviceId,
          sequence: event.sequence,
          type: event.type,
          loteId: event.loteId,
          animalId: event.animalId,
          payload: event.payload as Prisma.InputJsonValue,
          occurredAt: new Date(event.occurredAt)
        }
      });
      accepted.push(event.eventId);
    }

    return { accepted, duplicates, rejected };
  }

  async getChanges(cursor: number) {
    if (!useDatabasePersistence()) {
      const changes = store.changes.filter((c) => c.cursor > cursor);
      const nextCursor = changes.length ? changes[changes.length - 1].cursor : cursor;
      return { cursor: nextCursor, changes };
    }

    const events = await this.prisma.eventoSync.findMany({
      where: { cursor: { gt: cursor } },
      orderBy: { cursor: "asc" },
      take: 200
    });
    const changes = events.map((evt) => ({
      cursor: evt.cursor,
      entity: evt.type,
      entityId: evt.loteId ?? evt.animalId ?? evt.id,
      action: "UPSERT" as const,
      data: evt.payload as Record<string, unknown>,
      eventRef: evt.eventId,
      changedAt: evt.receivedAt.toISOString()
    }));
    const nextCursor = changes.length ? changes[changes.length - 1].cursor : cursor;
    return { cursor: nextCursor, changes };
  }

  private async applySingleEventDb(event: SyncEventDto): Promise<boolean> {
    switch (event.type) {
      case EventoTipo.LOTE_CRIADO:
        return this.applyLoteCriadoDb(event);
      case EventoTipo.TRATO_REGISTRADO:
        return this.applyTratoDb(event);
      case EventoTipo.PESAGEM_REGISTRADA:
        return this.applyPesagemDb(event);
      case EventoTipo.TRATAMENTO_APLICADO:
        return this.applyTratamentoDb(event);
      default:
        return false;
    }
  }

  private async applyLoteCriadoDb(event: SyncEventDto): Promise<boolean> {
    const loteId = event.loteId ?? newId();
    const payload = event.payload;
    if (!payload.codigo || !payload.dataEntrada) return false;
    await this.prisma.lote.upsert({
      where: { id: loteId },
      update: {
        codigo: String(payload.codigo),
        dataEntrada: new Date(String(payload.dataEntrada)),
        cabecas: Number(payload.cabecas ?? 0),
        pesoMedioEntradaKg: Number(payload.pesoMedioEntradaKg ?? 0),
        custoAquisicaoTotal: new Prisma.Decimal(Number(payload.custoAquisicaoTotal ?? 0)),
        freteTotal: new Prisma.Decimal(Number(payload.freteTotal ?? 0)),
        pesoIdealAbateKg: Number(payload.pesoIdealAbateKg ?? 550),
        status: "ATIVO"
      },
      create: {
        id: loteId,
        codigo: String(payload.codigo),
        dataEntrada: new Date(String(payload.dataEntrada)),
        cabecas: Number(payload.cabecas ?? 0),
        pesoMedioEntradaKg: Number(payload.pesoMedioEntradaKg ?? 0),
        custoAquisicaoTotal: new Prisma.Decimal(Number(payload.custoAquisicaoTotal ?? 0)),
        freteTotal: new Prisma.Decimal(Number(payload.freteTotal ?? 0)),
        pesoIdealAbateKg: Number(payload.pesoIdealAbateKg ?? 550),
        status: "ATIVO"
      }
    });
    return true;
  }

  private async applyTratoDb(event: SyncEventDto): Promise<boolean> {
    if (!event.loteId) return false;
    const payload = event.payload;
    const insumoId = String(payload.insumoId ?? "insumo-generico");
    await this.prisma.insumo.upsert({
      where: { id: insumoId },
      update: {},
      create: {
        id: insumoId,
        nome: String(payload.insumoNome ?? "Insumo genérico"),
        categoria: String(payload.insumoCategoria ?? "SUPLEMENTO"),
        estoqueKg: 0,
        pontoReposicaoKg: 0
      }
    });
    await this.prisma.tratoDiario.create({
      data: {
        id: String(payload.id ?? newId()),
        loteId: event.loteId,
        data: new Date(String(payload.data ?? event.occurredAt)),
        insumoId,
        quantidadeKg: Number(payload.quantidadeKg ?? 0)
      }
    });
    return true;
  }

  private async applyPesagemDb(event: SyncEventDto): Promise<boolean> {
    if (!event.loteId) return false;
    const payload = event.payload;
    await this.prisma.pesagem.create({
      data: {
        id: String(payload.id ?? newId()),
        loteId: event.loteId,
        animalId: event.animalId,
        dataPesagem: new Date(String(payload.dataPesagem ?? event.occurredAt)),
        pesoKg: Number(payload.pesoKg ?? 0)
      }
    });
    return true;
  }

  private async applyTratamentoDb(event: SyncEventDto): Promise<boolean> {
    const payload = event.payload;
    await this.prisma.tratamentoSanitario.create({
      data: {
        id: String(payload.id ?? newId()),
        loteId: event.loteId,
        animalId: event.animalId,
        medicamento: String(payload.medicamento ?? "nao-informado"),
        dataAplicacao: new Date(String(payload.dataAplicacao ?? event.occurredAt)),
        diasCarencia: Number(payload.diasCarencia ?? 0)
      }
    });
    return true;
  }

  private applyEventsInMemory(events: SyncEventDto[]) {
    const accepted: string[] = [];
    const duplicates: string[] = [];
    const rejected: string[] = [];

    for (const event of events) {
      const key = `${event.deviceId}:${event.eventId}`;
      if (store.eventosAplicados.has(key)) {
        duplicates.push(event.eventId);
        continue;
      }

      const lastSeq = store.ultSequenciaPorDispositivo.get(event.deviceId) ?? 0;
      if (event.sequence <= lastSeq) {
        duplicates.push(event.eventId);
        continue;
      }

      const ok = this.applySingleEventMemory(event);
      if (!ok) {
        rejected.push(event.eventId);
        continue;
      }

      store.eventosAplicados.add(key);
      store.ultSequenciaPorDispositivo.set(event.deviceId, event.sequence);
      store.eventosRecebidos.push(event);
      accepted.push(event.eventId);
    }
    return { accepted, duplicates, rejected };
  }

  private applySingleEventMemory(event: SyncEventDto): boolean {
    switch (event.type) {
      case EventoTipo.LOTE_CRIADO:
        return this.applyLoteCriadoMemory(event);
      case EventoTipo.TRATO_REGISTRADO:
        return this.applyTratoMemory(event);
      case EventoTipo.PESAGEM_REGISTRADA:
        return this.applyPesagemMemory(event);
      case EventoTipo.TRATAMENTO_APLICADO:
        return this.applyTratamentoMemory(event);
      default:
        return false;
    }
  }

  private applyLoteCriadoMemory(event: SyncEventDto): boolean {
    const loteId = event.loteId ?? newId();
    const payload = event.payload;
    if (!payload.codigo || !payload.dataEntrada) return false;

    const lote: Lote = {
      id: loteId,
      codigo: String(payload.codigo),
      dataEntrada: String(payload.dataEntrada),
      cabecas: Number(payload.cabecas ?? 0),
      pesoMedioEntradaKg: Number(payload.pesoMedioEntradaKg ?? 0),
      custoAquisicaoTotal: Number(payload.custoAquisicaoTotal ?? 0),
      freteTotal: Number(payload.freteTotal ?? 0),
      pesoIdealAbateKg: Number(payload.pesoIdealAbateKg ?? 550),
      status: "ATIVO"
    };
    store.lotes.set(lote.id, lote);
    this.appendChange("lotes", lote.id, { ...lote }, event.eventId);
    return true;
  }

  private applyTratoMemory(event: SyncEventDto): boolean {
    if (!event.loteId) return false;
    const payload = event.payload;
    const trato: TratoDiario = {
      id: String(payload.id ?? newId()),
      loteId: event.loteId,
      data: String(payload.data ?? event.occurredAt),
      insumoId: String(payload.insumoId ?? "insumo-generico"),
      quantidadeKg: Number(payload.quantidadeKg ?? 0)
    };
    store.tratos.set(trato.id, trato);
    this.appendChange("tratos", trato.id, { ...trato }, event.eventId);
    return true;
  }

  private applyPesagemMemory(event: SyncEventDto): boolean {
    if (!event.loteId) return false;
    const payload = event.payload;
    const pesagem: Pesagem = {
      id: String(payload.id ?? newId()),
      loteId: event.loteId,
      animalId: event.animalId,
      dataPesagem: String(payload.dataPesagem ?? event.occurredAt),
      pesoKg: Number(payload.pesoKg ?? 0)
    };
    store.pesagens.set(pesagem.id, pesagem);
    this.appendChange("pesagens", pesagem.id, { ...pesagem }, event.eventId);
    return true;
  }

  private applyTratamentoMemory(event: SyncEventDto): boolean {
    const payload = event.payload;
    const tratamento: TratamentoSanitario = {
      id: String(payload.id ?? newId()),
      loteId: event.loteId,
      animalId: event.animalId,
      medicamento: String(payload.medicamento ?? "nao-informado"),
      dataAplicacao: String(payload.dataAplicacao ?? event.occurredAt),
      diasCarencia: Number(payload.diasCarencia ?? 0)
    };
    store.tratamentos.set(tratamento.id, tratamento);
    this.appendChange("tratamentos", tratamento.id, { ...tratamento }, event.eventId);
    return true;
  }

  private appendChange(entity: string, entityId: string, data: Record<string, unknown>, eventRef: string) {
    store.changes.push({
      cursor: store.nextCursor++,
      entity,
      entityId,
      action: "UPSERT",
      data,
      eventRef,
      changedAt: new Date().toISOString()
    });
  }
}
