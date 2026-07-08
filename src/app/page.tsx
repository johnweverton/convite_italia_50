import Hero from "@/components/Hero";
import Convite from "@/components/Convite";
import Interludio from "@/components/Interludio";
import MapaRota from "@/components/MapaRota";
import Presentes from "@/components/Presentes";
import MusicaAmbiente from "@/components/MusicaAmbiente";
import Fecho from "@/components/Fecho";

export default function Home() {
  return (
    <main>
      <MusicaAmbiente />
      <Hero />
      <Convite />

      {/* Respiro clássico: a Roma antiga, o Coliseu */}
      <Interludio
        legenda="A cidade eterna"
        frase="Há lugares que guardam séculos de histórias em cada pedra, e eu sempre sonhei em caminhar por eles com calma, sentindo tudo de pertinho."
        obra="O Coliseu, Roma"
        atmosfera="linear-gradient(165deg, #241a12 0%, #6b4a2e 55%, #b5803f 100%)"
        imagem="/cenas/coliseu.jpg"
      />

      <MapaRota />
      <Presentes />
      <Fecho />
    </main>
  );
}
