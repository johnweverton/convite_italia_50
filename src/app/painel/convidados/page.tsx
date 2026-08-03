import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase/server";
import NovoConviteForm from "@/components/NovoConviteForm";
import RelatorioButton from "@/components/RelatorioButton";
import PainelLoginForm from "@/components/PainelLoginForm";
import ListaConvidados, { type RsvpCard } from "@/components/ListaConvidados";
import { mapConvite, parearConvites, type ConviteComConvidados, type RsvpResposta } from "@/lib/convidados";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
