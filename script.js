import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ═══════════════════════════════════════════════════
   CYBERSPACE PORTFOLIO v3.0
   Three.js + CSS3DRenderer + Post-processing
   ═══════════════════════════════════════════════════ */

const State = {
  scrollProgress: 0,
  currentZone: 0,
  hoveredCard: null,
  mouseX: 0,
  mouseY: 0,
  fps: 60,
};

let scene, camera, webglRenderer, css3dRenderer, composer;
let cardObjects = [];
let particles = null;
let cameraTarget = new THREE.Vector3();

/* ── Boot Sequence ── */
async function boot() {
  const bootEl = document.getElementById('boot-overlay');
  const bootText = document.getElementById('boot-text');
  const bootBar = document.getElementById('boot-bar');

  const lines = [
    'INITIALIZING NEURAL INTERFACE...',
    'LOADING CYBERSPACE BUFFER...',
    'ESTABLISHING QUANTUM LINK...',
    'PRABH.OS v3.0 READY',
    'WELCOME TO THE VOID'
  ];

  for (const line of lines) {
    bootText.innerHTML += line + '<br>';
    await sleep(300);
  }

  gsap.to(bootBar, { width: '100%', duration: 0.8, ease: 'power2.inOut' });
  await sleep(600);

  gsap.to(bootEl, {
    opacity: 0,
    pointerEvents: 'none',
    duration: 0.6,
    ease: 'power3.inOut'
  });
}

/* ── Initialize Three.js Scene ── */
function initScene() {
  // WebGL Renderer (for 3D)
  const canvas = document.getElementById('canvas');
  webglRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  webglRenderer.setSize(window.innerWidth, window.innerHeight);
  webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  webglRenderer.setClearColor(0x000000, 1);
  webglRenderer.shadowMap.enabled = true;

  // Scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 200, 1500);

  // Camera
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(0, 0, 800);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x0088ff, 0.4);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0x00ffff, 0.8, 800);
  pointLight.position.set(200, 300, 400);
  scene.add(pointLight);

  // Post-processing
  composer = new EffectComposer(webglRenderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, 0.4, 0.85
  );
  composer.addPass(bloomPass);

  // Grid floor
  const gridGeo = new THREE.BufferGeometry();
  const gridSize = 2000;
  const gridDivisions = 40;
  const half = gridSize / 2;

  const positions = [];
  for (let i = 0; i <= gridDivisions; i++) {
    const x = -half + (i / gridDivisions) * gridSize;
    positions.push(x, 0, -half, x, 0, half);
    positions.push(-half, 0, x, half, 0, x);
  }

  gridGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  const gridMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.1 });
  const grid = new THREE.LineSegments(gridGeo, gridMat);
  scene.add(grid);

  // Floating geometry
  addFloatingGeometry();

  // Particle system
  particles = createParticles();
  scene.add(particles);

  // CSS3D Renderer (for HTML cards)
  css3dRenderer = new CSS3DRenderer();
  css3dRenderer.setSize(window.innerWidth, window.innerHeight);
  css3dRenderer.domElement.style.position = 'absolute';
  css3dRenderer.domElement.style.top = '0';
  css3dRenderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(css3dRenderer.domElement);

  // Add cards to CSS3D space
  setupCards();

  // Handle resize
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('scroll', onScroll);
  document.addEventListener('mousemove', onMouseMove);

  // Animation loop
  animate();
}

function addFloatingGeometry() {
  const geos = [
    { geo: new THREE.IcosahedronGeometry(50, 3), color: 0xff00ff, pos: [-300, 100, -200] },
    { geo: new THREE.OctahedronGeometry(60, 2), color: 0x00ffff, pos: [300, -50, -300] },
    { geo: new THREE.TetrahedronGeometry(40, 2), color: 0xff00ff, pos: [-200, 200, 200] },
  ];

  geos.forEach((item, i) => {
    const edges = new THREE.EdgesGeometry(item.geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: item.color }));
    line.position.set(...item.pos);
    line.userData.rotSpeed = 0.001 + Math.random() * 0.002;
    line.userData.axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
    scene.add(line);
    line.userData.isGeo = true;
  });
}

function createParticles() {
  const geo = new THREE.BufferGeometry();
  const count = 1500;
  const pos = new Float32Array(count * 3);
  const cols = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 1500;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 1200;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 1500;

    const c = Math.random() > 0.5 ? 0 : 1;
    cols[i * 3] = c === 0 ? 0 : 1;       // R
    cols[i * 3 + 1] = 1;                // G (always full for cyan/magenta)
    cols[i * 3 + 2] = c === 0 ? 1 : 1;  // B
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

  const mat = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });

  return new THREE.Points(geo, mat);
}

