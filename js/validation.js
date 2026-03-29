// Form Validation Utilities

export function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateAadhaar(aadhaar) {
  const clean = aadhaar.replace(/\s/g, '');
  return /^\d{12}$/.test(clean);
}

export function validatePincode(pin) {
  return /^\d{6}$/.test(pin);
}

export function validateName(name) {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
}

export function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}-error`);
  if (field) field.classList.add('error');
  if (error) error.textContent = message;
}

export function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}-error`);
  if (field) field.classList.remove('error');
  if (error) error.textContent = '';
}

export function clearAllErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.form-input.error').forEach(f => f.classList.remove('error'));
  form.querySelectorAll('.form-error').forEach(e => e.textContent = '');
}

// Real-time validation on blur
export function attachRealTimeValidation() {
  document.querySelectorAll('.form-input[required]').forEach(input => {
    input.addEventListener('blur', () => {
      if (!input.value.trim()) {
        input.classList.add('error');
        const error = document.getElementById(`${input.id}-error`);
        if (error) error.textContent = 'This field is required';
      } else {
        input.classList.remove('error');
        const error = document.getElementById(`${input.id}-error`);
        if (error) error.textContent = '';
      }
    });
    input.addEventListener('input', () => {
      if (input.value.trim()) {
        input.classList.remove('error');
        const error = document.getElementById(`${input.id}-error`);
        if (error) error.textContent = '';
      }
    });
  });
}

// Format Aadhaar as user types: XXXX XXXX XXXX
export function formatAadhaarInput(input) {
  input.addEventListener('input', () => {
    let val = input.value.replace(/\D/g, '').substring(0, 12);
    input.value = val.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  attachRealTimeValidation();
  const aadhaarInput = document.getElementById('aadhaar');
  if (aadhaarInput) formatAadhaarInput(aadhaarInput);
});
