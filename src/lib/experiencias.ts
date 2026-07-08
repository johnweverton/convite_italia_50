/**
 * Fonte única das experiências da jornada. Usada nas cenas, no formulário e no painel.
 * A ordem aqui define a sequência da viagem (rota desenhada no mapa).
 */

export type Experiencia = {
  id: string;
  cidade: string;
  titulo: string;
  /** Valor sugerido em Reais. `null` = contribuição livre (valor aberto). */
  valor: number | null;
  /** Copy sensorial, em primeira pessoa, que faz sentir a experiência. */
  microcopia: string;
  /** Legenda curta com referência clássica ou católica da cidade. */
  referencia: string;
  /** Gradiente atmosférico de fundo (evoca a luz de uma pintura da cidade). */
  atmosfera: string;
  /** Caminho opcional de uma pintura/foto em public/cenas/{id}.jpg. */
  imagem?: string;
  /** Coordenadas relativas (0–100) sobre o SVG do mapa, para o traçado da rota. */
  mapa: { x: number; y: number };
  /** Link para pagamento com cartão de crédito (Ton). */
  linkCartao?: string;
};

export const EXPERIENCIAS: Experiencia[] = [
  {
    id: "roma",
    cidade: "Roma",
    titulo: "Um café da manhã em Roma",
    valor: 250,
    microcopia:
      "Penso no cheiro do café forte numa manhã de sol, as pedras antigas ainda frescas debaixo dos pés, e a cidade acordando devagarinho enquanto os sinos chamam para a missa.",
    referencia: "A poucos passos do Coliseu e da Basílica de São Pedro.",
    atmosfera: "linear-gradient(165deg, #2e2018 0%, #7a4a2e 55%, #b5803f 100%)",
    imagem: "/cenas/roma.jpg",
    mapa: { x: 52, y: 42 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_VyMmOdw6AlQD5Evs0ixX30zWe2nKabop",
  },
  {
    id: "florenca",
    cidade: "Florença",
    titulo: "Um almoço em Florença",
    valor: 300,
    microcopia:
      "Uma mesa farta no coração da cidade, a cúpula do Duomo ali pertinho, o tempo passando sem nenhuma pressa e a sensação de estar dentro de uma pintura antiga.",
    referencia: "Sob a grande cúpula de Brunelleschi, no Duomo.",
    atmosfera: "linear-gradient(165deg, #2c2a1e 0%, #6b5a32 55%, #9a7b3e 100%)",
    imagem: "/cenas/florenca.jpg",
    mapa: { x: 44, y: 28 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_L1mWq5Q0ZEGvjK2t5iQ3NV3aAl49gyon",
  },
  {
    id: "toscana",
    cidade: "Toscana",
    titulo: "Uma garrafa de vinho na Toscana",
    valor: 350,
    microcopia:
      "O sol descendo devagar sobre os vinhedos, uma taça na mão, o ar morno cheirando a terra e a uva, e aquele silêncio bom das colinas que parecem feitas a pincel.",
    referencia: "Entre vinhedos e capelas centenárias.",
    atmosfera: "linear-gradient(165deg, #3a2f1c 0%, #8a6a35 55%, #c9a24b 100%)",
    imagem: "/cenas/toscana.jpg",
    mapa: { x: 42, y: 33 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_Z8oBjqYwJb6LqVYUXTwyNyGV1OlX7Ez9",
  },
  {
    id: "barco_amalfi",
    cidade: "Costa Amalfitana",
    titulo: "Passeio de barco pela Costa Amalfitana",
    valor: 500,
    microcopia:
      "Navegar pelas águas cristalinas do mar Tirreno, sentindo a brisa suave no rosto enquanto as falésias desenham um cenário de filme.",
    referencia: "O charme inconfundível da Costa Amalfitana.",
    atmosfera: "linear-gradient(165deg, #1f4e5a 0%, #3a7a8a 55%, #7aa0b5 100%)",
    imagem: "/cenas/capri.jpg",
    mapa: { x: 53, y: 48 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_RAbgzWMY136XOGf4MTgaXaKv9d8oBGlm",
  },
  {
    id: "veneza",
    cidade: "Veneza",
    titulo: "Um passeio de gôndola em Veneza",
    valor: 800,
    microcopia:
      "Deslizar pelos canais no fim da tarde, ouvindo só o remo tocando a água e os sinos de uma igreja antiga ao longe, com a luz dourada se espalhando entre os palácios.",
    referencia: "Com os sinos de São Marcos ecoando na água.",
    atmosfera: "linear-gradient(165deg, #1c2a32 0%, #2f5a6b 55%, #7a93a0 100%)",
    imagem: "/cenas/veneza.jpg",
    mapa: { x: 52, y: 15 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_dEaQq3JMxOzmLXGI0SRvKP17Wn6V9Z2N",
  },
  {
    id: "roteiro_amalfi",
    cidade: "Costa Amalfitana",
    titulo: "Roteiro pela Costa Amalfitana",
    valor: 1000,
    microcopia:
      "Desbravar as pequenas vilas incrustadas nas rochas, parando para um limoncello refrescante e absorvendo cada detalhe desse paraíso.",
    referencia: "Uma jornada inesquecível pelo litoral.",
    atmosfera: "linear-gradient(165deg, #2a4d3e 0%, #4a8268 55%, #7ab59b 100%)",
    imagem: "/cenas/capri.jpg",
    mapa: { x: 54, y: 49 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_mQkX3wr04DjZN2YHKTOZMyV1RvbYaLK9",
  },
  {
    id: "capri",
    cidade: "Capri",
    titulo: "Uma diária em Capri",
    valor: 1200,
    microcopia:
      "Acordar com o mar daquele azul que quase não parece real na janela, sentir a brisa morna entrando devagar e deixar a ilha cuidar do tempo por mim.",
    referencia: "No azul do Mediterrâneo que encantou imperadores e santos.",
    atmosfera: "linear-gradient(165deg, #10293a 0%, #1f6b8a 55%, #5aa6c9 100%)",
    imagem: "/cenas/capri.jpg",
    mapa: { x: 55, y: 50 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_lvmJrbM4EVx5mvoTW0f9oKeqZWP97dG6",
  },
  {
    id: "toscana_2dias",
    cidade: "Toscana",
    titulo: "Dois dias explorando as paisagens da Toscana",
    valor: 1500,
    microcopia:
      "Atravessar estradinhas de terra ladeadas por ciprestes, descansando em pequenos vilarejos medievais onde o tempo parece ter parado.",
    referencia: "O coração campestre da Itália.",
    atmosfera: "linear-gradient(165deg, #3a2f1c 0%, #8a6a35 55%, #c9a24b 100%)",
    imagem: "/cenas/toscana.jpg",
    mapa: { x: 41, y: 34 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_4MJxq1Q5rzwvArO3H4c2ZdX2GLyeY0bj",
  },
  {
    id: "hotel_veneza",
    cidade: "Veneza",
    titulo: "Hospedagem em charmoso hotel em Veneza",
    valor: 2000,
    microcopia:
      "Adormecer com o som suave da água nos canais e acordar com a luz romântica de Veneza invadindo a janela do quarto.",
    referencia: "Conforto clássico na cidade das águas.",
    atmosfera: "linear-gradient(165deg, #1c2a32 0%, #2f5a6b 55%, #7a93a0 100%)",
    imagem: "/cenas/veneza.jpg",
    mapa: { x: 53, y: 14 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_4ZlBMjygzNKLK9YclfXYvJ9o6qedknwb",
  },
  {
    id: "capri_completa",
    cidade: "Capri",
    titulo: "Experiência completa em Capri",
    valor: 2500,
    microcopia:
      "Viver tudo que Capri tem de melhor: o frescor do mar, a sofisticação da gastronomia local e as paisagens que marcam a alma para sempre.",
    referencia: "O ápice da beleza mediterrânea.",
    atmosfera: "linear-gradient(165deg, #10293a 0%, #1f6b8a 55%, #5aa6c9 100%)",
    imagem: "/cenas/capri.jpg",
    mapa: { x: 56, y: 51 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_VDPl5BONW98mNDEHOotE7dZJApknyEqb",
  },
  {
    id: "etapa_sonhos",
    cidade: "Itália",
    titulo: "Uma etapa da viagem dos sonhos",
    valor: 3000,
    microcopia:
      "Fazer parte dos momentos mais grandiosos dessa jornada, me presenteando com um pedacinho desse sonho inesquecível pela Itália.",
    referencia: "A grande celebração da vida.",
    atmosfera: "linear-gradient(165deg, #2e2018 0%, #7a4a2e 55%, #b5803f 100%)",
    imagem: "/cenas/coliseu.jpg",
    mapa: { x: 50, y: 35 },
    linkCartao: "https://payment-link-v3.ton.com.br/pl_Ne5J3b2xn4rk0KgoH4cN0wBpmEVKGgRA",
  },
  {
    id: "livre",
    cidade: "Itália",
    titulo: "Contribuição livre",
    valor: null,
    microcopia:
      "Se você quiser caminhar comigo nessa viagem do seu jeito, com o valor que fizer sentido pra você, eu vou guardar esse carinho em cada cantinho da Itália.",
    referencia: "Do seu jeito, com todo o carinho.",
    atmosfera: "linear-gradient(165deg, #2e2018 0%, #5a4326 55%, #8a6a35 100%)",
    imagem: "/cenas/coliseu.jpg",
    mapa: { x: 48, y: 55 },
  },
];

/** Apenas as experiências com valor fixo (exclui a contribuição livre). */
export const EXPERIENCIAS_FIXAS = EXPERIENCIAS.filter((e) => e.valor !== null);

/** Pontos da rota desenhada no mapa, na ordem narrativa (sem a contribuição livre). */
export const ROTA = EXPERIENCIAS_FIXAS.map((e) => e.mapa);
