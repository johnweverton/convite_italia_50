import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase/server";
import NovoConviteForm from "@/components/NovoConviteForm";
import ExcluirConviteButton from "@/components/ExcluirConviteButton";
import RelatorioButton from "@/components/RelatorioButton";
import PainelLoginForm from "@/components/PainelLoginForm";

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
  checked_in_at: string | null;
};

type ConviteComConvidados = {
  id: string;
  nome_principal: string;
  email: string;
  vagas_extras: number;
  status: string;
  convidados: ConvidadoDoConvite[];
};

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
  
  // Buscar todas as respostas do formulário
  const { data: rsvpData, error: erroRsvp } = await supabase
    .from("respostas_rsvp")
    .select("*")
    .order("created_at", { ascending: false });

  const rsvps: RsvpResposta[] = rsvpData ?? [];

  // Buscar todos os convites (ingressos/QR) para gestão e exclusão de duplicidades
  const { data: convitesData, error: erroConvites } = await supabase
    .from("convites")
    .select("id, nome_principal, email, vagas_extras, status, convidados(id, nome, tipo, status, checked_in_at)")
    .order("created_at", { ascending: false });

  const convites: ConviteComConvidados[] = (convitesData ?? []) as unknown as ConviteComConvidados[];

  // Calcular estatísticas
  const confirmados = rsvps.filter((r) => r.presenca);
  const ausentes = rsvps.filter((r) => !r.presenca);
  
  let totalPessoasConfirmadas = 0;
  confirmados.forEach(r => {
    totalPessoasConfirmadas += 1 + (r.acompanhantes?.length || 0);
  });

  return (
    <main className="min-h-[100svh] bg-creme px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Cabeçalho */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl text-sepia sm:text-4xl">Convidados</h1>
          <p className="mt-2 font-sans text-sm uppercase tracking-widest text-sepia/60">
            Festa di 50 Anni — Carmem
          </p>
        </div>

        {erroRsvp && (
          <div className="mb-8 rounded-sm bg-terracotta/10 p-4 text-center font-sans text-sm text-terracotta">
            Ocorreu um erro ao carregar os dados. Tente atualizar a página.
          </div>
        )}

        {/* Dashboard de Estatísticas */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

        {/* Lista de Respostas */}
        <h2 className="mb-6 font-serif text-2xl text-sepia">Respostas do Formulário (RSVP)</h2>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {rsvps.map((rsvp) => (
            <div
              key={rsvp.id}
              className={`flex flex-col rounded-sm border ${
                rsvp.presenca ? "border-oliva/30 bg-white" : "border-terracotta/20 bg-white/50 opacity-80"
              } p-6 shadow-sm`}
            >
              <div className="flex items-start justify-between border-b border-sepia/10 pb-4">
                <div>
                  <h3 className="font-serif text-xl text-sepia">{rsvp.nome}</h3>
                  <p className="font-sans text-xs text-sepia/60">{rsvp.email}</p>
                </div>
                <div className={`rounded-full px-3 py-1 font-sans text-xs font-medium uppercase tracking-wider ${
                  rsvp.presenca ? "bg-oliva/10 text-oliva" : "bg-terracotta/10 text-terracotta"
                }`}>
                  {rsvp.presenca ? "Confirmado" : "Não irá"}
                </div>
              </div>

              {rsvp.presenca && (
                <div className="mt-4 flex-1 space-y-4">
                  {/* Acompanhantes */}
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">Acompanhante</p>
                    {rsvp.acompanhantes && rsvp.acompanhantes.length > 0 ? (
                      <p className="mt-1 font-sans text-sm text-sepia">{rsvp.acompanhantes[0]}</p>
                    ) : (
                      <p className="mt-1 font-sans text-sm italic text-sepia/60">Nenhum acompanhante</p>
                    )}
                  </div>

                  {/* Restrições Alimentares */}
                  {rsvp.restricao_alimentar && rsvp.restricao_alimentar.length > 0 && (
                    <div>
                      <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">Restrições Alimentares</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {rsvp.restricao_alimentar.map((restricao, idx) => (
                          <span key={idx} className="rounded-sm bg-terracotta/10 px-2 py-1 font-sans text-xs text-terracotta">
                            {restricao}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensagem */}
                  {rsvp.mensagem && (
                    <div className="rounded-sm bg-sepia/5 p-4">
                      <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">Mensagem para Carmem</p>
                      <p className="mt-2 font-serif text-sm italic leading-relaxed text-sepia">"{rsvp.mensagem}"</p>
                    </div>
                  )}
                </div>
              )}
              
              {!rsvp.presenca && rsvp.mensagem && (
                <div className="mt-4 rounded-sm bg-sepia/5 p-4">
                  <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">Mensagem deixada</p>
                  <p className="mt-2 font-serif text-sm italic leading-relaxed text-sepia">"{rsvp.mensagem}"</p>
                </div>
              )}
              
              <div className="mt-auto pt-4">
                <p className="font-sans text-[10px] text-sepia/40">
                  Respondido em {new Date(rsvp.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {rsvps.length === 0 && !erroRsvp && (
            <div className="col-span-full rounded-sm border border-sepia/10 bg-white p-12 text-center">
              <p className="font-sans text-sepia/50">Nenhuma resposta recebida ainda.</p>
            </div>
          )}
        </div>

        {/* Convites / Ingressos (QR code) */}
        <div className="mt-16 border-t border-sepia/10 pt-16">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-sepia">Convites (Ingressos / QR Code)</h2>
              <p className="mt-1 font-sans text-xs text-sepia/60">
                Gerencie os convites emitidos. Use "Excluir" para remover duplicidades.
              </p>
            </div>
            <RelatorioButton />
          </div>

          {erroConvites && (
            <p className="mb-4 rounded-sm bg-terracotta/10 p-3 font-sans text-sm text-terracotta">
              Erro ao carregar convites.
            </p>
          )}

          <div className="overflow-x-auto rounded-sm border border-sepia/10 bg-white">
            <table className="w-full text-left font-sans text-sm">
              <thead className="border-b border-sepia/10 text-xs uppercase tracking-wider text-sepia/50">
                <tr>
                  <th className="px-4 py-3">Titular</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Vagas extras</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Convidados / Check-in</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {convites.map((c) => (
                  <tr key={c.id} className="border-b border-sepia/5 align-top">
                    <td className="px-4 py-3 text-sepia">{c.nome_principal}</td>
                    <td className="px-4 py-3 text-sepia/70">{c.email}</td>
                    <td className="px-4 py-3 text-sepia/70">{c.vagas_extras}</td>
                    <td className="px-4 py-3 text-sepia/70">
                      {c.status === "confirmado" ? "Confirmado" : "Pendente"}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {c.convidados.map((cv) => (
                          <li key={cv.id} className="text-sepia/70">
                            {cv.nome} ({cv.tipo === "principal" ? "titular" : "acomp."}) —{" "}
                            {cv.status === "check-in" ? "✅ chegou" : "⏳ aguardando"}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <ExcluirConviteButton conviteId={c.id} nomePrincipal={c.nome_principal} />
                    </td>
                  </tr>
                ))}
                {convites.length === 0 && !erroConvites && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sepia/50">
                      Nenhum convite emitido ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gerador Manual de Ingressos */}
        <div className="mt-16 border-t border-sepia/10 pt-16">
          <h2 className="mb-2 text-center font-serif text-xl text-sepia">Gerar Convite Manualmente</h2>
          <p className="mb-8 text-center font-sans text-xs text-sepia/60">
            Use esta opção apenas se precisar emitir ingressos para alguém que não preencheu o formulário online.
          </p>
          <div className="mx-auto max-w-xl rounded-sm border border-dourado/30 bg-white p-8 shadow-cena">
            <NovoConviteForm />
          </div>
        </div>

      </div>
    </main>
  );
}
