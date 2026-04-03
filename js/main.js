/* =====================================================
   LUNAR Rocketry Club – Main JavaScript
   ===================================================== */

(function () {
  'use strict';

  /* ---- Mobile Navigation ---- */
  const hamburger = document.querySelector('.nav__hamburger');
  const navLinks  = document.querySelector('.nav__links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });

    /* Close menu when a link is clicked */
    navLinks.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Accordion ---- */
  document.querySelectorAll('.accordion-header').forEach(function (header) {
    header.addEventListener('click', function () {
      const item = header.closest('.accordion-item');
      const wasOpen = item.classList.contains('open');

      /* Close all siblings */
      item.closest('.accordion').querySelectorAll('.accordion-item').forEach(function (i) {
        i.classList.remove('open');
      });

      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ---- Membership form submission (no back-end; show thank-you) ---- */
  const joinForm = document.getElementById('join-form');
  if (joinForm) {
    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      joinForm.innerHTML =
        '<div style="text-align:center;padding:2rem 0">' +
        '<div style="font-size:3rem;margin-bottom:1rem">🚀</div>' +
        '<h3 style="margin-bottom:0.5rem">Application Received!</h3>' +
        '<p style="color:var(--color-muted)">Thanks for your interest in LUNAR. ' +
        'We\'ll be in touch within a few days with next steps.</p>' +
        '</div>';
    });
  }

  /* ---- Smooth active-link highlight ---- */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(function (link) {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });
}());
