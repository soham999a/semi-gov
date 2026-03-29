// UI Utilities - Toasts, Modals, Loading states

// ===== TOAST =====
export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" aria-label="Close notification">×</button>
  `;

  container.appendChild(toast);

  const close = () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', close);
  if (duration > 0) setTimeout(close, duration);
  return toast;
}

// ===== LOADING BUTTON =====
export function setButtonLoading(btn, loading, text = '') {
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = text || 'Loading...';
    btn.classList.add('btn-loading');
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

// ===== MODAL =====
let _modalScrollY = 0;

export function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.add('active');
    overlay.querySelector('.modal')?.focus();
    _modalScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${_modalScrollY}px`;
    document.body.style.width = '100%';
  }
}

export function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, _modalScrollY);
  }
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ===== NAVBAR TOGGLE =====
function initNavbar() {
  const toggle = document.getElementById('navbar-toggle');
  const menu = document.getElementById('navbar-menu');
  if (!toggle || !menu) return;

  let scrollY = 0;

  function openMenu() {
    scrollY = window.scrollY;
    menu.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    // iOS Safari scroll lock fix
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  }

  function closeMenu() {
    menu.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    // Restore scroll position
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
    toggle.focus();
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close when clicking a nav link (not the CTA buttons)
  menu.querySelectorAll('li:not(.navbar-menu-actions) > a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// ===== SIDEBAR TOGGLE (dashboard) =====
function initSidebarToggle() {
  const btn = document.getElementById('sidebar-toggle-btn') || document.getElementById('admin-sidebar-toggle');
  const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('admin-sidebar');
  if (!btn || !sidebar) return;

  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ===== FORMAT CURRENCY =====
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// ===== FORMAT DATE =====
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initNavbar();
  initSidebarToggle();

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Close modal buttons
  document.querySelectorAll('.modal-close, #modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) closeModal(overlay.id);
    });
  });
});
