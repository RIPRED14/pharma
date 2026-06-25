import store from './store.js';

export function initPOS() {} // placeholder

export function initWebshop() {
  renderWebshopConfig();
  renderReservationsTable();
  setupEventListeners();
}

function setupEventListeners() {
  const form = document.getElementById('webshop-config-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    
    const config = {
      siteTitle: document.getElementById('webshop-title').value,
      bannerText: document.getElementById('webshop-banner').value,
      siteAccent: document.getElementById('webshop-accent').value,
      isOnline: document.getElementById('webshop-online').checked
    };

    store.updateWebshop(config);
    alert('Configuration de la vitrine en ligne mise à jour avec succès !');
    renderWebshopConfig();
  };

  // Open site client trigger
  document.getElementById('open-webshop-btn').onclick = () => {
    window.open('client_site.html', '_blank');
  };

  // Listen to store updates to keep reservation list real-time
  window.addEventListener('pharmastore-update', renderReservationsTable);
}

function renderWebshopConfig() {
  const webshop = store.getWebshop();
  
  document.getElementById('webshop-title').value = webshop.siteTitle;
  document.getElementById('webshop-banner').value = webshop.bannerText;
  document.getElementById('webshop-accent').value = webshop.siteAccent;
  document.getElementById('webshop-online').checked = webshop.isOnline;

  const previewLink = document.getElementById('webshop-preview-url');
  previewLink.textContent = `${window.location.origin}/client_site.html`;
}

function renderReservationsTable() {
  const tbody = document.getElementById('reservations-tbody');
  if (!tbody) return; // Prevent errors if not actively rendering this view
  tbody.innerHTML = '';

  const reservations = [...store.getReservations()].reverse(); // Newest first
  
  if (reservations.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
          Aucune réservation en ligne pour le moment.
        </td>
      </tr>
    `;
    return;
  }

  reservations.forEach(res => {
    const d = new Date(res.date);
    const dateStr = `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}`;
    
    let badgeColor = 'var(--warning)';
    let badgeText = 'En attente';
    
    if (res.status === 'completed') {
      badgeColor = 'var(--primary)';
      badgeText = 'Retiré / Livré';
    } else if (res.status === 'cancelled') {
      badgeColor = 'var(--danger)';
      badgeText = 'Annulé';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600;">${res.id}</td>
      <td>${dateStr}</td>
      <td><strong>${res.patientName}</strong><br/><small style="color:var(--text-muted);">${res.patientPhone}</small></td>
      <td style="font-weight: 700; color: var(--primary);">${res.total.toFixed(2)} DH</td>
      <td>
        <span style="font-size:0.75rem; background:rgba(255,255,255,0.03); padding:4px 8px; border-radius:4px; color:${badgeColor}; font-weight:bold; border:1px solid ${badgeColor}40;">
          ${badgeText}
        </span>
      </td>
      <td>
        ${res.status === 'pending' ? `
          <button class="btn btn-primary approve-res-btn" data-id="${res.id}" style="padding:6px 12px; font-size:0.8rem;"><i data-lucide="check"></i> Valider Retrait</button>
          <button class="btn btn-danger cancel-res-btn" data-id="${res.id}" style="padding:6px 12px; font-size:0.8rem;"><i data-lucide="x"></i> Annuler</button>
        ` : `<span style="color:var(--text-muted); font-size:0.8rem;">Opération terminée</span>`}
      </td>
    `;

    // Bind action events
    const approveBtn = tr.querySelector('.approve-res-btn');
    if (approveBtn) {
      approveBtn.onclick = () => {
        if (confirm('Confirmer le retrait de la réservation par le patient et l\'encaissement ?')) {
          store.updateReservationStatus(res.id, 'completed');
          renderReservationsTable();
        }
      };
    }

    const cancelBtn = tr.querySelector('.cancel-res-btn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        if (confirm('Voulez-vous vraiment annuler cette réservation ?')) {
          store.updateReservationStatus(res.id, 'cancelled');
          renderReservationsTable();
        }
      };
    }

    tbody.appendChild(tr);
  });

  lucide.createIcons();
}
