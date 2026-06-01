import { Inject, Injectable } from "@nestjs/common";
import { CotacaoArroba } from "@gp/shared";
import { Prisma } from "@prisma/client";
import { store } from "../../core/data-store";
import { newId } from "../../core/id";
import { useDatabasePersistence } from "../../core/persistence";
import { PrismaService } from "../../core/prisma.service";
import { CreateCotacaoDto } from "./dto/create-cotacao.dto";

@Injectable()
export class CotacoesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreateCotacaoDto): Promise<CotacaoArroba> {
    if (!useDatabasePersistence()) {
      const cotacao: CotacaoArroba = {
        id: newId(),
        data: input.data,
        regiao: input.regiao,
        valor: input.valor,
        fonte: "MANUAL",
        usuarioId: input.usuarioId
      };
      store.cotacoes.push(cotacao);
      return cotacao;
    }

    const created = await this.prisma.cotacaoArroba.create({
      data: {
        data: new Date(input.data),
        regiao: input.regiao,
        valor: new Prisma.Decimal(input.valor),
        fonte: "MANUAL",
        usuarioId: input.usuarioId
      }
    });

    return {
      id: created.id,
      data: created.data.toISOString(),
      regiao: created.regiao,
      valor: Number(created.valor),
      fonte: "MANUAL",
      usuarioId: created.usuarioId
    };
  }

  async list(): Promise<CotacaoArroba[]> {
    if (!useDatabasePersistence()) {
      return [...store.cotacoes].sort((a, b) => b.data.localeCompare(a.data));
    }
    const items = await this.prisma.cotacaoArroba.findMany({
      orderBy: { data: "desc" },
      take: 200
    });
    return items.map((item) => ({
      id: item.id,
      data: item.data.toISOString(),
      regiao: item.regiao,
      valor: Number(item.valor),
      fonte: "MANUAL",
      usuarioId: item.usuarioId
    }));
  }
}
