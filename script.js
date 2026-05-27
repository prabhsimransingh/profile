/* ═══════════════════════════════════════════════
   PRABH SINGH — SCI-FI PORTFOLIO v2 · script.js
   ═══════════════════════════════════════════════ */

'use strict';

/* ── Password Gate ── */
(function () {
  const _k = 'UHJhYmhTaW5naDIwMjY=';
  const _s = 'pg_auth';
  if (sessionStorage.getItem(_s) === _k) return;
  const input = prompt('🔐 Enter password to view this portfolio:');
  if (input !== null && btoa(input) === _k) {
    sessionStorage.setItem(_s, _k);
  } else {
    document.documentElement.innerHTML = `<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000308;color:#00f5d4;font-family:monospace;font-size:1.2rem;letter-spacing:0.1em;flex-direction:column;gap:1rem;text-align:center;padding:2rem">🔒 Incorrect password.<br><span style="color:#64748b;font-size:0.85rem">Refresh to try again.</span></body>`;
  }
})();

const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Loader ── */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => {
      gsap.to(loader, {
        yPercent: -100, duration: 0.8, ease: 'power3.inOut',
        onComplete: () => { loader.style.display = 'none'; initHero(); }
      });
    }, 1300);
  });
}

/* ── Cursor ── */
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const dot  = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function track() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    if (dot)  { dot.style.left  = mx + 'px'; dot.style.top  = my + 'px'; }
    if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
    requestAnimationFrame(track);
  })();
  document.querySelectorAll('a,button,.filter-tab,.project-card,.skill-chip').forEach(el => {
    el.addEventListener('mouseenter', () => ring && ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring && ring.classList.remove('hovered'));
  });
}

/* ── Smooth Scroll (Lenis) ── */
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
  lenis.on('scroll', () => { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update(); });
  if (typeof gsap !== 'undefined') {
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

/* ── Scroll Progress ── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const p = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    bar.style.transform = `scaleX(${p})`;
  });
}

/* ── Nav ── */
function initNav() {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobile-nav');

  window.addEventListener('scroll', () => {
    nav && nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  if (burger && mobileNav) {
    burger.addEventListener('click', () => mobileNav.classList.toggle('open'));
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));
  }

  // Active link
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav__links a');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => obs.observe(s));
}

/* ── Three.js Particle Field ── */
function initThree() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 180;

  // Particles
  const COUNT = window.innerWidth < 768 ? 1200 : 2500;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);

  const cyan   = new THREE.Color(0x00f5d4);
  const purple = new THREE.Color(0x7c3aed);
  const white  = new THREE.Color(0xe2e8f0);

  for (let i = 0; i < COUNT; i++) {
    const r = 120 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);

    const t = Math.random();
    const c = t < 0.5 ? cyan.clone().lerp(purple, t * 2)
                       : purple.clone().lerp(white, (t - 0.5) * 2);
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    sizes[i] = Math.random() * 2.5 + 0.5;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animate
  let frame = 0;
  (function animate() {
    requestAnimationFrame(animate);
    frame += 0.003;
    particles.rotation.y = frame * 0.15 + mouseX * 0.05;
    particles.rotation.x = mouseY * 0.03;
    renderer.render(scene, camera);
  })();
}

/* ── Hero Animation ── */
function initHero() {
  if (noMotion) return;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero__badge',   { y: 20, opacity: 0, duration: 0.7 }, 0.1)
    .from('.hero__glitch',  { y: 40, opacity: 0, duration: 0.9 }, 0.3)
    .from('.hero__sub',     { y: 20, opacity: 0, duration: 0.7 }, 0.65)
    .from('.hero__tagline', { y: 20, opacity: 0, duration: 0.7 }, 0.8)
    .from('.hero__ctas',    { y: 20, opacity: 0, duration: 0.7 }, 0.95)
    .from('.hero__socials', { y: 20, opacity: 0, duration: 0.7 }, 1.1);
}

/* ── Typed.js ── */
function initTyped() {
  if (typeof Typed === 'undefined') return;
  new Typed('#hero-typed', {
    strings: [
      'enterprise AI infrastructure.',
      'Kubernetes platforms at Fortune 500 scale.',
      'engineering orgs that ship.',
      'cloud-native systems that last.',
      'platforms powering $25B+ in revenue.',
    ],
    typeSpeed: 42,
    backSpeed: 22,
    backDelay: 2200,
    loop: true,
    smartBackspace: true,
  });
}

/* ── Counters ── */
function initCounters() {
  let done = false;
  const about = document.getElementById('about');
  if (!about) return;
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || done) return;
    done = true;
    document.querySelectorAll('.stat__num').forEach(el => {
      const target = +el.dataset.target;
      const dur = target > 100 ? 2200 : 1600;
      const t0 = performance.now();
      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
        el.textContent = target >= 1000 ? val.toLocaleString() : val;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target >= 1000 ? target.toLocaleString() : target;
      })(t0);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }).observe(about);
}

/* ── Reveal Animations ── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── Project Filter ── */
function initFilter() {
  // Pre-show all cards
  document.querySelectorAll('.project-card').forEach(c => {
    c.style.opacity = '1'; c.style.display = '';
  });

  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const f = tab.dataset.filter;
      document.querySelectorAll('.project-card').forEach(card => {
        const show = f === 'all' || (card.dataset.tags || '').split(' ').includes(f);
        if (show) {
          card.style.display = '';
          card.style.opacity = '';
          if (typeof gsap !== 'undefined') {
            gsap.killTweensOf(card);
            gsap.fromTo(card, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
          }
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ── Vanilla Tilt ── */
function initTilt() {
  if (typeof VanillaTilt === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return;
  VanillaTilt.init(document.querySelectorAll('.project-card'), {
    max: 8, speed: 400, glare: true, 'max-glare': 0.08
  });
}

/* ── Contact Copy ── */
function initCopy() {
  const btn = document.getElementById('copy-email');
  const val = document.getElementById('contact-email');
  if (!btn || !val) return;
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(val.textContent.trim()).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓';
      btn.style.color = 'var(--cyan)';
      setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1800);
    });
  });
}

/* ── GSAP ScrollTrigger animations ── */
function initScrollAnimations() {
  if (noMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Timeline line draw
  const tlLine = document.querySelector('.timeline::before');
  if (document.querySelector('.timeline')) {
    gsap.from('.timeline', {
      scrollTrigger: { trigger: '.timeline', start: 'top 80%', end: 'bottom 20%', scrub: 1 },
      '--line-scale': 0
    });
  }

  // Cards stagger
  gsap.utils.toArray('.speak-card, .award-card, .pub-featured, .pub-card').forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      y: 30, opacity: 0, duration: 0.6, delay: (i % 3) * 0.1, ease: 'power2.out'
    });
  });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initCursor();
  initLenis();
  initScrollProgress();
  initNav();
  initThree();
  initTyped();
  initCounters();
  initReveal();
  initFilter();
  initTilt();
  initCopy();
  initScrollAnimations();
});
