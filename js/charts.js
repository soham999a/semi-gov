// Chart.js integration for dashboard analytics
// Uses Chart.js from CDN — no install needed

let spendingChart = null;
let balanceChart = null;
let adminChart = null;

export function initSpendingChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (spendingChart) spendingChart.destroy();

  spendingChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: ['#1B3A7D','#16A085','#2ECC71','#F39C12','#E67E22','#8E44AD'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            font: { family: 'Manrope', size: 12, weight: '600' },
            color: '#444650',
            usePointStyle: true,
            pointStyleWidth: 8
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ₹${ctx.parsed.toLocaleString('en-IN')}`
          }
        }
      }
    }
  });
}

export function initBalanceTrendChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (balanceChart) balanceChart.destroy();

  balanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Balance',
        data: data.values,
        borderColor: '#1B3A7D',
        backgroundColor: 'rgba(27,58,125,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#1B3A7D',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Manrope', size: 11 }, color: '#444650' }
        },
        y: {
          grid: { color: 'rgba(196,198,210,0.3)', drawBorder: false },
          ticks: {
            font: { family: 'Manrope', size: 11 }, color: '#444650',
            callback: (v) => '₹' + (v / 1000).toFixed(0) + 'k'
          }
        }
      }
    }
  });
}

export function initAdminBarChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (adminChart) adminChart.destroy();

  adminChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Approved',
          data: data.approved,
          backgroundColor: 'rgba(46,204,113,0.85)',
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: 'Pending',
          data: data.pending,
          backgroundColor: 'rgba(230,126,34,0.85)',
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: 'Rejected',
          data: data.rejected,
          backgroundColor: 'rgba(231,76,60,0.85)',
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Manrope', size: 12, weight: '600' }, color: '#444650', usePointStyle: true }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Manrope', size: 11 }, color: '#444650' } },
        y: { grid: { color: 'rgba(196,198,210,0.3)' }, ticks: { font: { family: 'Manrope', size: 11 }, color: '#444650' } }
      }
    }
  });
}

export function initUserGrowthChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'New Users',
        data: data.values,
        borderColor: '#16A085',
        backgroundColor: 'rgba(22,160,133,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#16A085',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Manrope', size: 11 }, color: '#444650' } },
        y: { grid: { color: 'rgba(196,198,210,0.3)' }, ticks: { font: { family: 'Manrope', size: 11 }, color: '#444650' } }
      }
    }
  });
}

// Generate mock trend data for last 6 months
export function generateTrendData(baseValue = 10000) {
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  const values = months.map((_, i) => Math.floor(baseValue * (0.7 + i * 0.08 + Math.random() * 0.1)));
  return { labels: months, values };
}

export function generateSpendingData(transactions = []) {
  const categories = { 'Deposit': 0, 'Withdrawal': 0, 'Transfer': 0, 'Insurance': 0, 'Investment': 0, 'Other': 0 };
  transactions.forEach(t => {
    const type = t.type || 'Other';
    if (type === 'deposit') categories['Deposit'] += t.amount || 0;
    else if (type === 'withdrawal') categories['Withdrawal'] += t.amount || 0;
    else if (type === 'transfer') categories['Transfer'] += t.amount || 0;
    else categories['Other'] += t.amount || 0;
  });
  const filtered = Object.entries(categories).filter(([, v]) => v > 0);
  return {
    labels: filtered.map(([k]) => k),
    values: filtered.map(([, v]) => v)
  };
}
