const PRODUCTS = [
  // Bem-estar e Saúde
  {
    id: 1,
    name: "Máscara de Terapia LED",
    category: "bem-estar",
    price: 69.90,
    oldPrice: 99.90,
    description: "Máscara facial com 7 cores de luz LED para tratamento de pele. Estimula a produção de colagénio, reduz acne e manchas.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Mascara+LED",
    badge: "Mais vendido",
    rating: 4.7,
    reviews: 234
  },
  {
    id: 2,
    name: "Tapete de Acupressão + Almofada",
    category: "bem-estar",
    price: 39.90,
    oldPrice: 59.90,
    description: "Tapete com 6.210 pontos de acupressão e almofada incluída. Alivia dores nas costas, tensão e stress.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Acupressao",
    badge: "Popular",
    rating: 4.5,
    reviews: 187
  },
  {
    id: 3,
    name: "Pedras Gua Sha Set",
    category: "bem-estar",
    price: 19.90,
    oldPrice: 29.90,
    description: "Conjunto de 4 pedras Gua Sha naturais. Reduz inchaço, melhora a circulação e contorna o rosto.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Gua+Sha",
    badge: null,
    rating: 4.6,
    reviews: 312
  },
  {
    id: 4,
    name: "Massajador Linfático Elétrico",
    category: "bem-estar",
    price: 34.90,
    oldPrice: 49.90,
    description: "Massajador portátil com 3 intensidades. Drena líquidos, reduz celulite e melhora a circulação.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Massajador",
    badge: "Novo",
    rating: 4.4,
    reviews: 98
  },

  // Casa e Decor
  {
    id: 5,
    name: "Projetor Galaxy Bluetooth",
    category: "casa",
    price: 49.90,
    oldPrice: 69.90,
    description: "Projetor de estrelas com controlo por app e Bluetooth. Cria um ambiente único em qualquer divisão.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Galaxy",
    badge: "Trend",
    rating: 4.8,
    reviews: 456
  },
  {
    id: 6,
    name: "Difusor Efeito Chama",
    category: "casa",
    price: 44.90,
    oldPrice: 64.90,
    description: "Difusor de aromas com efeito visual de chama realista. LED RGB com temporizador e auto-desligamento.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Difusor",
    badge: null,
    rating: 4.6,
    reviews: 203
  },
  {
    id: 7,
    name: "Lâmpada Sunset RGB",
    category: "casa",
    price: 24.90,
    oldPrice: 34.90,
    description: "Lâmpada portátil com 16 cores e efeito pôr-do-sol. Controlo remoto e USB recarregável.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Sunset",
    badge: "Popular",
    rating: 4.5,
    reviews: 178
  },
  {
    id: 8,
    name: "Peluche Dinossauro Ponderado",
    category: "casa",
    price: 32.90,
    oldPrice: 44.90,
    description: "Peluche ponderado de 1.5kg com textura suave. Efeito calmante, ideal para ansiedade e stress.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Dino",
    badge: "Viral",
    rating: 4.9,
    reviews: 521
  },

  // Gadgets e Acessórios
  {
    id: 9,
    name: "Suporte Magnético para Telemóvel",
    category: "gadgets",
    price: 17.90,
    oldPrice: 24.90,
    description: "Suporte magnético 360° para carro. Montagem em grelha de ar condicionado, compatível com todos os telemóveis.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Suporte+Magnetico",
    badge: null,
    rating: 4.3,
    reviews: 145
  },
  {
    id: 10,
    name: "Sprayer de Óleo Elétrico",
    category: "gadgets",
    price: 14.90,
    oldPrice: 22.90,
    description: "Sprayer elétrico recarregável para óleo de cozinha. Dosagem precisa, sem desperdício, fácil de limpar.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Sprayer",
    badge: "Útil",
    rating: 4.4,
    reviews: 89
  },
  {
    id: 11,
    name: "Liners Air Fryer (Pack 5)",
    category: "gadgets",
    price: 12.90,
    oldPrice: 18.90,
    description: "Liners de silicone reutilizáveis para air fryer. Anti-aderente, resistente ao calor, fácil limpeza.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Air+Fryer+Liners",
    badge: "Recompra",
    rating: 4.7,
    reviews: 367
  },
  {
    id: 12,
    name: "Organizador Rotativo 8 Compartimentos",
    category: "gadgets",
    price: 27.90,
    oldPrice: 39.90,
    description: "Tabuleiro rotativo com 8 compartimentos para snacks, especiarias ou organização de secretária.",
    image: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Organizador",
    badge: null,
    rating: 4.5,
    reviews: 134
  }
];

const CATEGORIES = [
  { id: "todos", name: "Todos" },
  { id: "bem-estar", name: "Bem-estar" },
  { id: "casa", name: "Casa e Decor" },
  { id: "gadgets", name: "Gadgets" }
];