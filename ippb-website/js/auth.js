import { auth, db } from './firebase-config.js';
import { showToast, setButtonLoading } from './ui.js';
import { validatePhone, showError, clearAllErrors } from './validation.js';
import { checkOTPRateLimit, resetOTPRateLimit, sanitizeObject, logAuditEvent } from './security.js';import {
  signInWithPhoneNumber, RecaptchaVerifier, signOut, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let confirmationResult = null;
let otpTimer = null;

// ===== RECAPTCHA =====
function setupRecaptcha() {
  if (window.recaptchaVerifier) return;
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      showToast('reCAPTCHA expired. Please try again.', 'warning');
      window.recaptchaVerifier = null;
    }
  });
}

// ===== SEND OTP =====
async function sendOTP(phoneNumber) {
  setupRecaptcha();
  const appVerifier = window.recaptchaVerifier;
  confirmationResult = await signInWithPhoneNumber(auth, `+91${phoneNumber}`, appVerifier);
}

// ===== VERIFY OTP =====
async function verifyOTP(code) {
  if (!confirmationResult) throw new Error('No OTP session. Please request OTP again.');
  const result = await confirmationResult.confirm(code);
  return result.user;
}

// ===== REGISTER USER =====
export async function registerUser(userData) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await setDoc(doc(db, 'users', user.uid), {
    ...userData,
    phoneNumber: user.phoneNumber || userData.phoneNumber || '',
    email: user.email || userData.email || '',
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    isAdmin: false,
    kycStatus: 'pending'
  });

  // Create default account
  const accountId = `IPPB${Date.now()}`;
  await setDoc(doc(db, 'accounts', accountId), {
    userId: user.uid,
    accountNumber: accountId,
    accountType: userData.accountType || 'savings',
    balance: 0,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return user;
}

// ===== LOGOUT =====
export async function logout() {
  await signOut(auth);
  window.location.href = 'index.html';
}

// ===== AUTH STATE =====
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

// ===== OTP TIMER =====
function startOTPTimer(seconds = 30) {
  const timerEl = document.getElementById('timer-count');
  const resendLink = document.getElementById('resend-otp');
  if (!timerEl) return;

  let remaining = seconds;
  clearInterval(otpTimer);

  otpTimer = setInterval(() => {
    remaining--;
    timerEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(otpTimer);
      timerEl.parentElement.style.display = 'none';
      if (resendLink) resendLink.style.display = 'inline';
    }
  }, 1000);
}

