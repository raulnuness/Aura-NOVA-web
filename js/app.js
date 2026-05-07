document.addEventListener("DOMContentLoaded", () => {
  Cart.updateUI();
  renderCategories();
  renderProducts(PRODUCTS);
  setupCartToggle();
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