import store from './store.js';

let salesChart = null;
let categoryChart = null;

export function initDashboard() {
  renderKPIs();
  renderAlerts();
  renderCharts();
  
  // Set up event listeners for shortcuts
  document.getElementById('shortcut-sale').onclick = () => {
    document.querySelector('.nav-item[data-view="pos"] a').click();
  };
  document.getElementById('shortcut-add-med').onclick = () => {
    document.querySelector('.nav-item[data-view="inventory"] a').click();
    // Programmatically open add modal if function exists
    setTimeout(() => {
      const addBtn = document.getElementById('add-medication-btn');
      if (addBtn) addBtn.click();
    }, 100);
  };
}

export function destroyDashboard() {
  if (salesChart) {
    salesChart.destroy();
    salesChart = null;
  }
  if (categoryChart) {
    categoryChart.destroy();
    categoryChart = null;
  }
}

function renderKPIs() {
  const sales = store.getSales();
  const medications = store.getMedications();
  const alerts = store.getAlerts();
  const currentDate = store.getCurrentDate();
  
  // 1. Sales today (June 11, 2026)
  const todayStr = currentDate.toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(todayStr));
  const todayTotalRevenue = todaySales.reduce((acc, curr) => acc + curr.total, 0);
  
  document.getElementById('kpi-sales-today').textContent = `${todayTotalRevenue.toFixed(2)} DH`;
  
  // 2. Prescriptions / Sales count
  document.getElementById('kpi-prescriptions').textContent = todaySales.length;

  // 3. Low stock warning count
  const criticalCount = medications.filter(m => m.stock <= m.minStock).length;
  document.getElementById('kpi-low-stock').textContent = criticalCount;
  
  // 4. Total Active Alerts
  document.getElementById('kpi-alerts-active').textContent = alerts.length;
}

function renderAlerts() {
  const container = document.getElementById('dashboard-alerts-list');
  container.innerHTML = '';
  const alerts = store.getAlerts();

  if (alerts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-muted);">
        <i data-lucide="check-circle" style="width: 36px; height: 36px; color: var(--primary); margin-bottom: 8px;"></i>
        <p>Aucune alerte en cours. Le stock est optimal.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Show top 5 warnings
  alerts.slice(0, 5).forEach(alert => {
    const div = document.createElement('div');
    div.className = `alert-item ${alert.type === 'danger' ? 'danger-alert' : 'warning-alert'}`;
    
    div.innerHTML = `
      <i data-lucide="${alert.type === 'danger' ? 'alert-octagon' : 'alert-triangle'}" style="color: var(--${alert.type}); flex-shrink: 0; width: 18px; height: 18px;"></i>
      <div class="alert-item-content">
        <div class="alert-item-title">${alert.message}</div>
        <div class="alert-item-time">${alert.date === 'Immédiat' ? 'Action requise immédiate' : `Péremption: ${alert.date}`}</div>
      </div>
    `;
    container.appendChild(div);
  });
  lucide.createIcons();
}

function renderCharts() {
  const sales = store.getSales();
  const medications = store.getMedications();

  // 1. Weekly Sales Chart
  const ctxSales = document.getElementById('salesTrendChart').getContext('2d');
  
  // Calculate daily totals for the last 7 days ending June 11, 2026
  const dates = [];
  const dailyTotals = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(store.getCurrentDate());
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dates.push(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
    
    const daySales = sales.filter(s => s.date.startsWith(dateStr));
    const total = daySales.reduce((acc, curr) => acc + curr.total, 0);
    dailyTotals.push(total);
  }

  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const textColor = theme === 'dark' ? '#9ca3af' : '#64748B';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  salesChart = new Chart(ctxSales, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Ventes (DH)',
        data: dailyTotals,
        borderColor: '#0F9D7A',
        backgroundColor: 'rgba(15, 157, 122, 0.08)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0F9D7A',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter' } },
          beginAtZero: true
        }
      }
    }
  });

  // 2. Category Distribution Chart
  const ctxCategory = document.getElementById('categoryDistributionChart').getContext('2d');
  
  // Count medications by category
  const categories = {};
  medications.forEach(m => {
    categories[m.category] = (categories[m.category] || 0) + 1;
  });

  const catLabels = Object.keys(categories);
  const catData = Object.values(categories);

  categoryChart = new Chart(ctxCategory, {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catData,
        backgroundColor: [
          '#0F9D7A',
          '#1E88E5',
          '#1CC98A',
          '#F59E0B',
          '#EF4444',
          '#8b5cf6',
          '#ec4899'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: textColor,
            font: { family: 'Inter', size: 11 }
          }
        }
      },
      cutout: '70%'
    }
  });
}
