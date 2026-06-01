import { EventoTipo } from "@gp/shared";

export class SyncEventDto {
  eventId!: string;
  deviceId!: string;
  sequence!: number;
  type!: EventoTipo;
  loteId?: string;
  animalId?: string;
  payload!: Record<string, unknown>;
  occurredAt!: string;
}

export class SyncEventsDto {
  events!: SyncEventDto[];
}
