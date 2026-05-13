document.addEventListener("DOMContentLoaded", async () => {
  // Mostrar skeleton loading enquanto carrega
  const grid = document.getElementById("product-grid");
  if (grid && PRODUCTS.length === 0) {
    grid.innerHTML = Array.from({length: 8}, () => `
      <div class="product-card loading" style="opacity:1;transform:none;">
        <div class="product-image" style="min-height:230px;"></div>
        <div class="product-info" style="padding:1.25rem;">
          <div style="width:70%;height:14px;background:var(--border);border-radius:4px;margin-bottom:0.5rem;"></div>
          <div style="width:100%;height:12px;background:var(--border);border-radius:4px;margin-bottom:0.5rem;"></div>
          <div style="width:50%;height:18px;background:var(--border);border-radius:4px;margin-top:1rem;"></div>
        </div>
      </div>
    `).join("");
  }

  // Carregar produtos da API antes de tudo
  await loadProducts();

  Cart.updateUI();
  renderCategories();
  renderProducts(PRODUCTS);
  setupCartToggle();
  setupMenuToggle();
  setupNavLinks();
  setupSearch();
  setupProductModal();
  setupEmailPopup();
  setupScrollReveal();
  setupFooterNewsletter();
  setupBackToTop();
  setupCookieBanner();
  setupDarkMode();
  setupSortFilter();
  initRecentlyViewed();
  setupCoupon();
  Checkout.init();
  Wishlist.updateUI();
});

/* ═══ CATEGORIES ═══ */
function renderCategories() {
  const container = document.getElementById("categories");
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <button class="category-btn ${cat.id === "todos" ? "active" : ""}"
            data-category="${cat.id}"
            onclick="filterProducts('${cat.id}')">
      ${cat.name}
    </button>
  `).join("");
}

function filterProducts(category) {
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.category === category);
  });

  const filtered = category === "todos" ? PRODUCTS : PRODUCTS.filter(p => p.category === category);
  const sortVal = document.getElementById("sort-select")?.value || "default";
  renderProducts(sortProducts(filtered, sortVal));
}

/* ═══ SORT & FILTER ═══ */
function setupSortFilter() {
  const sortSelect = document.getElementById("sort-select");
  if (!sortSelect) return;

  sortSelect.addEventListener("change", () => {
    const active = document.querySelector(".category-btn.active");
    const cat = active ? active.dataset.category : "todos";
    const filtered = cat === "todos" ? [...PRODUCTS] : PRODUCTS.filter(p => p.category === cat);
    renderProducts(sortProducts(filtered, sortSelect.value));
  });
}

function sortProducts(products, sort) {
  const list = [...products];
  switch (sort) {
    case "price-asc": return list.sort((a, b) => a.price - b.price);
    case "price-desc": return list.sort((a, b) => b.price - a.price);
    case "rating": return list.sort((a, b) => b.rating - a.rating);
    case "newest": return list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    default: return list;
  }
}

/* ═══ PRODUCTS ═══ */
function renderProducts(products) {
  const container = document.getElementById("product-grid");
  if (!container) return;

  container.innerHTML = products.map(p => `
    <article class="product-card" data-id="${p.id}" onclick="openProductModal(${p.id})">
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
      ${p.isNew ? `<span class="product-badge product-badge-new">Novo</span>` : ""}
      <button class="wishlist-btn ${Wishlist.has(p.id) ? 'active' : ''}" data-wishlist-btn="${p.id}" onclick="event.stopPropagation(); Wishlist.toggle(${p.id})" aria-label="Favorito">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${Wishlist.has(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
      </button>
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect fill=%22%231a1a1a%22 width=%22400%22 height=%22400%22/><text fill=%22%23666%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2216%22>Imagem indisponível</text></svg>'">
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-rating">
          <span class="star">${"★".repeat(Math.floor(p.rating))}${p.rating % 1 >= 0.5 ? "½" : ""}</span>
          <span>${p.rating} (${p.reviews})</span>
        </div>
        <div class="product-pricing">
          <span class="product-price">${p.price.toFixed(2).replace(".", ",")}€</span>
          ${p.oldPrice ? `<span class="product-old-price">${p.oldPrice.toFixed(2).replace(".", ",")}€</span>` : ""}
          ${p.oldPrice ? `<span class="product-discount">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : ""}
        </div>
        <button class="btn-add-cart" onclick="event.stopPropagation(); Cart.add(${p.id})">
          <span>Adicionar ao carrinho</span>
        </button>
      </div>
    </article>
  `).join("");

  setupScrollReveal();
}

/* ═══ SEARCH ═══ */
function setupSearch() {
  const toggle = document.getElementById("search-toggle");
  const search = document.getElementById("header-search");
  const close = document.getElementById("search-close");
  const input = document.getElementById("search-input");
  const results = document.createElement("div");
  results.className = "search-results";
  search.parentNode.insertBefore(results, search.nextSibling);

  if (!toggle || !search) return;

  toggle.addEventListener("click", () => {
    search.classList.add("open");
    input.focus();
  });

  close.addEventListener("click", () => {
    search.classList.remove("open");
    results.classList.remove("open");
    input.value = "";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      search.classList.remove("open");
      results.classList.remove("open");
      input.value = "";
    }
  });

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { results.classList.remove("open"); return; }

    const matches = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );

    results.innerHTML = matches.length === 0
      ? '<div class="search-no-results">Nenhum produto encontrado</div>'
      : matches.map(p => `
        <div class="search-result-item" onclick="openProductModal(${p.id}); document.getElementById('header-search').classList.remove('open'); document.querySelector('.search-results').classList.remove('open'); document.getElementById('search-input').value = '';">
          <img src="${p.image}" alt="${p.name}">
          <div class="search-result-info">
            <h4>${p.name}</h4>
            <span>${p.price.toFixed(2).replace(".", ",")}€</span>
          </div>
        </div>
      `).join("");

    results.classList.add("open");
  });
}

