export type UUID = string;

export enum EventoTipo {
  LOTE_CRIADO = "LOTE_CRIADO",
  TRATO_REGISTRADO = "TRATO_REGISTRADO",
  PESAGEM_REGISTRADA = "PESAGEM_REGISTRADA",
  TRATAMENTO_APLICADO = "TRATAMENTO_APLICADO"
}

export interface EventoSync {
  eventId: UUID;
  deviceId: string;
  sequence: number;
  type: EventoTipo;
  loteId?: UUID;
  animalId?: UUID;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface Lote {
  id: UUID;
  codigo: string;
  dataEntrada: string;
  cabecas: number;
  pesoMedioEntradaKg: number;
  custoAquisicaoTotal: number;
  freteTotal: number;
  pesoIdealAbateKg: number;
  status: "ATIVO" | "ENCERRADO";
}

export interface Animal {
  id: UUID;
  loteId: UUID;
  identificacao: string;
  dataEntrada: string;
  pesoEntradaKg: number;
  status: "ATIVO" | "EMBARCADO";
}

export interface Pesagem {
  id: UUID;
  loteId: UUID;
  animalId?: UUID;
  dataPesagem: string;
  pesoKg: number;
}

export interface TratoDiario {
  id: UUID;
  loteId: UUID;
  data: string;
  insumoId: UUID;
  quantidadeKg: number;
}

export interface TratamentoSanitario {
  id: UUID;
  loteId?: UUID;
  animalId?: UUID;
  medicamento: string;
  dataAplicacao: string;
  diasCarencia: number;
}

export interface CotacaoArroba {
  id: UUID;
  data: string;
  regiao: string;
  valor: number;
  fonte: "MANUAL";
  usuarioId: UUID;
}

export interface CustoOperacional {
  id: UUID;
  loteId: UUID;
  data: string;
  valor: number;
  tipo: "FIXO" | "VARIAVEL";
  descricao: string;
}

export interface KPIResponse {
  loteId: UUID;
  gmdKgDia: number;
  eficienciaAlimentar: number;
  custoDiariaCabeca: number;
  custoArrobaProduzida: number;
  breakEvenArroba: number;
  diasProjetadosVenda: number;
  diasProjetadosAbate: number;
  bloqueadoPorCarencia: boolean;
}
