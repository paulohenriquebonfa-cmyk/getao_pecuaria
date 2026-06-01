import { EventoSync } from "@gp/shared";

const QUEUE_KEY = "gp:offline:event-queue";
const CURSOR_KEY = "gp:offline:sync-cursor";
const localStore = new Map<string, string>();

const StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return localStore.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    localStore.set(key, value);
  }
};

export class EventQueue {
  async enqueue(event: EventoSync): Promise<void> {
    const queue = await this.getQueue();
    queue.push(event);
    await StorageAdapter.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  async getQueue(): Promise<EventoSync[]> {
    const raw = await StorageAdapter.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EventoSync[];
  }

  async removeProcessed(eventIds: string[]): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((evt) => !eventIds.includes(evt.eventId));
    await StorageAdapter.setItem(QUEUE_KEY, JSON.stringify(filtered));
  }

  async setCursor(cursor: number): Promise<void> {
    await StorageAdapter.setItem(CURSOR_KEY, String(cursor));
  }

  async getCursor(): Promise<number> {
    const raw = await StorageAdapter.getItem(CURSOR_KEY);
    return raw ? Number(raw) : 0;
  }
}
