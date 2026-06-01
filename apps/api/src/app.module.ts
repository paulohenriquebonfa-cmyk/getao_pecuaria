import { Module } from "@nestjs/common";
import { CoreModule } from "./core/core.module";
import { LotesModule } from "./modules/lotes/lotes.module";
import { SyncModule } from "./modules/sync/sync.module";
import { CotacoesModule } from "./modules/cotacoes/cotacoes.module";

@Module({
  imports: [CoreModule, SyncModule, LotesModule, CotacoesModule]
})
export class AppModule {}
