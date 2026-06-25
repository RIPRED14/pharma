import store from './store.js';

let cart = [];
let selectedPatientId = null;

export function initPOS() {
  cart = [];
  selectedPatientId = null;
  
  renderProductGrid();
  renderCart();
  setupPatientSelect();
  setupEventListeners();
}

function setupEventListeners() {
  // Search bar live filter
  const searchInput = document.getElementById('pos-search');
  searchInput.addEventListener('input', (e) => {
    renderProductGrid(e.target.value);
  });

  // Patient select dropdown change
  const patientSelect = document.getElementById('pos-patient-select');
  patientSelect.addEventListener('change', (e) => {
    selectedPatientId = e.target.value || null;
    renderCart();
  });

  // Clear cart button
  document.getElementById('clear-cart-btn').onclick = () => {
    cart = [];
    renderCart();
  };

  // Checkout button
  document.getElementById('checkout-btn').onclick = () => {
    processCheckout();
  };

  // Close invoice modal
  document.getElementById('close-invoice-modal').onclick = () => {
    document.getElementById('invoice-modal').classList.remove('active');
    initPOS(); // Reset terminal
  };
}

function renderProductGrid(filterText = '') {
  const container = document.getElementById('pos-products-grid');
  container.innerHTML = '';
  
  const meds = store.getMedications();
  const query = filterText.toLowerCase();
  
  const filteredMeds = meds.filter(m => 
    m.name.toLowerCase().includes(query) ||
    m.molecule.toLowerCase().includes(query) ||
    m.code.includes(query) ||
    m.category.toLowerCase().includes(query)
  );

  if (filteredMeds.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        Aucun produit trouvé.
      </div>
    `;
    return;
  }

  filteredMeds.forEach(med => {
    const isLow = med.stock <= med.minStock && med.stock > 0;
    const isOut = med.stock === 0;
    
    const div = document.createElement('div');
    div.className = `product-item ${isOut ? 'no-stock' : isLow ? 'low-stock' : ''}`;
    
    div.innerHTML = `
      <span class="prod-category">${med.category}</span>
      <span class="prod-name">${med.name}</span>
      <div class="prod-details">
        <span>Molecule: ${med.molecule}</span>
        <span>Stock: <strong>${med.stock}</strong></span>
      </div>
      <span class="prod-price">${med.price.toFixed(2)} DH</span>
    `;

    if (!isOut) {
      div.onclick = () => addToCart(med);
    }
    
    container.appendChild(div);
  });
}

function setupPatientSelect() {
  const select = document.getElementById('pos-patient-select');
  select.innerHTML = '<option value="">Client Anonyme (Cash / Tiers-Payant Aucun)</option>';
  
  const patients = store.getPatients();
  patients.forEach(pat => {
    const opt = document.createElement('option');
    opt.value = pat.id;
    opt.textContent = `${pat.name} - ${pat.mutuelle || 'Sans mutuelle'} (Maladie: ${pat.chronicDisease})`;
    select.appendChild(opt);
  });
}

function addToCart(med) {
  const existing = cart.find(item => item.medicationId === med.id);
  
  if (existing) {
    if (existing.quantity >= med.stock) {
      alert(`Stock maximum de ${med.stock} atteint pour ${med.name}`);
      return;
    }
    existing.quantity++;
  } else {
    cart.push({
      medicationId: med.id,
      name: med.name,
      price: med.price,
      quantity: 1,
      maxStock: med.stock
    });
  }
  renderCart();
}

function updateCartQty(medId, delta) {
  const item = cart.find(i => i.medicationId === medId);
  if (!item) return;

  item.quantity += delta;
  
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.medicationId !== medId);
  } else if (item.quantity > item.maxStock) {
    alert(`Désolé, seulement ${item.maxStock} pièces de ce médicament sont disponibles.`);
    item.quantity = item.maxStock;
  }
  
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items-list');
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        Le panier est vide. Sélectionnez un produit à gauche.
      </div>
    `;
    document.getElementById('checkout-btn').disabled = true;
    document.getElementById('cart-subtotal').textContent = '0.00 DH';
    document.getElementById('cart-insurance').textContent = '0.00 DH';
    document.getElementById('cart-total').textContent = '0.00 DH';
    return;
  }

  document.getElementById('checkout-btn').disabled = false;

  let subtotal = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-details">${item.price.toFixed(2)} DH x ${item.quantity} = ${itemTotal.toFixed(2)} DH</div>
      </div>
      <div class="cart-item-actions">
        <div class="qty-control">
          <button class="qty-btn minus-btn" data-id="${item.medicationId}">-</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn plus-btn" data-id="${item.medicationId}">+</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  // Attach buttons events dynamically
  container.querySelectorAll('.minus-btn').forEach(btn => {
    btn.onclick = () => updateCartQty(btn.dataset.id, -1);
  });
  container.querySelectorAll('.plus-btn').forEach(btn => {
    btn.onclick = () => updateCartQty(btn.dataset.id, 1);
  });

  // Apply Insurance / Mutuelle Rates
  let mutuelleRate = 0;
  if (selectedPatientId) {
    const patient = store.getPatients().find(p => p.id === selectedPatientId);
    if (patient && patient.mutuelle) {
      const match = patient.mutuelle.match(/\((\d+)%\)/);
      if (match) {
        mutuelleRate = parseFloat(match[1]) / 100;
      }
    }
  }

  const insuranceDiscount = subtotal * mutuelleRate;
  const grandTotal = subtotal - insuranceDiscount;

  document.getElementById('cart-subtotal').textContent = `${subtotal.toFixed(2)} DH`;
  document.getElementById('cart-insurance').textContent = `-${insuranceDiscount.toFixed(2)} DH (${(mutuelleRate*100)}%)`;
  document.getElementById('cart-total').textContent = `${grandTotal.toFixed(2)} DH`;
}

