import { auth, db } from './firebase-config.js';
import { showToast, formatCurrency, formatDate, setButtonLoading } from './ui.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection, query, where, orderBy, limit, getDocs,
  doc, getDoc, addDoc, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let currentSection = 'overview';

// ===== AUTH GUARD =====
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;
  await loadUserProfile(user.uid);
  loadSection('overview');
});

// ===== LOAD USER PROFILE =====
async function loadUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) { window.location.href = 'register.html'; return; }
    const data = snap.data();

    const firstName = data.fullName?.split(' ')[0] || 'User';
    const initial = data.fullName?.[0]?.toUpperCase() || 'U';

    document.getElementById('welcome-name').textContent = firstName;
    document.getElementById('sidebar-name').textContent = data.fullName || 'User';
    document.getElementById('sidebar-phone').textContent = data.phoneNumber || '';
    document.getElementById('sidebar-avatar').textContent = initial;
    document.getElementById('nav-user-name').textContent = firstName;
    document.getElementById('last-login').textContent = `Last login: ${formatDate(data.lastLogin)}`;

    window._userData = data;
  } catch (err) {
    console.error('Profile load error:', err);
  }
}

// ===== SECTION NAVIGATION =====
document.querySelectorAll('[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    loadSection(section);
    document.querySelectorAll('[data-section]').forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`[data-section="${section}"]`).forEach(l => l.classList.add('active'));
    document.getElementById('dashboard-sidebar')?.classList.remove('open');
  });
});

function loadSection(section) {
  document.querySelectorAll('.dashboard-section-wrapper').forEach(s => s.style.display = 'none');
  const el = document.getElementById(`section-${section}`);
  if (el) el.style.display = 'block';
  currentSection = section;

  switch (section) {
    case 'overview': loadOverview(); break;
    case 'accounts': loadAccounts(); break;
    case 'transactions': loadTransactions(); break;
    case 'requests': loadRequests(); break;
    case 'schemes': loadSchemes(); break;
    case 'profile': loadProfile(); break;
  }
}

// ===== OVERVIEW =====
async function loadOverview() {
  if (!currentUser) return;
  await Promise.all([loadAccountSummary(), loadRecentTransactions(), loadActiveSchemes()]);
}

// ===== ACCOUNTS =====
async function loadAccountSummary() {
  const grid = document.getElementById('accounts-grid');
  if (!grid) return;

  try {
    const q = query(collection(db, 'accounts'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = '<p class="text-secondary">No accounts found. <a href="contact.html" style="color:var(--primary-blue);">Contact us</a> to set up your account.</p>';
      return;
    }

    let totalBalance = 0;
    grid.innerHTML = '';
    snap.forEach(d => {
      const acc = d.data();
      totalBalance += acc.balance || 0;
      grid.innerHTML += `
        <div class="account-card">
          <div class="account-card-header">
            <span class="account-type-badge">${acc.accountType?.toUpperCase() || 'SAVINGS'}</span>
            <span class="account-status-dot" title="Active"></span>
          </div>
          <div class="account-number">${acc.accountNumber}</div>
          <div class="account-balance">${formatCurrency(acc.balance || 0)}</div>
          <div class="account-actions">
            <button class="btn btn-secondary btn-sm" onclick="requestService('deposit')">Deposit</button>
            <button class="btn btn-secondary btn-sm" onclick="requestService('cash_withdrawal')">Withdraw</button>
          </div>
        </div>`;
    });

    const statBalance = document.getElementById('stat-balance');
    if (statBalance) statBalance.textContent = formatCurrency(totalBalance);
  } catch (err) {
    console.error('Accounts error:', err);
    grid.innerHTML = '<p class="text-secondary">Failed to load accounts.</p>';
  }
}

async function loadAccounts() {
  const grid = document.getElementById('all-accounts-grid');
  if (!grid) return;
  grid.innerHTML = '<p class="text-secondary">Loading...</p>';
  await loadAccountSummary();
  const overviewGrid = document.getElementById('accounts-grid');
  if (overviewGrid && grid) grid.innerHTML = overviewGrid.innerHTML;
}

// ===== TRANSACTIONS =====
async function loadRecentTransactions() {
  const container = document.getElementById('recent-transactions');
  if (!container) return;

  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = '<p class="text-secondary" style="text-align:center;padding:var(--spacing-xl);">No transactions yet.</p>';
      return;
    }

    container.innerHTML = '';
    snap.forEach(d => {
      const txn = d.data();
      const isCredit = txn.type === 'deposit' || txn.type === 'credit';
      container.innerHTML += `
        <div class="transaction-row">
          <div class="transaction-icon ${isCredit ? 'credit' : 'debit'}">${isCredit ? '' : ''}</div>
          <div class="transaction-details">
            <div class="transaction-desc">${txn.description || txn.type}</div>
            <div class="transaction-date">${formatDate(txn.timestamp)}</div>
          </div>
          <div>
            <div class="transaction-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '-'}${formatCurrency(txn.amount)}</div>
            <span class="badge badge-${txn.status === 'success' ? 'success' : txn.status === 'pending' ? 'pending' : 'error'}">${txn.status}</span>
          </div>
        </div>`;
    });
  } catch (err) {
    console.error('Transactions error:', err);
    container.innerHTML = '<p class="text-secondary">Failed to load transactions.</p>';
  }
}

