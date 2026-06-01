import { KPIResponse } from "@gp/shared";

export interface KpiInput {
  loteId: string;
  dataEntrada: string;
  cabecas: number;
  pesoMedioEntradaKg: number;
  pesoIdealAbateKg: number;
  custoAquisicaoTotal: number;
  freteTotal: number;
  pesagens: Array<{ dataPesagem: string; pesoKg: number }>;
  tratos: Array<{ quantidadeKg: number }>;
  custosOperacionais: Array<{ valor: number }>;
  tratamentos: Array<{ dataAplicacao: string; diasCarencia: number }>;
}

export function calculateKpis(input: KpiInput): KPIResponse {
  const pesagens = [...input.pesagens].sort((a, b) =>
    a.dataPesagem.localeCompare(b.dataPesagem)
  );
  const gmdKgDia = calcGmd(input.pesoMedioEntradaKg, input.dataEntrada, pesagens);
  const ganhoTotalKg = Math.max(
    0,
    lastPeso(pesagens, input.pesoMedioEntradaKg) - input.pesoMedioEntradaKg
  );
  const consumoKg = input.tratos.reduce((acc, t) => acc + t.quantidadeKg, 0);
  const eficienciaAlimentar = ganhoTotalKg > 0 ? consumoKg / ganhoTotalKg : 0;

  const custoTrato = input.tratos.reduce((acc, t) => acc + t.quantidadeKg * 1, 0);
  const custoOperacional = input.custosOperacionais.reduce((acc, c) => acc + c.valor, 0);
  const custoTotal = input.custoAquisicaoTotal + input.freteTotal + custoTrato + custoOperacional;

  const cabecas = Math.max(input.cabecas, 1);
  const dias = Math.max(1, diffDays(input.dataEntrada, new Date().toISOString()));
  const custoDiariaCabeca = custoTotal / cabecas / dias;

  const arrobasProduzidas = ganhoTotalKg / 15;
  const custoArrobaProduzida = arrobasProduzidas > 0 ? custoTotal / arrobasProduzidas : 0;
  const pesoFinalProjetadoKg = lastPeso(pesagens, input.pesoMedioEntradaKg);
  const arrobasVendaveis = (pesoFinalProjetadoKg * cabecas) / 15;
  const breakEvenArroba = arrobasVendaveis > 0 ? custoTotal / arrobasVendaveis : 0;

  const diasProjetadosVenda =
    gmdKgDia > 0 ? Math.max(0, (input.pesoIdealAbateKg - pesoFinalProjetadoKg) / gmdKgDia) : 0;

  const now = new Date();
  const bloqueadoPorCarencia = input.tratamentos.some((t) => {
    const fim = new Date(t.dataAplicacao);
    fim.setDate(fim.getDate() + t.diasCarencia);
    return fim > now;
  });

  return {
    loteId: input.loteId,
    gmdKgDia: Number(gmdKgDia.toFixed(4)),
    eficienciaAlimentar: Number(eficienciaAlimentar.toFixed(4)),
    custoDiariaCabeca: Number(custoDiariaCabeca.toFixed(2)),
    custoArrobaProduzida: Number(custoArrobaProduzida.toFixed(2)),
    breakEvenArroba: Number(breakEvenArroba.toFixed(2)),
    diasProjetadosVenda: Number(diasProjetadosVenda.toFixed(1)),
    // Campo legado mantido por compatibilidade de consumidores antigos.
    diasProjetadosAbate: Number(diasProjetadosVenda.toFixed(1)),
    bloqueadoPorCarencia
  };
}

function calcGmd(
  pesoEntrada: number,
  dataEntrada: string,
  pesagens: Array<{ dataPesagem: string; pesoKg: number }>
) {
  if (pesagens.length === 0) return 0;
  const ultima = pesagens[pesagens.length - 1];
  const deltaPeso = ultima.pesoKg - pesoEntrada;
  const deltaDias = Math.max(1, diffDays(dataEntrada, ultima.dataPesagem));
  return deltaPeso / deltaDias;
}

function lastPeso(pesagens: Array<{ pesoKg: number }>, fallback: number) {
  if (!pesagens.length) return fallback;
  return pesagens[pesagens.length - 1].pesoKg;
}

function diffDays(fromIso: string, toIso: string) {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const diff = to.getTime() - from.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
