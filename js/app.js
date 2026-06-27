import store from './store.js';
import { initDashboard, destroyDashboard } from './dashboard.js';
import { initPOS } from './pos.js';
import { initInventory } from './inventory.js';
import { initSuppliers } from './suppliers.js';
import { initPatients } from './patients.js';
import { initReports } from './reports.js';
import { initWebshop } from './webshop.js';

// Router mappings
const routes = {
  dashboard: { init: initDashboard, destroy: destroyDashboard },
  pos: { init: initPOS },
  inventory: { init: initInventory },
  suppliers: { init: initSuppliers },
  patients: { init: initPatients },
  reports: { init: initReports },
  webshop: { init: initWebshop }
};

let currentRoute = null;

function navigate(viewId) {
  if (!routes[viewId]) return;

  // Deactivate current view
  if (currentRoute && routes[currentRoute].destroy) {
    routes[currentRoute].destroy();
  }

  // Update DOM navigation items
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.view === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch active section
  document.querySelectorAll('.view-section').forEach(section => {
    if (section.id === `${viewId}-view`) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });

  // Update Page Title if element exists
  const titleMap = {
    dashboard: 'Tableau de Bord Exhaustif',
    pos: 'Point de Vente (Caisse Express)',
    inventory: 'Catalogue & Gestion des Stocks',
    suppliers: 'Gestion des Fournisseurs',
    patients: 'Fichiers Patients & Tiers-Payant',
    reports: 'Statistiques & Rapports Financiers',
    webshop: 'Générateur de Site Web & Commandes Clients'
  };
  const titleEl = document.getElementById('page-current-title');
  if (titleEl) titleEl.textContent = titleMap[viewId];

  // Initialize view controller
  currentRoute = viewId;
  routes[viewId].init();
}

// Global UI Setup
function setupGlobalUI() {
  const currentSettings = store.getSettings();
  
  // Theme Toggle
  const themeToggleBtn = document.getElementById('theme-toggle');
  document.documentElement.setAttribute('data-theme', currentSettings.theme);
  
  const updateThemeButtonText = (theme) => {
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? `<i data-lucide="sun"></i> Mode Clair`
      : `<i data-lucide="moon"></i> Mode Sombre`;
    lucide.createIcons();
  };

  updateThemeButtonText(currentSettings.theme);

  themeToggleBtn.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    store.updateTheme(nextTheme);
    updateThemeButtonText(nextTheme);
  });

  // Notifications Badge Update
  const updateNotificationBadge = () => {
    const alerts = store.getAlerts();
    const badge = document.getElementById('notification-badge');
    const count = alerts.filter(a => a.type === 'danger' || a.type === 'warning').length;
    
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  };

  updateNotificationBadge();
  window.addEventListener('pharmastore-update', updateNotificationBadge);

  // Set Pharmacy name in profile area
  document.getElementById('profile-pharmacy-name').textContent = currentSettings.pharmacyName;

  // Sidebar navigation click handlers
  document.querySelectorAll('.nav-item a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = link.parentElement.dataset.view;
      navigate(viewId);
    });
  });

  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('pharma_authenticated');
      localStorage.removeItem('pharma_authenticated');
      window.location.href = 'login.html';
    });
  }

  // --- AI ASSISTANT DRAWER PANEL LOGIC ---
  const aiTrigger = document.getElementById('ai-assistant-trigger');
  const aiDrawer = document.getElementById('ai-assistant-drawer');
  const aiClose = document.getElementById('ai-drawer-close');
  const aiInput = document.getElementById('ai-drawer-input');
  const aiSend = document.getElementById('ai-drawer-send');
  const aiBody = document.getElementById('ai-drawer-body');

  if (aiTrigger && aiDrawer && aiClose) {
    aiTrigger.onclick = () => {
      aiDrawer.style.right = aiDrawer.style.right === '0px' ? '-400px' : '0px';
      if (aiDrawer.style.right === '0px') {
        aiInput.focus();
      }
    };

    aiClose.onclick = () => {
      aiDrawer.style.right = '-400px';
    };

    const appendAiMsg = (sender, text) => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-msg ${sender}-msg`;
      msgDiv.style.padding = '10px 14px';
      msgDiv.style.borderRadius = '12px';
      msgDiv.style.fontSize = '0.85rem';
      msgDiv.style.lineHeight = '1.4';
      msgDiv.style.maxWidth = '85%';

      if (sender === 'bot') {
        msgDiv.style.background = 'var(--primary-glow)';
        msgDiv.style.color = 'var(--text-primary)';
        msgDiv.style.alignSelf = 'flex-start';
        msgDiv.style.border = '1px solid rgba(15,157,122,0.15)';
      } else {
        msgDiv.style.background = 'var(--bg-deep)';
        msgDiv.style.color = 'var(--text-primary)';
        msgDiv.style.alignSelf = 'flex-end';
        msgDiv.style.border = '1px solid var(--card-border)';
      }

      msgDiv.textContent = text;
      aiBody.appendChild(msgDiv);
      aiBody.scrollTop = aiBody.scrollHeight;
    };

    const handleAiMsgSubmit = () => {
      const text = aiInput.value.trim();
      if (!text) return;

      appendAiMsg('user', text);
      aiInput.value = '';

      setTimeout(() => {
        const lower = text.toLowerCase();
        let reply = "Je recherche dans la base clinique et les stocks... ";

        if (lower.includes('interaction') || lower.includes('incompatible') || lower.includes('danger')) {
          reply = "🔍 Risques Majeurs identifiés en base :\n1. Paracétamol + Paracétamol (Doliprane + Dafalgan) : Risque de toxicité hépatique sévère.\n2. AINS (Ibuprofène + Kétoprofène) : Risque hémorragique gastrique élevé.\n3. Anticoagulants + Aspirine : Augmentation critique du temps de saignement.";
        } else if (lower.includes('stock') || lower.includes('rupture') || lower.includes('commander')) {
          const meds = store.getMedications();
          const lowStock = meds.filter(m => m.stock <= m.minStock);
          reply = `📦 Analyse des stocks : ${lowStock.length} articles sont en seuil critique ou en rupture. Je vous conseille de lancer une commande de réapprovisionnement auprès de Cooper Maroc (le fournisseur principal).`;
        } else if (lower.includes('doliprane') || lower.includes('paracétamol')) {
          reply = "ℹ️ Fiche Produit - Doliprane 1000mg : Indiqué en cas de douleur et/ou fièvre. Adultes : 1 comprimé de 1g par prise, à renouveler au bout de 4h minimum. Dose max : 4g/jour.";
        } else {
          reply = "💡 Assistant Officine : N'hésitez pas à me demander l'analyse de stock critique, les molécules incompatibles ou les posologies de base de médicaments.";
        }

        appendAiMsg('bot', reply);
      }, 700);
    };

    aiSend.onclick = handleAiMsgSubmit;
    aiInput.onkeydown = (e) => {
      if (e.key === 'Enter') handleAiMsgSubmit();
    };
  }
}

// Boot up
document.addEventListener('DOMContentLoaded', async () => {
  setupGlobalUI();
  
  // Asynchronously load real Moroccan medicines database (5,917 items)
  await store.initDatabase();
  
  // Start on dashboard
  navigate('dashboard');
  
  // Render lucide icons
  lucide.createIcons();
});
