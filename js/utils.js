// Shared utility functions

// ===== CURRENCY =====
export function formatCurrency(amount) {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount);
}

// ===== DATE =====
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ===== ACCOUNT NUMBER GENERATOR =====
export function generateAccountNumber() {
  const prefix = 'IPPB';
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return `${prefix}${year}${random}`;
}

// ===== REFERENCE ID =====
export function generateRefId() {
  return `REF${Date.now().toString(36).toUpperCase()}`;
}

// ===== DEBOUNCE =====
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ===== COUNTER ANIMATION =====
export function animateCounter(el, target, duration = 1500, prefix = '', suffix = '') {
  const start = 0;
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.floor(eased * target);
    el.textContent = prefix + current.toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ===== CSV EXPORT =====
export function exportToCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== FORM AUTO-SAVE =====
export function autoSaveForm(formId, storageKey) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Restore saved data
  const saved = sessionStorage.getItem(storageKey);
  if (saved) {
    const data = JSON.parse(saved);
    Object.entries(data).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && el.type !== 'password') el.value = val;
    });
  }

  // Save on input
  form.addEventListener('input', debounce(() => {
    const data = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.id && el.type !== 'password') data[el.id] = el.value;
    });
    sessionStorage.setItem(storageKey, JSON.stringify(data));
  }, 500));
}

export function clearAutoSave(storageKey) {
  sessionStorage.removeItem(storageKey);
}

// ===== PRINT RECEIPT =====
export function printReceipt(content) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>IPPB Receipt</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #091d2e; }
      .header { text-align: center; border-bottom: 2px solid #002361; padding-bottom: 20px; margin-bottom: 20px; }
      .header h1 { color: #002361; font-size: 22px; margin: 0; }
      .header p { color: #444650; font-size: 13px; margin: 4px 0 0; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #edf4ff; }
      .label { color: #444650; font-size: 13px; }
      .value { font-weight: 700; font-size: 14px; }
      .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #444650; }
      @media print { body { padding: 20px; } }
    </style>
    </head><body>${content}<script>window.print();window.close();<\/script></body></html>
  `);
  win.document.close();
}
