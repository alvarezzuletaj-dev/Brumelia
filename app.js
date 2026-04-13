const WA_NUMBER = "573116285221";


let products = [];
let cart = loadCart();
let currentFilter = "todo";
let currentSearch = "";

fetch("products.json")
  .then(res => res.json())
  .then(data => {
    products = data;
    renderGrid(); 
  })
  .catch(err => {
    console.error("Error cargando productos:", err);
  });


function formatPrice(n) {
  return "$" + n.toLocaleString("es-CO");
}


function showToast(msg, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = "toast show " + type;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = "toast";
  }, 2800);
}


function filter(cat, btn) {
  currentFilter = cat;
  currentSearch = "";
  const input = document.querySelector(".search");
  if (input) input.value = "";
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderGrid();
}


function searchProducts(val) {
  currentSearch = val.toLowerCase();
  renderGrid();
}


function buildCard(p) {
  const badge = p.badge
    ? `<span class="badge badge-${p.badge}">${p.badge === "new" ? "Nuevo" : "Oferta"}</span>`
    : "";

  const dots = (p.colors || [])
    .map(c => `<div class="color-dot" style="background:${c}"></div>`)
    .join("");
    
  const oldPrice = p.oldPrice
    ? `<span class="price-old">${formatPrice(p.oldPrice)}</span>`
    : "";


  const imgHTML = p.imagen
    ? `<img src="${p.imagen}" alt="${p.name}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
       <span class="img-fallback" style="display:none;">🛍️</span>`
    : `<span class="img-fallback">🛍️</span>`;

  
  const inCart = cart.some(i => i.id === p.id);

  return `
    <div class="card" id="card-${p.id}">
      <div class="img-area">
        ${imgHTML}
        ${badge}
      </div>
      <div class="card-body">
        <div class="prod-name">${p.name}</div>
        <div class="prod-desc">${p.desc}</div>
        <div class="colors">${dots}</div>
        <div class="footer-row">
          <div>
            <span class="price">${formatPrice(p.price)}</span>
            ${oldPrice}
          </div>
          <button
            class="btn-add ${inCart ? 'added' : ''}"
            id="btn-${p.id}"
            onclick="addToCart(${p.id})"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            ${inCart ? "En carrito" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  `;
}


function renderGrid() {
  const grid = document.getElementById("grid");
  const hayBusqueda = currentSearch.length > 0;

  const filtered = products.filter(p => {
    
    const matchCat =
      hayBusqueda ||
      currentFilter === "todo" ||
      p.cat === currentFilter ||
      (currentFilter === "sale" && p.oldPrice);

    const matchSearch =
      !hayBusqueda ||
      p.name.toLowerCase().includes(currentSearch) ||
      p.desc.toLowerCase().includes(currentSearch);

    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    const msg = hayBusqueda
      ? `No se encontraron productos para "<strong>${currentSearch}</strong>"`
      : "No hay productos en esta categoría";
    grid.innerHTML = `<div class="empty">${msg}</div>`;
    return;
  }

  grid.innerHTML = filtered.map(buildCard).join("");
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(i => i.id === id);

  if (existing) {
    
    existing.qty += 1;
    showToast(`+1 ${product.name.split(" ").slice(0, 3).join(" ")}...`);
  } else {
    
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      imagen: product.imagen,
      qty: 1
    });
    showToast("¡Producto agregado al carrito! 🛍️");
  }

  saveCart();
  renderCart();
  updateCartButton(id);

  
  const panel = document.getElementById("cartPanel");
  if (!panel.classList.contains("open")) toggleCart();
}


function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
  
  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.classList.remove("added");
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Agregar`;
  }
}


function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart();
  renderCart();
}


function clearCart() {
  if (!confirm("¿Seguro que quieres vaciar el carrito?")) return;
  cart = [];
  saveCart();
  renderCart();
  
  document.querySelectorAll(".btn-add").forEach(btn => {
    const id = parseInt(btn.id.replace("btn-", ""));
    btn.classList.remove("added");
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Agregar`;
  });
  showToast("Carrito vaciado");
}


function getTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}


