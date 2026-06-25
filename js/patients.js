import store from './store.js';

let editingPatientId = null;

export function initPatients() {
  editingPatientId = null;
  renderPatientsTable();
  setupEventListeners();
}

function setupEventListeners() {
  const addBtn = document.getElementById('add-patient-btn');
  const modal = document.getElementById('patient-modal');
  const closeBtn = document.getElementById('close-patient-modal');
  const form = document.getElementById('patient-form');

  addBtn.onclick = () => {
    editingPatientId = null;
    document.getElementById('patient-modal-title').textContent = 'Ajouter un Patient';
    form.reset();
    document.getElementById('patient-id').value = '';
    modal.classList.add('active');
  };

  closeBtn.onclick = () => {
    modal.classList.remove('active');
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    savePatientFromForm();
    modal.classList.remove('active');
  };

  // Search filter
  document.getElementById('patient-search').oninput = (e) => {
    renderPatientsTable(e.target.value);
  };
}

function renderPatientsTable(search = '') {
  const tbody = document.getElementById('patients-tbody');
  tbody.innerHTML = '';

  let patients = store.getPatients();
  const sales = store.getSales();
  const meds = store.getMedications();
  const query = search.toLowerCase();

  if (query) {
    patients = patients.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.chronicDisease.toLowerCase().includes(query) ||
      p.mutuelle.toLowerCase().includes(query)
    );
  }

  if (patients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">
          Aucun patient trouvé.
        </td>
      </tr>
    `;
    return;
  }

  patients.forEach(pat => {
    // Calculate prescription counts / purchases from sales history
    const patSales = sales.filter(s => s.patientId === pat.id);
    const purchasesCount = patSales.length;
    
    // Calculate total spent
    const totalSpent = patSales.reduce((acc, curr) => acc + curr.paidByPatient, 0);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;">${pat.name}</td>
      <td>${pat.phone}</td>
      <td>
        <span style="font-size:0.8rem; background:${pat.chronicDisease !== 'Aucune' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)'}; 
                     color:${pat.chronicDisease !== 'Aucune' ? 'var(--danger)' : 'var(--text-secondary)'}; 
                     padding:4px 8px; border-radius:4px;">
          ${pat.chronicDisease}
        </span>
      </td>
      <td><span style="font-weight:600; color:var(--accent);">${pat.mutuelle}</span></td>
      <td><strong>${purchasesCount}</strong> achats (${totalSpent.toFixed(2)} DH patient)</td>
      <td>
        <div class="action-buttons-cell">
          <button class="btn-icon-only edit-btn" data-id="${pat.id}"><i data-lucide="edit"></i></button>
          <button class="btn-icon-only delete-btn" data-id="${pat.id}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    `;

    tr.querySelector('.edit-btn').onclick = () => openEditModal(pat);
    tr.querySelector('.delete-btn').onclick = () => deletePatient(pat.id);

    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

function openEditModal(pat) {
  editingPatientId = pat.id;
  document.getElementById('patient-modal-title').textContent = 'Modifier le Patient';
  
  document.getElementById('patient-id').value = pat.id;
  document.getElementById('patient-name').value = pat.name;
  document.getElementById('patient-phone').value = pat.phone;
  document.getElementById('patient-email').value = pat.email;
  document.getElementById('patient-disease').value = pat.chronicDisease;
  document.getElementById('patient-mutuelle').value = pat.mutuelle;

  document.getElementById('patient-modal').classList.add('active');
}

function savePatientFromForm() {
  const pat = {
    id: document.getElementById('patient-id').value || null,
    name: document.getElementById('patient-name').value,
    phone: document.getElementById('patient-phone').value,
    email: document.getElementById('patient-email').value,
    chronicDisease: document.getElementById('patient-disease').value,
    mutuelle: document.getElementById('patient-mutuelle').value
  };

  store.savePatient(pat);
  initPatients();
}

function deletePatient(id) {
  if (confirm('Voulez-vous vraiment supprimer ce dossier patient ?')) {
    store.deletePatient(id);
    initPatients();
  }
}
