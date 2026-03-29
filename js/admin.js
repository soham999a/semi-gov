import { auth, db } from './firebase-config.js';
import { showToast, formatCurrency, formatDate, setButtonLoading, openModal, closeModal } from './ui.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection, query, orderBy, limit, getDocs, doc, getDoc,
  updateDoc, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentAdmin = null;
let selectedRequestId = null;

// ===== AUTH GUARD (admin only) =====
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }

  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists() || !snap.data().isAdmin) {
    showToast('Access denied. Admin only.', 'error');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
    return;
  }

  currentAdmin = user;
  loadAdminSection('overview');
  loadMetrics();
});

// ===== SECTION NAVIGATION =====
document.querySelectorAll('[data-admin-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.adminSection;
    loadAdminSection(section);
    document.querySelectorAll('[data-admin-section]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('admin-sidebar')?.classList.remove('open');
  });
});

function loadAdminSection(section) {
  document.querySelectorAll('[id^="admin-section-"]').forEach(s => s.style.display = 'none');
  const el = document.getElementById('admin-section-' + section);
  if (el) el.style.display = 'block';
  const titles = { overview:'Dashboard Overview', users:'User Management', requests:'Service Requests', transactions:'Transaction Reports', grievances:'Grievance Management', schemes:'Scheme Management', audit:'Audit Logs' };
  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) titleEl.textContent = titles[section] || 'Dashboard';
  switch (section) {
    case 'overview':     loadPendingRequests(); loadAdminCharts(); break;
    case 'users':        loadUsers(); break;
    case 'requests':     loadAllRequests(); break;
    case 'transactions': loadAdminTransactions(); break;
    case 'grievances':   loadGrievances(); break;
    case 'schemes':      loadAdminSchemes(); break;
    case 'audit':        loadAuditLogs(); break;
  }
}

// ===== METRICS =====
async function loadMetrics() {
  try {
    const [usersSnap, accountsSnap, pendingSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'accounts'), where('status', '==', 'active'))),
      getDocs(query(collection(db, 'serviceRequests'), where('status', '==', 'pending')))
    ]);

    document.getElementById('metric-users').textContent = usersSnap.size;
    document.getElementById('metric-accounts').textContent = accountsSnap.size;
    document.getElementById('metric-pending').textContent = pendingSnap.size;
    document.getElementById('badge-users').textContent = usersSnap.size;
    document.getElementById('badge-requests').textContent = pendingSnap.size;
  } catch (err) {
    console.error('Metrics error:', err);
  }
}

// ===== PENDING REQUESTS =====
async function loadPendingRequests() {
  const tbody = document.getElementById('pending-requests-tbody');
  if (!tbody) return;

  try {
    const q = query(collection(db, 'serviceRequests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(20));
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:var(--spacing-xl);">No pending requests</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    for (const d of snap.docs) {
      const r = d.data();
      let userName = 'Unknown';
      try {
        const userSnap = await getDoc(doc(db, 'users', r.userId));
        if (userSnap.exists()) userName = userSnap.data().fullName || 'Unknown';
      } catch {}

      tbody.innerHTML += `
        <tr>
          <td class="text-mono">#${d.id.substring(0, 8).toUpperCase()}</td>
          <td>${userName}</td>
          <td>${r.type?.replace(/_/g, ' ').toUpperCase()}</td>
          <td>${formatDate(r.createdAt)}</td>
          <td><span class="dark-badge pending">PENDING</span></td>
          <td>
            <div class="action-btns">
              <button class="admin-btn admin-btn-success" onclick="openRequestModal('${d.id}', '${userName}', '${r.type}', \`${r.description?.replace(/`/g, "'")}\`)">Review</button>
            </div>
          </td>
        </tr>`;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">Failed to load requests</td></tr>';
  }
}

