import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ═══════════════════════════════════════════════
   PRABH.OS v2.0 — Cyberspace Interface · script.js
   Three.js + WebGL · Particle systems · HUD logic
   ═══════════════════════════════════════════════ */

const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let fps = 60;

/* ── Boot Sequence ── */
async function initBoot() {
  const boot = document.getElementById('boot');
  const terminal = document.getElementById('boot-terminal');
  const bar = document.getElementById('boot-bar');
  const status = document.getElementById('boot-status');

  const lines = [
    'INITIALIZING SYSTEM',
    'LOADING MEMORY CACHE',
    'ENGAGING NEURAL INTERFACE',
    'PRABH.OS v2.0 READY',
    'HANDSHAKE COMPLETE'
  ];

  for (const line of lines) {
    const div = document.createElement('div');
    div.className = 'boot__terminal-line';
    div.textContent = line;
    terminal.appendChild(div);
    await new Promise(r => setTimeout(r, 200));
  }

  gsap.to(bar, { width: '100%', duration: 1, ease: 'power2.inOut', delay: 0.3 });

  await new Promise(r => setTimeout(r, 1400));
  gsap.to(boot, {
    opacity: 0,
    yPercent: -100,
    duration: 0.7,
    ease: 'power3.inOut',
    onComplete: () => { boot.style.display = 'none'; }
  });
}

/* ── Three.js Setup ── */
function initThreeScene() {
  const canvas = document.getElementById('webgl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 40, 100);
  camera.lookAt(0, 0, 0);

  /* Post-processing: Bloom */
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.2,  /* strength */
    0.4,  /* radius */
    0.85  /* threshold */
  );
  composer.addPass(bloomPass);

  /* Lights */
  const ambLight = new THREE.AmbientLight(0x0088ff, 0.3);
  scene.add(ambLight);

  const pointLight = new THREE.PointLight(0x00ffff, 1, 500);
  pointLight.position.set(100, 100, 100);
  scene.add(pointLight);

  /* Grid Floor */
  const gridSize = 400;
  const gridDivisions = 40;
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0xff006e, 0x333366);
  gridHelper.position.y = -50;
  scene.add(gridHelper);

  /* Infinite grid effect via material */
  const gridMat = gridHelper.material;
  gridMat.color.set(0x00ffff);
  gridMat.linewidth = 1;

  /* Floating geometric shapes */
  const geoShapes = [
    createWireframeGeometry('icosahedron', 30, 0xff006e),
    createWireframeGeometry('octahedron', 40, 0x00ffff),
    createWireframeGeometry('tetrahedron', 25, 0xff8c00),
    createWireframeGeometry('icosahedron', 35, 0xff006e),
  ];

  geoShapes[0].position.set(-80, 0, -100);
  geoShapes[1].position.set(80, 20, -80);
  geoShapes[2].position.set(-60, -20, 60);
  geoShapes[3].position.set(60, 10, 80);

  geoShapes.forEach((shape, i) => {
    scene.add(shape);
    // Subtle animation
    shape.userData.speed = 0.3 + Math.random() * 0.3;
    shape.userData.axis = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
  });

  /* Particle Systems */
  const particleLayers = [
    createParticles(2000, 150, [0x00ffff, 0xff006e], 0.3),
    createParticles(1500, 250, [0x00ffff, 0xff8c00], 0.5),
    createParticles(1000, 350, [0xff006e, 0xffffff], 0.8),
  ];

  particleLayers.forEach((layer, i) => {
    scene.add(layer.points);
    layer.userData.index = i;
  });

  /* Window resize */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  /* Mouse parallax */
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* Scroll-driven camera */
  let scrollProgress = 0;
  const cameraPath = [
    new THREE.Vector3(0, 40, 100),
    new THREE.Vector3(-30, 35, 80),
    new THREE.Vector3(30, 38, 85),
    new THREE.Vector3(-20, 42, 95),
    new THREE.Vector3(40, 36, 75),
    new THREE.Vector3(-40, 40, 90),
    new THREE.Vector3(20, 35, 70),
    new THREE.Vector3(0, 45, 110),
  ];

  window.addEventListener('scroll', () => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  });

  /* Animation loop */
  let frameCount = 0;
  function animate() {
    requestAnimationFrame(animate);
    frameCount++;

    /* Update camera position along path */
    const pathIndex = Math.floor(scrollProgress * (cameraPath.length - 1));
    const nextIndex = Math.min(pathIndex + 1, cameraPath.length - 1);
    const t = scrollProgress * (cameraPath.length - 1) - pathIndex;
    const pos = cameraPath[pathIndex].clone().lerp(cameraPath[nextIndex], t);
    camera.position.lerp(pos, 0.05);
    camera.lookAt(
      mouseX * 20,
      mouseY * 15,
      0
    );

    /* Rotate floating shapes */
    geoShapes.forEach(shape => {
      shape.rotateOnWorldAxis(shape.userData.axis, shape.userData.speed * 0.01);
    });

    /* Animate particles */
    particleLayers.forEach((layer, i) => {
      layer.points.rotation.y += 0.0001 * (i + 1);
      layer.points.rotation.x += 0.00005 * (i + 1);
    });

    /* Update HUD */
    updateHUD(scrollProgress, camera);

    /* Render */
    composer.render();
    updateFPS();
  }

  animate();
}

