# Carmem na Itália 2026 🇮🇹

Convite virtual imersivo dos 50 anos de **Carmem Glisse Cavalcante** — uma jornada
cinematográfica pela Itália onde os convidados podem presentear experiências da viagem.

Estética **Grand Tour** (terracota, travertino, dourado envelhecido), tipografia Cormorant
Garamond + Inter, animações com framer-motion (respeitando `prefers-reduced-motion`).

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Zod · framer-motion

## Estrutura
- `src/app/page.tsx` — a jornada (Hero → Convite → Mapa → Presentes → Encerramento)
- `src/components/MapaRota.tsx` — mapa da Itália com rota animada no scroll
- `src/components/Pagamento.tsx` — modal Pix (QR + chave) + cartão por link externo
- `src/app/api/contribuicoes/route.ts` — registra a contribuição (Zod + service role)
- `src/app/painel/page.tsx` — painel privado da Carmem (`/painel?senha=...`)
- `src/lib/experiencias.ts` — as 6 experiências (fonte única)
- `src/lib/pix.ts` — gerador do Pix "copia e cola" (BR Code + CRC16)
- `supabase/migrations/001_contribuicoes.sql` — tabela + RLS

## Como rodar
```bash
npm install
cp .env.local.example .env.local   # preencha as variáveis
npm run dev                         # http://localhost:3000
```

## Estrutura visual da página
1. **Hero** em papel claro, letras no marrom da casa, com a silhueta da Itália desenhada
   de leve ao fundo e a frase revelada linha a linha (em `src/components/Hero.tsx`).
2. **Convite** — agradecimento, texto justificado.
3. **Interlúdio clássico** — o Coliseu (foto), respiro contemplativo.
4. **Mapa do viaggio** — pergaminho que se desdobra ao entrar na tela, com rosa dos
   ventos e moldura de tinta; a rota é traçada conforme o scroll, apontando cada parada
   numerada de 1 a 5 (em `src/components/MapaRota.tsx`).
5. **Experiências** — grade de cards elegantes (Roma, Florença, Toscana, Veneza, Capri).
6. **Interlúdio católico** — a Capela Sistina (foto) com uma frase de fé e gratidão.
7. **Contribuição livre** e **Encerramento** com a assinatura.

Tudo respeita `prefers-reduced-motion`.

### Imagens dos interlúdios (`public/cenas/`)
Os interlúdios usam `coliseu.jpg` e `catolico.jpg` (interior da Capela Sistina). Um
conjunto inicial de domínio público vem do Wikimedia Commons:
```bash
node scripts/baixar-pinturas.mjs                 # baixa todas
node scripts/baixar-pinturas.mjs coliseu catolico # só algumas
```
**Importante:** são apenas um ponto de partida e algumas vêm em baixa resolução. Vale
trocar por imagens em alta resolução. As demais fotos baixadas (`roma`, `veneza`, etc.)
não são usadas na versão atual em cards, mas ficam disponíveis para uso futuro.

## Variáveis de ambiente (`.env.local`)
| Variável | Para quê |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** — usado na API e no painel |
| `NEXT_PUBLIC_PIX_CHAVE` | chave Pix exibida (gera o QR) |
| `NEXT_PUBLIC_PIX_NOME` | nome do recebedor (payload Pix) |
| `NEXT_PUBLIC_PIX_CIDADE` | cidade do recebedor (payload Pix) |
| `NEXT_PUBLIC_LINK_CARTAO` | link de pagamento de cartão externo |
| `PAINEL_SENHA` | senha do painel `/painel` |

## Banco de dados
Aplique a migration em `supabase/migrations/001_contribuicoes.sql` no projeto Supabase
(SQL Editor ou CLI). RLS fica ativo e sem policies públicas — só a service role acessa.

## Pendências para a cliente
- [ ] Foto da Carmem em alta resolução em `public/carmem.jpg` (abertura).
- [ ] Chave Pix definitiva + (se cartão) link de pagamento externo criado.
- [ ] Domínio (`carmemnaitalia.com.br` / `carmem50anos.com.br`) e deploy na Vercel.
- [ ] Imagem de Open Graph em `public/og.jpg` para preview no WhatsApp.

## Deploy
Vercel (grátis). Configure as variáveis de ambiente no projeto Vercel e aponte o domínio.