// ===== ALL REQUESTS =====
async function loadAllRequests() {
  const tbody = document.getElementById('all-requests-tbody');
  if (!tbody) return;

  try {
    const q = query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);

    tbody.innerHTML = '';
    for (const d of snap.docs) {
      const r = d.data();
      let userName = 'Unknown';
      try {
        const userSnap = await getDoc(doc(db, 'users', r.userId));
        if (userSnap.exists()) userName = userSnap.data().fullName || 'Unknown';
      } catch {}

      const statusClass = r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'pending';
      tbody.innerHTML += `
        <tr>
          <td class="text-mono">#${d.id.substring(0, 8).toUpperCase()}</td>
          <td>${userName}</td>
          <td>${r.type?.replace(/_/g, ' ').toUpperCase()}</td>
          <td>${formatDate(r.createdAt)}</td>
          <td><span class="badge badge-${statusClass}">${r.status?.toUpperCase()}</span></td>
          <td>
            ${r.status === 'pending' ? `<button class="admin-btn admin-btn-ghost" onclick="openRequestModal('${d.id}', '${userName}', '${r.type}', \`${r.description?.replace(/`/g, "'")}\`)">Review</button>` : ''}
          </td>
        </tr>`;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Failed to load</td></tr>';
  }
}

// ===== USERS =====
async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  try {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50)));

    tbody.innerHTML = '';
    snap.forEach(d => {
      const u = d.data();
      const kycClass = u.kycStatus === 'approved' ? 'success' : u.kycStatus === 'rejected' ? 'error' : 'pending';
      tbody.innerHTML += `
        <tr>
          <td>${u.fullName || 'N/A'}</td>
          <td>${u.phoneNumber || 'N/A'}</td>
          <td><span class="badge badge-${kycClass}">${u.kycStatus?.toUpperCase() || 'PENDING'}</span></td>
          <td>${formatDate(u.createdAt)}</td>
          <td>
            <div class="action-btns">
              <button class="admin-btn admin-btn-ghost" onclick="viewUser('${d.id}')">View</button>
              <button class="admin-btn admin-btn-danger" onclick="suspendUser('${d.id}')">Suspend</button>
            </div>
          </td>
        </tr>`;
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Failed to load users</td></tr>';
  }
}

// ===== TRANSACTIONS =====
async function loadAdminTransactions() {
  const tbody = document.getElementById('admin-txn-tbody');
  if (!tbody) return;

  try {
    const snap = await getDocs(query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(50)));

    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No transactions found</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    snap.forEach(d => {
      const t = d.data();
      const statusClass = t.status === 'success' ? 'success' : t.status === 'failed' ? 'error' : 'pending';
      tbody.innerHTML += `
        <tr>
          <td class="text-mono">${d.id.substring(0, 10).toUpperCase()}</td>
          <td>${t.userId?.substring(0, 8) || 'N/A'}</td>
          <td>${t.type?.toUpperCase()}</td>
          <td>${formatCurrency(t.amount || 0)}</td>
          <td>${formatDate(t.timestamp)}</td>
          <td><span class="badge badge-${statusClass}">${t.status?.toUpperCase()}</span></td>
        </tr>`;
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Failed to load</td></tr>';
  }
}

// ===== SCHEMES =====
async function loadAdminSchemes() {
  const container = document.getElementById('admin-schemes-list');
  if (!container) return;

  try {
    const snap = await getDocs(collection(db, 'schemes'));
    if (snap.empty) {
      container.innerHTML = '<p class="text-secondary">No schemes found. Click "+ Add Scheme" to create one.</p>';
      return;
    }

    container.innerHTML = '<div style="display:grid;gap:var(--spacing-md);">';
    snap.forEach(d => {
      const s = d.data();
      container.innerHTML += `
        <div style="background:var(--bg-light);padding:var(--spacing-md);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>${s.name}</strong>
            <p style="font-size:13px;color:var(--text-secondary);margin-top:4px;">${s.description || ''}</p>
          </div>
          <span class="badge badge-${s.isActive ? 'success' : 'error'}">${s.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
        </div>`;
    });
    container.innerHTML += '</div>';
  } catch (err) {
    container.innerHTML = '<p class="text-secondary">Failed to load schemes.</p>';
  }
}

// ===== APPROVE / REJECT =====
window.openRequestModal = (id, user, type, desc) => {
  selectedRequestId = id;
  document.getElementById('modal-req-id').textContent = `#${id.substring(0, 8).toUpperCase()}`;
  document.getElementById('modal-req-user').textContent = user;
  document.getElementById('modal-req-type').textContent = type?.replace(/_/g, ' ').toUpperCase();
  document.getElementById('modal-req-desc').textContent = desc;
  document.getElementById('action-modal').classList.add('active');
};

document.getElementById('approve-btn')?.addEventListener('click', async () => {
  if (!selectedRequestId) return;
  const btn = document.getElementById('approve-btn');
  setButtonLoading(btn, true, 'Approving...');
  try {
    await updateDoc(doc(db, 'serviceRequests', selectedRequestId), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: currentAdmin.uid
    });
    showToast('Request approved successfully!', 'success');
    document.getElementById('action-modal').classList.remove('active');
    loadPendingRequests();
    loadMetrics();
  } catch (err) {
    showToast('Failed to approve request.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
});

document.getElementById('reject-btn')?.addEventListener('click', async () => {
  if (!selectedRequestId) return;
  const reason = document.getElementById('rejection-reason').value.trim();
  const btn = document.getElementById('reject-btn');
  setButtonLoading(btn, true, 'Rejecting...');
  try {
    await updateDoc(doc(db, 'serviceRequests', selectedRequestId), {
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: serverTimestamp(),
      rejectedBy: currentAdmin.uid
    });
    showToast('Request rejected.', 'info');
    document.getElementById('action-modal').classList.remove('active');
    loadPendingRequests();
    loadMetrics();
  } catch (err) {
    showToast('Failed to reject request.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
});

document.getElementById('refresh-requests')?.addEventListener('click', () => {
  loadPendingRequests();
  loadMetrics();
});

// User search
document.getElementById('user-search')?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('#users-tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

window.viewUser = (uid) => showToast(`User ID: ${uid}`, 'info');
window.suspendUser = async (uid) => {
  if (!confirm('Suspend this user?')) return;
  try {
    await updateDoc(doc(db, 'users', uid), { kycStatus: 'suspended' });
    showToast('User suspended.', 'warning');
    loadUsers();
  } catch { showToast('Failed to suspend user.', 'error'); }
};