async function loadTransactions() {
  const container = document.getElementById('all-transactions');
  if (!container) return;
  container.innerHTML = '<p class="text-secondary" style="text-align:center;padding:var(--spacing-xl);">Loading...</p>';

  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = '<p class="text-secondary" style="text-align:center;padding:var(--spacing-xl);">No transactions found.</p>';
      return;
    }

    container.innerHTML = '';
    snap.forEach(d => {
      const txn = d.data();
      const isCredit = txn.type === 'deposit' || txn.type === 'credit';
      container.innerHTML += `
        <div class="transaction-row">
          <div class="transaction-icon ${isCredit ? 'credit' : 'debit'}">${isCredit ? '' : ''}</div>
          <div class="transaction-details">
            <div class="transaction-desc">${txn.description || txn.type}</div>
            <div class="transaction-date">${formatDate(txn.timestamp)}</div>
          </div>
          <div>
            <div class="transaction-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '-'}${formatCurrency(txn.amount)}</div>
            <span class="badge badge-${txn.status === 'success' ? 'success' : 'pending'}">${txn.status}</span>
          </div>
        </div>`;
    });
  } catch (err) {
    container.innerHTML = '<p class="text-secondary">Failed to load transactions.</p>';
  }
}

// ===== SCHEMES =====
async function loadActiveSchemes() {
  const grid = document.getElementById('schemes-grid');
  if (!grid) return;

  try {
    const q = query(collection(db, 'schemes'), where('isActive', '==', true), limit(4));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = '<p class="text-secondary">No active schemes. <a href="services.html#schemes" style="color:var(--primary-blue);">Explore schemes </a></p>';
      return;
    }

    grid.innerHTML = '';
    snap.forEach(d => {
      const s = d.data();
      grid.innerHTML += `
        <div class="scheme-card">
          <div class="scheme-card-header">
            <span class="scheme-name">${s.name}</span>
            <span class="badge badge-success">ACTIVE</span>
          </div>
          <p class="text-secondary" style="font-size:13px;margin-top:var(--spacing-sm);">${s.description || ''}</p>
          <a href="services.html#schemes" class="btn btn-secondary btn-sm" style="margin-top:var(--spacing-sm);">View Details</a>
        </div>`;
    });
  } catch (err) {
    grid.innerHTML = '<p class="text-secondary">Failed to load schemes.</p>';
  }
}

async function loadSchemes() {
  const container = document.getElementById('schemes-list');
  if (!container) return;
  await loadActiveSchemes();
  const grid = document.getElementById('schemes-grid');
  if (grid && container) container.innerHTML = grid.innerHTML;
}

