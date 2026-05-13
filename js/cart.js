const Wishlist = {
  items: JSON.parse(localStorage.getItem("auranova_wishlist") || "[]"),

  save() {
    localStorage.setItem("auranova_wishlist", JSON.stringify(this.items));
    this.updateUI();
  },

  toggle(productId) {
    const idx = this.items.indexOf(productId);
    if (idx > -1) {
      this.items.splice(idx, 1);
      Cart.showNotification("Removido dos favoritos");
    } else {
      this.items.push(productId);
      Cart.showNotification("Adicionado aos favoritos");
    }
    this.save();
  },

  has(productId) {
    return this.items.includes(productId);
  },

  updateUI() {
    document.querySelectorAll("[data-wishlist-btn]").forEach(btn => {
      const id = parseInt(btn.dataset.wishlistBtn);
      btn.classList.toggle("active", this.has(id));
    });
  }
};

const Coupons = {
  applied: null,

  apply: async function(code) {
    try {
      const res = await fetch(API_BASE + "/orders/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": CSRF_TOKEN },
        body: JSON.stringify({ code, subtotal: Cart.total() })
      });
      const result = await res.json();
      if (result.valid) {
        this.applied = { code: result.code, type: result.type, value: result.value, discount: result.discount };
        return { valid: true, message: result.message };
      }
      return { valid: false, message: result.message };
    } catch (e) {
      return { valid: false, message: "Não foi possível validar o cupão. Tenta novamente." };
    }
  },

  remove() {
    this.applied = null;
  },

  getDiscount(subtotal) {
    if (!this.applied) return 0;
    if (this.applied.type === "percent") return subtotal * (this.applied.value / 100);
    if (this.applied.type === "shipping") return 3.99;
    if (this.applied.discount) return this.applied.discount;
    return 0;
  }
};

const Cart = {
  items: JSON.parse(localStorage.getItem("auranova_cart") || "[]"),

  save() {
    localStorage.setItem("auranova_cart", JSON.stringify(this.items));
    this.updateUI();
  },

  add(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = this.items.find(i => i.id === productId);
    if (existing) {
      existing.qty++;
    } else {
      this.items.push({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image, qty: 1 });
    }
    this.save();
    this.showNotification(`${product.name} adicionado ao carrinho`);

    const countEl = document.getElementById("cart-count");
    if (countEl) {
      countEl.style.transform = "scale(1.3)";
      setTimeout(() => countEl.style.transform = "", 200);
    }
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

    const listEl = document.getElementById("cart-items");
    if (listEl) {
      if (this.items.length === 0) {
        listEl.innerHTML = '<div class="cart-empty-state"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.25-3h-15l.75 9h13.5l.75-9z"/></svg><p>O carrinho está vazio</p><span>Adiciona produtos para começar</span></div>';
      } else {
        listEl.innerHTML = this.items.map(item => {
          const lineTotal = item.price * item.qty;
          return `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <div class="cart-item-info">
              <h4>${item.name}</h4>
              <p class="cart-item-price">${item.price.toFixed(2).replace(".", ",")}€ × ${item.qty} = ${lineTotal.toFixed(2).replace(".", ",")}€</p>
              <div class="cart-item-qty">
                <button onclick="Cart.updateQty(${item.id}, ${item.qty - 1})">−</button>
                <span>${item.qty}</span>
                <button onclick="Cart.updateQty(${item.id}, ${item.qty + 1})">+</button>
              </div>
            </div>
            <button class="cart-item-remove" onclick="Cart.remove(${item.id})">&times;</button>
          </div>
        `}).join("");
      }
    }

    const subtotal = this.total();
    const discount = Coupons.getDiscount(subtotal);
    const shipping = subtotal >= 35 ? 0 : 3.99;
    const finalTotal = subtotal - discount + shipping;

    const cartTotalEl = document.getElementById("cart-total");
    if (cartTotalEl) cartTotalEl.textContent = subtotal.toFixed(2).replace(".", ",") + "€";

    const cartDiscountEl = document.getElementById("cart-discount");
    if (cartDiscountEl) {
      if (discount > 0) {
        cartDiscountEl.parentElement.style.display = "flex";
        cartDiscountEl.textContent = "-" + discount.toFixed(2).replace(".", ",") + "€";
      } else {
        cartDiscountEl.parentElement.style.display = "none";
      }
    }

    const cartShippingEl = document.getElementById("cart-shipping");
    if (cartShippingEl) cartShippingEl.textContent = shipping === 0 ? "Grátis" : shipping.toFixed(2).replace(".", ",") + "€";

    const cartFinalTotalEl = document.getElementById("cart-final-total");
    if (cartFinalTotalEl) cartFinalTotalEl.textContent = finalTotal.toFixed(2).replace(".", ",") + "€";

    Wishlist.updateUI();
  }
};