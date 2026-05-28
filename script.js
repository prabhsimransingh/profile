// ============================================================================
// PRABH.OS — script.js
// Three.js cinematic intro: camera flies out from inside torus
// Chrome ring centred on screen, text overlaps it (matching reference)
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

  // ── Boot: quick CSS fade, then Three.js intro takes over ─────────────────
  const boot = document.getElementById('boot');
  if (boot) setTimeout(() => { boot.classList.add('out'); setTimeout(()=>boot.remove(),900); }, 800);

  // Hide content panel until Three.js intro completes
  if (contentPanel) { contentPanel.style.opacity='0'; contentPanel.style.transition='opacity 1.2s ease'; }

  // ── Three.js scene ────────────────────────────────────────────────────────
  (function initThree() {
    if (typeof THREE === 'undefined') {
      if (contentPanel) contentPanel.style.opacity='1';
      return;
    }

    const canvas   = document.getElementById('bg-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha:false, antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x010d1a, 1);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x010d1a, 0.01);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 300);
    // Start INSIDE the torus, fly back to reveal it
    camera.position.set(0, 0, 4);

    // ── Lighting for sharp chrome specular ───────────────────────────
    // Key: very bright white directional from top-right front
    const keyLight = new THREE.DirectionalLight(0xffffff, 8);
    keyLight.position.set(6, 8, 12);
    scene.add(keyLight);

    // Fill: cyan from left
    const fillLight = new THREE.PointLight(0x00d4ff, 5, 80);
    fillLight.position.set(-14, 2, 10);
    scene.add(fillLight);

    // Rim: cool blue from behind-right
    const rimLight = new THREE.PointLight(0x4488ff, 3, 60);
    rimLight.position.set(10, -6, -8);
    scene.add(rimLight);

    // Back: dim purple for depth
    const backLight = new THREE.PointLight(0x7733ff, 1.5, 60);
    backLight.position.set(-8, 8, -12);
    scene.add(backLight);

    scene.add(new THREE.AmbientLight(0x04112a, 2));

    // ── Chrome torus — CENTRED at origin ─────────────────────────────
    const torusGeo = new THREE.TorusGeometry(9, 2.4, 128, 256);
    const torusMat = new THREE.MeshPhongMaterial({
      color:     new THREE.Color(0x061828),
      emissive:  new THREE.Color(0x010810),
      specular:  new THREE.Color(0xffffff),   // pure white specular → sharp streaks
      shininess: 1200,
      side:      THREE.DoubleSide,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);

    // Glow halos (additive)
    [[2.8, 0.06, 0x003388],[3.8, 0.025, 0x002266],[5.5, 0.008, 0x001144]].forEach(([tube,op,col]) =>
      torus.add(new THREE.Mesh(
        new THREE.TorusGeometry(9, tube, 32, 64),
        new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:op,
          blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })
      ))
    );

    // Inner portal glow disc
    torus.add(new THREE.Mesh(
      new THREE.CircleGeometry(6.5, 64),
      new THREE.MeshBasicMaterial({ color:0x002255, transparent:true, opacity:0.25,
        blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })
    ));

    const torusGroup = new THREE.Group();
    torusGroup.add(torus);
    torusGroup.position.set(0, 0, 0);   // ← CENTRED (was 3.5)
    scene.add(torusGroup);

    // ── Vertical light pillar through torus (like the reference) ─────
    const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, 80, 8);
    const pillarMat = new THREE.MeshBasicMaterial({
      color:0x00d4ff, transparent:true, opacity:0.18,
      blending:THREE.AdditiveBlending, depthWrite:false
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(0,0,0);
    scene.add(pillar);

    // Glowing ring where pillar meets torus (equator highlight)
    const eqGeo = new THREE.TorusGeometry(0.15, 0.06, 8, 32);
    const eqMat = new THREE.MeshBasicMaterial({
      color:0x00ffff, transparent:true, opacity:0.5,
      blending:THREE.AdditiveBlending, depthWrite:false
    });
    [9, -9].forEach(y => {
      const eq = new THREE.Mesh(eqGeo, eqMat);
      eq.rotation.x = Math.PI/2; eq.position.y = y;
      scene.add(eq);
    });

    // ── Particle field ────────────────────────────────────────────────
    const N   = 2200;
    const pp  = new Float32Array(N*3);
    const pc  = new Float32Array(N*3);
    const pv  = new Float32Array(N*3);
    // Explosion velocity (used during intro)
    const pev = new Float32Array(N*3);

    const pal = [[0,0.83,1],[0.3,0.5,1],[0.6,0.4,1],[0,0.6,0.9],[0.1,0.9,0.8]];

    for (let i=0; i<N; i++) {
      const r = 5 + Math.random()*70;
      const θ = Math.random()*Math.PI*2, φ = (Math.random()-0.5)*Math.PI;
      pp[i*3]   = r*Math.cos(θ)*Math.cos(φ);
      pp[i*3+1] = r*Math.sin(φ)*0.5;
      pp[i*3+2] = r*Math.sin(θ)*Math.cos(φ) - 5;
      // Explosion direction: outward from centre
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
      size:1.5, map:new THREE.CanvasTexture(spCvs),
      vertexColors:true, transparent:true, opacity:0.7,
      blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true,
    });
    scene.add(new THREE.Points(partGeo, partMat));

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Expose scroll hook
    let _targetRotY=0, _currentRotY=0;
    _setTargetRotY = v => { _targetRotY=v; };

    // ── Intro animation state ─────────────────────────────────────────
    // Camera: z=4 → z=22 over INTRO_DUR seconds (ease-out)
    const INTRO_DUR   = 2.8;   // seconds
    const CAM_START_Z = 4;
    const CAM_END_Z   = 22;
    let introT        = 0;
    let introComplete = false;

    // ── Render loop ───────────────────────────────────────────────────
    let t=0;
    const posArr = partGeo.attributes.position.array;

    function loop() {
      t += 0.008;

      // ── Intro camera fly-out ──────────────────────────────────────
      if (!introComplete) {
        introT += 0.016;
        const p = Math.min(1, introT/INTRO_DUR);
        const e = 1-Math.pow(1-p,3);               // ease-out cubic
        camera.position.z = CAM_START_Z + (CAM_END_Z-CAM_START_Z)*e;

        // During intro, explode particles outward
        const explodeStrength = Math.max(0, 1-p*2); // fades after halfway
        for (let i=0; i<N; i++) {
          posArr[i*3]   += pev[i*3]   * explodeStrength;
          posArr[i*3+1] += pev[i*3+1] * explodeStrength;
          posArr[i*3+2] += pev[i*3+2] * explodeStrength;
        }

        if (p >= 1) {
          introComplete = true;
          // Reveal content panel
          if (contentPanel) contentPanel.style.opacity='1';
        }
      }

      // ── Torus scroll rotation ─────────────────────────────────────
      _currentRotY += (_targetRotY-_currentRotY)*0.06;
      torusGroup.rotation.y = _currentRotY;

      // Ambient tilt (makes chrome specular streak move)
      torus.rotation.x = Math.sin(t*0.35)*0.18;
      torus.rotation.z = Math.cos(t*0.28)*0.06;

      // Orbit key + fill lights for moving specular streaks
      keyLight.position.x  =  Math.sin(t*0.4)*10 + 4;
      keyLight.position.y  =  Math.cos(t*0.3)*6  + 5;
      fillLight.position.x = -Math.cos(t*0.35)*12 - 4;
      fillLight.position.y =  Math.sin(t*0.28)*5;

      // Normal particle drift (after intro explosion settles)
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

      // Subtle camera drift (after intro)
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
