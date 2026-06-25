import store from './store.js';

let financeChart = null;
let paymentChart = null;

export function initReports() {
  destroyReports();
  
  renderReportKPIs();
  renderSalesHistoryTable();
  renderReportCharts();
}

export function destroyReports() {
  if (financeChart) {
    financeChart.destroy();
    financeChart = null;
  }
  if (paymentChart) {
    paymentChart.destroy();
    paymentChart = null;
  }
}

function getSaleProfit(sale, medications) {
  let profit = 0;
  sale.items.forEach(item => {
    const med = medications.find(m => m.id === item.medicationId);
    const purchase = med && med.purchasePrice ? med.purchasePrice : (item.price * 0.66);
    profit += (item.price - purchase) * item.quantity;
  });
  return profit;
}

function renderReportKPIs() {
  const sales = store.getSales();
  const medications = store.getMedications();
  
  // Total Revenue
  const totalRev = sales.reduce((acc, curr) => acc + curr.total, 0);
  document.getElementById('rep-kpi-total-sales').textContent = `${totalRev.toFixed(2)} DH`;

  // Real profit calculation
  const totalProfit = sales.reduce((acc, curr) => acc + getSaleProfit(curr, medications), 0);
  document.getElementById('rep-kpi-profit').textContent = `${totalProfit.toFixed(2)} DH`;

  // Taxes (7% of total sales)
  const totalTax = totalRev * 0.07;
  document.getElementById('rep-kpi-taxes').textContent = `${totalTax.toFixed(2)} DH`;

  // Average ticket
  const avgTicket = sales.length > 0 ? (totalRev / sales.length) : 0;
  document.getElementById('rep-kpi-average').textContent = `${avgTicket.toFixed(2)} DH`;
}

function renderSalesHistoryTable() {
  const tbody = document.getElementById('reports-sales-tbody');
  tbody.innerHTML = '';
  
  const sales = [...store.getSales()].reverse(); // Show newest first
  const patients = store.getPatients();

  if (sales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">
          Aucune transaction disponible.
        </td>
      </tr>
    `;
    return;
  }

  sales.forEach(sale => {
    const d = new Date(sale.date);
    const dateStr = `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}`;
    
    let patientName = 'Passant (Anonyme)';
    if (sale.patientId) {
      const p = patients.find(pat => pat.id === sale.patientId);
      if (p) patientName = p.name;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;">${sale.id}</td>
      <td>${dateStr}</td>
      <td>${patientName}</td>
      <td style="font-weight:700; color:var(--primary);">${sale.total.toFixed(2)} DH</td>
      <td>${sale.paidByPatient.toFixed(2)} DH</td>
      <td style="color:var(--accent); font-weight:500;">${sale.paidByMutuelle.toFixed(2)} DH</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderReportCharts() {
  const sales = store.getSales();
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const textColor = theme === 'dark' ? '#9ca3af' : '#64748B';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  // 1. Finance comparison chart (Revenues vs Profit)
  const ctxFinance = document.getElementById('financeComparisonChart').getContext('2d');
  
  const days = [];
  const revenues = [];
  const profits = [];

  const medications = store.getMedications();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(store.getCurrentDate());
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
    
    const daySales = sales.filter(s => s.date.startsWith(dateStr));
    const dayRev = daySales.reduce((acc, curr) => acc + curr.total, 0);
    const dayProf = daySales.reduce((acc, curr) => acc + getSaleProfit(curr, medications), 0);
    
    revenues.push(dayRev);
    profits.push(dayProf);
  }

  financeChart = new Chart(ctxFinance, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Chiffre d\'Affaires (DH)',
          data: revenues,
          backgroundColor: '#1E88E5',
          borderRadius: 4
        },
        {
          label: 'Marge Bénéficiaire (DH)',
          data: profits,
          backgroundColor: '#0F9D7A',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
      },
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: 'Inter' } }
        }
      }
    }
  });

  // 2. Tiers-payant split distribution
  const ctxPayment = document.getElementById('paymentShareChart').getContext('2d');
  
  const totalPatientPay = sales.reduce((acc, curr) => acc + curr.paidByPatient, 0);
  const totalMutuellePay = sales.reduce((acc, curr) => acc + curr.paidByMutuelle, 0);

  paymentChart = new Chart(ctxPayment, {
    type: 'pie',
    data: {
      labels: ['Part Patients (Direct)', 'Tiers-Payant (Mutuelles)'],
      datasets: [{
        data: [totalPatientPay, totalMutuellePay],
        backgroundColor: ['#1CC98A', '#1E88E5'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            font: { family: 'Inter', size: 12 }
          }
        }
      }
    }
  });
}
