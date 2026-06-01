import { EventoSync } from "@gp/shared";
import { EventQueue } from "./event-queue";

export class SyncClient {
  constructor(
    private readonly apiBaseUrl: string = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001",
    private readonly queue = new EventQueue()
  ) {}

  async pushPendingEvents(): Promise<void> {
    const pending = await this.queue.getQueue();
    if (pending.length === 0) return;

    const response = await fetch(`${this.apiBaseUrl}/api/v1/sync/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: pending })
    });
    if (!response.ok) return;

    const result = (await response.json()) as {
      accepted: string[];
      duplicates: string[];
      rejected: string[];
    };
    const processed = [...result.accepted, ...result.duplicates];
    await this.queue.removeProcessed(processed);
  }

  async pullIncrementalChanges(): Promise<Record<string, unknown>[]> {
    const cursor = await this.queue.getCursor();
    const response = await fetch(`${this.apiBaseUrl}/api/v1/sync/changes?cursor=${cursor}`);
    if (!response.ok) return [];

    const result = (await response.json()) as {
      cursor: number;
      changes: Record<string, unknown>[];
    };
    await this.queue.setCursor(result.cursor);
    return result.changes;
  }

  async registerAndTrySync(event: EventoSync) {
    await this.queue.enqueue(event);
    await this.pushPendingEvents();
  }
}