/* ═══ PRODUCT MODAL ═══ */
function openProductModal(id) {
  const p = PRODUCTS.find(prod => prod.id === id);
  if (!p) return;

  saveRecentlyViewed(p.id);

  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("product-modal");

  document.getElementById("modal-img").src = p.image;
  document.getElementById("modal-img").alt = p.name;
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("modal-desc").textContent = p.description;

  const badge = document.getElementById("modal-badge");
  badge.textContent = p.badge || "";
  badge.style.display = p.badge ? "inline-block" : "none";

  const rating = document.getElementById("modal-rating");
  rating.innerHTML = `<span>${"★".repeat(Math.floor(p.rating))}${p.rating % 1 >= 0.5 ? "½" : ""}</span> <span>${p.rating} (${p.reviews} avaliações)</span>`;

  const pricing = document.getElementById("modal-pricing");
  pricing.innerHTML = `
    <span class="modal-price">${p.price.toFixed(2).replace(".", ",")}€</span>
    ${p.oldPrice ? `<span class="modal-old-price">${p.oldPrice.toFixed(2).replace(".", ",")}€</span>` : ""}
    ${p.oldPrice ? `<span class="modal-discount">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : ""}
  `;

  const features = document.getElementById("modal-features");
  features.innerHTML = p.features.map(f => `
    <div class="modal-feature">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span>${f}</span>
    </div>
  `).join("");

  const wishBtn = document.getElementById("modal-wishlist-btn");
  if (wishBtn) {
    wishBtn.className = `modal-secondary-btn ${Wishlist.has(p.id) ? 'active' : ''}`;
    wishBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${Wishlist.has(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg> ${Wishlist.has(p.id) ? 'Guardado' : 'Guardar'}`;
    wishBtn.onclick = () => {
      Wishlist.toggle(p.id);
      wishBtn.className = `modal-secondary-btn ${Wishlist.has(p.id) ? 'active' : ''}`;
      wishBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${Wishlist.has(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg> ${Wishlist.has(p.id) ? 'Guardado' : 'Guardar'}`;
    };
  }

  const addBtn = document.getElementById("modal-add-btn");
  addBtn.onclick = () => { Cart.add(p.id); closeModal(); };

  const related = PRODUCTS.filter(rp => rp.category === p.category && rp.id !== p.id).slice(0, 3);
  const relatedContainer = document.getElementById("modal-related");
  if (relatedContainer && related.length > 0) {
    relatedContainer.innerHTML = `
      <h4>Também pode gostar</h4>
      <div class="modal-related-grid">
        ${related.map(rp => `
          <div class="modal-related-item" onclick="openProductModal(${rp.id})">
            <img src="${rp.image}" alt="${rp.name}">
            <div>
              <span class="modal-related-name">${rp.name}</span>
              <span class="modal-related-price">${rp.price.toFixed(2).replace(".", ",")}€</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    relatedContainer.style.display = "block";
  } else if (relatedContainer) {
    relatedContainer.style.display = "none";
  }

  overlay.classList.add("open");
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("product-modal").classList.remove("open");
  document.body.style.overflow = "";
}

function setupProductModal() {
  const overlay = document.getElementById("modal-overlay");
  const closeBtn = document.getElementById("modal-close");
  if (overlay) overlay.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

/* ═══ RECENTLY VIEWED ═══ */
function saveRecentlyViewed(id) {
  let viewed = JSON.parse(localStorage.getItem("auranova_recent") || "[]");
  viewed = viewed.filter(v => v !== id);
  viewed.unshift(id);
  viewed = viewed.slice(0, 6);
  localStorage.setItem("auranova_recent", JSON.stringify(viewed));
}

function initRecentlyViewed() {
  const viewed = JSON.parse(localStorage.getItem("auranova_recent") || "[]");
  if (viewed.length === 0) return;

  const section = document.getElementById("recently-viewed");
  if (!section) return;

  const products = viewed.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  if (products.length === 0) return;

  section.style.display = "block";
  const grid = document.getElementById("recently-viewed-grid");
  if (!grid) return;

  grid.innerHTML = products.map(p => `
    <div class="recently-viewed-card" onclick="openProductModal(${p.id})">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div>
        <h4>${p.name}</h4>
        <span>${p.price.toFixed(2).replace(".", ",")}€</span>
      </div>
    </div>
  `).join("");
}

/* ═══ CART ═══ */
function setupCartToggle() {
  const toggle = document.getElementById("cart-toggle");
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");
  const close = document.getElementById("cart-close");

  if (!toggle || !sidebar) return;

  toggle.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  });

  close.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  function closeCart() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }
}

function setupMenuToggle() {
  const btn = document.getElementById("menu-toggle");
  const nav = document.getElementById("header-nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    nav.classList.toggle("open");
  });
}

/* ═══ NAV ═══ */
function setupNavLinks() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      const cat = link.dataset.category;

      if (cat) {
        e.preventDefault();
        document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        if (cat !== "todos") {
          filterProducts(cat);
        } else {
          filterProducts("todos");
        }

        const menuBtn = document.getElementById("menu-toggle");
        const nav = document.getElementById("header-nav");
        if (menuBtn && nav) {
          menuBtn.classList.remove("open");
          nav.classList.remove("open");
        }

        const grid = document.getElementById("product-grid");
        if (grid) grid.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

/* ═══ EMAIL POPUP ═══ */
function setupEmailPopup() {
  if (localStorage.getItem("auranova_email_sub")) return;

  const popup = document.getElementById("email-popup");
  const overlay = document.getElementById("email-overlay");
  const closeBtn = document.getElementById("email-popup-close");
  const form = document.getElementById("email-form");

  const show = () => { popup.classList.add("show"); overlay.classList.add("show"); };
  const hide = () => { popup.classList.remove("show"); overlay.classList.remove("show"); localStorage.setItem("auranova_email_sub", "dismissed"); };

  setTimeout(show, 20000);

  closeBtn.addEventListener("click", hide);
  overlay.addEventListener("click", hide);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email-input").value;
    const submitBtn = form.querySelector("button");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "A enviar..."; }

    try {
      const res = await fetch(`${API_BASE}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": CSRF_TOKEN },
        body: JSON.stringify({ email, source: "popup" })
      });
      if (res.ok) {
        localStorage.setItem("auranova_email_sub", email);
        form.innerHTML = '<p style="text-align:center;font-weight:700;color:#16a34a;font-size:0.95rem;">Subscrito! Verifica o teu email.</p>';
      } else {
        const data = await res.json().catch(() => ({}));
        form.innerHTML = `<p style="text-align:center;font-weight:700;color:#dc2626;font-size:0.95rem;">${data.error || "Erro ao subscrever. Tenta novamente."}</p>`;
      }
    } catch {
      localStorage.setItem("auranova_email_sub", email);
      form.innerHTML = '<p style="text-align:center;font-weight:700;color:#16a34a;font-size:0.95rem;">Subscrito! Verifica o teu email.</p>';
    }
    setTimeout(hide, 2500);
  });
}

