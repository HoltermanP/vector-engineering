const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobilePanel = document.querySelector('[data-mobile-panel]');
const mobileLinks = document.querySelectorAll('[data-mobile-panel] a');
const contactForm = document.querySelector('#contactForm');
const formNote = document.querySelector('[data-form-note]');

function syncHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
}

syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

menuToggle.addEventListener('click', () => {
  const isOpen = mobilePanel.classList.toggle('is-open');
  document.body.classList.toggle('menu-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Menu sluiten' : 'Menu openen');
});

mobileLinks.forEach((link) => {
  link.addEventListener('click', () => {
    mobilePanel.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Menu openen');
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

if (contactForm) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const endpoint = contactForm.getAttribute('action') || '/api/contact';

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!formNote || !submitButton) return;

    formNote.textContent = '';
    formNote.classList.remove('is-error');
    submitButton.disabled = true;
    submitButton.textContent = 'Versturen...';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Het verzenden is mislukt.');
      }

      formNote.textContent = result.message;
      contactForm.reset();
    } catch (error) {
      formNote.textContent = error.message || 'Het verzenden is mislukt. Probeer het later opnieuw.';
      formNote.classList.add('is-error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Verstuur bericht';
    }
  });
}

const gantt = document.querySelector('[data-gantt]');

if (gantt && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gantt.classList.add('is-pending');
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      gantt.classList.remove('is-pending');
      observer.disconnect();
    }
  }, { threshold: 0.25 });
  observer.observe(gantt);
}
