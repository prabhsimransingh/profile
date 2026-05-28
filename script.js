// ============================================================================
// PRABH.OS — script.js
// CSS 3D cylinder carousel + Three.js WebGL particle field
// ============================================================================

(function () {
  'use strict';

  const cylinder    = document.getElementById('cylinder');
  const dots        = document.querySelectorAll('.dot');
  const zoneEl      = document.getElementById('zone');
  const counterEl   = document.getElementById('section-counter');
  const progressBar = document.getElementById('progress-bar');

  const CARD_COUNT     = 8;
  const ANGLE_PER_CARD = 45;

  const zones = [
    'IDENTITY', 'PROFILE', 'CAPABILITIES', 'ARCHIVE',
    'TIMELINE', 'TRANSMISSIONS', 'CREDENTIALS', 'INTERFACE'
  ];

  let targetAngle    = 0;
  let currentAngle   = 0;
  let currentSection = 0;
  let scrollFraction = 0;

  // ── Three.js WebGL particle system ───────────────────────────────────────

  let threeRender = null;

  function initThree() {
    if (typeof THREE === 'undefined') return;

    const canvas = document.getElementById('bg-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 800);
    camera.position.z = 90;

    // ── Glowing sprite texture ──────────────────────────────────────
    const spriteCvs = document.createElement('canvas');
    spriteCvs.width = spriteCvs.height = 64;
    const sCtx = spriteCvs.getContext('2d');
    const grad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0,   'rgba(255,255,255,1)');
    grad.addColorStop(0.25,'rgba(255,255,255,0.8)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.3)');
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(spriteCvs);

    // ── Particles ───────────────────────────────────────────────────
    const COUNT    = 1400;
    const positions  = new Float32Array(COUNT * 3);
    const colors     = new Float32Array(COUNT * 3);
    const velocities = [];

    // Palette: cyan, magenta, gold, emerald, ice blue
    const palette = [
      [0.0,  1.0,  1.0],   // cyan
      [1.0,  0.0,  1.0],   // magenta
      [1.0,  0.85, 0.05],  // gold
      [0.06, 0.73, 0.51],  // emerald
      [0.38, 0.93, 1.0],   // ice blue
    ];

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 220;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 130;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90 - 10;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];

      velocities.push(
        (Math.random() - 0.5) * 0.025,
        (Math.random() - 0.5) * 0.018,
        (Math.random() - 0.5) * 0.008
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size:         2.2,
      map:          sprite,
      vertexColors: true,
      transparent:  true,
      opacity:      0.72,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // ── Flowing connection lines (sparse, nearest neighbors) ────────
    // Build a few hundred short line segments between nearby particles
    const linePositions = [];
    const lineColors    = [];
    const MAX_DIST_SQ   = 18 * 18; // only connect if within 18 units
    const MAX_LINES     = 300;

    for (let i = 0; i < COUNT && linePositions.length / 6 < MAX_LINES; i++) {
      const ax = positions[i * 3], ay = positions[i * 3 + 1], az = positions[i * 3 + 2];
      for (let j = i + 1; j < COUNT && linePositions.length / 6 < MAX_LINES; j++) {
        const bx = positions[j * 3], by = positions[j * 3 + 1], bz = positions[j * 3 + 2];
        const d2 = (ax-bx)*(ax-bx) + (ay-by)*(ay-by) + (az-bz)*(az-bz);
        if (d2 < MAX_DIST_SQ) {
          linePositions.push(ax, ay, az, bx, by, bz);
          // fade color: blend the two particle colors at low alpha
          lineColors.push(
            (colors[i*3]+colors[j*3])*0.5, (colors[i*3+1]+colors[j*3+1])*0.5, (colors[i*3+2]+colors[j*3+2])*0.5,
            (colors[i*3]+colors[j*3])*0.5, (colors[i*3+1]+colors[j*3+1])*0.5, (colors[i*3+2]+colors[j*3+2])*0.5
          );
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    lineGeo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(lineColors), 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // ── Resize handler ──────────────────────────────────────────────
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ── Return per-frame render function ────────────────────────────
    let t = 0;
    const pos = geo.attributes.position.array;

    return function renderThree() {
      t += 0.003;

      // Drift each particle
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3]     += velocities[i * 3];
        pos[i * 3 + 1] += velocities[i * 3 + 1];
        pos[i * 3 + 2] += velocities[i * 3 + 2];

        // Wrap boundaries
        if (pos[i*3]     >  110) pos[i*3]     = -110;
        if (pos[i*3]     < -110) pos[i*3]     =  110;
        if (pos[i*3+1]   >   65) pos[i*3+1]   =  -65;
        if (pos[i*3+1]   <  -65) pos[i*3+1]   =   65;
      }
      geo.attributes.position.needsUpdate = true;

      // Slow fluid rotation + scroll tilt
      points.rotation.y = t * 0.04  + scrollFraction * Math.PI * 0.6;
      points.rotation.x = Math.sin(t * 0.025) * 0.12 + scrollFraction * 0.15;

      // Breathe: subtle camera z pulse
      camera.position.z = 90 + Math.sin(t * 0.5) * 4;

      renderer.render(scene, camera);
    };
  }

  // ── Main rAF loop: cylinder lerp + Three.js render ───────────────────────

  threeRender = initThree();

  function animate() {
    // Lerp cylinder rotation + vertical scroll (helix: one card-height per 45°)
    currentAngle += (targetAngle - currentAngle) * 0.08;
    const liftY = -currentAngle * (350 / 45);   // as cylinder rotates down, lift cards up
    cylinder.style.transform = `rotateY(${currentAngle}deg) translateY(${liftY}px)`;

    // Section detection
    const sec = Math.min(CARD_COUNT - 1, Math.max(0,
      Math.round(Math.abs(currentAngle) / ANGLE_PER_CARD)
    ));
    if (sec !== currentSection) {
      currentSection = sec;
      if (zoneEl)    zoneEl.textContent    = zones[sec];
      if (counterEl) counterEl.textContent = String(sec + 1).padStart(2, '0') + ' / 08';
      dots.forEach((d, i) => d.classList.toggle('active', i === sec));
    }

    // Three.js WebGL frame
    if (threeRender) threeRender();

    requestAnimationFrame(animate);
  }

  // ── Scroll handler ────────────────────────────────────────────────────────

  window.addEventListener('scroll', () => {
    const scrollY   = window.scrollY;
    const vh        = window.innerHeight;
    const maxScroll = (CARD_COUNT - 1) * vh;

    targetAngle    = -(scrollY / vh) * ANGLE_PER_CARD;
    scrollFraction = Math.min(1, scrollY / maxScroll);

    if (progressBar) {
      progressBar.style.width = (scrollFraction * 100) + '%';
    }
  }, { passive: true });

  // ── Dot nav ───────────────────────────────────────────────────────────────

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
