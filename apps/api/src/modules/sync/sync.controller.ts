import { Body, Controller, Get, Inject, Post, Query } from "@nestjs/common";
import { SyncEventsDto } from "./dto/sync-events.dto";
import { SyncService } from "./sync.service";

@Controller("sync")
export class SyncController {
  constructor(@Inject(SyncService) private readonly syncService: SyncService) {}

  @Post("events")
  async syncEvents(@Body() body: SyncEventsDto) {
    return this.syncService.applyEvents(body.events ?? []);
  }

  @Get("changes")
  async getChanges(@Query("cursor") cursor?: string) {
    const safeCursor = Number(cursor ?? 0);
    return this.syncService.getChanges(Number.isNaN(safeCursor) ? 0 : safeCursor);
  }
}
