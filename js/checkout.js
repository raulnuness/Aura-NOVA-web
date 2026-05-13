// Checkout com Stripe
const Checkout = {
  currentStep: 1,

  init() {
    const checkoutBtn = document.getElementById("checkout-btn");
    const overlay = document.getElementById("checkout-overlay");
    const modal = document.getElementById("checkout-modal");
    const closeBtn = document.getElementById("checkout-close");

    if (!checkoutBtn || !overlay || !modal) return;

    checkoutBtn.addEventListener("click", () => {
      if (Cart.items.length === 0) {
        Cart.showNotification("Adiciona produtos ao carrinho primeiro");
        return;
      }
      overlay.classList.add("open");
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      document.getElementById("cart-sidebar")?.classList.remove("open");
      document.getElementById("cart-overlay")?.classList.remove("show");
    });

    closeBtn.addEventListener("click", this.close.bind(this));
    overlay.addEventListener("click", this.close.bind(this));

    const next1 = document.getElementById("checkout-next-1");
    if (next1) {
      next1.addEventListener("click", () => this.validateStep1());
    }

    const payBtn = document.getElementById("stripe-pay-btn");
    if (payBtn) {
      payBtn.addEventListener("click", () => this.processPayment());
    }

    const backBtn = document.getElementById("checkout-back-1");
    if (backBtn) {
      backBtn.addEventListener("click", () => this.goToStep(1));
    }

    this.checkOrderSuccess();
    this.checkOrderCancelled();
  },

  close() {
    document.getElementById("checkout-overlay").classList.remove("open");
    document.getElementById("checkout-modal").classList.remove("open");
    document.body.style.overflow = "";
  },

  goToStep(step) {
    document.querySelectorAll(".checkout-form").forEach(f => f.style.display = "none");
    const stepEl = document.getElementById(`checkout-step-${step}`);
    if (stepEl) stepEl.style.display = "block";

    document.querySelectorAll(".checkout-step").forEach(s => {
      const sNum = parseInt(s.dataset.step);
      s.classList.toggle("active", sNum === step);
      s.classList.toggle("completed", sNum < step);
    });

    this.currentStep = step;
  },

  validateStep1() {
    const name = document.getElementById("ch-name").value.trim();
    const email = document.getElementById("ch-email").value.trim();
    const address = document.getElementById("ch-address").value.trim();
    const zip = document.getElementById("ch-zip").value.trim();
    const city = document.getElementById("ch-city").value.trim();

    if (!name || !email || !address || !zip || !city) {
      Cart.showNotification("Preenche todos os campos obrigatórios");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Cart.showNotification("Email inválido");
      return;
    }

    if (!/^\d{4}-?\d{3}$/.test(zip.replace(/\s/g, ''))) {
      Cart.showNotification("Código postal inválido (formato: 0000-000)");
      return;
    }

    this.goToStep(2);
    this.renderPaymentStep();
  },

  renderPaymentStep() {
    const subtotal = Cart.total();
    const discount = Coupons.applied ? Coupons.getDiscount(subtotal) : 0;
    const shipping = subtotal >= 35 ? 0 : 3.99;
    const total = subtotal - discount + shipping;

    const summaryEl = document.getElementById("checkout-summary-step2");
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="checkout-summary-compact">
          <h4>Resumo</h4>
          ${Cart.items.map(item => `
            <div class="summary-row"><span>${item.name} × ${item.qty}</span><span>${(item.price * item.qty).toFixed(2).replace(".", ",")}€</span></div>
          `).join("")}
          <div class="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2).replace(".", ",")}€</span></div>
          ${discount > 0 ? `<div class="summary-row" style="color:#16a34a"><span>Desconto</span><span>-${discount.toFixed(2).replace(".", ",")}€</span></div>` : ""}
          <div class="summary-row"><span>Envio</span><span>${shipping === 0 ? "Grátis" : shipping.toFixed(2).replace(".", ",") + "€"}</span></div>
          <div class="summary-total"><span>Total</span><span>${total.toFixed(2).replace(".", ",")}€</span></div>
        </div>
      `;
    }
  },

  async processPayment() {
    const payBtn = document.getElementById("stripe-pay-btn");
    if (!payBtn) return;

    payBtn.disabled = true;
    payBtn.classList.add("loading");
    payBtn.innerHTML = '<span class="spinner"></span> A processar...';

    try {
      const orderData = {
        customer_name: document.getElementById("ch-name").value.trim(),
        customer_surname: document.getElementById("ch-surname").value.trim(),
        customer_email: document.getElementById("ch-email").value.trim(),
        customer_phone: document.getElementById("ch-phone").value.trim(),
        address: document.getElementById("ch-address").value.trim(),
        postal_code: document.getElementById("ch-zip").value.trim(),
        city: document.getElementById("ch-city").value.trim(),
        items: Cart.items.map(item => ({
          id: item.id,
          qty: item.qty
        })),
        coupon_code: Coupons.applied ? Coupons.applied.code : null,
        payment_method: "stripe",
        _csrf: CSRF_TOKEN
      };

      const orderRes = await fetch(API_BASE + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": CSRF_TOKEN },
        body: JSON.stringify(orderData)
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Erro ao criar encomenda");
      }

      const order = await orderRes.json();

      const stripeRes = await fetch(API_BASE + "/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": CSRF_TOKEN },
        body: JSON.stringify({ order_id: order.order_id })
      });

      if (!stripeRes.ok) {
        const err = await stripeRes.json();
        throw new Error(err.error || "Erro ao criar sessão de pagamento");
      }

      const stripe = await stripeRes.json();

      if (stripe.url) {
        window.location.href = stripe.url;
      } else {
        throw new Error("URL de pagamento não disponível");
      }

    } catch (error) {
      Cart.showNotification(error.message || "Erro ao processar pagamento. Tenta novamente.");
      payBtn.disabled = false;
      payBtn.classList.remove("loading");
      payBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Pagar com Stripe`;
    }
  },

  checkOrderSuccess() {
    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get("order");
    if (orderNumber) {
      Cart.clear();
      Coupons.remove();
      Cart.updateUI();
      this.showSuccessMessage(orderNumber);
      window.history.replaceState({}, "", window.location.pathname);
    }
  },

  checkOrderCancelled() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cancel") === "1") {
      Cart.showNotification("Pagamento cancelado. Podes tentar novamente.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  },

  showSuccessMessage(orderNumber) {
    const overlay = document.createElement("div");
    overlay.className = "checkout-overlay open";
    overlay.id = "success-overlay";

    const modal = document.createElement("div");
    modal.className = "checkout-modal open";
    modal.innerHTML = `
      <div class="checkout-success" style="display:block">
        <div class="checkout-success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h3>Encomenda confirmada!</h3>
        <p>Número da encomenda: <strong>${orderNumber}</strong></p>
        <p>Vais receber um email com os detalhes da encomenda.</p>
        <p style="font-size:0.85rem;color:var(--text-muted);">Prazo de entrega: 2-5 dias úteis</p>
        <button class="checkout-next-btn" onclick="document.getElementById('success-overlay').remove(); this.closest('.checkout-modal').remove();">Continuar a comprar</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";

    overlay.addEventListener("click", () => {
      overlay.remove();
      modal.remove();
      document.body.style.overflow = "";
    });
  }
};