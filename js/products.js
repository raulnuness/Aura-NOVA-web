// Produtos — carregados da API com fallback local
let PRODUCTS = [];
const CATEGORIES = [
  { id: "todos", name: "Todos" },
  { id: "bem-estar", name: "Bem-estar" },
  { id: "casa", name: "Casa e Decor" },
  { id: "gadgets", name: "Gadgets" }
];

// Fallback local — usado se a API não estiver disponível
const FALLBACK_PRODUCTS = [
  { id: 1, slug: "mascara-led", name: "Máscara de Terapia LED", category: "bem-estar", price: 69.90, oldPrice: 99.90, description: "Máscara facial com 7 cores de luz LED para tratamento de pele. Estimula a produção de colagénio, reduz acne e manchas. Recarregável por USB, 3 modos de intensidade. Resultados visíveis em 2 semanas de uso regular.", features: ["7 cores LED", "Recarregável USB", "3 intensidades"], image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop", badge: "Bestseller", rating: 4.7, reviews: 234, isNew: false },
  { id: 2, slug: "tapete-acupressao", name: "Tapete de Acupressão + Almofada", category: "bem-estar", price: 39.90, oldPrice: 59.90, description: "Tapete com 6.210 pontos de acupressão e almofada incluída. Alivia dores nas costas, tensão muscular e stress. Perfeito para relaxar após um longo dia de trabalho. Acompanha bolsa de transporte.", features: ["6.210 pontos", "Almofada incluída", "Bolsa de transporte"], image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop", badge: null, rating: 4.5, reviews: 187, isNew: false },
  { id: 3, slug: "pedras-gua-sha", name: "Pedras Gua Sha Set", category: "bem-estar", price: 19.90, oldPrice: 29.90, description: "Conjunto de 4 pedras Gua Sha naturais (rosa quartzo, jade, ametista e obsidiana). Reduz inchaço, melhora a circulação e contorna o rosto. Inclui guia de utilização ilustrado.", features: ["4 pedras naturais", "Guia incluído", "Em caixa premium"], image: "https://images.unsplash.com/photo-1608248597275-a725c3c14264?w=400&h=400&fit=crop", badge: null, rating: 4.6, reviews: 312, isNew: false },
  { id: 4, slug: "massajador-linfatico", name: "Massajador Linfático Elétrico", category: "bem-estar", price: 34.90, oldPrice: 49.90, description: "Massajador portátil com 3 intensidades e cabeça rotativa. Drena líquidos, reduz celulite e melhora a circulação. Bateria de longa duração, ideal para usar em casa ou viagens.", features: ["3 intensidades", "Cabeça rotativa", "Bateria longa"], image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop", badge: "Novo", rating: 4.4, reviews: 98, isNew: true },
  { id: 5, slug: "projetor-galaxy", name: "Projetor Galaxy Bluetooth", category: "casa", price: 49.90, oldPrice: 69.90, description: "Projetor de estrelas com Bluetooth integrado e controlo por app. Cria um ambiente único em qualquer divisão. 21 modos de iluminação, temporizador e auto-desligamento.", features: ["Bluetooth", "21 modos", "Controlo por app"], image: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=400&fit=crop", badge: "Trend", rating: 4.8, reviews: 456, isNew: false },
  { id: 6, slug: "difusor-chama", name: "Difusor Efeito Chama", category: "casa", price: 44.90, oldPrice: 64.90, description: "Difusor de aromas com efeito visual de chama realista. LED RGB com 7 cores, temporizador e auto-desligamento quando o reservatório fica vazio. Capacidade de 300ml.", features: ["Efeito chama realista", "7 cores LED", "300ml capacidade"], image: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&h=400&fit=crop", badge: null, rating: 4.6, reviews: 203, isNew: false },
  { id: 7, slug: "lampada-sunset", name: "Lâmpada Sunset RGB", category: "casa", price: 24.90, oldPrice: 34.90, description: "Lâmpada portátil com 16 cores e efeito pôr-do-sol. Controlo remoto incluído, USB recarregável. Cria o ambiente perfeito para relaxar, meditar ou fotografar.", features: ["16 cores", "Controlo remoto", "USB recarregável"], image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=400&fit=crop", badge: null, rating: 4.5, reviews: 178, isNew: false },
  { id: 8, slug: "peluche-dinossauro", name: "Peluche Dinossauro Ponderado", category: "casa", price: 32.90, oldPrice: 44.90, description: "Peluche ponderado de 1.5kg com textura suave e hipoalergénica. Efeito calmante, ideal para ansiedade e stress. Perfeito para crianças e adultos. Lavável na máquina.", features: ["1.5kg ponderado", "Hipoalergénico", "Lavável na máquina"], image: "https://images.unsplash.com/photo-1559715541-32d1a6c7b3d3?w=400&h=400&fit=crop", badge: "Bestseller", rating: 4.9, reviews: 521, isNew: false },
  { id: 9, slug: "suporte-magnetico", name: "Suporte Magnético para Telemóvel", category: "gadgets", price: 17.90, oldPrice: 24.90, description: "Suporte magnético 360° para carro. Montagem em grelha de ar condicionado, compatível com todos os telemóveis. Fixação forte, rotação livre, design compacto.", features: ["360° rotação", "Montagem fácil", "Universal"], image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop", badge: null, rating: 4.3, reviews: 145, isNew: false },
  { id: 10, slug: "sprayer-oleo", name: "Sprayer de Óleo Elétrico", category: "gadgets", price: 14.90, oldPrice: 22.90, description: "Sprayer elétrico recarregável para óleo de cozinha. Dosagem precisa por gota, sem desperdício. Fácil de limpar e recarregar via USB. Capacidade de 250ml.", features: ["Dosagem precisa", "Recarregável USB", "250ml"], image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop", badge: null, rating: 4.4, reviews: 89, isNew: false },
  { id: 11, slug: "liners-air-fryer", name: "Liners Air Fryer (Pack 5)", category: "gadgets", price: 12.90, oldPrice: 18.90, description: "Liners de silicone reutilizáveis para air fryer. Anti-aderente, resistente ao calor até 230°C, fácil de limpar. Pack de 5 tamanhos diferentes para adaptar a qualquer modelo.", features: ["Pack de 5", "Até 230°C", "Reutilizáveis"], image: "https://images.unsplash.com/photo-1625944525533-473f892e1a2c?w=400&h=400&fit=crop", badge: "Bestseller", rating: 4.7, reviews: 367, isNew: false },
  { id: 12, slug: "organizador-rotativo", name: "Organizador Rotativo 8 Compartimentos", category: "gadgets", price: 27.90, oldPrice: 39.90, description: "Tabuleiro rotativo com 8 compartimentos para snacks, especiarias ou organização de secretária. Base anti-derrapante, material BPA-free, fácil de montar.", features: ["8 compartimentos", "Base anti-derrapante", "BPA-free"], image: "https://images.unsplash.com/photo-1586023492125-27b2c045a684?w=400&h=400&fit=crop", badge: null, rating: 4.5, reviews: 134, isNew: true }
];

// Carregar produtos da API
async function loadProducts() {
  const cached = localStorage.getItem('auranova_products_cache');
  const cacheTime = localStorage.getItem('auranova_products_time');
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Usar cache se for recente
  if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_TTL) {
    PRODUCTS = JSON.parse(cached);
    return PRODUCTS;
  }

  try {
    const res = await fetch(API_BASE + '/products');
    if (res.ok) {
      const data = await res.json();
      PRODUCTS = data.products.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        price: parseFloat(p.price),
        oldPrice: p.old_price ? parseFloat(p.old_price) : null,
        description: p.description || '',
        features: p.features ? (typeof p.features === 'string' ? JSON.parse(p.features) : p.features) : [],
        image: p.image,
        badge: p.badge,
        rating: parseFloat(p.rating),
        reviews: p.reviews_count,
        isNew: !!p.is_new
      }));
      localStorage.setItem('auranova_products_cache', JSON.stringify(PRODUCTS));
      localStorage.setItem('auranova_products_time', Date.now().toString());
      return PRODUCTS;
    }
  } catch (e) {
    // API indisponível
  }

  // Fallback para dados locais
  PRODUCTS = FALLBACK_PRODUCTS;
  return PRODUCTS;
}

// Carregar produto individual por slug
async function loadProductBySlug(slug) {
  try {
    const res = await fetch(API_BASE + '/products/' + encodeURIComponent(slug));
    if (res.ok) {
      const p = await res.json();
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        price: parseFloat(p.price),
        oldPrice: p.old_price ? parseFloat(p.old_price) : null,
        description: p.description || '',
        features: p.features ? (typeof p.features === 'string' ? JSON.parse(p.features) : p.features) : [],
        image: p.image,
        badge: p.badge,
        rating: parseFloat(p.rating),
        reviews: p.reviews_count,
        isNew: !!p.is_new
      };
    }
  } catch (e) {
    // Fallback local
  }
  return FALLBACK_PRODUCTS.find(p => p.slug === slug) || null;
}