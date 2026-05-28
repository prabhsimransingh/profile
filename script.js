// ============================================================================
// PRABH.OS — script.js
// Three.js cinematic intro: camera flies IN toward torus (far → close)
// Small preloader ring + sweeping arc trails disappear when torus arrives
// ============================================================================

(function () {
  'use strict';

  const SECTION_COUNT = 8;
  const zones = ['IDENTITY','PROFILE','CAPABILITIES','ARCHIVE',
                  'TIMELINE','TRANSMISSIONS','CREDENTIALS','INTERFACE'];

  const sections    = document.querySelectorAll('.sec');
  const auxPanels   = document.querySelectorAll('.aux-panel');
  const dots        = document.querySelectorAll('.dot');
  const zoneEl      = document.getElementById('zone');
  const counterEl   = document.getElementById('section-counter');
  const progressBar = document.getElementById('progress-bar');
  const contentPanel = document.getElementById('content-panel');

  let currentSection = 0;
  let scrollProgress = 0;
  let scrollFraction = 0;

  // ── Text scramble ─────────────────────────────────────────────────────────
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*';
  function scrambleText(el, finalText, ms) {
    ms = ms || 650;
    const lines  = finalText.split('\n');
    const frames = Math.round(ms / 16);
    let f = 0;
    if (el._st) clearInterval(el._st);
    el._st = setInterval(() => {
      const p = f / frames;
      el.innerHTML = lines.map(line =>
        line.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < p * line.length) return `<span>${ch}</span>`;
          return `<span style="opacity:.3;color:var(--cyan)">${CHARS[Math.floor(Math.random()*CHARS.length)]}</span>`;
        }).join('')
      ).join('<br>');
      if (++f >= frames) { clearInterval(el._st); el.innerHTML = lines.map(l=>`<span>${l}</span>`).join('<br>'); }
    }, 16);
  }

  // ── Section switching ─────────────────────────────────────────────────────
  function goToSection(idx) {
    if (idx === currentSection) return;
    currentSection = idx;
    sections.forEach((s,i) => {
      const was = s.classList.contains('active');
      s.classList.toggle('active', i===idx);
      if (i===idx && !was) {
        const t = s.querySelector('.sec__title');
        if (t) scrambleText(t, t.innerHTML.replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').trim(), 700);
      }
    });
    auxPanels.forEach((p,i) => p.classList.toggle('active', i===idx));
    dots.forEach((d,i) => d.classList.toggle('active', i===idx));
    if (zoneEl)    zoneEl.textContent    = zones[idx];
    if (counterEl) counterEl.textContent = String(idx+1).padStart(2,'0')+' / 08';
  }

  // ── Scroll ────────────────────────────────────────────────────────────────
  let _setTargetRotY = null;

  window.addEventListener('scroll', () => {
    const sy = window.scrollY, vh = window.innerHeight;
    const max = (SECTION_COUNT-1)*vh;
    scrollProgress = sy/vh;
    scrollFraction = Math.min(1, sy/max);
    if (progressBar) progressBar.style.width = (scrollFraction*100)+'%';
    const idx = Math.min(SECTION_COUNT-1, Math.max(0, Math.round(scrollProgress)));
    goToSection(idx);
    if (_setTargetRotY) _setTargetRotY(scrollProgress*(Math.PI/4));
  }, { passive:true });

  // ── Dot nav ───────────────────────────────────────────────────────────────
  dots.forEach((d,i) => d.addEventListener('click', () =>
    window.scrollTo({ top: i*window.innerHeight, behavior:'smooth' })));

  // ── Copy ──────────────────────────────────────────────────────────────────
  const copyBtn = document.getElementById('copy');
  if (copyBtn) copyBtn.addEventListener('click', () =>
    navigator.clipboard.writeText('prabh_simran@hotmail.com').then(() => {
      copyBtn.textContent='[COPIED!]'; copyBtn.classList.add('copied');
      setTimeout(()=>{ copyBtn.textContent='[COPY]'; copyBtn.classList.remove('copied'); },2000);
    }));

  // Hide content panel until Three.js intro completes
  if (contentPanel) { contentPanel.style.opacity='0'; contentPanel.style.transition='opacity 1.2s ease'; }

  // Reset any stale card transforms from previous sessions
  sections.forEach(s => { s.style.transform = ''; });

  // ── Boot arc canvas preloader ─────────────────────────────────────────────
  // Draws: small glowing ring + two sweeping comet arc trails
  // Sits on top of the THREE.js canvas (which renders behind the boot overlay)
  let _bootArcRAF = null;
  (function initBootArc() {
    const arcEl = document.getElementById('boot-arc');
    if (!arcEl) return;
    const bCtx = arcEl.getContext('2d');
    let bT = 0;

    function resize() {
      arcEl.width  = window.innerWidth;
      arcEl.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function frame() {
      bT += 0.016;
      const bW = arcEl.width, bH = arcEl.height;
      const cx = bW / 2, cy = bH / 2;
      bCtx.clearRect(0, 0, bW, bH);

      // ── Small centered glowing ring ───────────────────────────────
      const R = 52;

      // Outer soft glow
      bCtx.save();
      bCtx.shadowColor = 'rgba(0,212,255,0.8)';
      bCtx.shadowBlur  = 22;
      bCtx.beginPath(); bCtx.arc(cx, cy, R, 0, Math.PI*2);
      bCtx.strokeStyle = 'rgba(0,212,255,0.0)';
      bCtx.lineWidth   = 14;
      bCtx.stroke();
      bCtx.restore();

      // Main ring
      bCtx.beginPath(); bCtx.arc(cx, cy, R, 0, Math.PI*2);
      bCtx.strokeStyle = 'rgba(0,212,255,0.9)';
      bCtx.lineWidth   = 1.8;
      bCtx.stroke();

      // Inner ring
      bCtx.beginPath(); bCtx.arc(cx, cy, R - 15, 0, Math.PI*2);
      bCtx.strokeStyle = 'rgba(0,180,220,0.30)';
      bCtx.lineWidth   = 1;
      bCtx.stroke();

      // Pulsing ring segment (animated arc on top)
      const arcStart = bT * 1.8;
      bCtx.beginPath();
      bCtx.arc(cx, cy, R, arcStart, arcStart + 1.1);
      bCtx.strokeStyle = 'rgba(180,240,255,0.85)';
      bCtx.lineWidth   = 2.5;
      bCtx.stroke();

      // ── Two sweeping comet arc trails ─────────────────────────────
      // Each arc is a quadratic bezier from top-to-bottom through center,
      // bowed sideways — they rotate slowly, 180° apart.
      const arcH = bH * 0.40; // half-length of each arc

      for (let i = 0; i < 2; i++) {
        const rot = bT * 0.32 + i * Math.PI;
        bCtx.save();
        bCtx.translate(cx, cy);
        bCtx.rotate(rot);

        // Build gradient: tail (faint) → head (bright)
        const grad = bCtx.createLinearGradient(0, -arcH, 0, arcH);
        grad.addColorStop(0,   'rgba(0,212,255,0.0)');
        grad.addColorStop(0.35,'rgba(0,212,255,0.08)');
        grad.addColorStop(0.72,'rgba(80,200,255,0.45)');
        grad.addColorStop(0.90,'rgba(160,230,255,0.75)');
        grad.addColorStop(1,   'rgba(220,245,255,0.95)');

        bCtx.beginPath();
        // Quadratic bezier: top → bowed-right midpoint → bottom
        bCtx.moveTo(0, -arcH);
        bCtx.quadraticCurveTo(arcH * 0.32, 0, 0, arcH);
        bCtx.strokeStyle = grad;
        bCtx.lineWidth   = 1.6;
        bCtx.stroke();

        // Bright comet head dot at the tip
        bCtx.beginPath();
        bCtx.arc(0, arcH, 2.5, 0, Math.PI*2);
        bCtx.fillStyle = 'rgba(220,245,255,0.95)';
        bCtx.fill();

        bCtx.restore();
      }

      _bootArcRAF = requestAnimationFrame(frame);
    }

    frame();
  })();

  // ── Three.js scene ────────────────────────────────────────────────────────
  (function initThree() {
    if (typeof THREE === 'undefined') {
      if (contentPanel) contentPanel.style.opacity='1';
      const b = document.getElementById('boot');
      if (b) { b.classList.add('out'); setTimeout(()=>b.remove(),1000); }
      return;
    }

    const canvas   = document.getElementById('bg-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha:false, antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000608, 1);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000608, 0.008);

    // Camera starts FAR (z=90, torus tiny) — flies IN to z=22
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 400);
    camera.position.set(0, 0, 90);

    // ── Lighting ─────────────────────────────────────────────────────
    const keyLight = new THREE.DirectionalLight(0xffffff, 8);
    keyLight.position.set(6, 8, 12);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x00d4ff, 5, 80);
    fillLight.position.set(-14, 2, 10);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x4488ff, 3, 60);
    rimLight.position.set(10, -6, -8);
    scene.add(rimLight);

    const backLight = new THREE.PointLight(0x7733ff, 1.5, 60);
    backLight.position.set(-8, 8, -12);
    scene.add(backLight);

    // Explosion flash light — activated at flythrough moment
    const flashLight = new THREE.PointLight(0x00eeff, 0, 120);
    flashLight.position.set(0, 0, 0);
    scene.add(flashLight);

    scene.add(new THREE.AmbientLight(0x0a2040, 4));

    // ── Per-section accent colors (for shards, pillar, light) ────────
    const SECTION_COLORS = [
      0x00d4ff, 0x0088ff, 0x44ddaa, 0xff8833,
      0xffbb00, 0xff44bb, 0xaa44ff, 0x00ffdd,
    ];

    // ── Per-section scene background colors (richer, not pure black) ─
    const BG_COLORS = [
      new THREE.Color(0x001428), // IDENTITY:      rich navy
      new THREE.Color(0x00200e), // PROFILE:       rich forest
      new THREE.Color(0x100638), // CAPABILITIES:  rich violet
      new THREE.Color(0x280e00), // ARCHIVE:       rich amber
      new THREE.Color(0x2a000c), // TIMELINE:      rich crimson
      new THREE.Color(0x00201c), // TRANSMISSIONS: rich teal
      new THREE.Color(0x0e0030), // CREDENTIALS:   rich indigo
      new THREE.Color(0x003030), // INTERFACE:     rich cyan
    ];

    // ── Chrome torus ──────────────────────────────────────────────────
    const torusGeo = new THREE.TorusGeometry(9, 2.4, 128, 256);
    const torusMat = new THREE.MeshPhongMaterial({
      color:       new THREE.Color(0x061828),
      emissive:    new THREE.Color(0x010810),
      specular:    new THREE.Color(0xffffff),
      shininess:   1200,
      side:        THREE.DoubleSide,
      transparent: true,
      opacity:     1,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);

    // Glow halos — store base opacity on userData for scroll-driven fade
    [[2.8, 0.06, 0x003388],[3.8, 0.025, 0x002266],[5.5, 0.008, 0x001144]].forEach(([tube,op,col]) => {
      const mat = new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:op,
        blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
      mat.userData.baseOp = op;
      torus.add(new THREE.Mesh(new THREE.TorusGeometry(9, tube, 32, 64), mat));
    });

    // Inner portal disc
    const discMat = new THREE.MeshBasicMaterial({ color:0x002255, transparent:true, opacity:0.25,
      blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
    discMat.userData.baseOp = 0.25;
    torus.add(new THREE.Mesh(new THREE.CircleGeometry(6.5, 64), discMat));

    const torusGroup = new THREE.Group();
    torusGroup.add(torus);
    torusGroup.position.set(0, 0, 0);
    scene.add(torusGroup);

    // ── Vertical light pillar (backbone) ─────────────────────────────
    const pillarMat = new THREE.MeshBasicMaterial({ color:0x00d4ff, transparent:true, opacity:0.18,
      blending:THREE.AdditiveBlending, depthWrite:false });
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 80, 8), pillarMat);
    pillar.position.set(0,0,0);
    scene.add(pillar);

    // ── Per-section crystal shard columns ─────────────────────────────
    // 18 OctahedronGeometry shards per section, orbiting + bobbing along pillar
    const shardGroups = SECTION_COLORS.map((hex, si) => {
      const group = new THREE.Group();
      const col = new THREE.Color(hex);
      for (let i = 0; i < 18; i++) {
        const scale = 0.18 + Math.random() * 0.48;
        const geo = new THREE.OctahedronGeometry(scale, 0);
        const mat = new THREE.MeshPhongMaterial({
          color: col.clone(), emissive: col.clone().multiplyScalar(0.25),
          specular: new THREE.Color(0xffffff), shininess: 100,
          transparent: true, opacity: 0, side: THREE.DoubleSide,
        });
        mat.userData.baseOp = 0.55 + Math.random() * 0.4;
        const pAngle  = (i / 18) * Math.PI * 2;
        const pHeight = 2 + (i / 17) * 13;
        const pRadius = 0.3 + Math.random() * 1.6;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          Math.cos(pAngle) * pRadius,
          pHeight,
          Math.sin(pAngle) * pRadius - 1
        );
        mesh.userData = {
          pAngle, pHeight, pRadius,
          orbitSpeed: 0.12 + Math.random() * 0.22,
          rotSpeed: new THREE.Vector3(
            0.008 + Math.random() * 0.018,
            0.012 + Math.random() * 0.018,
            0.004 + Math.random() * 0.008
          ),
          bobPhase: Math.random() * Math.PI * 2,
        };
        group.add(mesh);
      }
      group.visible = false;
      group.userData.fadeOp = 0;
      scene.add(group);
      return group;
    });

    // Section accent point light — shifts color per active section
    const sectionLight = new THREE.PointLight(0x00d4ff, 0, 60);
    sectionLight.position.set(0, -2, 2);
    scene.add(sectionLight);

    // Equator rings
    const eqMeshes = [];
    const eqGeo = new THREE.TorusGeometry(0.15, 0.06, 8, 32);
    [9, -9].forEach(y => {
      const mat = new THREE.MeshBasicMaterial({ color:0x00ffff, transparent:true, opacity:0.5,
        blending:THREE.AdditiveBlending, depthWrite:false });
      const eq = new THREE.Mesh(eqGeo, mat);
      eq.rotation.x = Math.PI/2; eq.position.y = y;
      eqMeshes.push(eq);
      scene.add(eq);
    });

    // ── Particle field ────────────────────────────────────────────────
    const N   = 2200;
    const pp  = new Float32Array(N*3);
    const pc  = new Float32Array(N*3);
    const pv  = new Float32Array(N*3);
    const pev = new Float32Array(N*3); // explosion velocity

    const pal = [[0,0.83,1],[0.3,0.5,1],[0.6,0.4,1],[0,0.6,0.9],[0.1,0.9,0.8]];

    for (let i=0; i<N; i++) {
      const r = 5 + Math.random()*70;
      const θ = Math.random()*Math.PI*2, φ = (Math.random()-0.5)*Math.PI;
      pp[i*3]   = r*Math.cos(θ)*Math.cos(φ);
      pp[i*3+1] = r*Math.sin(φ)*0.5;
      pp[i*3+2] = r*Math.sin(θ)*Math.cos(φ) - 5;

      const len = Math.sqrt(pp[i*3]**2+pp[i*3+1]**2+pp[i*3+2]**2);
      pev[i*3]   = (pp[i*3]/len)   * (0.15+Math.random()*0.25);
      pev[i*3+1] = (pp[i*3+1]/len) * (0.15+Math.random()*0.25);
      pev[i*3+2] = (pp[i*3+2]/len) * (0.08+Math.random()*0.12);

      const c = pal[Math.floor(Math.random()*pal.length)];
      pc[i*3]=c[0]; pc[i*3+1]=c[1]; pc[i*3+2]=c[2];

      pv[i*3]   = (Math.random()-0.5)*0.012;
      pv[i*3+1] = (Math.random()-0.5)*0.008;
      pv[i*3+2] = (Math.random()-0.5)*0.004;
    }

    const spCvs = document.createElement('canvas');
    spCvs.width = spCvs.height = 64;
    const spCtx = spCvs.getContext('2d');
    const spG   = spCtx.createRadialGradient(32,32,0,32,32,32);
    spG.addColorStop(0,'rgba(255,255,255,1)');
    spG.addColorStop(0.35,'rgba(255,255,255,0.55)');
    spG.addColorStop(1,'rgba(255,255,255,0)');
    spCtx.fillStyle=spG; spCtx.fillRect(0,0,64,64);

    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    partGeo.setAttribute('color',    new THREE.BufferAttribute(pc, 3));
    const partMat = new THREE.PointsMaterial({
      size:1.8, map:new THREE.CanvasTexture(spCvs),
      vertexColors:true, transparent:true, opacity:0.85,
      blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true,
    });
    scene.add(new THREE.Points(partGeo, partMat));

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let _targetRotY=0, _currentRotY=0;
    _setTargetRotY = v => { _targetRotY=v; };

    // Smooth-scrolled position for fluid card motion (lerped toward scrollProgress)
    let smoothScroll = 0;

    // ── Intro: camera flies IN from far (z=90) to close (z=22) ───────
    // At z=90 torus appears as tiny ring → matches boot preloader ring visual
    // Explosion peaks at p≈0.75 (flythrough moment), then boot fades
    const INTRO_DUR   = 3.5;
    const CAM_START_Z = 90;
    const CAM_END_Z   = 22;
    let introT        = 0;
    let introComplete = false;
    let bootFaded     = false;

    // ── Render loop ───────────────────────────────────────────────────
    let t=0;
    const posArr = partGeo.attributes.position.array;

    function loop() {
      t += 0.008;

      // ── Camera fly-in intro ───────────────────────────────────────
      if (!introComplete) {
        introT += 0.016;
        const p  = Math.min(1, introT / INTRO_DUR);
        // ease-in-out: camera accelerates then decelerates into position
        const e  = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2;
        camera.position.z = CAM_START_Z + (CAM_END_Z - CAM_START_Z) * e;

        // Particle explosion: peaks when camera "passes through" torus area
        // (p ≈ 0.7-0.85, i.e. camera near z=35-22)
        const explodeStrength = Math.max(0,
          Math.sin(Math.PI * Math.max(0, Math.min(1, (p - 0.55) / 0.35)))
        );
        // Strong explosion — fills screen like reference (5x particle push)
        for (let i=0; i<N; i++) {
          posArr[i*3]   += pev[i*3]   * explodeStrength * 5;
          posArr[i*3+1] += pev[i*3+1] * explodeStrength * 5;
          posArr[i*3+2] += pev[i*3+2] * explodeStrength * 5;
        }
        // Blinding flash at peak
        flashLight.intensity = explodeStrength * 90;
        partMat.size = 1.5 + explodeStrength * 4;

        // Fade out the boot overlay as explosion peaks (p=0.72), then
        // remove it after fade completes
        if (p >= 0.72 && !bootFaded) {
          bootFaded = true;
          const b = document.getElementById('boot');
          if (b) {
            b.classList.add('out');
            setTimeout(() => {
              b.remove();
              if (_bootArcRAF) cancelAnimationFrame(_bootArcRAF);
            }, 1000);
          }
        }

        if (p >= 1) {
          introComplete = true;
          if (contentPanel) contentPanel.style.opacity = '1';
          flashLight.intensity = 0;
        }
      }

      // ── True 3D Y-axis orbit around the column ────────────────────────
      // Cards orbit the vertical pillar in 3D — each card physically travels
      // in a circular arc: left-facing → sweeps sideways around the column
      // → disappears behind it → next card emerges from the other side.
      // This is rotation around the Y axis (vertical column axis), not X.
      smoothScroll += (scrollProgress - smoothScroll) * 0.07;

      if (introComplete) {
        // Orbit radius = distance from card center to column center.
        // Column is at ~50vw, card center at ~3vw + 22vw = 25vw.
        // On a 1440px screen: (0.50 - 0.25) * 1440 ≈ 360px.
        const ORBIT_R = Math.round(window.innerWidth * 0.25);

        sections.forEach((s, i) => {
          const delta = smoothScroll - i;
          // 90° of Y-axis orbit per section — card is fully edge-on (invisible) at ±1
          const angle = delta * (Math.PI / 2);

          // X: card sweeps right as angle increases (past cards exit right)
          const tx = Math.sin(angle) * ORBIT_R;
          // Z: card recedes behind column as it orbits to the side
          const tz = (Math.cos(angle) - 1) * ORBIT_R;
          // Y: slight helix rise as card orbits (makes motion feel 3-dimensional)
          const ty = delta * -35;
          // Y-rotation: card face tracks the orbit so it stays readable while turning
          const ry = angle * (180 / Math.PI);

          // Opacity: clamp by DELTA distance (not orbit angle) so sections
          // that complete a full orbit never reappear at the front position.
          // Visible only within ±1 section of active — gone completely at ±1.
          const op = Math.max(0, 1 - Math.abs(delta) * 1.25);

          s.style.opacity       = op;
          s.style.transform     = `perspective(1100px) translateX(${tx}px) translateY(calc(-50% + ${ty}px)) translateZ(${tz}px) rotateY(${ry}deg)`;
          s.style.pointerEvents = Math.abs(delta) < 0.38 ? 'auto' : 'none';
        });
      }

      // ── Scene background floods with section color ─────────────────────
      if (introComplete) {
        const si  = Math.min(Math.floor(smoothScroll), SECTION_COUNT - 2);
        const sf  = Math.max(0, Math.min(1, smoothScroll - si));
        const bgC = BG_COLORS[si].clone().lerp(BG_COLORS[si + 1], sf);
        renderer.setClearColor(bgC);
        scene.fog.color.copy(bgC);
      }

      // ── Torus: visible only during intro (section 0), fades by section 1 ─
      const torusVis = introComplete ? Math.max(0, 1 - scrollProgress) : 1;
      torusMat.opacity = torusVis;
      torus.children.forEach(child => {
        if (child.material && child.material.userData.baseOp !== undefined)
          child.material.opacity = child.material.userData.baseOp * torusVis;
      });
      eqMeshes.forEach(m => { m.material.opacity = 0.5 * torusVis; });
      torusGroup.visible = torusVis > 0.01;
      eqMeshes.forEach(m => { m.visible = torusVis > 0.01; });

      // ── Backbone pillar — always visible after intro, colored per section ─
      pillarMat.color.setHex(SECTION_COLORS[currentSection]);
      pillarMat.opacity = introComplete ? 0.38 : torusVis * 0.18;
      pillar.visible    = true;

      // ── Torus rotation from scroll ─────────────────────────────────
      _currentRotY += (_targetRotY - _currentRotY) * 0.06;
      torusGroup.rotation.y = _currentRotY;

      // Ambient tilt for moving specular streaks
      torus.rotation.x = Math.sin(t*0.35)*0.18;
      torus.rotation.z = Math.cos(t*0.28)*0.06;

      // Orbit key + fill lights
      keyLight.position.x  =  Math.sin(t*0.4)*10 + 4;
      keyLight.position.y  =  Math.cos(t*0.3)*6  + 5;
      fillLight.position.x = -Math.cos(t*0.35)*12 - 4;
      fillLight.position.y =  Math.sin(t*0.28)*5;

      // Particle drift
      for (let i=0; i<N; i++) {
        posArr[i*3]   += pv[i*3];
        posArr[i*3+1] += pv[i*3+1];
        posArr[i*3+2] += pv[i*3+2];
        if (posArr[i*3]   >  90) posArr[i*3]   = -90;
        if (posArr[i*3]   < -90) posArr[i*3]   =  90;
        if (posArr[i*3+1] >  45) posArr[i*3+1] = -45;
        if (posArr[i*3+1] < -45) posArr[i*3+1] =  45;
      }
      partGeo.attributes.position.needsUpdate = true;

      // ── Per-section shard column — fades between adjacent sections ───
      shardGroups.forEach((group, si) => {
        // Show shards for any section within 1 step of smoothScroll
        const dist   = Math.abs(smoothScroll - si);
        const target = introComplete ? Math.max(0, 1 - dist * 1.4) : 0;
        group.userData.fadeOp += (target - group.userData.fadeOp) * 0.06;
        const fo = group.userData.fadeOp;
        group.visible = fo > 0.005;
        if (!group.visible) return;
        group.children.forEach(mesh => {
          const d = mesh.userData;
          d.pAngle += d.orbitSpeed * 0.01;
          mesh.position.x = Math.cos(d.pAngle) * d.pRadius;
          mesh.position.z = Math.sin(d.pAngle) * d.pRadius - 1;
          mesh.position.y = d.pHeight + Math.sin(t * 0.5 + d.bobPhase) * 0.5;
          mesh.rotation.x += d.rotSpeed.x;
          mesh.rotation.y += d.rotSpeed.y;
          mesh.rotation.z += d.rotSpeed.z;
          mesh.material.opacity = mesh.material.userData.baseOp * fo;
        });
      });

      // Section accent light: shift color per section
      sectionLight.color.setHex(SECTION_COLORS[currentSection]);
      sectionLight.intensity = introComplete ? 5 : 0;

      // Subtle camera drift after intro settles
      if (introComplete) {
        camera.position.x = Math.sin(t*0.09)*0.8;
        camera.position.y = Math.cos(t*0.07)*0.5;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }

    loop();
  })();

})();
