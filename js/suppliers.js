import store from './store.js';

let editingSupplierId = null;

export function initSuppliers() {
  editingSupplierId = null;
  renderSuppliersTable();
  setupEventListeners();
  updateReplenishIndicator();
}

function setupEventListeners() {
  const addBtn = document.getElementById('add-supplier-btn');
  const modal = document.getElementById('supplier-modal');
  const closeBtn = document.getElementById('close-supplier-modal');
  const form = document.getElementById('supplier-form');

  addBtn.onclick = () => {
    editingSupplierId = null;
    document.getElementById('supplier-modal-title').textContent = 'Ajouter un Fournisseur';
    form.reset();
    document.getElementById('supplier-id').value = '';
    modal.classList.add('active');
  };

  closeBtn.onclick = () => {
    modal.classList.remove('active');
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    saveSupplierFromForm();
    modal.classList.remove('active');
  };

  // Search filter
  document.getElementById('supplier-search').oninput = (e) => {
    renderSuppliersTable(e.target.value);
  };

  // Replenish Order Trigger
  document.getElementById('generate-order-btn').onclick = () => {
    openReplenishModal();
  };

  document.getElementById('close-order-modal').onclick = () => {
    document.getElementById('order-modal').classList.remove('active');
  };
}

function renderSuppliersTable(search = '') {
  const tbody = document.getElementById('suppliers-tbody');
  tbody.innerHTML = '';

  let suppliers = store.getSuppliers();
  const query = search.toLowerCase();

  if (query) {
    suppliers = suppliers.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.contact.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
    );
  }

  if (suppliers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted);">
          Aucun fournisseur trouvé.
        </td>
      </tr>
    `;
    return;
  }

  suppliers.forEach(sup => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;">${sup.name}</td>
      <td>${sup.contact}</td>
      <td><a href="mailto:${sup.email}" style="color:var(--accent); text-decoration:none;">${sup.email}</a></td>
      <td>${sup.phone}</td>
      <td>
        <div class="action-buttons-cell">
          <button class="btn-icon-only edit-btn" data-id="${sup.id}"><i data-lucide="edit"></i></button>
          <button class="btn-icon-only delete-btn" data-id="${sup.id}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    `;

    tr.querySelector('.edit-btn').onclick = () => openEditModal(sup);
    tr.querySelector('.delete-btn').onclick = () => deleteSupplier(sup.id);

    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

function openEditModal(sup) {
  editingSupplierId = sup.id;
  document.getElementById('supplier-modal-title').textContent = 'Modifier le Fournisseur';
  
  document.getElementById('supplier-id').value = sup.id;
  document.getElementById('supplier-name').value = sup.name;
  document.getElementById('supplier-contact').value = sup.contact;
  document.getElementById('supplier-email').value = sup.email;
  document.getElementById('supplier-phone').value = sup.phone;

  document.getElementById('supplier-modal').classList.add('active');
}

function saveSupplierFromForm() {
  const sup = {
    id: document.getElementById('supplier-id').value || null,
    name: document.getElementById('supplier-name').value,
    contact: document.getElementById('supplier-contact').value,
    email: document.getElementById('supplier-email').value,
    phone: document.getElementById('supplier-phone').value
  };

  store.saveSupplier(sup);
  initSuppliers();
}

function deleteSupplier(id) {
  if (confirm('Voulez-vous vraiment retirer ce fournisseur ?')) {
    store.deleteSupplier(id);
    initSuppliers();
  }
}

function updateReplenishIndicator() {
  const meds = store.getMedications();
  const lowStockMeds = meds.filter(m => m.stock <= m.minStock);
  const count = lowStockMeds.length;
  
  const label = document.getElementById('low-stock-count-label');
  if (count > 0) {
    label.innerHTML = `<i data-lucide="alert-triangle" style="width:16px;height:16px;color:var(--warning);vertical-align:middle;"></i> <strong>${count}</strong> produit(s) en rupture ou sous le seuil d'alerte.`;
    document.getElementById('generate-order-btn').disabled = false;
  } else {
    label.innerHTML = `<i data-lucide="check-circle" style="width:16px;height:16px;color:var(--primary);vertical-align:middle;"></i> Tout le stock est à des niveaux optimaux.`;
    document.getElementById('generate-order-btn').disabled = true;
  }
  lucide.createIcons();
}

function openReplenishModal() {
  const select = document.getElementById('order-supplier-select');
  select.innerHTML = '';
  
  const suppliers = store.getSuppliers();
  suppliers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });

  const generateTicket = () => {
    const supplierId = select.value;
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const meds = store.getMedications();
    const lowStockMeds = meds.filter(m => m.stock <= m.minStock);

    const ticketContainer = document.getElementById('order-ticket-container');
    const settings = store.getSettings();
    const orderDate = new Date();

    let html = `
      <div class="virtual-invoice">
        <div class="invoice-header">
          <div class="invoice-title">BON DE COMMANDE FOURNISSEUR</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Émetteur : ${settings.pharmacyName}</div>
        </div>
        <div class="invoice-row">
          <span>Date : ${orderDate.toLocaleDateString('fr-FR')}</span>
          <span>Fournisseur : <strong>${supplier.name}</strong></span>
        </div>
        <div class="invoice-row">
          <span>Email : ${supplier.email}</span>
          <span>Tél : ${supplier.phone}</span>
        </div>
        <div class="invoice-divider"></div>
        <div class="invoice-items">
          <div class="item-row" style="font-weight:bold; border-bottom:1px solid #475569; padding-bottom:4px; margin-bottom:6px;">
            <span>Désignation</span>
            <span>Qte Suggérée</span>
          </div>
    `;

    lowStockMeds.forEach(m => {
      // Order amount to restore to double the minStock
      const suggestQty = (m.minStock * 2) - m.stock;
      html += `
        <div class="item-row" style="margin-bottom:6px;">
          <span>${m.name}<br/><small style="color:#64748b;">Molécule: ${m.molecule}</small></span>
          <span style="font-weight:bold;">${suggestQty} unités</span>
        </div>
      `;
    });

    html += `
        </div>
        <div class="invoice-divider"></div>
        <div class="invoice-footer" style="text-align:left; font-size:0.75rem;">
          <p>Note : Ce bon de commande est généré de manière algorithmique sur la base des seuils de réapprovisionnement. Veuillez signer et envoyer à ${supplier.email}.</p>
        </div>
      </div>
    `;

    ticketContainer.innerHTML = html;
  };

  select.onchange = generateTicket;
  generateTicket(); // Run initial render

  document.getElementById('order-modal').classList.add('active');
}
