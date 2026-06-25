import store from './store.js';

let editingMedicationId = null;

export function initInventory() {
  editingMedicationId = null;
  renderInventoryTable();
  setupFilters();
  setupEventListeners();
}

function setupEventListeners() {
  const addBtn = document.getElementById('add-medication-btn');
  const modal = document.getElementById('medication-modal');
  const closeBtn = document.getElementById('close-med-modal');
  const form = document.getElementById('medication-form');

  addBtn.onclick = () => {
    editingMedicationId = null;
    document.getElementById('med-modal-title').textContent = 'Ajouter un Médicament';
    form.reset();
    document.getElementById('med-id').value = '';
    modal.classList.add('active');
  };

  closeBtn.onclick = () => {
    modal.classList.remove('active');
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    saveMedicationFromForm();
    modal.classList.remove('active');
  };
}

function setupFilters() {
  const searchInput = document.getElementById('inventory-search');
  const catSelect = document.getElementById('inventory-filter-category');
  const stockSelect = document.getElementById('inventory-filter-stock');

  // Populate categories list in filter
  const meds = store.getMedications();
  const cats = [...new Set(meds.map(m => m.category))];
  
  catSelect.innerHTML = '<option value="">Toutes les catégories</option>';
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });

  const triggerFilter = () => {
    renderInventoryTable(searchInput.value, catSelect.value, stockSelect.value);
  };

  searchInput.oninput = triggerFilter;
  catSelect.onchange = triggerFilter;
  stockSelect.onchange = triggerFilter;
}

function renderInventoryTable(search = '', category = '', stockFilter = '') {
  const tbody = document.getElementById('inventory-tbody');
  tbody.innerHTML = '';
  
  let meds = store.getMedications();
  const query = search.toLowerCase();

  // Apply Search
  if (query) {
    meds = meds.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.molecule.toLowerCase().includes(query) ||
      m.code.includes(query) ||
      m.batch.toLowerCase().includes(query)
    );
  }

  // Apply Category Filter
  if (category) {
    meds = meds.filter(m => m.category === category);
  }

  // Apply Stock Filter
  if (stockFilter) {
    if (stockFilter === 'low') {
      meds = meds.filter(m => m.stock > 0 && m.stock <= m.minStock);
    } else if (stockFilter === 'out') {
      meds = meds.filter(m => m.stock === 0);
    } else if (stockFilter === 'normal') {
      meds = meds.filter(m => m.stock > m.minStock);
    }
  }

  if (meds.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted);">
          Aucun produit ne correspond aux critères de recherche.
        </td>
      </tr>
    `;
    return;
  }

  meds.forEach(med => {
    const tr = document.createElement('tr');
    
    // Calculate stock status
    let stockBadge = '<span class="status-badge in-stock"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block;"></span> En Stock</span>';
    if (med.stock === 0) {
      stockBadge = '<span class="status-badge out-of-stock"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Rupture</span>';
    } else if (med.stock <= med.minStock) {
      stockBadge = '<span class="status-badge low-stock"><span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block;"></span> Critique</span>';
    }

    // Check expiry
    const currentDate = store.getCurrentDate();
    const expDate = new Date(med.expiry);
    const isExpired = expDate <= currentDate;
    const isSoonExpired = !isExpired && (expDate - currentDate) / (1000 * 60 * 60 * 24) <= 45;

    let expiryStyle = '';
    if (isExpired) {
      expiryStyle = 'color: var(--danger); font-weight: bold;';
    } else if (isSoonExpired) {
      expiryStyle = 'color: var(--warning); font-weight: 600;';
    }

    const purchasePrice = med.purchasePrice ? med.purchasePrice.toFixed(2) : (med.price * 0.66).toFixed(2);
    tr.innerHTML = `
      <td style="font-weight: 600;">${med.name}</td>
      <td style="color: var(--text-secondary); font-size: 0.85rem;">${med.molecule}</td>
      <td><span style="font-size:0.8rem; background: var(--bg-input); padding: 4px 8px; border-radius: 4px; border:1px solid var(--border-color);">${med.category}</span></td>
      <td><strong>${med.stock}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">/ ${med.minStock}</span></td>
      <td style="font-weight: 500; color: var(--text-secondary);">${purchasePrice} DH</td>
      <td style="font-weight: 700; color: var(--primary);">${med.price.toFixed(2)} DH</td>
      <td style="${expiryStyle}">${med.expiry}</td>
      <td>${stockBadge}</td>
      <td>
        <div class="action-buttons-cell">
          <button class="btn-icon-only edit-btn" data-id="${med.id}"><i data-lucide="edit"></i></button>
          <button class="btn-icon-only delete-btn" data-id="${med.id}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    `;
    
    // Attach buttons events dynamically
    tr.querySelector('.edit-btn').onclick = () => openEditModal(med);
    tr.querySelector('.delete-btn').onclick = () => deleteMedication(med.id);
    
    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

function openEditModal(med) {
  editingMedicationId = med.id;
  document.getElementById('med-modal-title').textContent = 'Modifier le Médicament';
  
  document.getElementById('med-id').value = med.id;
  document.getElementById('med-name').value = med.name;
  document.getElementById('med-molecule').value = med.molecule;
  document.getElementById('med-category').value = med.category;
  document.getElementById('med-stock').value = med.stock;
  document.getElementById('med-min-stock').value = med.minStock;
  document.getElementById('med-price').value = med.price;
  
  const purchasePrice = med.purchasePrice ? med.purchasePrice : (med.price * 0.66).toFixed(2);
  document.getElementById('med-purchase-price').value = purchasePrice;
  
  document.getElementById('med-expiry').value = med.expiry;
  document.getElementById('med-batch').value = med.batch;
  document.getElementById('med-code').value = med.code;

  document.getElementById('medication-modal').classList.add('active');
}

function saveMedicationFromForm() {
  const med = {
    id: document.getElementById('med-id').value || null,
    name: document.getElementById('med-name').value,
    molecule: document.getElementById('med-molecule').value,
    category: document.getElementById('med-category').value,
    stock: parseInt(document.getElementById('med-stock').value, 10),
    minStock: parseInt(document.getElementById('med-min-stock').value, 10),
    price: parseFloat(document.getElementById('med-price').value),
    purchasePrice: parseFloat(document.getElementById('med-purchase-price').value),
    expiry: document.getElementById('med-expiry').value,
    batch: document.getElementById('med-batch').value,
    code: document.getElementById('med-code').value
  };

  store.saveMedication(med);
  initInventory(); // Re-render table and trigger lists update
}

function deleteMedication(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce médicament du catalogue ?')) {
    store.deleteMedication(id);
    initInventory();
  }
}
