// Product Page — carrega produto dinamicamente a partir do slug no URL
document.addEventListener("DOMContentLoaded", async () => {
  // Carregar produtos da API
  await loadProducts();

  Cart.updateUI();

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    showNotFound();
    return;
  }

  // Tentar carregar da API primeiro, fallback para PRODUCTS
  let product = PRODUCTS.find(p => p.slug === slug);

  if (!product) {
    // Tentar carregar produto individual da API
    product = await loadProductBySlug(slug);
  }

  if (!product) {
    showNotFound();
    return;
  }

  renderProduct(product);
  renderRelated(product);
  setupCartLink();
});

function showNotFound() {
  document.getElementById("product-loading").style.display = "none";
  document.getElementById("product-notfound").style.display = "block";
  document.title = "Produto não encontrado — Aura NØVA";
}

function renderProduct(p) {
  document.getElementById("product-loading").style.display = "none";
  document.getElementById("product-content").style.display = "grid";

  document.title = `${p.name} — Aura NØVA`;
  document.querySelector('meta[name="description"]').content = p.description;
  document.querySelector('meta[property="og:title"]').content = `${p.name} — Aura NØVA`;
  document.querySelector('meta[property="og:description"]').content = p.description;
  document.querySelector('meta[property="og:image"]').content = p.image;

  const categoryNames = { "bem-estar": "Bem-estar", "casa": "Casa e Decor", "gadgets": "Gadgets" };
  document.getElementById("breadcrumb-category").textContent = categoryNames[p.category] || p.category;

  const img = document.getElementById("pd-image");
  img.src = p.image;
  img.alt = p.name;

  const badge = document.getElementById("pd-badge");
  if (p.badge) {
    badge.textContent = p.badge;
    badge.style.display = "inline-block";
  } else if (p.isNew) {
    badge.textContent = "Novo";
    badge.style.display = "inline-block";
  }

  document.getElementById("breadcrumb-product").textContent = p.name;
  document.getElementById("pd-name").textContent = p.name;

  document.getElementById("pd-rating").innerHTML = `
    <span class="star">${"★".repeat(Math.floor(p.rating))}${p.rating % 1 >= 0.5 ? "½" : ""}</span>
    <span>${p.rating} (${p.reviews} avaliações)</span>
  `;

  document.getElementById("pd-pricing").innerHTML = `
    <span class="product-price" style="font-size:1.75rem;font-weight:800;">${p.price.toFixed(2).replace(".", ",")}€</span>
    ${p.oldPrice ? `<span class="product-old-price" style="font-size:1.1rem;">${p.oldPrice.toFixed(2).replace(".", ",")}€</span>` : ""}
    ${p.oldPrice ? `<span class="product-discount">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : ""}
  `;

  document.getElementById("pd-desc").textContent = p.description;

  document.getElementById("pd-features").innerHTML = p.features.map(f => `
    <div class="modal-feature" style="display:flex;align-items:center;gap:0.5rem;margin:0.4rem 0;">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="var(--green)" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span>${f}</span>
    </div>
  `).join("");

  // Quantity selector
  let qty = 1;
  const qtyDisplay = document.getElementById("pd-qty");
  const qtyMinus = document.getElementById("pd-qty-minus");
  const qtyPlus = document.getElementById("pd-qty-plus");

  if (qtyDisplay) qtyDisplay.textContent = qty;
  if (qtyMinus) qtyMinus.addEventListener("click", () => {
    if (qty > 1) { qty--; qtyDisplay.textContent = qty; }
  });
  if (qtyPlus) qtyPlus.addEventListener("click", () => {
    qty++; qtyDisplay.textContent = qty;
  });

  document.getElementById("pd-add-cart").addEventListener("click", () => {
    for (let i = 0; i < qty; i++) Cart.add(p.id);
  });

  const wishBtn = document.getElementById("pd-wishlist");
  if (Wishlist.has(p.id)) {
    wishBtn.classList.add("active");
    wishBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg> Guardado`;
  }
  wishBtn.addEventListener("click", () => {
    Wishlist.toggle(p.id);
    if (Wishlist.has(p.id)) {
      wishBtn.classList.add("active");
      wishBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg> Guardado`;
    } else {
      wishBtn.classList.remove("active");
      wishBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg> Guardar`;
    }
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "description": p.description,
    "image": p.image,
    "brand": { "@type": "Brand", "name": "Aura NØVA" },
    "offers": {
      "@type": "Offer",
      "price": p.price.toFixed(2),
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "url": `https://auranova.pt/pages/produto.html?slug=${p.slug}`
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": p.rating.toString(),
      "reviewCount": p.reviews.toString()
    }
  };
  document.getElementById("product-jsonld").textContent = JSON.stringify(jsonLd);

  let viewed = JSON.parse(localStorage.getItem("auranova_recent") || "[]");
  viewed = viewed.filter(v => v !== p.id);
  viewed.unshift(p.id);
  viewed = viewed.slice(0, 6);
  localStorage.setItem("auranova_recent", JSON.stringify(viewed));
}

function renderRelated(p) {
  const related = PRODUCTS.filter(rp => rp.category === p.category && rp.id !== p.id).slice(0, 4);
  if (related.length === 0) return;

  document.getElementById("related-section").style.display = "block";
  const grid = document.getElementById("related-grid");
  grid.innerHTML = related.map(rp => `
    <a href="produto.html?slug=${rp.slug}" class="product-card" style="text-decoration:none;color:inherit;">
      ${rp.badge ? `<span class="product-badge">${rp.badge}</span>` : ""}
      ${rp.isNew ? `<span class="product-badge product-badge-new">Novo</span>` : ""}
      <div class="product-image"><img src="${rp.image}" alt="${rp.name}" loading="lazy"></div>
      <div class="product-info">
        <h3>${rp.name}</h3>
        <div class="product-pricing">
          <span class="product-price">${rp.price.toFixed(2).replace(".", ",")}€</span>
          ${rp.oldPrice ? `<span class="product-old-price">${rp.oldPrice.toFixed(2).replace(".", ",")}€</span>` : ""}
        </div>
      </div>
    </a>
  `).join("");
}

function setupCartLink() {
  const link = document.getElementById("checkout-btn-link");
  if (link) {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      // Abrir checkout modal em vez de navegar
      const overlay = document.getElementById("checkout-overlay");
      const modal = document.getElementById("checkout-modal");
      if (overlay && modal && Cart.items.length > 0) {
        document.getElementById("cart-sidebar")?.classList.remove("open");
        document.getElementById("cart-overlay")?.classList.remove("show");
        overlay.classList.add("open");
        modal.classList.add("open");
        document.body.style.overflow = "hidden";
      }
    });
  }
}