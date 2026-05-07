document.addEventListener("DOMContentLoaded", () => {
  Cart.updateUI();
  renderCategories();
  renderProducts(PRODUCTS);
  setupCartToggle();
  setupMenuToggle();
  setupNavLinks();
  setupCountdown();
  setupUrgencyBar();
  setupEmailPopup();
});

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
  renderProducts(filtered);
}

function renderProducts(products) {
  const container = document.getElementById("product-grid");
  if (!container) return;

  container.innerHTML = products.map(p => `
    <article class="product-card">
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
      ${p.stock <= 5 ? `<span class="product-stock">${p.stock <= 2 ? "Últimas ${p.stock} unidades" : "Apenas ${p.stock} em stock"}</span>` : ""}
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
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
        <button class="btn-add-cart" onclick="Cart.add(${p.id})">
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  `).join("");
}

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

function setupNavLinks() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      const cat = link.dataset.category;
      if (!cat || cat === "sobre") return;

      e.preventDefault();
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      filterProducts(cat);

      const menuBtn = document.getElementById("menu-toggle");
      const nav = document.getElementById("header-nav");
      if (menuBtn && nav) {
        menuBtn.classList.remove("open");
        nav.classList.remove("open");
      }

      document.getElementById("product-grid").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function setupCountdown() {
  let end = localStorage.getItem("dropshop_promo_end");
  if (!end || parseInt(end) < Date.now()) {
    end = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("dropshop_promo_end", end);
  }
  end = parseInt(end);

  function tick() {
    const diff = Math.max(0, end - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById("cd-hours").textContent = String(h).padStart(2, "0");
    document.getElementById("cd-mins").textContent = String(m).padStart(2, "0");
    document.getElementById("cd-secs").textContent = String(s).padStart(2, "0");
    if (diff > 0) requestAnimationFrame(tick);
  }
  tick();
  setInterval(tick, 1000);
}

function setupUrgencyBar() {
  const bar = document.getElementById("urgency-bar");
  const text = document.getElementById("urgency-text");
  const lowStock = PRODUCTS.filter(p => p.stock <= 5);
  if (!lowStock.length) { bar.style.display = "none"; return; }

  const pick = lowStock[Math.floor(Math.random() * lowStock.length)];
  const msg = pick.stock <= 2
    ? `Últimas ${pick.stock} unidades — ${pick.name}`
    : `Apenas ${pick.stock} em stock — ${pick.name}`;
  text.textContent = msg;

  setInterval(() => {
    const p = lowStock[Math.floor(Math.random() * lowStock.length)];
    const m = p.stock <= 2
      ? `Últimas ${p.stock} unidades — ${p.name}`
      : `Apenas ${p.stock} em stock — ${p.name}`;
    text.textContent = m;
  }, 8000);
}

function setupEmailPopup() {
  if (localStorage.getItem("dropshop_email_sub")) return;

  const popup = document.getElementById("email-popup");
  const overlay = document.getElementById("email-overlay");
  const closeBtn = document.getElementById("email-popup-close");
  const form = document.getElementById("email-form");

  const show = () => {
    popup.classList.add("show");
    overlay.classList.add("show");
  };
  const hide = () => {
    popup.classList.remove("show");
    overlay.classList.remove("show");
    localStorage.setItem("dropshop_email_sub", "dismissed");
  };

  setTimeout(show, 12000);

  closeBtn.addEventListener("click", hide);
  overlay.addEventListener("click", hide);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email-input").value;
    localStorage.setItem("dropshop_email_sub", email);
    form.innerHTML = '<p style="text-align:center;font-weight:600;">Subscrito! Verifica o teu email.</p>';
    setTimeout(hide, 2500);
  });
}