function updateCartButton(id) {
  const btn = document.getElementById(`btn-${id}`);
  if (!btn) return;
  btn.classList.add("added");
  btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> En carrito`;
}


function renderCart() {
  const itemsEl   = document.getElementById("cartItems");
  const footerEl  = document.getElementById("cartFooter");
  const emptyEl   = document.getElementById("cartEmpty");
  const totalEl   = document.getElementById("cartTotal");
  const countEl   = document.getElementById("cartCount");

  
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  countEl.textContent = totalItems;

  if (cart.length === 0) {
  itemsEl.innerHTML = `
  <div class="cart-empty">
    <span class="cart-empty-icon">🛍️</span>
    <p>Tu carrito está vacío</p>
    <small>Agrega productos para comenzar</small>
  </div>
`;
  


  footerEl.style.display = "none";

  
  totalEl.textContent = formatPrice(0);
  countEl.textContent = "0";

  return;
}

  
  footerEl.style.display = "flex";
  totalEl.textContent = formatPrice(getTotal());

  itemsEl.innerHTML = cart.map(item => {
    const imgHTML = item.imagen
      ? `<img src="${item.imagen}" alt="${item.name}"
           onerror="this.style.display='none'" />`
      : "🛍️";

    return `
      <div class="cart-item" id="ci-${item.id}">
        <div class="cart-item-img">${imgHTML}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
          <div class="qty-controls">
            <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id}, +1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Eliminar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }).join("");
}

function toggleCart() {
  const panel = document.getElementById("cartPanel");
  panel.classList.toggle("open");
  
renderCart();
}



function saveCart() {
  try {
    localStorage.setItem("brumelia_cart", JSON.stringify(cart));
  } catch(e) {
    console.warn("No se pudo guardar el carrito:", e);
  }
}

function loadCart() {
  try {
    const data = localStorage.getItem("brumelia_cart");
    return data ? JSON.parse(data) : [];
  } catch(e) {
    return [];
  }
}

function openCheckout() {
  if (cart.length === 0) {
    showToast("Tu carrito está vacío", "error");
    return;
  }

  const summaryEl = document.getElementById("orderSummary");
  const itemsHTML = cart.map(item => `
    <div class="order-item">
      <span>${item.qty}x ${item.name.split(" ").slice(0, 4).join(" ")}...</span>
      <span>${formatPrice(item.price * item.qty)}</span>
    </div>
  `).join("");

  summaryEl.innerHTML = itemsHTML + `
    <div class="order-total-line">
      <span>Total</span>
      <span class="total-val">${formatPrice(getTotal())}</span>
    </div>
  `;

  document.getElementById("checkoutOverlay").classList.add("open");
}


function closeCheckout(e) {
  if (!e || e.target === document.getElementById("checkoutOverlay")) {
    document.getElementById("checkoutOverlay").classList.remove("open");
  }
}

function sendToWhatsApp() {
  const name    = document.getElementById("clientName").value.trim();
  const address = document.getElementById("clientAddress").value.trim();
  const payment = document.getElementById("paymentMethod").value;
  const note    = document.getElementById("clientNote").value.trim();

  
  if (!name) {
    showToast("Por favor ingresa tu nombre", "error");
    document.getElementById("clientName").focus();
    return;
  }
  if (!address) {
    showToast("Por favor ingresa tu dirección", "error");
    document.getElementById("clientAddress").focus();
    return;
  }

  // 
  let msg = `*🌸 PEDIDO - Brumelia Wonders 🌸*\n\n`;
  msg += `👤 *Cliente:* ${name}\n`;
  msg += `📍 *Dirección:* ${address}\n`;
  if (payment) msg += `💳 *Pago:* ${payment}\n`;
  msg += `\n🛍 *Productos:*\n`;

  cart.forEach(item => {
    msg += `• ${item.qty}x ${item.name}\n`;
    msg += `  └ ${formatPrice(item.price)} c/u = *${formatPrice(item.price * item.qty)}*\n`;
  });

  msg += `\n💰 *TOTAL: ${formatPrice(getTotal())}*`;
  if (note) msg += `\n\n📝 *Nota:* ${note}`;
  

  
  const url = `https://api.whatsapp.com/send?phone=${WA_NUMBER}&text=${encodeURIComponent(msg)}`;

  
  const confirmed = confirm(
    `¿Confirmas tu pedido?\n\n` +
    `Cliente: ${name}\n` +
    `Total: ${formatPrice(getTotal())}\n\n` +
    `Se abrirá WhatsApp con tu pedido listo.`
  );

  if (!confirmed) return;

 
  window.open(url, "_blank");

  
  cart = [];
  saveCart();
  renderCart();
  closeCheckout();
  toggleCart();

  
  document.getElementById("clientName").value    = "";
  document.getElementById("clientAddress").value = "";
  document.getElementById("paymentMethod").value = "";
  document.getElementById("clientNote").value    = "";

  
  document.querySelectorAll(".btn-add").forEach(btn => {
    btn.classList.remove("added");
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Agregar`;
  });

  showToast("¡Pedido enviado! Revisa WhatsApp 🎉", "success");
}



document.addEventListener("DOMContentLoaded", () => {
  renderGrid(); 
  renderCart();  

  
  if (cart.length > 0) {
    showToast(`Tienes ${cart.length} producto(s) en tu carrito 🛍️`);
  }
});