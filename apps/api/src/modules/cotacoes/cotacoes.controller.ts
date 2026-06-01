import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { CreateCotacaoDto } from "./dto/create-cotacao.dto";
import { CotacoesService } from "./cotacoes.service";

@Controller("cotacoes-arroba")
export class CotacoesController {
  constructor(@Inject(CotacoesService) private readonly cotacoesService: CotacoesService) {}

  @Post()
  async create(@Body() input: CreateCotacaoDto) {
    return this.cotacoesService.create(input);
  }

  @Get()
  async list() {
    return this.cotacoesService.list();
  }
}
