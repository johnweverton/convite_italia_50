/**
 * Baixa pinturas de domínio público do Wikimedia Commons para public/cenas/.
 * Uso: node scripts/baixar-pinturas.mjs
 *
 * As imagens são apenas um ponto de partida (curadoria automática por busca).
 * Reveja licença e estética e troque livremente os arquivos em public/cenas/.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "cenas");

const UA = "ConviteCarmem/1.0 (uso pessoal; contato@exemplo.com)";

// arquivo de destino -> termo de busca no Commons.
// Cenas de experiência = FOTOS reais do lugar (a vista que ela terá).
// Interlúdios = fotografia clássica do monumento.
const CENAS = {
  roma: "Rome skyline",
  florenca: "Florence panorama",
  toscana: "Tuscany landscape vineyard",
  veneza: "Venice Grand Canal sunset gondola",
  capri: "Capri Faraglioni sea view",
  coliseu: "Colosseum Rome exterior photograph",
  catolico: "Sistine Chapel interior ceiling",
  "mapa-italia": "Italy antique map 1700",
};

async function buscarUrl(termo) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    "&generator=search&gsrnamespace=6&gsrlimit=8" +
    `&gsrsearch=${encodeURIComponent(termo + " filetype:bitmap")}` +
    "&prop=imageinfo&iiprop=url&iiurlwidth=1800";
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  const json = await res.json();
  const pages = json?.query?.pages;
  if (!pages) return null;
  for (const p of Object.values(pages)) {
    const info = p?.imageinfo?.[0];
    const url = info?.thumburl || info?.url;
    if (url && /\.(jpe?g|png)$/i.test(url)) return url;
  }
  return null;
}

async function main() {
  await mkdir(RAIZ, { recursive: true });
  // Filtro opcional: node scripts/baixar-pinturas.mjs roma veneza
  const filtro = process.argv.slice(2);
  const entradas = Object.entries(CENAS).filter(
    ([nome]) => filtro.length === 0 || filtro.includes(nome),
  );
  for (const [nome, termo] of entradas) {
    try {
      const url = await buscarUrl(termo);
      if (!url) {
        console.log(`✗ ${nome}: nada encontrado para "${termo}"`);
        continue;
      }
      const img = await fetch(url, { headers: { "User-Agent": UA } });
      const buf = Buffer.from(await img.arrayBuffer());
      const destino = join(RAIZ, `${nome}.jpg`);
      await writeFile(destino, buf);
      console.log(`✓ ${nome}.jpg (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.log(`✗ ${nome}: ${e.message}`);
    }
  }
}

main();