function setupCards() {
  const cardEls = document.querySelectorAll('.card');
  const cardSpacing = 1000;

  cardEls.forEach((el, i) => {
    const css3dObj = new CSS3DObject(el);
    css3dObj.position.set(0, 0, -i * cardSpacing);
    css3dObj.rotation.x = 0;
    css3dObj.rotation.y = 0;

    scene.add(css3dObj);
    cardObjects.push({
      element: el,
      object: css3dObj,
      index: i,
      targetRotation: { x: 0, y: 0 },
      currentRotation: { x: 0, y: 0 }
    });

    el.addEventListener('mouseenter', () => {
      State.hoveredCard = i;
      el.style.zIndex = 10;
    });

    el.addEventListener('mouseleave', () => {
      State.hoveredCard = null;
      el.style.zIndex = 0;
    });
  });
}

/* ── Scroll Handler ── */
function onScroll() {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  State.scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

  // Update HUD
  const zoneIdx = Math.floor(State.scrollProgress * (cardObjects.length - 1));
  State.currentZone = Math.min(zoneIdx, cardObjects.length - 1);

  const zoneEl = document.querySelector('[data-zone]');
  if (zoneEl) {
    const zone = cardObjects[State.currentZone].element.dataset.zone;
    document.getElementById('hud-zone').textContent = zone;
    document.getElementById('hud-depth').textContent = (State.scrollProgress * 8000).toFixed(2);
    document.getElementById('hud-bar').style.width = (State.scrollProgress * 100) + '%';
  }
}

function onMouseMove(e) {
  State.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  State.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

  // Custom cursor
  document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
  document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
}

/* ── Main Animation Loop ── */
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Update camera: fly through card positions based on scroll
  const targetZ = -State.scrollProgress * 8000;
  camera.position.z += (targetZ - camera.position.z) * 0.08;
  camera.position.x = Math.sin(State.scrollProgress * Math.PI * 2) * 200;
  camera.position.y = Math.cos(State.scrollProgress * Math.PI) * 150 + 200;

  camera.lookAt(0, 0, targetZ);

  // Update card positions & rotations
  cardObjects.forEach((card, i) => {
    card.object.position.z = -i * 1000;

    // 3D hover effect
    if (State.hoveredCard === i) {
      card.targetRotation.x = State.mouseY * 0.1;
      card.targetRotation.y = State.mouseX * 0.1;
      card.object.scale.lerp(new THREE.Vector3(1.05, 1.05, 1.05), 0.1);
    } else {
      card.targetRotation.x = 0;
      card.targetRotation.y = 0;
      card.object.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }

    card.currentRotation.x += (card.targetRotation.x - card.currentRotation.x) * 0.08;
    card.currentRotation.y += (card.targetRotation.y - card.currentRotation.y) * 0.08;
    card.object.rotation.x = card.currentRotation.x;
    card.object.rotation.y = card.currentRotation.y;

    // Fade effect based on distance from camera
    const dist = Math.abs(card.object.position.z - camera.position.z);
    const opacity = Math.max(0.3, 1 - dist / 3000);
    card.element.style.opacity = opacity;
  });

  // Animate floating geometry
  scene.children.forEach(obj => {
    if (obj.userData.isGeo) {
      obj.rotateOnWorldAxis(obj.userData.axis, obj.userData.rotSpeed);
    }
  });

  // Animate particles
  if (particles) {
    particles.rotation.x += 0.0002;
    particles.rotation.y += 0.0001;
  }

  // Render both WebGL and CSS3D
  composer.render();
  css3dRenderer.render(scene, camera);
}

/* ── Helpers ── */
function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  webglRenderer.setSize(w, h);
  css3dRenderer.setSize(w, h);
  composer.setSize(w, h);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* ── Copy Button ── */
document.addEventListener('click', (e) => {
  if (e.target.id === 'copy-btn') {
    navigator.clipboard.writeText('prabh_simran@hotmail.com').then(() => {
      const orig = e.target.textContent;
      e.target.textContent = '[COPIED]';
      setTimeout(() => { e.target.textContent = orig; }, 1500);
    });
  }
});

/* ── Smooth Scroll ── */
if (typeof Lenis !== 'undefined') {
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
  gsap.ticker.add(t => lenis.raf(t * 1000));
}

/* ── Init ── */
window.addEventListener('DOMContentLoaded', async () => {
  await boot();
  initScene();

  // Set scroll height (number of cards * card spacing)
  const cardCount = document.querySelectorAll('.card').length;
  document.body.style.height = (cardCount * 1000) + 'px';
});
