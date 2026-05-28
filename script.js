// ============================================================================
// PRABH.OS — script.js
// Babylon.js atmospheric background + IntersectionObserver card reveals
// ============================================================================

(function () {
  'use strict';

  // ── Babylon.js 3D background scene ───────────────────────────────────────

  const canvas = document.getElementById('renderCanvas');
  let engine, scene;

  function initBabylon() {
    if (typeof BABYLON === 'undefined') return;

    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0.03, 1);

    // Camera — fixed, slight tilt, no user control on scroll
    const camera = new BABYLON.ArcRotateCamera('cam',
      -Math.PI / 2, Math.PI / 3, 80, BABYLON.Vector3.Zero(), scene);

    // Ambient
    const ambient = new BABYLON.HemisphericLight('amb',
      new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.15;
    ambient.diffuse = new BABYLON.Color3(0.1, 0.4, 0.6);

    // Dynamic neon point lights
    const lightC = new BABYLON.PointLight('lc',
      new BABYLON.Vector3(30, 20, 20), scene);
    lightC.diffuse = new BABYLON.Color3(0, 1, 1);
    lightC.intensity = 0.6;
    lightC.range = 120;

    const lightM = new BABYLON.PointLight('lm',
      new BABYLON.Vector3(-30, -20, 20), scene);
    lightM.diffuse = new BABYLON.Color3(1, 0, 1);
    lightM.intensity = 0.5;
    lightM.range = 120;

    // Wireframe floating shapes
    const shapes = [];
    const shapeData = [
      { type: 'ico',  size: 8,  pos: [28, 12, -15],  speed: 0.4,  col: [0, 1, 1] },
      { type: 'oct',  size: 10, pos: [-25, -10, -20], speed: 0.3,  col: [1, 0, 1] },
      { type: 'ico',  size: 5,  pos: [0, 28, -25],   speed: 0.6,  col: [1, 0.85, 0] },
      { type: 'oct',  size: 6,  pos: [-18, 20, -10],  speed: 0.25, col: [0, 1, 1] },
      { type: 'ico',  size: 4,  pos: [20, -20, -18],  speed: 0.5,  col: [1, 0, 1] },
    ];

    shapeData.forEach(d => {
      const mat = new BABYLON.StandardMaterial('m', scene);
      mat.emissiveColor = new BABYLON.Color3(...d.col);
      mat.wireframe = true;

      const mesh = d.type === 'ico'
        ? BABYLON.MeshBuilder.CreateIcoSphere('s', { radius: d.size, subdivisions: 2 }, scene)
        : BABYLON.MeshBuilder.CreatePolyhedron('s', { type: 3, size: d.size }, scene);

      mesh.position = new BABYLON.Vector3(...d.pos);
      mesh.material = mat;
      mesh.isPickable = false;
      shapes.push({ mesh, ...d, t: Math.random() * Math.PI * 2 });
    });

    // Particle system — volumetric dust
    const ps = new BABYLON.ParticleSystem('ps', 1800, scene);

    // Build circular texture
    const ptex = new BABYLON.DynamicTexture('ptex', { width: 64, height: 64 }, scene);
    const pctx = ptex.getContext();
    const g = pctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, 64, 64);
    ptex.update();
    ps.particleTexture = ptex;

    const emitterMesh = BABYLON.MeshBuilder.CreateBox('e', { size: 0.01 }, scene);
    emitterMesh.isVisible = false;
    ps.emitter = emitterMesh;
    ps.minEmitBox = new BABYLON.Vector3(-40, -35, -40);
    ps.maxEmitBox = new BABYLON.Vector3(40, 35, 40);
    ps.minSize = 0.25;
    ps.maxSize = 0.9;
    ps.minLifeTime = 3;
    ps.maxLifeTime = 6;
    ps.emitRate = 120;
    ps.minEmitPower = 0.3;
    ps.maxEmitPower = 1.2;
    ps.gravity = new BABYLON.Vector3(0, 0.05, 0);

    // Alternating cyan/magenta particles
    ps.addColorGradient(0,   new BABYLON.Color4(0, 1, 1, 0));
    ps.addColorGradient(0.2, new BABYLON.Color4(0, 1, 1, 0.5));
    ps.addColorGradient(0.5, new BABYLON.Color4(1, 0, 1, 0.35));
    ps.addColorGradient(0.8, new BABYLON.Color4(0, 1, 1, 0.3));
    ps.addColorGradient(1.0, new BABYLON.Color4(0, 1, 1, 0));
    ps.start();

    // Grid floor
    const gridMat = new BABYLON.StandardMaterial('grid', scene);
    gridMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0.4);
    gridMat.wireframe = true;
    gridMat.alpha = 0.15;
    const grid = BABYLON.MeshBuilder.CreateGround('grid',
      { width: 120, height: 120, subdivisions: 20 }, scene);
    grid.position.y = -35;
    grid.material = gridMat;
    grid.isPickable = false;

    // Render loop
    let t = 0;
    engine.runRenderLoop(() => {
      t += 0.012;

      // Animate floating shapes
      shapes.forEach(s => {
        s.mesh.rotation.x += 0.003 * s.speed;
        s.mesh.rotation.y += 0.005 * s.speed;
        s.mesh.position.y = s.pos[1] + Math.sin(t * s.speed + s.t) * 3;
      });

      // Animate lights
      lightC.position.x = Math.sin(t * 0.4) * 35;
      lightC.position.y = Math.cos(t * 0.3) * 25;
      lightM.position.x = Math.cos(t * 0.35) * 35;
      lightM.position.y = Math.sin(t * 0.28) * 25;

      // Slow camera orbit
      camera.alpha += 0.0008;

      scene.render();
    });

    window.addEventListener('resize', () => engine.resize());
  }

  // ── Card reveal with IntersectionObserver ─────────────────────────────────

  const scenes   = document.querySelectorAll('.scene');
  const dots     = document.querySelectorAll('.dot');
  const zoneEl   = document.getElementById('zone');
  const counterEl = document.getElementById('section-counter');
  const progressBar = document.getElementById('progress-bar');
  const total    = scenes.length;

  let current = 0;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const card = entry.target.querySelector('.card');
      if (entry.isIntersecting) {
        const idx = parseInt(entry.target.dataset.idx);
        current = idx;

        // Reveal card
        card.classList.remove('out');
        card.classList.add('visible');

        // Update HUD
        zoneEl.textContent  = entry.target.dataset.zone;
        counterEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' +
                                String(total).padStart(2, '0');

        // Highlight dot
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      } else {
        card.classList.remove('visible');
      }
    });
  }, {
    threshold: 0.45,
  });

  scenes.forEach(s => observer.observe(s));

  // ── Scroll progress bar ───────────────────────────────────────────────────

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
  }, { passive: true });

  // ── Dot-nav click scrolls to section ─────────────────────────────────────

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.idx);
      scenes[idx].scrollIntoView({ behavior: 'smooth' });
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

  function initBoot() {
    const boot = document.getElementById('boot');
    setTimeout(() => {
      boot.classList.add('out');
      setTimeout(() => boot.remove(), 900);
    }, 2600);
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  initBoot();
  initBabylon();

})();
