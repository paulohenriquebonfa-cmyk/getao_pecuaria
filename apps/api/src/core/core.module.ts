import { Global, Module } from "@nestjs/common";
import { DevBootstrapService } from "./dev-bootstrap.service";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService, DevBootstrapService],
  exports: [PrismaService]
})
export class CoreModule {}