// ===== REQUESTS =====
async function loadRequests() {
  const tbody = document.getElementById('requests-tbody');
  if (!tbody) return;

  try {
    const q = query(
      collection(db, 'serviceRequests'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No requests yet</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    snap.forEach(d => {
      const r = d.data();
      tbody.innerHTML += `
        <tr>
          <td class="text-mono">#${d.id.substring(0, 8).toUpperCase()}</td>
          <td>${r.type?.replace(/_/g, ' ').toUpperCase()}</td>
          <td>${formatDate(r.createdAt)}</td>
          <td><span class="badge badge-${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'pending'}">${r.status}</span></td>
        </tr>`;
    });

    const pendingCount = snap.docs.filter(d => d.data().status === 'pending').length;
    const statPending = document.getElementById('stat-pending');
    if (statPending) statPending.textContent = pendingCount;
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">Failed to load requests</td></tr>';
  }
}

// ===== PROFILE =====
async function loadProfile() {
  const container = document.getElementById('profile-details');
  if (!container || !currentUser) return;

  try {
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (!snap.exists()) return;
    const d = snap.data();

    container.innerHTML = `
      <div style="display:grid;gap:var(--spacing-md);">
        ${profileRow('Full Name', d.fullName)}
        ${profileRow('Mobile', d.phoneNumber)}
        ${profileRow('Email', d.email || 'Not provided')}
        ${profileRow('Date of Birth', d.dateOfBirth)}
        ${profileRow('Gender', d.gender)}
        ${profileRow('Address', d.address)}
        ${profileRow('City', d.city)}
        ${profileRow('State', d.state)}
        ${profileRow('Pincode', d.pincode)}
        ${profileRow('KYC Status', `<span class="badge badge-${d.kycStatus === 'approved' ? 'success' : 'pending'}">${d.kycStatus?.toUpperCase()}</span>`)}
        ${profileRow('Member Since', formatDate(d.createdAt))}
      </div>`;
  } catch (err) {
    container.innerHTML = '<p class="text-secondary">Failed to load profile.</p>';
  }
}

function profileRow(label, value) {
  return `<div style="display:flex;justify-content:space-between;padding:var(--spacing-md);background:var(--bg-light);border-radius:var(--radius-md);">
    <span style="font-weight:600;color:var(--text-secondary);font-size:14px;">${label}</span>
    <span style="color:var(--text-dark);">${value || 'N/A'}</span>
  </div>`;
}

// ===== SERVICE REQUEST FORM =====
document.addEventListener('DOMContentLoaded', () => {
  const reqForm = document.getElementById('service-request-form');
  if (reqForm) {
    reqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) return;

      const type = document.getElementById('req-type').value;
      const desc = document.getElementById('req-desc').value.trim();
      if (!type) { showToast('Please select a service type', 'warning'); return; }
      if (!desc) { showToast('Please describe your request', 'warning'); return; }

      const btn = reqForm.querySelector('button[type="submit"]');
      setButtonLoading(btn, true, 'Submitting...');
      try {
        const ref = await addDoc(collection(db, 'serviceRequests'), {
          userId: currentUser.uid,
          type,
          description: desc,
          amount: parseFloat(document.getElementById('req-amount').value) || 0,
          contactMethod: document.querySelector('input[name="contactMethod"]:checked')?.value || 'phone',
          status: 'pending',
          createdAt: serverTimestamp()
        });
        showToast(`Request submitted! Reference: #${ref.id.substring(0, 8).toUpperCase()}`, 'success');
        reqForm.reset();
        loadRequests();
      } catch (err) {
        showToast('Failed to submit request. Please try again.', 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // Support ticket form
  const supportForm = document.getElementById('support-form');
  if (supportForm) {
    supportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) return;
      const subject = document.getElementById('ticket-subject').value.trim();
      const desc = document.getElementById('ticket-desc').value.trim();
      if (!subject || !desc) { showToast('Please fill all required fields', 'warning'); return; }

      const btn = supportForm.querySelector('button[type="submit"]');
      setButtonLoading(btn, true, 'Submitting...');
      try {
        await addDoc(collection(db, 'supportTickets'), {
          userId: currentUser.uid,
          subject,
          description: desc,
          category: document.getElementById('ticket-category').value,
          status: 'open',
          createdAt: serverTimestamp()
        });
        showToast('Support ticket raised successfully!', 'success');
        supportForm.reset();
      } catch (err) {
        showToast('Failed to submit ticket.', 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }
});

// Global helper for inline onclick
window.requestService = (type) => {
  loadSection('requests');
  document.querySelectorAll('[data-section]').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('[data-section="requests"]').forEach(l => l.classList.add('active'));
  setTimeout(() => {
    const sel = document.getElementById('req-type');
    if (sel) sel.value = type;
  }, 100);
};