/* ═══ SCROLL REVEAL ═══ */
function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add("revealed"), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });

  document.querySelectorAll(".product-card, .review-card, .about-feature").forEach((el, i) => {
    el.dataset.delay = (i % 4) * 80;
    observer.observe(el);
  });
}

/* ═══ NEWSLETTER ═══ */
function setupFooterNewsletter() {
  const form = document.getElementById("footer-newsletter");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    if (!input.value) return;
    const email = input.value;

    try {
      const res = await fetch(`${API_BASE}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": CSRF_TOKEN },
        body: JSON.stringify({ email, source: "newsletter" })
      });
      if (res.ok) {
        localStorage.setItem("auranova_email_sub", email);
        form.innerHTML = '<p style="color:rgba(255,255,255,0.8);font-size:0.82rem;font-weight:600;">Subscrito!</p>';
      } else {
        form.innerHTML = '<p style="color:#f87171;font-size:0.82rem;font-weight:600;">Erro ao subscrever. Tenta novamente.</p>';
      }
    } catch {
      localStorage.setItem("auranova_email_sub", email);
      form.innerHTML = '<p style="color:rgba(255,255,255,0.8);font-size:0.82rem;font-weight:600;">Subscrito!</p>';
    }
  });
}

/* ═══ BACK TO TOP ═══ */
function setupBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 600);
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ═══ COOKIE BANNER ═══ */
function setupCookieBanner() {
  if (localStorage.getItem("auranova_cookies")) return;

  const banner = document.getElementById("cookie-banner");
  if (!banner) return;

  setTimeout(() => banner.classList.add("show"), 2000);

  document.getElementById("cookie-accept").addEventListener("click", () => {
    localStorage.setItem("auranova_cookies", JSON.stringify({ necessary: true, analytics: true, marketing: true }));
    banner.classList.remove("show");
  });

  document.getElementById("cookie-reject").addEventListener("click", () => {
    localStorage.setItem("auranova_cookies", JSON.stringify({ necessary: true, analytics: false, marketing: false }));
    banner.classList.remove("show");
  });
}

/* ═══ DARK MODE ═══ */
function setupDarkMode() {
  const toggle = document.getElementById("dark-mode-toggle");
  if (!toggle) return;

  const saved = localStorage.getItem("auranova_theme");
  if (saved === "dark") document.body.classList.add("dark-mode");

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("auranova_theme", isDark ? "dark" : "light");
    toggle.innerHTML = isDark
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>';
  });

  const isDark = document.body.classList.contains("dark-mode");
  toggle.innerHTML = isDark
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>';
}

/* ═══ COUPON ═══ */
function setupCoupon() {
  const applyBtn = document.getElementById("coupon-apply");
  const input = document.getElementById("coupon-input");
  if (!applyBtn || !input) return;

  applyBtn.addEventListener("click", async () => {
    const code = input.value.trim();
    if (!code) return;
    const result = await Coupons.apply(code);
    if (result.valid) {
      input.style.borderColor = "#16a34a";
      input.value = "";
      Cart.updateUI();
      Cart.showNotification(result.message);
    } else {
      input.style.borderColor = "#dc2626";
      Cart.showNotification(result.message);
      setTimeout(() => input.style.borderColor = "", 2000);
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyBtn.click();
  });
}

/* ═══ CHECKOUT ═══ */
/* Checkout moved to checkout.js — Checkout.init() handles everything */