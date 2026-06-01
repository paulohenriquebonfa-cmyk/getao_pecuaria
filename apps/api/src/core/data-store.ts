import {
  Animal,
  CotacaoArroba,
  CustoOperacional,
  EventoSync,
  KPIResponse,
  Lote,
  Pesagem,
  TratoDiario,
  TratamentoSanitario
} from "@gp/shared";

export interface ChangeLogEntry {
  cursor: number;
  entity: string;
  entityId: string;
  action: "UPSERT";
  data: Record<string, unknown>;
  eventRef?: string;
  changedAt: string;
}

export class DataStore {
  public lotes = new Map<string, Lote>();
  public animais = new Map<string, Animal>();
  public pesagens = new Map<string, Pesagem>();
  public tratos = new Map<string, TratoDiario>();
  public tratamentos = new Map<string, TratamentoSanitario>();
  public custosOperacionais = new Map<string, CustoOperacional>();
  public cotacoes: CotacaoArroba[] = [];
  public eventosAplicados = new Set<string>();
  public ultSequenciaPorDispositivo = new Map<string, number>();
  public eventosRecebidos: EventoSync[] = [];
  public changes: ChangeLogEntry[] = [];
  public nextCursor = 1;
  public kpiSnapshots = new Map<
    string,
    Array<{
      capturedAt: string;
      kpi: KPIResponse;
    }>
  >();
}

export const store = new DataStore();

export function resetStore() {
  store.lotes.clear();
  store.animais.clear();
  store.pesagens.clear();
  store.tratos.clear();
  store.tratamentos.clear();
  store.custosOperacionais.clear();
  store.cotacoes = [];
  store.eventosAplicados.clear();
  store.ultSequenciaPorDispositivo.clear();
  store.eventosRecebidos = [];
  store.changes = [];
  store.nextCursor = 1;
  store.kpiSnapshots.clear();
}
