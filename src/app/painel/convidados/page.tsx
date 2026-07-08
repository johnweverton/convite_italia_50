import { getServiceClient } from "@/lib/supabase/server";
import NovoConviteForm from "@/components/NovoConviteForm";

export const dynamic = "force-dynamic";

type Convite = {
  id: string;
  nome_principal: string;
  email: string;
  vagas_extras: number;
  status: string;
};

type Convidado = {
  id: string;
  convite_id: string;
  nome: string;
  tipo: string;
  status: string;
};

/**
 * Painel de convidados/ingressos da Carmem. Mesma proteção simples por senha
 * usada em /painel (via env var PAINEL_SENHA).
 */
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
          className="w-full max-w-sm rounded-sm border border-dourado/30 bg-white p-8 text-center shadow-cena"
        >
          <h1 className="font-serif text-2xl text-sepia">Painel de convidados</h1>
          <p className="mt-2 font-sans text-sm text-sepia/60">
            Digite a senha para gerenciar os convites.
          </p>
          <input
            type="password"
            name="senha"
            placeholder="Senha"
            className="mt-6 w-full rounded-sm border border-sepia/20 px-4 py-3 font-sans focus:border-terracotta focus:outline-none"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-sm bg-terracotta py-3 font-sans text-sm uppercase tracking-wider text-creme"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  const supabase = getServiceClient();
  const { data: convitesData, error: erroConvites } = await supabase
    .from("convites")
    .select("id, nome_principal, email, vagas_extras, status")
    .order("nome_principal", { ascending: true });
  const { data: convidadosData, error: erroConvidados } = await supabase
    .from("convidados")
    .select("id, convite_id, nome, tipo, status");

  const convites: Convite[] = convitesData ?? [];
  const convidados: Convidado[] = convidadosData ?? [];

  return (
    <main className="min-h-[100svh] bg-creme px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-serif text-3xl text-sepia">Convidados</h1>
        <p className="mt-1 font-sans text-sm text-sepia/60">Carmem na Itália 2026</p>

        {(erroConvites || erroConvidados) && (
          <p className="mt-6 rounded-sm bg-terracotta/10 p-4 font-sans text-sm text-terracotta">
            Erro ao carregar: verifique se a migration 002_convidados.sql foi aplicada.
          </p>
        )}

        <div className="mt-8">
          <NovoConviteForm />
        </div>

        <div className="mt-8 space-y-6">
          {convites.map((convite) => {
            const pessoas = convidados.filter((c) => c.convite_id === convite.id);
            return (
              <div
                key={convite.id}
                className="rounded-sm border border-sepia/10 bg-white p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-serif text-lg text-sepia">{convite.nome_principal}</p>
                  <span className="font-sans text-xs uppercase tracking-wider text-sepia/50">
                    {convite.status === "confirmado" ? "✅ Confirmado" : "⏳ Aguardando acompanhantes"}
                  </span>
                </div>
                <p className="mt-1 font-sans text-sm text-sepia/60">
                  {convite.email} · até {convite.vagas_extras} acompanhante(s)
                </p>

                <ul className="mt-3 divide-y divide-sepia/5 font-sans text-sm">
                  {pessoas.map((pessoa) => (
                    <li key={pessoa.id} className="flex items-center justify-between py-2">
                      <span className="text-sepia">
                        {pessoa.nome}{" "}
                        <span className="text-xs uppercase text-sepia/40">
                          ({pessoa.tipo === "principal" ? "principal" : "acompanhante"})
                        </span>
                      </span>
                      <span>{pessoa.status === "check-in" ? "✅ check-in" : "⏳ pendente"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {convites.length === 0 && !erroConvites && (
            <p className="rounded-sm border border-sepia/10 bg-white p-6 text-center text-sepia/50">
              Nenhum convite criado ainda.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