function createWireframeGeometry(type, size, color) {
  let geo;
  switch (type) {
    case 'icosahedron':
      geo = new THREE.IcosahedronGeometry(size, 2);
      break;
    case 'octahedron':
      geo = new THREE.OctahedronGeometry(size, 2);
      break;
    case 'tetrahedron':
      geo = new THREE.TetrahedronGeometry(size, 2);
      break;
    default:
      geo = new THREE.IcosahedronGeometry(size, 2);
  }

  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, linewidth: 2 })
  );
  return line;
}

function createParticles(count, range, colors, opacity) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const cols = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * range * 2;
    pos[i * 3 + 1] = (Math.random() - 0.5) * range * 2;
    pos[i * 3 + 2] = (Math.random() - 0.5) * range * 2;

    const col = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
    cols[i * 3] = col.r;
    cols[i * 3 + 1] = col.g;
    cols[i * 3 + 2] = col.b;

    sizes[i] = Math.random() * 2 + 1;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 1.5,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  return { points, geo, mat };
}

/* ── HUD Updates ── */
function updateHUD(progress, camera) {
  const coords = document.getElementById('hud-coords');
  const zone = document.getElementById('hud-zone');
  const zoneIdx = document.getElementById('hud-zone-idx');
  const percent = document.getElementById('hud-percent');
  const progressFill = document.getElementById('hud-progress');

  const zoneNum = Math.floor(progress * 8) + 1;
  const zoneNames = ['IDENTITY', 'PROFILE', 'CAPABILITIES', 'ARCHIVE', 'TIMELINE', 'TRANSMISSIONS', 'CREDENTIALS', 'INTERFACE'];
  zone.textContent = `— ${zoneNames[Math.min(zoneNum - 1, 7)]} —`;
  zoneIdx.textContent = zoneNum.toString().padStart(2, '0');

  const pct = Math.round(progress * 100);
  percent.textContent = pct.toString().padStart(3, '0');
  progressFill.style.width = pct + '%';

  coords.textContent = `+${(camera.position.x | 0).toString().padStart(4, '0')}.${(camera.position.z | 0).toString().padStart(3, '0')} / ${(camera.position.y | 0).toString().padStart(4, '0')}.000`;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  document.getElementById('hud-time').textContent = timeStr + ' UTC';
}

/* ── Cursor ── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
}

/* ── Smooth Scroll ── */
function initLenis() {
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

/* ── Typed.js ── */
function initTyped() {
  if (typeof Typed === 'undefined') return;
  new Typed('#typed', {
    strings: [
      'enterprise AI infrastructure.',
      'Kubernetes platforms at Fortune 500 scale.',
      'engineering orgs that ship.',
      'cloud-native systems that last.',
      'platforms powering $25B+ in revenue.'
    ],
    typeSpeed: 45,
    backSpeed: 25,
    backDelay: 2000,
    loop: true,
    smartBackspace: true,
  });
}

/* ── Stat Counters ── */
function initCounters() {
  let done = false;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !done) {
        done = true;
        document.querySelectorAll('[data-target]').forEach(el => {
          const target = +el.dataset.target;
          const dur = 1600;
          const t0 = performance.now();
          (function tick(now) {
            const p = Math.min((now - t0) / dur, 1);
            const val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
            el.textContent = val.toLocaleString();
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target.toLocaleString();
          })(t0);
        });
      }
    });
  }, { threshold: 0.2 });

  const profilePanel = document.querySelector('.panel--profile');
  if (profilePanel) observer.observe(profilePanel);
}

/* ── Project Filter ── */
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projCards = document.querySelectorAll('.proj-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      projCards.forEach(card => {
        const tags = (card.dataset.tags || '').split(' ');
        const show = filter === 'all' || tags.includes(filter);
        card.style.display = show ? '' : 'none';
        if (show && typeof gsap !== 'undefined') {
          gsap.fromTo(card, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        }
      });
    });
  });
}

/* ── Copy to Clipboard ── */
function initCopy() {
  const copyBtn = document.getElementById('copy-email');
  if (!copyBtn) return;
  copyBtn.addEventListener('click', e => {
    e.preventDefault();
    const email = 'prabh_simran@hotmail.com';
    navigator.clipboard.writeText(email).then(() => {
      const orig = copyBtn.textContent;
      copyBtn.textContent = '[copied!]';
      setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    });
  });
}

/* ── Panel Reveals ── */
function initPanelReveals() {
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.panel').forEach((panel, i) => {
    gsap.from(panel, {
      scrollTrigger: {
        trigger: panel,
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 30,
      duration: 0.7,
      delay: i * 0.1,
      ease: 'power2.out'
    });
  });
}

/* ── FPS Counter ── */
function updateFPS() {
  const fpsEl = document.getElementById('hud-fps');
  if (!fpsEl) return;
  fpsEl.textContent = Math.round(1000 / (performance.now() % 1000 || 1));
}

/* ── Scroll Snap Sections ── */
function initScrollSnap() {
  document.querySelectorAll('[data-go]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.go);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  await initBoot();
  initThreeScene();
  initCursor();
  initLenis();
  initTyped();
  initCounters();
  initProjectFilter();
  initCopy();
  initPanelReveals();
  initScrollSnap();
});
