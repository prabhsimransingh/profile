// ============================================================================
// PRABH.OS — script.js
// CSS 3D cylinder carousel driven by scroll
// ============================================================================

(function () {
  'use strict';

  const cylinder    = document.getElementById('cylinder');
  const dots        = document.querySelectorAll('.dot');
  const zoneEl      = document.getElementById('zone');
  const counterEl   = document.getElementById('section-counter');
  const progressBar = document.getElementById('progress-bar');

  const CARD_COUNT      = 8;
  const ANGLE_PER_CARD  = 45;

  const zones = [
    'IDENTITY', 'PROFILE', 'CAPABILITIES', 'ARCHIVE',
    'TIMELINE', 'TRANSMISSIONS', 'CREDENTIALS', 'INTERFACE'
  ];

  let targetAngle  = 0;
  let currentAngle = 0;
  let currentSection = 0;

  // ── rAF loop: lerp cylinder toward target angle ───────────────────────────

  function animate() {
    currentAngle += (targetAngle - currentAngle) * 0.08;
    cylinder.style.transform = `rotateY(${currentAngle}deg)`;

    const sec = Math.min(CARD_COUNT - 1, Math.max(0,
      Math.round(Math.abs(currentAngle) / ANGLE_PER_CARD)
    ));

    if (sec !== currentSection) {
      currentSection = sec;
      if (zoneEl)    zoneEl.textContent    = zones[sec];
      if (counterEl) counterEl.textContent = String(sec + 1).padStart(2, '0') + ' / 08';
      dots.forEach((d, i) => d.classList.toggle('active', i === sec));
    }

    requestAnimationFrame(animate);
  }

  // ── Scroll → target angle + progress bar ─────────────────────────────────

  window.addEventListener('scroll', () => {
    const scrollY   = window.scrollY;
    const vh        = window.innerHeight;
    const maxScroll = (CARD_COUNT - 1) * vh;

    targetAngle = -(scrollY / vh) * ANGLE_PER_CARD;

    if (progressBar) {
      progressBar.style.width = Math.min(100, (scrollY / maxScroll) * 100) + '%';
    }
  }, { passive: true });

  // ── Dot nav: click scrolls to section ────────────────────────────────────

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      window.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' });
    });
  });

  // ── Copy button ───────────────────────────────────────────────────────────

  const copyBtn = document.getElementById('copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('prabh_simran@hotmail.com').then(() => {
        copyBtn.textContent = '[COPIED!]';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = '[COPY]';
          copyBtn.classList.remove('copied');
        }, 2000);
      });
    });
  }

  // ── Boot sequence ─────────────────────────────────────────────────────────

  const boot = document.getElementById('boot');
  if (boot) {
    setTimeout(() => {
      boot.classList.add('out');
      setTimeout(() => boot.remove(), 900);
    }, 2600);
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  animate();

})();
