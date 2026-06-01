import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { KPIResponse } from "@gp/shared";
import { ConfirmSubmitButton } from "./components/confirm-submit-button";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

type LoteLite = {
  id: string;
  codigo: string;
  cabecas: number;
  dataEntrada: string;
  status: string;
};
type TimelinePoint = { date: string; pesoKg: number; gmdParcial: number };
type Snapshot = { capturedAt: string; kpi: KPIResponse };
type EstoqueItem = {
  insumoId: string;
  nome: string;
  estoqueKg: number;
  pontoReposicaoKg: number;
  alertaReposicao: boolean;
};
type Lancamento = {
  id: string;
  tipo: "TRATO" | "PESAGEM" | "SANITARIO" | "CUSTO";
  data: string;
  quantidadeKg?: number;
  pesoKg?: number;
  medicamento?: string;
  diasCarencia?: number;
  valor?: number;
  descricao?: string;
  insumoId?: string;
};

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function apiPost(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  if (!response.ok) {
    let detail = "";
    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(data?.message)) {
        detail = data.message.join(", ");
      } else if (typeof data?.message === "string") {
        detail = data.message;
      }
    } catch {
      detail = "";
    }
    throw new Error(detail ? `Falha HTTP ${response.status}: ${detail}` : `Falha HTTP ${response.status}`);
  }
}

