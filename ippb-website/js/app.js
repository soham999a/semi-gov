// Main app logic - contact form, general page interactions
import { db } from './firebase-config.js';
import { showToast, setButtonLoading } from './ui.js';
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { validatePhone, validateEmail, showError, clearAllErrors } from './validation.js';

document.addEventListener('DOMContentLoaded', () => {

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // ===== CONTACT FORM =====
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors('contact-form');

      const name = document.getElementById('contact-name').value.trim();
      const phone = document.getElementById('contact-phone').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      let valid = true;

      if (!name || name.length < 2) { showError('contact-name', 'Enter your full name'); valid = false; }
      if (!validatePhone(phone)) { showError('contact-phone', 'Enter valid 10-digit number'); valid = false; }
      if (!message || message.length < 10) { showError('contact-message', 'Message must be at least 10 characters'); valid = false; }
      if (!valid) return;

      const btn = contactForm.querySelector('button[type="submit"]');
      setButtonLoading(btn, true, 'Sending...');
      try {
        await addDoc(collection(db, 'contactMessages'), {
          name,
          phone,
          email: document.getElementById('contact-email')?.value.trim() || '',
          category: document.getElementById('contact-category')?.value || 'general',
          message,
          createdAt: serverTimestamp(),
          status: 'unread'
        });
        showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
        contactForm.reset();
      } catch (err) {
        showToast('Failed to send message. Please try again.', 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // ===== SERVICES SIDEBAR ACTIVE STATE =====
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
  if (sidebarLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.service-category').forEach(section => observer.observe(section));
  }

  // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
