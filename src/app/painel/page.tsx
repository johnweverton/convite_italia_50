import { getServiceClient } from "@/lib/supabase/server";
import { formatarBRL } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Contribuicao = {
  id: string;
  created_at: string;
  nome: string;
  experiencia: string;
  valor: number;
  metodo: string | null;
  mensagem: string | null;
  confirmado: boolean;
};

/**
 * Painel privado da Carmem. Proteção simples por senha via query string,
 * comparada com PAINEL_SENHA (server-side). Para produção pública, considerar
 * Supabase Auth. Página com noindex (ver metadata global).
 */
export default async function Painel({
  searchParams,
}: {
  searchParams: { senha?: string };
}) {
  const senhaCorreta = process.env.PAINEL_SENHA || "CARMEM";
  const autorizado = Boolean(senhaCorreta) && searchParams.senha === senhaCorreta;

  if (!autorizado) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-creme px-6">
        <form
          method="get"
          className="w-full max-w-sm rounded-sm border border-dourado/30 bg-white p-8 text-center shadow-cena"
        >
          <h1 className="font-serif text-2xl text-sepia">Painel da Carmem</h1>
          <p className="mt-2 font-sans text-sm text-sepia/60">
            Digite a senha para ver as contribuições.
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
  const { data, error } = await supabase
    .from("contribuicoes")
    .select("*")
    .order("created_at", { ascending: false });

  // Dados falsos (mock) para demonstração caso o banco não esteja configurado
  const mockDemonstracao: Contribuicao[] = [
    {
      id: "1",
      created_at: new Date().toISOString(),
      nome: "João Silva",
      experiencia: "Um passeio de gôndola em Veneza",
      valor: 800,
      metodo: "Pix",
      mensagem: "Aproveite muito, Carmem! Feliz 50 anos!",
      confirmado: true,
    },
    {
      id: "2",
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
      nome: "Maria Oliveira",
      experiencia: "Contribuição Livre",
      valor: 250,
      metodo: "Cartão",
      mensagem: "Para o seu gelato na praça. Bjs!",
      confirmado: false,
    },
  ];

  const contribuicoes = error ? mockDemonstracao : ((data ?? []) as Contribuicao[]);
  const total = contribuicoes.reduce((s, c) => s + Number(c.valor), 0);
  const confirmadoTotal = contribuicoes
    .filter((c) => c.confirmado)
    .reduce((s, c) => s + Number(c.valor), 0);

  return (
    <main className="min-h-[100svh] bg-creme px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-serif text-3xl text-sepia">Contribuições</h1>
        <p className="mt-1 font-sans text-sm text-sepia/60">
          Carmem na Itália 2026
        </p>

        {error && (
          <p className="mt-6 rounded-sm bg-terracotta/10 p-4 font-sans text-sm text-terracotta">
            Erro ao carregar: verifique se a migration foi aplicada e as chaves
            do Supabase estão configuradas.
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-dourado/30 bg-white p-5">
            <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">
              Total declarado
            </p>
            <p className="mt-1 font-serif text-2xl text-terracotta">
              {formatarBRL(total)}
            </p>
          </div>
          <div className="rounded-sm border border-dourado/30 bg-white p-5">
            <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">
              Confirmado
            </p>
            <p className="mt-1 font-serif text-2xl text-oliva">
              {formatarBRL(confirmadoTotal)}
            </p>
          </div>
          <div className="rounded-sm border border-dourado/30 bg-white p-5">
            <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">
              Presentes
            </p>
            <p className="mt-1 font-serif text-2xl text-sepia">
              {contribuicoes.length}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto rounded-sm border border-sepia/10 bg-white">
          <table className="w-full text-left font-sans text-sm">
            <thead className="border-b border-sepia/10 text-xs uppercase tracking-wider text-sepia/50">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Experiência</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Recado</th>
                <th className="px-4 py-3">Confirmado</th>
              </tr>
            </thead>
            <tbody>
              {contribuicoes.map((c) => (
                <tr key={c.id} className="border-b border-sepia/5 align-top">
                  <td className="px-4 py-3 text-sepia/60">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-sepia">{c.nome}</td>
                  <td className="px-4 py-3 text-sepia/80">{c.experiencia}</td>
                  <td className="px-4 py-3 font-medium text-terracotta">
                    {formatarBRL(Number(c.valor))}
                  </td>
                  <td className="px-4 py-3 uppercase text-sepia/60">
                    {c.metodo ?? "—"}
                  </td>
                  <td className="px-4 py-3 italic text-sepia/60">
                    {c.mensagem ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.confirmado ? "✅" : "⏳"}
                  </td>
                </tr>
              ))}
              {contribuicoes.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sepia/50"
                  >
                    Ainda nenhuma contribuição registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 font-sans text-xs text-sepia/40">
          “Confirmado” é marcado manualmente no Supabase quando o Pix/cartão é
          recebido. O registro aqui é a intenção declarada pelo convidado.
        </p>
      </div>
    </main>
  );
}
