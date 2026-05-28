// ============================================================================
// CANVAS ANIMATION (CSS-based background glow)
// ============================================================================

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Animate canvas with glowing grid and particles
function animateCanvas() {
  // Clear with semi-transparent black for trail effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw particles
  const scroll = window.scrollY;
  for (let i = 0; i < 20; i++) {
    const x = (Math.sin(Date.now() * 0.0001 + i) * 0.5 + 0.5) * canvas.width;
    const y = (Math.cos(Date.now() * 0.00008 + i * 0.5) * 0.5 + 0.5) * canvas.height;
    const size = Math.sin(Date.now() * 0.001 + i) * 1.5 + 2;
    const color = i % 2 === 0 ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 0, 255, 0.3)';

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  requestAnimationFrame(animateCanvas);
}

animateCanvas();

// ============================================================================
// SCROLL & HUD
// ============================================================================

const sections = document.querySelectorAll('.section');
const zoneDisplay = document.querySelector('#zone');

window.addEventListener('scroll', () => {
  let currentZone = 'INTRO';
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight / 2) {
      currentZone = section.getAttribute('data-zone') || 'UNKNOWN';
    }
  });
  if (zoneDisplay) zoneDisplay.textContent = currentZone;
});

// ============================================================================
// BOOT SEQUENCE
// ============================================================================

function initBoot() {
  const bootEl = document.querySelector('.boot');
  const bootBar = document.querySelector('.boot__bar');

  if (bootEl) {
    setTimeout(() => {
      bootEl.classList.add('hidden');
    }, 2400);
  }
}

// ============================================================================
// LENIS SMOOTH SCROLL
// ============================================================================

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
});

lenis.on('scroll', (e) => {
  // Scroll event for future integrations
});

function rafCallback(time) {
  lenis.raf(time * 1000);
  requestAnimationFrame(rafCallback);
}

requestAnimationFrame(rafCallback);

// ============================================================================
// COPY TO CLIPBOARD
// ============================================================================

const copyButton = document.querySelector('#copy');
if (copyButton) {
  copyButton.addEventListener('click', () => {
    const email = 'prabh_simran@hotmail.com';
    navigator.clipboard.writeText(email).then(() => {
      copyButton.textContent = '[COPIED!]';
      copyButton.classList.add('copied');
      setTimeout(() => {
        copyButton.textContent = '[COPY]';
        copyButton.classList.remove('copied');
      }, 2000);
    });
  });
}

// ============================================================================
// WINDOW RESIZE
// ============================================================================

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initBoot();
});
