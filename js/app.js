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