// ===== LOGIN PAGE LOGIC =====
document.addEventListener('DOMContentLoaded', () => {
  const phoneForm = document.getElementById('phone-form');
  const otpForm = document.getElementById('otp-form');
  const stepPhone = document.getElementById('step-phone');
  const stepOtp = document.getElementById('step-otp');
  const backBtn = document.getElementById('back-to-phone');
  const verifyBtn = document.getElementById('verify-otp-btn');
  const otpInputs = document.querySelectorAll('.otp-input');
  const resendLink = document.getElementById('resend-otp');

  // OTP input auto-advance
  otpInputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '');
      if (input.value && i < otpInputs.length - 1) otpInputs[i + 1].focus();
      const full = [...otpInputs].map(o => o.value).join('');
      if (verifyBtn) verifyBtn.disabled = full.length < 6;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) otpInputs[i - 1].focus();
    });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
      pasted.split('').forEach((ch, idx) => { if (otpInputs[idx]) otpInputs[idx].value = ch; });
      if (verifyBtn) verifyBtn.disabled = pasted.length < 6;
    });
  });

  // Send OTP
  if (phoneForm) {
    phoneForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors('phone-form');
      const phone = document.getElementById('phone').value.trim();
      if (!validatePhone(phone)) { showError('phone', 'Enter a valid 10-digit mobile number'); return; }

      // Rate limit check
      const rateCheck = checkOTPRateLimit(phone);
      if (!rateCheck.allowed) {
        showError('phone', `Too many attempts. Try again in ${rateCheck.remaining} minute(s).`);
        return;
      }

      const btn = document.getElementById('send-otp-btn');
      setButtonLoading(btn, true, 'Sending OTP...');
      try {
        await sendOTP(phone);
        stepPhone.classList.remove('active');
        stepOtp.classList.add('active');
        const sentTo = document.getElementById('otp-sent-to');
        if (sentTo) sentTo.textContent = `OTP sent to +91 ${phone.replace(/(\d{5})(\d{5})/, '$1 $2')}`;
        startOTPTimer(30);
        showToast('OTP sent successfully!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to send OTP. Please try again.', 'error');
        window.recaptchaVerifier = null;
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // Verify OTP
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = [...otpInputs].map(o => o.value).join('');
      if (code.length < 6) { showToast('Enter complete 6-digit OTP', 'warning'); return; }

      const btn = document.getElementById('verify-otp-btn');
      setButtonLoading(btn, true, 'Verifying...');
      try {
        const user = await verifyOTP(code);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        await updateDoc(doc(db, 'users', user.uid), { lastLogin: serverTimestamp() }).catch(() => {});
        await logAuditEvent(user.uid, 'login_success');
        resetOTPRateLimit(document.getElementById('phone')?.value.trim());
        showToast('Login successful!', 'success');
        setTimeout(() => {
          window.location.href = userDoc.exists() ? 'dashboard.html' : 'register.html';
        }, 800);
      } catch (err) {
        console.error(err);
        const msg = err.code === 'auth/invalid-verification-code' ? 'Invalid OTP. Please try again.' : 'Verification failed. Please try again.';
        showToast(msg, 'error');
        otpInputs.forEach(i => { i.value = ''; });
        otpInputs[0]?.focus();
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // Back button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      stepOtp.classList.remove('active');
      stepPhone.classList.add('active');
      clearInterval(otpTimer);
    });
  }

  // Resend OTP
  if (resendLink) {
    resendLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('phone')?.value.trim();
      if (!phone) return;
      try {
        window.recaptchaVerifier = null;
        await sendOTP(phone);
        resendLink.style.display = 'none';
        const timerParent = document.getElementById('timer-count')?.parentElement;
        if (timerParent) timerParent.style.display = '';
        startOTPTimer(30);
        showToast('OTP resent!', 'success');
      } catch (err) {
        showToast('Failed to resend OTP.', 'error');
      }
    });
  }

  // ===== REGISTRATION FLOW =====
  const regForm1 = document.getElementById('reg-form-1');
  const regForm2 = document.getElementById('reg-form-2');
  const regForm3 = document.getElementById('reg-form-3');
  let regData = {};

  function setStep(step) {
    [1, 2, 3].forEach(n => {
      document.getElementById(`reg-step-${n}`)?.classList.toggle('active', n === step);
      const dot = document.getElementById(`dot-${n}`);
      if (dot) {
        dot.classList.toggle('active', n === step);
        dot.classList.toggle('done', n < step);
        dot.textContent = n < step ? '' : n;
      }
      if (n < 3) {
        document.getElementById(`line-${n}`)?.classList.toggle('done', n < step);
      }
    });
    const progress = document.querySelector('[role="progressbar"]');
    if (progress) progress.setAttribute('aria-valuenow', step);
  }

  if (regForm1) {
    regForm1.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('fullName').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const dob = document.getElementById('dob').value;
      const gender = document.getElementById('gender').value;
      let valid = true;

      if (!name || name.length < 2) { showError('fullName', 'Enter your full name'); valid = false; }
      if (!validatePhone(phone)) { showError('regPhone', 'Enter valid 10-digit number'); valid = false; }
      if (!dob) { showError('dob', 'Date of birth is required'); valid = false; }
      if (!gender) { showError('gender', 'Please select gender'); valid = false; }
      if (!valid) return;

      regData = { fullName: name, phoneNumber: phone, email: document.getElementById('email').value.trim(), dateOfBirth: dob, gender };
      setStep(2);
    });
  }

  if (regForm2) {
    regForm2.addEventListener('submit', (e) => {
      e.preventDefault();
      const address = document.getElementById('address').value.trim();
      const city = document.getElementById('city').value.trim();
      const state = document.getElementById('state').value;
      const pincode = document.getElementById('pincode').value.trim();
      let valid = true;

      if (!address) { showError('address', 'Address is required'); valid = false; }
      if (!city) { showError('city', 'City is required'); valid = false; }
      if (!state) { showError('state', 'Please select state'); valid = false; }
      if (!/^\d{6}$/.test(pincode)) { showError('pincode', 'Enter valid 6-digit pincode'); valid = false; }
      if (!valid) return;

      const aadhaar = document.getElementById('aadhaar').value.replace(/\s/g, '');
      regData = { ...regData, aadhaarNumber: aadhaar, address, city, state, pincode };
      setStep(3);
    });

    document.getElementById('reg-back-1')?.addEventListener('click', () => setStep(1));
  }

  if (regForm3) {
    regForm3.addEventListener('submit', async (e) => {
      e.preventDefault();
      const terms = document.getElementById('terms').checked;
      if (!terms) { showError('terms', 'You must accept the terms and conditions'); return; }

      const accountType = document.querySelector('input[name="accountType"]:checked')?.value || 'savings';
      regData.accountType = accountType;

      const btn = document.getElementById('create-account-btn');
      setButtonLoading(btn, true, 'Creating Account...');
      try {
        // Check if user is already authenticated (came from login flow)
        const user = auth.currentUser;
        if (!user) {
          showToast('Session expired. Please login first.', 'error');
          setTimeout(() => window.location.href = 'login.html', 1500);
          return;
        }
        await registerUser(sanitizeObject(regData));
        sessionStorage.removeItem('google_user');
        showToast('Account created successfully!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      } catch (err) {
        console.error(err);
        showToast('Failed to create account. Please try again.', 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });

    document.getElementById('reg-back-2')?.addEventListener('click', () => setStep(2));
  }

  // Logout buttons
  document.querySelectorAll('#logout-btn, #sidebar-logout, #admin-logout, #sidebar-admin-logout').forEach(btn => {
    btn?.addEventListener('click', () => logout());
  });

  // ===== GOOGLE SIGN-IN =====
  async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // New Google user — pre-fill register form data and redirect
        sessionStorage.setItem('google_user', JSON.stringify({
          fullName: user.displayName || '',
          email: user.email || '',
          uid: user.uid,
          photoURL: user.photoURL || ''
        }));
        showToast('Google sign-in successful! Complete your profile.', 'success');
        setTimeout(() => window.location.href = 'register.html', 800);
      } else {
        await updateDoc(doc(db, 'users', user.uid), { lastLogin: serverTimestamp() }).catch(() => {});
        await logAuditEvent(user.uid, 'google_login_success');
        showToast('Welcome back!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 800);
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return;
      if (err.code === 'auth/popup-blocked') {
        showToast('Popup blocked. Please allow popups for this site.', 'warning', 6000);
        return;
      }
      showToast('Google sign-in failed. Please try again.', 'error');
      console.error('Google sign-in error:', err);
    }
  }

  document.getElementById('google-signin-btn')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('google-register-btn')?.addEventListener('click', handleGoogleSignIn);

  // Pre-fill register form if coming from Google sign-in
  const googleUser = sessionStorage.getItem('google_user');
  if (googleUser) {
    try {
      const gData = JSON.parse(googleUser);
      const nameEl = document.getElementById('fullName');
      const emailEl = document.getElementById('email');
      if (nameEl && gData.fullName) nameEl.value = gData.fullName;
      if (emailEl && gData.email) emailEl.value = gData.email;
    } catch {}
  }
});
