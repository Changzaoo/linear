/* ============================================================
   DADOS DO SITE — EDITE TUDO AQUI
   Nome da marca, WhatsApp, textos, números, portfólio.
   Nenhum componente precisa ser alterado para trocar conteúdo.
   ============================================================ */

export const siteData = {
  brand: {
    // EDITE AQUI: nome da marcenaria
    name: "LINEAR",
    tagline: "Marcenaria",
    specialty:
      "Engenharia em madeira e mobiliário sob medida para operações comerciais de alto padrão.",
  },

  contact: {
    // EDITE AQUI: número com DDI + DDD, somente dígitos. Ex: 5511999999999
    whatsappNumber: "5511999999999",
    whatsappMessage:
      "Olá, gostaria de solicitar uma proposta para um projeto de marcenaria comercial.",
    email: "contato@linearmarcenaria.com.br",
    instagram: "@linearmarcenaria",
    instagramUrl: "https://instagram.com/linearmarcenaria",
    location: "São Paulo — SP · Atendimento em todo o Brasil",
    cnpj: "00.000.000/0001-00", // EDITE ou deixe "" para ocultar
  },

  nav: [
    { label: "Início", href: "#inicio" },
    { label: "Capacidades", href: "#capacidades" },
    { label: "Clientes", href: "#clientes" },
    { label: "Processo", href: "#processo" },
    { label: "Portfólio", href: "#portfolio" },
    { label: "Contato", href: "#contato" },
  ],

  hero: {
    title: "Marcenaria para grandes projetos.",
    subtitle:
      "Projetamos, fabricamos e instalamos mobiliário sob medida para lojas, franquias, escritórios, clínicas, hotéis e operações comerciais de alto padrão.",
    ctaPrimary: "Solicitar proposta",
    ctaSecondary: "Ver capacidades técnicas",
    finalPhrase: "Grandes projetos exigem precisão em cada detalhe.",
  },

  authority: {
    eyebrow: "Capacidade técnica",
    title: "Estrutura para atender projetos que exigem escala.",
    text: "Não somos uma marcenaria comum. Atuamos com planejamento, produção organizada, controle de qualidade e instalação técnica para ambientes comerciais de grande porte.",
    cards: [
      {
        icon: "blueprint",
        title: "Projetos comerciais",
        desc: "Leitura e execução de projetos arquitetônicos completos para varejo, hotelaria e saúde.",
      },
      {
        icon: "building",
        title: "Mobiliário comercial",
        desc: "Estações, recepções e ambientes que representam a identidade da sua marca.",
      },
      {
        icon: "ruler",
        title: "Produção sob medida",
        desc: "Fabricação dimensionada por projeto executivo, com padronização entre unidades.",
      },
      {
        icon: "tools",
        title: "Instalação especializada",
        desc: "Equipe própria de montagem técnica, com cronograma e registro fotográfico.",
      },
      {
        icon: "check",
        title: "Controle de qualidade",
        desc: "Conferência dimensional e inspeção de acabamento antes de cada expedição.",
      },
      {
        icon: "handshake",
        title: "Atendimento para empresas",
        desc: "Processo B2B com contrato, documentação e relatórios de andamento.",
      },
    ],
  },

  audience: {
    eyebrow: "Para quem atendemos",
    title: "Mobiliário para marcas que operam em escala.",
    items: [
      { icon: "store", label: "Redes de lojas" },
      { icon: "franchise", label: "Franquias" },
      { icon: "restaurant", label: "Restaurantes" },
      { icon: "clinic", label: "Clínicas" },
      { icon: "hotel", label: "Hotéis" },
      { icon: "office", label: "Escritórios" },
      { icon: "crane", label: "Construtoras" },
      { icon: "compass", label: "Arquitetos" },
      { icon: "towers", label: "Incorporadoras" },
      { icon: "showroom", label: "Showrooms" },
      { icon: "kiosk", label: "Quiosques" },
      { icon: "retail", label: "Ambientes de varejo" },
    ],
  },

  process: {
    eyebrow: "Metodologia",
    title: "Do conceito à instalação final.",
    steps: [
      {
        title: "Briefing técnico",
        desc: "Entendimento do escopo, da operação e dos padrões da marca.",
      },
      {
        title: "Análise técnica",
        desc: "Avaliação de planta, viabilidade construtiva e interfaces com a obra.",
      },
      {
        title: "Projeto executivo",
        desc: "Detalhamento completo de peças, materiais, ferragens e encaixes.",
      },
      {
        title: "Orçamento detalhado",
        desc: "Proposta técnica com escopo fechado, prazos e condições claras.",
      },
      {
        title: "Produção",
        desc: "Fabricação com corte de precisão e rastreabilidade por etapa.",
      },
      {
        title: "Pré-montagem",
        desc: "Montagem de conferência em fábrica antes da expedição.",
      },
      {
        title: "Logística",
        desc: "Embalagem técnica, transporte e janela de entrega alinhada à obra.",
      },
      {
        title: "Instalação",
        desc: "Equipe especializada no local, com gestão de cronograma.",
      },
      {
        title: "Revisão final",
        desc: "Checklist de acabamento, ajustes finos e limpeza técnica.",
      },
      {
        title: "Pós-entrega",
        desc: "Acompanhamento, garantia e suporte para novas unidades.",
      },
    ],
  },

  differentials: {
    eyebrow: "Diferenciais",
    title: "Precisão, acabamento e responsabilidade em cada entrega.",
    items: [
      "Atendimento B2B",
      "Projetos de alto volume",
      "Leitura de projeto arquitetônico",
      "Compatibilidade com arquitetos e engenheiros",
      "Produção padronizada",
      "Materiais premium",
      "Ferragens de alta durabilidade",
      "Gestão de prazo",
      "Equipe de instalação",
      "Garantia de acabamento",
      "Documentação do processo",
      "Relatórios de andamento",
    ],
  },

  exploded: {
    eyebrow: "Engenharia do detalhe",
    text: "Cada peça tem função. Cada encaixe tem precisão. Cada detalhe protege a reputação da sua marca.",
    layers: [
      "Tampo com acabamento premium",
      "Corpo em MDF de alta densidade",
      "Estrutura interna reforçada",
      "Ferragens de alta durabilidade",
      "Iluminação LED integrada",
      "Base nivelada e protegida",
    ],
  },

  applications: {
    eyebrow: "Aplicações",
    title:
      "Mobiliário para ambientes que recebem pessoas, vendem produtos e representam marcas.",
    items: [
      "Balcões de atendimento",
      "Expositores comerciais",
      "Gôndolas",
      "Ilhas promocionais",
      "Móveis para franquias",
      "Quiosques",
      "Recepções",
      "Salas comerciais",
      "Painéis decorativos",
      "Revestimentos em madeira",
      "Móveis para hotelaria",
      "Ambientes premium de varejo",
    ],
  },

  // EDITE AQUI: números institucionais (valor, prefixo, sufixo e legenda)
  numbers: [
    { value: 120, prefix: "+", suffix: "", label: "projetos entregues" },
    { value: 35, prefix: "+", suffix: "", label: "empresas atendidas" },
    { value: 8, prefix: "+", suffix: "", label: "anos de experiência" },
    { value: 4000, prefix: "+", suffix: "m²", label: "de ambientes executados" },
  ],

  portfolio: {
    eyebrow: "Portfólio",
    title: "Projetos que sustentam operações reais.",
    // EDITE AQUI: cada projeto do portfólio.
    // "gradient" controla o placeholder visual do card (classes Tailwind).
    projects: [
      {
        id: "loja-premium",
        category: "Loja premium",
        title: "Flagship de moda — 280m²",
        gradient: "from-[#3a2a1a] via-[#1B1714] to-[#0d0b09]",
        scope:
          "Painéis ripados, expositores centrais, balcão caixa, provadores e vitrines internas.",
        materials: "MDF lacca fosca, lâmina de nogueira, latão escovado, LED integrado.",
        deadline: "45 dias entre projeto executivo e instalação final.",
        challenge:
          "Instalação noturna sem interromper a operação do shopping e alinhamento com vidraçaria e iluminação cênica.",
        solution:
          "Pré-montagem completa em fábrica e instalação em 4 noites com equipe dedicada e checklist por ambiente.",
      },
      {
        id: "clinica",
        category: "Clínica",
        title: "Clínica odontológica — 3 unidades",
        gradient: "from-[#2a2620] via-[#15120f] to-[#0a0908]",
        scope:
          "Recepção, painéis de fundo, armários técnicos e mobiliário de consultórios padronizado.",
        materials: "MDF com acabamento antibacteriano, quartzo, perfis de alumínio.",
        deadline: "30 dias por unidade, com produção simultânea.",
        challenge:
          "Padronização milimétrica entre unidades em cidades diferentes, com normas sanitárias rígidas.",
        solution:
          "Projeto executivo único com kits numerados por unidade e equipe de instalação itinerante.",
      },
      {
        id: "restaurante",
        category: "Restaurante",
        title: "Restaurante de alta gastronomia — 320m²",
        gradient: "from-[#40301c] via-[#1d1712] to-[#0b0a08]",
        scope:
          "Bar central, adega climatizada, painéis ripados acústicos e mobiliário do salão.",
        materials: "Carvalho natural, pedra sinterizada, ferro patinado, vidro temperado.",
        deadline: "60 dias com entregas faseadas por ambiente.",
        challenge:
          "Curvatura do balcão do bar com raio contínuo de 6 metros e integração com refrigeração.",
        solution:
          "Usinagem CNC seccionada com gabarito de obra e junções invisíveis pós-instalação.",
      },
      {
        id: "escritorio",
        category: "Escritório",
        title: "Sede empresarial — 2 pavimentos",
        gradient: "from-[#2c2c2e] via-[#161514] to-[#0a0909]",
        scope:
          "Recepção, salas de reunião, copas premium, estações e painéis de identidade visual.",
        materials: "Lâmina de freijó, lacca grafite, couro ecológico, latão.",
        deadline: "75 dias integrados ao cronograma da obra civil.",
        challenge:
          "Compatibilização com elétrica, automação e marcenaria embutida em drywall.",
        solution:
          "Reuniões semanais de compatibilização com a construtora e modelo 3D unificado do projeto.",
      },
      {
        id: "franquia",
        category: "Franquia",
        title: "Rede de cafeterias — rollout de 12 lojas",
        gradient: "from-[#3d2e1d] via-[#191510] to-[#0c0a08]",
        scope:
          "Kit completo de loja: balcão, retaguarda, painéis, mesas e comunicação integrada.",
        materials: "MDF padrão madeira, granito, aço inox AISI 304, LED.",
        deadline: "1 loja a cada 12 dias após estabilização da linha.",
        challenge:
          "Produção em série com identidade idêntica e logística para 5 estados.",
        solution:
          "Linha de produção dedicada, manual de montagem próprio e kits paletizados por loja.",
      },
      {
        id: "hotelaria",
        category: "Hotelaria",
        title: "Hotel boutique — 42 quartos",
        gradient: "from-[#33241a] via-[#171210] to-[#0b0908]",
        scope:
          "Cabeceiras, painéis, armários, bancadas de apoio e mobiliário do lobby.",
        materials: "Lâmina de nogueira, tecidos técnicos, metais em champagne fosco.",
        deadline: "90 dias com instalação por blocos de andares.",
        challenge:
          "Alto volume de peças idênticas com tolerância mínima e prédio em operação parcial.",
        solution:
          "Controle dimensional estatístico na produção e instalação silenciosa por etapas.",
      },
    ],
  },

  partners: {
    eyebrow: "Arquitetos e construtoras",
    title: "Um parceiro técnico para transformar projetos em execução real.",
    text: "Trabalhamos em conjunto com arquitetos, engenheiros, construtoras e equipes de expansão para garantir que o mobiliário final respeite o conceito, o prazo e a qualidade exigida pelo projeto.",
    cta: "Falar com equipe técnica",
    bullets: [
      "Detalhamento executivo a partir do seu projeto",
      "Compatibilização com obra civil e instalações",
      "Relatórios de andamento e registro fotográfico",
      "Sigilo e respeito à autoria do projeto",
    ],
  },

  finalCta: {
    title: "Seu próximo grande projeto merece uma execução à altura.",
    subtitle:
      "Envie sua planta, briefing ou ideia inicial. Nossa equipe avalia o escopo e retorna com uma proposta técnica personalizada.",
    ctaPrimary: "Solicitar proposta",
    ctaSecondary: "Enviar projeto pelo WhatsApp",
  },
};

/** Gera o link do WhatsApp com a mensagem pronta. */
export function whatsappLink(customMessage?: string): string {
  const { whatsappNumber, whatsappMessage } = siteData.contact;
  const text = encodeURIComponent(customMessage ?? whatsappMessage);
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}
