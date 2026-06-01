import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { useDatabasePersistence } from "./persistence";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    if (useDatabasePersistence()) {
      await this.$connect();
    }
  }
}
