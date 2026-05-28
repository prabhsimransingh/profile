// ============================================================================
// PRABH.OS — script.js
// Three.js chrome torus centrepiece + scroll-driven section reveals
// ============================================================================

(function () {
  'use strict';

  const SECTION_COUNT = 8;
  const zones = [
    'IDENTITY','PROFILE','CAPABILITIES','ARCHIVE',
    'TIMELINE','TRANSMISSIONS','CREDENTIALS','INTERFACE'
  ];

  const sections   = document.querySelectorAll('.sec');
  const auxPanels  = document.querySelectorAll('.aux-panel');
  const dots       = document.querySelectorAll('.dot');
  const zoneEl     = document.getElementById('zone');
  const counterEl  = document.getElementById('section-counter');
  const progressBar = document.getElementById('progress-bar');

  // ── Text scramble effect ─────────────────────────────────────────────────
  const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*';

  function scrambleText(el, finalText, duration) {
    duration = duration || 650;
    let frame = 0;
    const totalFrames = Math.round(duration / 16);
    // Store original HTML to restore line breaks
    const lines = finalText.split('\n');

    if (el._scrambleTimer) clearInterval(el._scrambleTimer);
    el._scrambleTimer = setInterval(() => {
      const progress = frame / totalFrames;
      el.innerHTML = lines.map(line =>
        line.split('').map((char, i) => {
          if (char === ' ') return ' ';
          const revealThreshold = progress * line.length;
          if (i < revealThreshold) return `<span>${char}</span>`;
          return `<span style="opacity:0.35;color:var(--cyan)">${SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]}</span>`;
        }).join('')
      ).join('<br>');
      frame++;
      if (frame >= totalFrames) {
        clearInterval(el._scrambleTimer);
        el.innerHTML = lines.map(line => `<span>${line}</span>`).join('<br>');
      }
    }, 16);
  }

  let currentSection  = 0;
  let scrollFraction  = 0;   // 0..1 across full scroll range
  let scrollProgress  = 0;   // 0..7 (one unit per section)

  // ── Three.js scene ───────────────────────────────────────────────────────

  function initScene() {
    if (typeof THREE === 'undefined') return null;

    const canvas   = document.getElementById('bg-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x01101e, 1);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x01101e, 0.012);

    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 0, 24);

    // ── Lighting — 6 coloured points for chrome specular ───────────
    const lights = [
      { col: 0xffffff, int: 3.0, pos: [8,   6,  14] },  // key (warm white, front)
      { col: 0x00d4ff, int: 4.0, pos: [-12, 2,  10] },  // fill (cyan, front-left)
      { col: 0x4466ff, int: 2.5, pos: [10, -8,   8] },  // blue bounce
      { col: 0x7b3fff, int: 2.0, pos: [-8,  8,  -8] },  // purple rim (behind)
      { col: 0x00d4ff, int: 1.5, pos: [0,  -12,  6] },  // bottom cyan
      { col: 0xffffff, int: 1.0, pos: [0,   0,  -15] }, // back fill
    ];
    lights.forEach(({ col, int, pos }) => {
      const l = new THREE.PointLight(col, int, 80);
      l.position.set(...pos);
      scene.add(l);
    });
    scene.add(new THREE.AmbientLight(0x06162a, 2));

    // ── Main torus (chrome) ─────────────────────────────────────────
    const torusGeo = new THREE.TorusGeometry(7, 2.2, 128, 256);
    const torusMat = new THREE.MeshPhongMaterial({
      color:     new THREE.Color(0x081c36),
      emissive:  new THREE.Color(0x020c1a),
      specular:  new THREE.Color(0xaaddff),
      shininess: 700,
      side:      THREE.DoubleSide,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);

    // ── Glow rings (additive blending, 3 layers) ────────────────────
    const glowLayers = [
      { tube: 2.6, opacity: 0.055, col: 0x0066cc },
      { tube: 3.2, opacity: 0.030, col: 0x0044aa },
      { tube: 4.2, opacity: 0.012, col: 0x002288 },
    ];
    glowLayers.forEach(({ tube, opacity, col }) => {
      const g = new THREE.Mesh(
        new THREE.TorusGeometry(7, tube, 32, 64),
        new THREE.MeshBasicMaterial({
          color: col, transparent: true, opacity,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        })
      );
      torus.add(g);
    });

    // ── Inner portal glow (flat disc behind the torus hole) ─────────
    const discGeo = new THREE.CircleGeometry(4.8, 64);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x003366,
      transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false,
      side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.z = 0;
    torus.add(disc);

    // ── Orbit group (scroll-driven rotation) ────────────────────────
    const torusGroup = new THREE.Group();
    torusGroup.add(torus);
    // Position group slightly right of center so left panel has space
    torusGroup.position.set(3.5, 0, 0);
    scene.add(torusGroup);

    // ── Particle field ──────────────────────────────────────────────
    const PART_COUNT = 1600;
    const partPos  = new Float32Array(PART_COUNT * 3);
    const partCol  = new Float32Array(PART_COUNT * 3);
    const partVel  = new Float32Array(PART_COUNT * 3);

    const palette = [
      [0, 0.83, 1],    // cyan
      [0.48, 0.4, 1],  // purple
      [0.1, 0.5, 1],   // blue
      [0, 0.6, 0.9],   // teal
    ];

    for (let i = 0; i < PART_COUNT; i++) {
      // Spread across a wide volume, denser near center
      const r = 20 + Math.random() * 60;
      const θ = Math.random() * Math.PI * 2;
      const φ = (Math.random() - 0.5) * Math.PI;
      partPos[i*3]   = r * Math.cos(θ) * Math.cos(φ);
      partPos[i*3+1] = r * Math.sin(φ) * 0.6;
      partPos[i*3+2] = r * Math.sin(θ) * Math.cos(φ) - 10;

      const c = palette[Math.floor(Math.random() * palette.length)];
      partCol[i*3] = c[0]; partCol[i*3+1] = c[1]; partCol[i*3+2] = c[2];

      partVel[i*3]   = (Math.random() - 0.5) * 0.012;
      partVel[i*3+1] = (Math.random() - 0.5) * 0.008;
      partVel[i*3+2] = (Math.random() - 0.5) * 0.004;
    }

    // Glowing sprite texture
    const spCvs = document.createElement('canvas');
    spCvs.width = spCvs.height = 64;
    const spCtx = spCvs.getContext('2d');
    const spGrad = spCtx.createRadialGradient(32,32,0,32,32,32);
    spGrad.addColorStop(0,   'rgba(255,255,255,1)');
    spGrad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    spGrad.addColorStop(1,   'rgba(255,255,255,0)');
    spCtx.fillStyle = spGrad;
    spCtx.fillRect(0,0,64,64);

    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    partGeo.setAttribute('color',    new THREE.BufferAttribute(partCol, 3));
    const partMat = new THREE.PointsMaterial({
      size: 1.4, map: new THREE.CanvasTexture(spCvs),
      vertexColors: true, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // ── Resize ───────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ── Animate lights orbiting (creates chrome-like reflections) ────
    let t = 0;
    const lightRefs = scene.children.filter(c => c.isPointLight);

    // Return per-frame function
    const partPositions = partGeo.attributes.position.array;

    let targetRotY = 0;
    let currentRotY = 0;

    // Expose targetRotY update to scroll handler
    scene._setTargetRotY = (v) => { targetRotY = v; };

    return function renderFrame() {
      t += 0.008;

      // Lerp torus group toward scroll angle
      currentRotY += (targetRotY - currentRotY) * 0.06;
      torusGroup.rotation.y = currentRotY;

      // Slow ambient tilt on the torus mesh itself (gives life)
      torus.rotation.x = Math.sin(t * 0.35) * 0.18;
      torus.rotation.z = Math.cos(t * 0.28) * 0.06;

      // Gently orbit two of the point lights for dynamic specular
      const lightList = scene.children.filter(c => c.isPointLight);
      if (lightList[0]) {
        lightList[0].position.x =  Math.sin(t * 0.5) * 12 + 4;
        lightList[0].position.y =  Math.cos(t * 0.4) * 8;
      }
      if (lightList[1]) {
        lightList[1].position.x = -Math.cos(t * 0.4) * 10 - 4;
        lightList[1].position.y =  Math.sin(t * 0.3) * 6;
      }

      // Drift particles
      for (let i = 0; i < PART_COUNT; i++) {
        partPositions[i*3]   += partVel[i*3];
        partPositions[i*3+1] += partVel[i*3+1];
        partPositions[i*3+2] += partVel[i*3+2];
        // Wrap
        if (partPositions[i*3]   >  80) partPositions[i*3]   = -80;
        if (partPositions[i*3]   < -80) partPositions[i*3]   =  80;
        if (partPositions[i*3+1] >  40) partPositions[i*3+1] = -40;
        if (partPositions[i*3+1] < -40) partPositions[i*3+1] =  40;
      }
      partGeo.attributes.position.needsUpdate = true;

      // Subtle camera drift
      camera.position.x = Math.sin(t * 0.1) * 0.6;
      camera.position.y = Math.cos(t * 0.08) * 0.4;

      renderer.render(scene, camera);
    };
  }

  // ── Section switching ─────────────────────────────────────────────────────

  function goToSection(idx) {
    if (idx === currentSection) return;
    currentSection = idx;

    // Swap main section panels
    sections.forEach((s, i) => {
      const wasActive = s.classList.contains('active');
      s.classList.toggle('active', i === idx);
      // Trigger scramble on title when section becomes active
      if (i === idx && !wasActive) {
        const titleEl = s.querySelector('.sec__title');
        if (titleEl) {
          // Preserve <br> as \n so scramble restores line breaks correctly
          const raw = titleEl.innerHTML
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .trim();
          scrambleText(titleEl, raw, 700);
        }
      }
    });

    // Swap aux panels
    auxPanels.forEach((p, i) => p.classList.toggle('active', i === idx));

    dots.forEach((d, i) => d.classList.toggle('active', i === idx));

    if (zoneEl)    zoneEl.textContent    = zones[idx];
    if (counterEl) counterEl.textContent = String(idx + 1).padStart(2,'0') + ' / 08';
  }

  // ── Scroll handler ────────────────────────────────────────────────────────

  let renderFrame = null;
  let sceneRef = null;

  window.addEventListener('scroll', () => {
    const scrollY   = window.scrollY;
    const vh        = window.innerHeight;
    const maxScroll = (SECTION_COUNT - 1) * vh;

    scrollProgress = scrollY / vh;            // 0..7
    scrollFraction = Math.min(1, scrollY / maxScroll);

    if (progressBar) progressBar.style.width = (scrollFraction * 100) + '%';

    const idx = Math.min(SECTION_COUNT - 1, Math.max(0, Math.round(scrollProgress)));
    goToSection(idx);

    // Drive torus rotation: 45° per section = π/4 per section
    if (sceneRef && sceneRef._setTargetRotY) {
      sceneRef._setTargetRotY(scrollProgress * (Math.PI / 4));
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
        setTimeout(() => { copyBtn.textContent = '[COPY]'; copyBtn.classList.remove('copied'); }, 2000);
      });
    });
  }

  // ── Boot screen ───────────────────────────────────────────────────────────

  const boot = document.getElementById('boot');
  if (boot) {
    setTimeout(() => {
      boot.classList.add('out');
      setTimeout(() => boot.remove(), 900);
    }, 2600);
  }

  // ── Init + rAF loop ───────────────────────────────────────────────────────

  sceneRef = (typeof THREE !== 'undefined') ? document.getElementById('bg-canvas')._scene = {} : {};
  renderFrame = initScene();

  // Patch: initScene returns the render fn but we need the scene ref for scroll.
  // Re-init cleanly:
  (function () {
    if (typeof THREE === 'undefined') return;

    const canvas   = document.getElementById('bg-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x01101e, 1);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x01101e, 0.012);

    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 0, 24);

    // Lights
    const lightDefs = [
      { col: 0xffffff, int: 3.0, pos: [8,   6,  14] },
      { col: 0x00d4ff, int: 4.0, pos: [-12, 2,  10] },
      { col: 0x4466ff, int: 2.5, pos: [10, -8,   8] },
      { col: 0x7b3fff, int: 2.0, pos: [-8,  8,  -8] },
      { col: 0x00d4ff, int: 1.5, pos: [0, -12,   6] },
      { col: 0xffffff, int: 1.0, pos: [0,   0, -15] },
    ];
    const movingLights = [];
    lightDefs.forEach(({ col, int, pos }, i) => {
      const l = new THREE.PointLight(col, int, 80);
      l.position.set(...pos);
      scene.add(l);
      if (i < 2) movingLights.push(l);
    });
    scene.add(new THREE.AmbientLight(0x06162a, 2));

    // Chrome torus
    const torusGeo = new THREE.TorusGeometry(7, 2.2, 128, 256);
    const torusMat = new THREE.MeshPhongMaterial({
      color:     new THREE.Color(0x081c36),
      emissive:  new THREE.Color(0x020c1a),
      specular:  new THREE.Color(0xaaddff),
      shininess: 700,
      side:      THREE.DoubleSide,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);

    // Glow halos
    [[2.6, 0.055, 0x0066cc], [3.4, 0.028, 0x0044aa], [4.6, 0.010, 0x002266]].forEach(([tube, op, col]) => {
      torus.add(new THREE.Mesh(
        new THREE.TorusGeometry(7, tube, 32, 64),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      ));
    });

    // Inner portal disc
    torus.add(new THREE.Mesh(
      new THREE.CircleGeometry(4.8, 64),
      new THREE.MeshBasicMaterial({ color: 0x003d7a, transparent: true, opacity: 0.22,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    ));

    const torusGroup = new THREE.Group();
    torusGroup.add(torus);
    torusGroup.position.set(3.5, 0, 0);
    scene.add(torusGroup);

    // Particles
    const N  = 1600;
    const pp = new Float32Array(N * 3);
    const pc = new Float32Array(N * 3);
    const pv = new Float32Array(N * 3);
    const pal = [[0,0.83,1],[0.48,0.4,1],[0.1,0.5,1],[0,0.6,0.9]];
    for (let i = 0; i < N; i++) {
      const r = 18 + Math.random() * 55;
      const θ = Math.random() * Math.PI * 2;
      const φ = (Math.random() - 0.5) * Math.PI;
      pp[i*3]   = r * Math.cos(θ) * Math.cos(φ);
      pp[i*3+1] = r * Math.sin(φ) * 0.55;
      pp[i*3+2] = r * Math.sin(θ) * Math.cos(φ) - 8;
      const c = pal[Math.floor(Math.random() * 4)];
      pc[i*3]=c[0]; pc[i*3+1]=c[1]; pc[i*3+2]=c[2];
      pv[i*3]   = (Math.random()-0.5)*0.01;
      pv[i*3+1] = (Math.random()-0.5)*0.007;
      pv[i*3+2] = (Math.random()-0.5)*0.004;
    }
    const spCvs = document.createElement('canvas');
    spCvs.width = spCvs.height = 64;
    const spCtx = spCvs.getContext('2d');
    const spG   = spCtx.createRadialGradient(32,32,0,32,32,32);
    spG.addColorStop(0,'rgba(255,255,255,1)');
    spG.addColorStop(0.35,'rgba(255,255,255,0.5)');
    spG.addColorStop(1,'rgba(255,255,255,0)');
    spCtx.fillStyle = spG; spCtx.fillRect(0,0,64,64);

    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    partGeo.setAttribute('color',    new THREE.BufferAttribute(pc, 3));
    scene.add(new THREE.Points(partGeo, new THREE.PointsMaterial({
      size: 1.3, map: new THREE.CanvasTexture(spCvs),
      vertexColors: true, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    })));

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Patch scroll handler to reach scene
    sceneRef._setTargetRotY = (v) => { _targetRotY = v; };

    let _targetRotY  = 0;
    let _currentRotY = 0;
    let t = 0;
    const posArr = partGeo.attributes.position.array;

    function loop() {
      t += 0.008;

      // Torus scroll rotation
      _currentRotY += (_targetRotY - _currentRotY) * 0.06;
      torusGroup.rotation.y = _currentRotY;

      // Ambient tilt
      torus.rotation.x = Math.sin(t * 0.35) * 0.18;
      torus.rotation.z = Math.cos(t * 0.28) * 0.06;

      // Orbiting lights (create moving specular)
      movingLights[0].position.x = Math.sin(t * 0.45) * 14 + 4;
      movingLights[0].position.y = Math.cos(t * 0.38) * 9;
      movingLights[1].position.x = -Math.cos(t * 0.38) * 12 - 4;
      movingLights[1].position.y = Math.sin(t * 0.30) * 7;

      // Particle drift + wrap
      for (let i = 0; i < N; i++) {
        posArr[i*3]   += pv[i*3];
        posArr[i*3+1] += pv[i*3+1];
        posArr[i*3+2] += pv[i*3+2];
        if (posArr[i*3]   >  80) posArr[i*3]   = -80;
        if (posArr[i*3]   < -80) posArr[i*3]   =  80;
        if (posArr[i*3+1] >  40) posArr[i*3+1] = -40;
        if (posArr[i*3+1] < -40) posArr[i*3+1] =  40;
      }
      partGeo.attributes.position.needsUpdate = true;

      // Subtle camera drift
      camera.position.x = Math.sin(t * 0.09) * 0.7;
      camera.position.y = Math.cos(t * 0.07) * 0.45;

      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }

    loop();
  })();

})();
