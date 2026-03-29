// Security utilities — session management, rate limiting, encryption helpers

// ===== SESSION TIMEOUT (15 min idle) =====
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
let idleTimer = null;
let warningTimer = null;
let warningShown = false;

export function startSessionWatcher(onExpire) {
  const reset = () => {
    clearTimeout(idleTimer);
    clearTimeout(warningTimer);
    warningShown = false;
    const banner = document.getElementById('session-warning');
    if (banner) banner.style.display = 'none';

    // Warn at 13 min
    warningTimer = setTimeout(() => {
      warningShown = true;
      showSessionWarning(onExpire);
    }, SESSION_TIMEOUT - 2 * 60 * 1000);

    // Expire at 15 min
    idleTimer = setTimeout(() => {
      onExpire();
    }, SESSION_TIMEOUT);
  };

  ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(e =>
    document.addEventListener(e, reset, { passive: true })
  );
  reset();
}

function showSessionWarning(onExpire) {
  let banner = document.getElementById('session-warning');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'session-warning';
    banner.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      background:#1B3A7D;color:white;padding:14px 24px;border-radius:12px;
      z-index:9998;font-family:Manrope,sans-serif;font-weight:600;font-size:14px;
      box-shadow:0 8px 32px rgba(0,0,0,0.2);display:flex;align-items:center;gap:16px;
    `;
    banner.innerHTML = `
      <span>Your session will expire in 2 minutes due to inactivity.</span>
      <button onclick="document.getElementById('session-warning').style.display='none'"
        style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 14px;
        border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;">Stay Logged In</button>
    `;
    document.body.appendChild(banner);
  }
  banner.style.display = 'flex';
}

// ===== OTP RATE LIMITING (client-side guard) =====
const OTP_KEY = 'ippb_otp_attempts';
const OTP_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

export function checkOTPRateLimit(phone) {
  const raw = localStorage.getItem(OTP_KEY);
  const data = raw ? JSON.parse(raw) : {};
  const now = Date.now();
  const entry = data[phone] || { count: 0, firstAttempt: now };

  // Reset window if expired
  if (now - entry.firstAttempt > OTP_WINDOW) {
    entry.count = 0;
    entry.firstAttempt = now;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const remaining = Math.ceil((OTP_WINDOW - (now - entry.firstAttempt)) / 60000);
    return { allowed: false, remaining };
  }

  entry.count++;
  data[phone] = entry;
  localStorage.setItem(OTP_KEY, JSON.stringify(data));
  return { allowed: true };
}

export function resetOTPRateLimit(phone) {
  const raw = localStorage.getItem(OTP_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);
  delete data[phone];
  localStorage.setItem(OTP_KEY, JSON.stringify(data));
}

// ===== INPUT SANITIZATION =====
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function sanitizeObject(obj) {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    clean[k] = typeof v === 'string' ? sanitize(v) : v;
  }
  return clean;
}

// ===== SIMPLE AADHAAR MASKING (display only) =====
export function maskAadhaar(aadhaar) {
  if (!aadhaar) return 'XXXX XXXX XXXX';
  const clean = aadhaar.replace(/\s/g, '');
  return `XXXX XXXX ${clean.slice(-4)}`;
}

// ===== AUDIT LOG =====
import { db } from './firebase-config.js';
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function logAuditEvent(userId, action, details = {}) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      userId,
      action,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent.substring(0, 200)
    });
  } catch (e) {
    // Audit log failure should never break the app
    console.warn('Audit log failed:', e);
  }
}

// ===== OFFLINE DETECTION =====
export function initOfflineDetection() {
  const show = () => {
    let bar = document.getElementById('offline-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'offline-bar';
      bar.style.cssText = `
        position:fixed;top:0;left:0;right:0;z-index:99999;
        background:#E74C3C;color:white;text-align:center;
        padding:10px;font-family:Manrope,sans-serif;font-weight:700;font-size:14px;
      `;
      bar.textContent = 'You are offline. Some features may not work.';
      document.body.prepend(bar);
    }
    bar.style.display = 'block';
  };
  const hide = () => {
    const bar = document.getElementById('offline-bar');
    if (bar) bar.style.display = 'none';
  };
  window.addEventListener('offline', show);
  window.addEventListener('online', hide);
  if (!navigator.onLine) show();
}
