import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lote = await prisma.lote.upsert({
    where: { codigo: "L001-SEED" },
    update: {},
    create: {
      codigo: "L001-SEED",
      dataEntrada: new Date("2026-05-01T00:00:00.000Z"),
      cabecas: 20,
      pesoMedioEntradaKg: 360,
      pesoIdealAbateKg: 520,
      custoAquisicaoTotal: new Prisma.Decimal(160000),
      freteTotal: new Prisma.Decimal(6000),
      status: "ATIVO"
    }
  });

  const insumo = await prisma.insumo.upsert({
    where: { id: "insumo-seed-01" },
    update: {},
    create: {
      id: "insumo-seed-01",
      nome: "Milho Moido",
      categoria: "ENERGETICO",
      estoqueKg: 18000,
      pontoReposicaoKg: 5000
    }
  });

  await prisma.animal.upsert({
    where: { identificacao: "BRINCO-0001" },
    update: {},
    create: {
      loteId: lote.id,
      identificacao: "BRINCO-0001",
      dataEntrada: new Date("2026-05-01T00:00:00.000Z"),
      pesoEntradaKg: 360,
      status: "ATIVO"
    }
  });

  await prisma.pesagem.upsert({
    where: { id: "pesagem-seed-01" },
    update: {},
    create: {
      id: "pesagem-seed-01",
      loteId: lote.id,
      dataPesagem: new Date("2026-05-11T00:00:00.000Z"),
      pesoKg: 390
    }
  });

  await prisma.pesagem.upsert({
    where: { id: "pesagem-seed-02" },
    update: {},
    create: {
      id: "pesagem-seed-02",
      loteId: lote.id,
      dataPesagem: new Date("2026-05-21T00:00:00.000Z"),
      pesoKg: 420
    }
  });

  await prisma.tratoDiario.upsert({
    where: { id: "trato-seed-01" },
    update: {},
    create: {
      id: "trato-seed-01",
      loteId: lote.id,
      insumoId: insumo.id,
      data: new Date("2026-05-15T00:00:00.000Z"),
      quantidadeKg: 300
    }
  });

  await prisma.custoOperacional.upsert({
    where: { id: "custo-seed-01" },
    update: {},
    create: {
      id: "custo-seed-01",
      loteId: lote.id,
      data: new Date("2026-05-18T00:00:00.000Z"),
      valor: new Prisma.Decimal(4500),
      tipo: "FIXO",
      descricao: "Mao de obra e energia"
    }
  });

  await prisma.cotacaoArroba.upsert({
    where: { id: "cotacao-seed-01" },
    update: {},
    create: {
      id: "cotacao-seed-01",
      data: new Date("2026-05-31T00:00:00.000Z"),
      regiao: "Cuiaba-MT",
      valor: new Prisma.Decimal(285.5),
      fonte: "MANUAL",
      usuarioId: "usuario-seed"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
