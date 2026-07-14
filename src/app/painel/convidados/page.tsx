import { getServiceClient } from "@/lib/supabase/server";
import NovoConviteForm from "@/components/NovoConviteForm";

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

export default async function PainelConvidados({
  searchParams,
}: {
  searchParams: { senha?: string };
}) {
  const senhaCorreta = process.env.PAINEL_SENHA;
  const autorizado = Boolean(senhaCorreta) && searchParams.senha === senhaCorreta;

  if (!autorizado) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-creme px-6">
        <form
          method="get"
          className="w-full max-w-sm rounded-sm border border-dourado/30 bg-white p-10 text-center shadow-cena"
        >
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-sepia/5">
            <svg className="h-6 w-6 text-sepia" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-sepia">Painel da Carmem</h1>
          <p className="mt-2 font-sans text-xs leading-relaxed text-sepia/60">
            Acesse para gerenciar sua lista de convidados e ver as confirmações.
          </p>
          <input
            type="password"
            name="senha"
            placeholder="Senha de acesso"
            className="mt-8 w-full border-b border-sepia/20 bg-transparent py-2 text-center font-sans text-sepia placeholder-sepia/30 focus:border-terracotta focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="mt-8 w-full rounded-sm bg-terracotta py-4 font-sans text-sm uppercase tracking-wider text-creme transition-colors hover:bg-terracotta/90"
          >
            Entrar no Painel
          </button>
        </form>
      </main>
    );
  }

  const supabase = getServiceClient();
  
  // Buscar todas as respostas do formulário
  const { data: rsvpData, error: erroRsvp } = await supabase
    .from("respostas_rsvp")
    .select("*")
    .order("created_at", { ascending: false });

  const rsvps: RsvpResposta[] = rsvpData ?? [];

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
