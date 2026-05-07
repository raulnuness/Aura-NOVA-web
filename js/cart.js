const Cart = {
  items: JSON.parse(localStorage.getItem("cart") || "[]"),

  save() {
    localStorage.setItem("cart", JSON.stringify(this.items));
    this.updateUI();
  },

  add(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = this.items.find(i => i.id === productId);
    if (existing) {
      existing.qty++;
    } else {
      this.items.push({ ...product, qty: 1 });
    }
    this.save();
    this.showNotification(`${product.name} adicionado ao carrinho`);
  },

  remove(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
  },

  updateQty(productId, qty) {
    if (qty <= 0) return this.remove(productId);
    const item = this.items.find(i => i.id === productId);
    if (item) item.qty = qty;
    this.save();
  },

  total() {
    return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  },

  clear() {
    this.items = [];
    this.save();
  },

  showNotification(msg) {
    const el = document.createElement("div");
    el.className = "cart-notification";
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 2000);
  },

  updateUI() {
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = this.count();

    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.textContent = this.total().toFixed(2).replace(".", ",") + "€";

    const listEl = document.getElementById("cart-items");
    if (listEl) {
      if (this.items.length === 0) {
        listEl.innerHTML = '<p class="cart-empty">O carrinho está vazio</p>';
      } else {
        listEl.innerHTML = this.items.map(item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <div class="cart-item-info">
              <h4>${item.name}</h4>
              <p class="cart-item-price">${item.price.toFixed(2).replace(".", ",")}€</p>
              <div class="cart-item-qty">
                <button onclick="Cart.updateQty(${item.id}, ${item.qty - 1})">-</button>
                <span>${item.qty}</span>
                <button onclick="Cart.updateQty(${item.id}, ${item.qty + 1})">+</button>
              </div>
            </div>
            <button class="cart-item-remove" onclick="Cart.remove(${item.id})">&times;</button>
          </div>
        `).join("");
      }
    }
  }
};