function processCheckout() {
  if (cart.length === 0) return;

  let mutuelleRate = 0;
  let patientName = 'Client Anonyme';
  
  if (selectedPatientId) {
    const patient = store.getPatients().find(p => p.id === selectedPatientId);
    if (patient) {
      patientName = patient.name;
      const match = patient.mutuelle.match(/\((\d+)%\)/);
      if (match) {
        mutuelleRate = parseFloat(match[1]) / 100;
      }
    }
  }

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const paidByMutuelle = subtotal * mutuelleRate;
  const paidByPatient = subtotal - paidByMutuelle;

  // Save Sale & update inventories
  const sale = store.addSale({
    items: cart.map(i => ({ medicationId: i.medicationId, quantity: i.quantity, price: i.price })),
    total: subtotal,
    mutuelleRate: mutuelleRate,
    paidByPatient: paidByPatient,
    paidByMutuelle: paidByMutuelle,
    patientId: selectedPatientId
  });

  // Build and show virtual invoice popup
  const settings = store.getSettings();
  const currentDate = new Date(sale.date);
  
  const ticketContainer = document.getElementById('virtual-invoice-ticket');
  
  let ticketHTML = `
    <div class="invoice-header">
      <div class="invoice-title">${settings.pharmacyName}</div>
      <div>${settings.address}</div>
      <div>Tél: 0522-404040</div>
    </div>
    <div class="invoice-row">
      <span>Ticket N°: ${sale.id}</span>
      <span>Date: ${currentDate.toLocaleDateString('fr-FR')} ${currentDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
    </div>
    <div class="invoice-row">
      <span>Patient: ${patientName}</span>
    </div>
    <div class="invoice-divider"></div>
    <div class="invoice-items">
  `;

  cart.forEach(item => {
    ticketHTML += `
      <div class="item-row">
        <span>${item.name} (x${item.quantity})</span>
        <span>${(item.price * item.quantity).toFixed(2)} DH</span>
      </div>
    `;
  });

  ticketHTML += `
    </div>
    <div class="invoice-divider"></div>
    <div class="invoice-row" style="font-weight: bold;">
      <span>TOTAL BRUT:</span>
      <span>${subtotal.toFixed(2)} DH</span>
    </div>
  `;

  if (mutuelleRate > 0) {
    ticketHTML += `
      <div class="invoice-row" style="color: #475569;">
        <span>Prise en charge (${(mutuelleRate*100)}%):</span>
        <span>-${paidByMutuelle.toFixed(2)} DH</span>
      </div>
      <div class="invoice-row" style="font-weight: bold; font-size: 1rem; color: #10b981;">
        <span>NET À PAYER (PATIENT):</span>
        <span>${paidByPatient.toFixed(2)} DH</span>
      </div>
    `;
  } else {
    ticketHTML += `
      <div class="invoice-row" style="font-weight: bold; font-size: 1rem; color: #10b981;">
        <span>NET À PAYER:</span>
        <span>${subtotal.toFixed(2)} DH</span>
      </div>
    `;
  }

  ticketHTML += `
    <div class="invoice-footer">
      <p>TVA incluse (7%)</p>
      <p>Merci pour votre confiance !</p>
    </div>
  `;

  ticketContainer.innerHTML = ticketHTML;
  document.getElementById('invoice-modal').classList.add('active');
}