function polylinePoints(points: TimelinePoint[]) {
  if (points.length === 0) return "";
  const min = Math.min(...points.map((p) => p.pesoKg));
  const max = Math.max(...points.map((p) => p.pesoKg));
  const span = Math.max(1, max - min);
  return points
    .map((p, idx) => {
      const x = (idx / Math.max(1, points.length - 1)) * 100;
      const y = 100 - ((p.pesoKg - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

function dateInputValue(rawDate?: string) {
  if (!rawDate) return "";
  return new Date(rawDate).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function defaultLoteCode() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `L${stamp}-${suffix}`;
}

export default async function Page({
  searchParams
}: {
  searchParams?: { error?: string; reason?: string; loteId?: string; novo?: string; reset?: string };
}) {
  const lotes = (await apiGet<LoteLite[]>("/api/v1/lotes")) ?? [];
  const selectedByQuery = lotes.find((l) => l.id === searchParams?.loteId);
  const lote = selectedByQuery ?? lotes[0] ?? null;

  async function createLote(formData: FormData) {
    "use server";
    try {
      await apiPost("/api/v1/lotes", {
        codigo: String(formData.get("codigo")),
        dataEntrada: String(formData.get("dataEntrada")),
        cabecas: Number(formData.get("cabecas")),
        pesoMedioEntradaKg: Number(formData.get("pesoMedioEntradaKg")),
        pesoMetaVendaKg: Number(formData.get("pesoMetaVendaKg")),
        custoAquisicaoTotal: Number(formData.get("custoAquisicaoTotal")),
        freteTotal: Number(formData.get("freteTotal")),
        insumos: [
          {
            id: "milho",
            nome: "Milho",
            categoria: "ENERGETICO",
            estoqueKg: Number(formData.get("estoqueMilhoKg")),
            pontoReposicaoKg: Number(formData.get("reposicaoMilhoKg"))
          },
          {
            id: "farelo",
            nome: "Farelo",
            categoria: "PROTEICO",
            estoqueKg: Number(formData.get("estoqueFareloKg")),
            pontoReposicaoKg: Number(formData.get("reposicaoFareloKg"))
          },
          {
            id: "nucleo",
            nome: "Núcleo",
            categoria: "MINERAL",
            estoqueKg: Number(formData.get("estoqueNucleoKg")),
            pontoReposicaoKg: Number(formData.get("reposicaoNucleoKg"))
          }
        ]
      });
      revalidatePath("/");
      redirect("/");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Erro desconhecido";
      redirect(`/?error=create-lote&reason=${encodeURIComponent(reason)}`);
    }
  }

  if (!lote || searchParams?.novo === "1") {
    return (
      <main className="container">
        <h1>{lote ? "Novo Lote" : "Primeiro Lote para Venda"}</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Cadastre os dados reais do lote para gestão de custos e lucro.
        </p>
        {searchParams?.error === "create-lote" ? (
          <div className="card alertError">
            <strong>Não foi possível criar lote.</strong> Verifique os campos obrigatórios e tente novamente.
            {searchParams?.reason ? (
              <div className="techDetail">
                Detalhe técnico: {searchParams.reason}
              </div>
            ) : null}
          </div>
        ) : null}
        <section className="card section">
          <form action={createLote} className="formGrid">
            <label>Código do lote<input name="codigo" defaultValue={defaultLoteCode()} required /></label>
            <label>Data de entrada<input name="dataEntrada" type="date" defaultValue={todayIso()} required /></label>
            <label>Cabeças<input name="cabecas" type="number" defaultValue="20" required /></label>
            <label>Peso médio entrada (kg)<input name="pesoMedioEntradaKg" type="number" step="0.01" defaultValue="360" required /></label>
            <label>Peso meta de venda (kg)<input name="pesoMetaVendaKg" type="number" step="0.01" defaultValue="520" required /></label>
            <label>Custo aquisição total (R$)<input name="custoAquisicaoTotal" type="number" step="0.01" defaultValue="0" required /></label>
            <label>Frete total (R$)<input name="freteTotal" type="number" step="0.01" defaultValue="0" required /></label>
            <label>Estoque milho (kg)<input name="estoqueMilhoKg" type="number" step="0.01" defaultValue="0" required /></label>
            <label>Reposição milho (kg)<input name="reposicaoMilhoKg" type="number" step="0.01" defaultValue="0" required /></label>
            <label>Estoque farelo (kg)<input name="estoqueFareloKg" type="number" step="0.01" defaultValue="0" required /></label>
            <label>Reposição farelo (kg)<input name="reposicaoFareloKg" type="number" step="0.01" defaultValue="0" required /></label>
            <label>Estoque núcleo (kg)<input name="estoqueNucleoKg" type="number" step="0.01" defaultValue="0" required /></label>
            <label>Reposição núcleo (kg)<input name="reposicaoNucleoKg" type="number" step="0.01" defaultValue="0" required /></label>
            <button type="submit">Criar Lote</button>
          </form>
        </section>
      </main>
    );
  }

  const loteId = lote.id;
  const [kpi, timeline, snapshots, estoque, lancamentos] = await Promise.all([
    apiGet<KPIResponse>(`/api/v1/lotes/${loteId}/kpis`),
    apiGet<TimelinePoint[]>(`/api/v1/lotes/${loteId}/timeline`),
    apiGet<Snapshot[]>(`/api/v1/lotes/${loteId}/snapshots`),
    apiGet<EstoqueItem[]>(`/api/v1/lotes/${loteId}/estoque`),
    apiGet<Lancamento[]>(`/api/v1/lotes/${loteId}/lancamentos`)
  ]);

  async function createLancamento(formData: FormData) {
    "use server";
    await apiPost(`/api/v1/lotes/${loteId}/lancamentos`, {
      tipo: String(formData.get("tipo")),
      data: String(formData.get("data")),
      quantidadeKg: Number(formData.get("quantidadeKg") ?? 0),
      pesoKg: Number(formData.get("pesoKg") ?? 0),
      valor: Number(formData.get("valor") ?? 0),
      medicamento: String(formData.get("medicamento") ?? ""),
      diasCarencia: Number(formData.get("diasCarencia") ?? 0),
      insumoId: String(formData.get("insumoId") ?? ""),
      descricao: String(formData.get("descricao") ?? "")
    });
    revalidatePath("/");
    redirect(`/?loteId=${loteId}`);
  }

  async function updateLoteDados(formData: FormData) {
    "use server";
    await apiPost(`/api/v1/lotes/${loteId}`, {
      codigo: String(formData.get("codigo")),
      dataEntrada: String(formData.get("dataEntrada")),
      cabecas: Number(formData.get("cabecas")),
      status: String(formData.get("status"))
    });
    revalidatePath("/");
    redirect(`/?loteId=${loteId}`);
  }

  async function resetarTudo() {
    "use server";
    await apiPost("/api/v1/lotes/reset/all", {});
    revalidatePath("/");
    redirect("/?reset=ok");
  }

  async function updateLancamento(formData: FormData) {
    "use server";
    const lancId = String(formData.get("lancamentoId"));
    await apiPost(`/api/v1/lotes/${loteId}/lancamentos/${lancId}`, {
      tipo: String(formData.get("tipo")),
      data: String(formData.get("data")),
      quantidadeKg: Number(formData.get("quantidadeKg") ?? 0),
      pesoKg: Number(formData.get("pesoKg") ?? 0),
      valor: Number(formData.get("valor") ?? 0),
      medicamento: String(formData.get("medicamento") ?? ""),
      diasCarencia: Number(formData.get("diasCarencia") ?? 0),
      insumoId: String(formData.get("insumoId") ?? ""),
      descricao: String(formData.get("descricao") ?? "")
    });
    revalidatePath("/");
    redirect(`/?loteId=${loteId}`);
  }

  async function captureSnapshot() {
    "use server";
    await apiPost(`/api/v1/lotes/${loteId}/snapshots`, {});
    revalidatePath("/");
    redirect(`/?loteId=${loteId}`);
  }

  return (
    <main className="container">
      <h1>Dashboard de Engorda para Venda</h1>
      <div className="topBar">
        <p>Lote monitorado:</p>
        <form method="get">
          <select name="loteId" defaultValue={loteId}>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.codigo} ({l.cabecas} cabeças)
              </option>
            ))}
          </select>
          <button type="submit" style={{ marginLeft: 8 }}>Trocar</button>
        </form>
        <a href="/?novo=1">
          + Novo Lote
        </a>
      </div>
      {searchParams?.reset === "ok" ? (
        <div className="card section" style={{ borderColor: "#b9d8c5", color: "#1d5c3f", background: "#f2fbf5" }}>
          Dados resetados com sucesso.
        </div>
      ) : null}

      {!kpi ? (
        <div className="card" style={{ marginTop: 20 }}>Não foi possível carregar os KPIs.</div>
      ) : (
        <>
          <section className="grid" style={{ marginTop: 18 }}>
            <article className="card"><div className="label">GMD (kg/dia)</div><div className="value">{kpi.gmdKgDia}</div></article>
            <article className="card"><div className="label">Eficiência Alimentar</div><div className="value">{kpi.eficienciaAlimentar}</div></article>
            <article className="card"><div className="label">Custo Diária/Cabeça</div><div className="value">R$ {kpi.custoDiariaCabeca}</div></article>
            <article className="card"><div className="label">Break-even (@)</div><div className="value">R$ {kpi.breakEvenArroba}</div></article>
            <article className="card"><div className="label">Dias Projetados para Venda</div><div className="value">{kpi.diasProjetadosVenda}</div></article>
            <article className="card"><div className="label">Elegibilidade Sanitária para Venda</div><div className="value">{kpi.bloqueadoPorCarencia ? "Bloqueado" : "Apto"}</div></article>
          </section>

          <section className="card section">
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Dados do Lote</h2>
            <form action={updateLoteDados} className="formGrid">
              <label>Código do lote<input name="codigo" defaultValue={lote.codigo} required /></label>
              <label>Data de entrada<input name="dataEntrada" type="date" defaultValue={dateInputValue(lote.dataEntrada)} required /></label>
              <label>Cabeças<input name="cabecas" type="number" defaultValue={String(lote.cabecas)} required /></label>
              <label>Status
                <select name="status" defaultValue={lote.status}>
                  <option value="ATIVO">ATIVO</option>
                  <option value="ENCERRADO">ENCERRADO</option>
                </select>
              </label>
              <button type="submit">Salvar Dados do Lote</button>
            </form>
          </section>

          <section className="card section">
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Zona de Segurança</h2>
            <p className="label">Apaga todos os dados do sistema (lotes, lançamentos, snapshots e cotações).</p>
            <form action={resetarTudo} style={{ marginTop: 12 }}>
              <ConfirmSubmitButton confirmMessage="Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.">
                Resetar Todos os Dados
              </ConfirmSubmitButton>
            </form>
          </section>

          <section className="card section">
            <h2 style={{ margin: 0, fontSize: 20 }}>Evolução de Peso</h2>
            {timeline && timeline.length > 0 ? (
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: 190, marginTop: 12 }}>
                <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={polylinePoints(timeline)} />
              </svg>
            ) : <p className="label" style={{ marginTop: 10 }}>Sem pesagens registradas.</p>}
          </section>

          <section className="grid section">
            <article className="card">
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Lançamento Operacional</h2>
              <form action={createLancamento} className="formGrid">
                <label>Tipo<select name="tipo" defaultValue="TRATO"><option value="TRATO">Trato</option><option value="PESAGEM">Pesagem</option><option value="SANITARIO">Sanitário</option><option value="CUSTO">Custo</option></select></label>
                <label>Data<input name="data" type="date" defaultValue={todayIso()} required /></label>
                <label>Quantidade kg<input name="quantidadeKg" type="number" step="0.01" defaultValue="0" /></label>
                <label>Peso kg<input name="pesoKg" type="number" step="0.01" defaultValue="0" /></label>
                <label>Valor R$<input name="valor" type="number" step="0.01" defaultValue="0" /></label>
                <label>Medicamento<input name="medicamento" defaultValue="" /></label>
                <label>Carência dias<input name="diasCarencia" type="number" defaultValue="0" /></label>
                <label>Insumo ID<input name="insumoId" defaultValue="milho" /></label>
                <label>Descrição<input name="descricao" defaultValue="Lançamento web" /></label>
                <button type="submit">Registrar</button>
              </form>
            </article>

            <article className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ marginTop: 0, fontSize: 20 }}>Snapshots de KPI</h2>
                <form action={captureSnapshot}><button type="submit">Capturar Snapshot</button></form>
              </div>
              <div style={{ marginTop: 8 }}>
                {(snapshots ?? []).length === 0 ? <p className="label">Nenhum snapshot capturado.</p> : (snapshots ?? []).slice().reverse().slice(0, 8).map((s) => (
                  <div key={s.capturedAt} className="snapshotRow">
                    <span>{new Date(s.capturedAt).toLocaleString("pt-BR")}</span>
                    <span>GMD {s.kpi.gmdKgDia}</span>
                    <span>Break-even R$ {s.kpi.breakEvenArroba}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="card section">
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Editar Lançamentos</h2>
            {(lancamentos ?? []).length === 0 ? (
              <p className="label">Sem lançamentos para editar.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {(lancamentos ?? []).slice(0, 10).map((l) => (
                  <form key={l.id} action={updateLancamento} className="formGrid">
                    <input type="hidden" name="lancamentoId" value={l.id} />
                    <label>Tipo<input name="tipo" defaultValue={l.tipo} readOnly /></label>
                    <label>Data<input name="data" type="date" defaultValue={dateInputValue(l.data)} /></label>
                    <label>Quantidade kg<input name="quantidadeKg" type="number" step="0.01" defaultValue={String(l.quantidadeKg ?? 0)} /></label>
                    <label>Peso kg<input name="pesoKg" type="number" step="0.01" defaultValue={String(l.pesoKg ?? 0)} /></label>
                    <label>Valor R$<input name="valor" type="number" step="0.01" defaultValue={String(l.valor ?? 0)} /></label>
                    <label>Medicamento<input name="medicamento" defaultValue={l.medicamento ?? ""} /></label>
                    <label>Carência dias<input name="diasCarencia" type="number" defaultValue={String(l.diasCarencia ?? 0)} /></label>
                    <label>Insumo ID<input name="insumoId" defaultValue={l.insumoId ?? ""} /></label>
                    <label>Descrição<input name="descricao" defaultValue={l.descricao ?? ""} /></label>
                    <button type="submit">Salvar Edição</button>
                  </form>
                ))}
              </div>
            )}
          </section>

          <section className="card section">
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Estoque de Insumos</h2>
            {(estoque ?? []).length === 0 ? <p className="label">Sem itens de estoque.</p> : (
              <table className="stockTable">
                <thead><tr><th>Insumo</th><th>Estoque (kg)</th><th>Ponto Reposição (kg)</th><th>Status</th></tr></thead>
                <tbody>
                  {(estoque ?? []).map((e) => (
                    <tr key={e.insumoId}>
                      <td>{e.nome}</td><td>{e.estoqueKg}</td><td>{e.pontoReposicaoKg}</td><td>{e.alertaReposicao ? "Repor" : "OK"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  );
}
