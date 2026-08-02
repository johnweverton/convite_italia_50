import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase/server";
import NovoConviteForm from "@/components/NovoConviteForm";
import RelatorioButton from "@/components/RelatorioButton";
import PainelLoginForm from "@/components/PainelLoginForm";
import ListaConvidados, { type RsvpCard } from "@/components/ListaConvidados";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type RsvpResposta = {
  id: string;
  created_at: string;
  nome: string;
  email: string;
  presenca: boolean;
  acompanhantes: string[];
  restricao_alimentar: string[];
  mensagem: string | null;
};

type ConvidadoDoConvite = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
};

type ConviteComConvidados = {
  id: string;
  nome_principal: string;
  email: string;
  vagas_extras: number;
  status: string;
  created_at: string;
  convidados: ConvidadoDoConvite[];
};

function mapConvite(c: ConviteComConvidados) {
  return {
    id: c.id,
    nomePrincipal: c.nome_principal,
    email: c.email,
    vagasExtras: c.vagas_extras,
    status: c.status,
    convidados: c.convidados.map((cv) => ({ id: cv.id, nome: cv.nome, tipo: cv.tipo, status: cv.status })),
  };
}

/**
 * Casa cada resposta de RSVP confirmada com o convite (ingresso/QR) que ela gerou.
 * Como as duas tabelas só se relacionam por e-mail (sem chave estrangeira), em
 * caso de duplicidade (mesmo e-mail com mais de um convite) o casamento usa o
 * convite criado mais próximo no tempo da resposta, já que ambos são inseridos
 * na mesma requisição em /api/rsvp. Convites que sobram (sem par) são os
 * criados manualmente pelo painel.
 */
function parearConvites(rsvps: RsvpResposta[], convites: ConviteComConvidados[]) {
  const disponiveis = [...convites];
  const porRsvpId = new Map<string, ConviteComConvidados>();

  const emOrdemDeChegada = rsvps
    .filter((r) => r.presenca)
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const rsvp of emOrdemDeChegada) {
    const candidatos = disponiveis.filter((c) => c.email === rsvp.email);
    if (candidatos.length === 0) continue;

    const rsvpTime = new Date(rsvp.created_at).getTime();
    candidatos.sort(
      (a, b) =>
        Math.abs(new Date(a.created_at).getTime() - rsvpTime) -
        Math.abs(new Date(b.created_at).getTime() - rsvpTime),
    );

    const escolhido = candidatos[0];
    porRsvpId.set(rsvp.id, escolhido);
    disponiveis.splice(
      disponiveis.findIndex((c) => c.id === escolhido.id),
      1,
    );
  }

  return { porRsvpId, restantes: disponiveis };
}

export default async function PainelConvidados() {
  const senhaCorreta = process.env.PAINEL_SENHA;
  const senhaCookie = cookies().get("painel_senha")?.value;
  const autorizado = Boolean(senhaCorreta) && senhaCookie === senhaCorreta;

  if (!autorizado) {
    return (
      <PainelLoginForm
        titulo="Painel da Carmem"
        descricao="Acesse para gerenciar sua lista de convidados e ver as confirmações."
      />
    );
  }

  const supabase = getServiceClient();

  const { data: rsvpData, error: erroRsvp } = await supabase
    .from("respostas_rsvp")
    .select("*")
    .order("created_at", { ascending: false });

  const rsvps: RsvpResposta[] = rsvpData ?? [];

  const { data: convitesData, error: erroConvites } = await supabase
    .from("convites")
    .select("id, nome_principal, email, vagas_extras, status, created_at, convidados(id, nome, tipo, status)")
    .order("created_at", { ascending: false });

  const convites: ConviteComConvidados[] = (convitesData ?? []) as unknown as ConviteComConvidados[];

  const { porRsvpId, restantes } = parearConvites(rsvps, convites);

  const rsvpCards: RsvpCard[] = rsvps.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    nome: r.nome,
    email: r.email,
    presenca: r.presenca,
    acompanhantes: r.acompanhantes ?? [],
    restricaoAlimentar: r.restricao_alimentar ?? [],
    mensagem: r.mensagem,
    convite: porRsvpId.has(r.id) ? mapConvite(porRsvpId.get(r.id)!) : null,
  }));

  const convitesManuais = restantes.map(mapConvite);

  const confirmados = rsvps.filter((r) => r.presenca);
  const ausentes = rsvps.filter((r) => !r.presenca);

  let totalPessoasConfirmadas = 0;
  confirmados.forEach((r) => {
    totalPessoasConfirmadas += 1 + (r.acompanhantes?.length || 0);
  });

  return (
    <main className="min-h-[100svh] bg-creme px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl text-sepia sm:text-4xl">Convidados</h1>
          <p className="mt-2 font-sans text-sm uppercase tracking-widest text-sepia/60">
            Festa di 50 Anni, Carmem
          </p>
        </div>

        {(erroRsvp || erroConvites) && (
          <div className="mb-8 rounded-sm bg-terracotta/10 p-4 text-center font-sans text-sm text-terracotta">
            Ocorreu um erro ao carregar os dados. Tente atualizar a página.
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-dourado/30 bg-white p-6 text-center shadow-sm">
            <p className="font-sans text-xs uppercase tracking-wider text-sepia/60">Total de Pessoas (Confirmadas)</p>
            <p className="mt-2 font-serif text-4xl text-oliva">{totalPessoasConfirmadas}</p>
          </div>
          <div className="rounded-sm border border-dourado/30 bg-white p-6 text-center shadow-sm">
            <p className="font-sans text-xs uppercase tracking-wider text-sepia/60">Respostas Positivas (Titulares)</p>
            <p className="mt-2 font-serif text-4xl text-sepia">{confirmados.length}</p>
          </div>
          <div className="rounded-sm border border-dourado/30 bg-white p-6 text-center shadow-sm">
            <p className="font-sans text-xs uppercase tracking-wider text-sepia/60">Ausências Registradas</p>
            <p className="mt-2 font-serif text-4xl text-terracotta">{ausentes.length}</p>
          </div>
        </div>

        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-sepia/10 pb-8">
          <NovoConviteForm />
          <RelatorioButton />
        </div>

        <h2 className="mb-6 font-serif text-2xl text-sepia">Respostas do Formulário (RSVP)</h2>

        <ListaConvidados rsvps={rsvpCards} convitesManuais={convitesManuais} />
      </div>
    </main>
  );
}
