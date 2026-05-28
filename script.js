// ============================================================================
// BABYLON.JS IMMERSIVE SCI-FI EXPERIENCE
// ============================================================================

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);

// Create scene
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0, 0, 0);
scene.collisionsEnabled = true;

// Camera - will be controlled by scroll
const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 0, 30));
camera.attachControl(canvas, true);
camera.angularSensibility = 1000;
camera.inertia = 0.7;

// Lighting
const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, 0), scene);
ambientLight.intensity = 0.3;
ambientLight.diffuse = new BABYLON.Color3(0, 0.4, 0.6);

const pointLight1 = new BABYLON.PointLight('light1', new BABYLON.Vector3(20, 20, 20), scene);
pointLight1.intensity = 0.4;
pointLight1.range = 100;
pointLight1.diffuse = new BABYLON.Color3(0, 1, 1);

const pointLight2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(-20, -20, 20), scene);
pointLight2.intensity = 0.4;
pointLight2.range = 100;
pointLight2.diffuse = new BABYLON.Color3(1, 0, 1);

// ============================================================================
// PARTICLE SYSTEM - VOLUMETRIC DUST/ENERGY
// ============================================================================

function createParticleSystem() {
  const particleSystem = new BABYLON.ParticleSystem('particles', 2000, scene);

  particleSystem.particleTexture = new BABYLON.DynamicTexture('particleTexture', 64);
  const ctx = particleSystem.particleTexture.getContext();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();
  particleSystem.particleTexture.update();

  const emitter = BABYLON.MeshBuilder.CreateSphere('emitter', { diameter: 50 }, scene);
  emitter.isVisible = false;
  particleSystem.emitter = emitter;

  particleSystem.minEmitBox = new BABYLON.Vector3(-30, -30, -30);
  particleSystem.maxEmitBox = new BABYLON.Vector3(30, 30, 30);

  particleSystem.minEmitPower = 0.5;
  particleSystem.maxEmitPower = 2;
  particleSystem.minLifeTime = 2;
  particleSystem.maxLifeTime = 4;

  particleSystem.minSize = 0.2;
  particleSystem.maxSize = 1;
  particleSystem.minScaleFunction = (start, end) => 0.8;
  particleSystem.maxScaleFunction = (start, end) => 1.2;

  particleSystem.emitRate = 100;
  particleSystem.gravity = new BABYLON.Vector3(0, 0.1, 0);
  particleSystem.minAngularSpeed = -Math.PI;
  particleSystem.maxAngularSpeed = Math.PI;

  particleSystem.addColorRemapGradient(0, new BABYLON.Color4(0, 1, 1, 0.5), new BABYLON.Color4(0, 1, 1, 0.5));
  particleSystem.addColorRemapGradient(0.5, new BABYLON.Color4(1, 0, 1, 0.3), new BABYLON.Color4(1, 0, 1, 0.3));
  particleSystem.addColorRemapGradient(1, new BABYLON.Color4(0, 1, 1, 0), new BABYLON.Color4(0, 1, 1, 0));

  particleSystem.start();
  return { system: particleSystem, emitter };
}

const { system: particles, emitter } = createParticleSystem();

// ============================================================================
// FLOATING CONTENT CARDS WITH 3D POSITIONING
// ============================================================================

const cards = document.querySelectorAll('.card');
const cardPositions = [
  { x: 0, y: 5, z: 0, rotX: 0, rotY: 0 },           // Hero
  { x: -15, y: -8, z: -5, rotX: 0.1, rotY: 0.3 },    // Profile
  { x: 15, y: -8, z: -5, rotX: -0.1, rotY: -0.3 },   // Capabilities
  { x: -20, y: 0, z: -8, rotX: 0, rotY: 0.4 },       // Archive
  { x: 20, y: 0, z: -8, rotX: 0, rotY: -0.4 },       // Timeline
  { x: -10, y: 15, z: -10, rotX: 0.2, rotY: 0.2 },   // Transmissions
  { x: 10, y: 15, z: -10, rotX: -0.2, rotY: -0.2 },  // Credentials
  { x: 0, y: -20, z: -5, rotX: 0, rotY: 0 }          // Contact
];

cards.forEach((card, idx) => {
  const pos = cardPositions[idx];
  card.style.left = 'auto';
  card.style.top = 'auto';
  card.style.transform = `perspective(1000px) translateZ(${pos.z * 10}px) rotateX(${pos.rotX}rad) rotateY(${pos.rotY}rad)`;
  card.dataset.x = pos.x;
  card.dataset.y = pos.y;
  card.dataset.z = pos.z;
  card.dataset.rotX = pos.rotX;
  card.dataset.rotY = pos.rotY;
});

// ============================================================================
// SCROLL TRACKING & CAMERA ANIMATION
// ============================================================================

const scrollProxy = document.getElementById('scroll-proxy');
let scrollProgress = 0;

window.addEventListener('scroll', () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

  // Update HUD zone
  let currentZone = 'INTRO';
  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight / 2 && rect.bottom > 0) {
      currentZone = card.getAttribute('data-zone') || 'UNKNOWN';
    }
  });
  document.getElementById('zone').textContent = currentZone;
});

// ============================================================================
// ANIMATION LOOP
// ============================================================================

let time = 0;

engine.runRenderLoop(() => {
  time += 0.016;

  // Animate camera with scroll
  camera.position.y = -scrollProgress * 40;
  camera.position.z = 30 + scrollProgress * 20;
  camera.rotation.x = scrollProgress * 0.3;

  // Animate particle emitter
  emitter.position.y = Math.sin(time * 0.5) * 10;
  emitter.position.x = Math.cos(time * 0.3) * 15;

  // Animate point lights
  pointLight1.position.x = Math.sin(time * 0.4) * 30;
  pointLight1.position.y = Math.cos(time * 0.35) * 30;
  pointLight2.position.x = Math.cos(time * 0.4) * 30;
  pointLight2.position.y = Math.sin(time * 0.35) * 30;

  // Animate cards with scroll influence
  cards.forEach((card, idx) => {
    const pos = cardPositions[idx];
    const offsetY = scrollProgress * 50;
    const offsetZ = scrollProgress * 15;
    const rotInfluence = Math.sin(time * 0.3 + idx) * 0.05;

    const x = pos.x + Math.sin(time * 0.2 + idx) * 2;
    const y = pos.y - offsetY + Math.cos(time * 0.15 + idx) * 2;
    const z = pos.z - offsetZ;
    const rotX = pos.rotX + rotInfluence;
    const rotY = pos.rotY + rotInfluence;

    // Calculate screen position from 3D coords
    const scale = 800 / (z + 50);
    const screenX = (x * scale + window.innerWidth / 2) - 300;
    const screenY = (y * scale + window.innerHeight / 2) - 150;

    card.style.left = Math.max(0, Math.min(screenX, window.innerWidth - 300)) + 'px';
    card.style.top = Math.max(0, Math.min(screenY, window.innerHeight - 200)) + 'px';
    card.style.opacity = Math.max(0.3, Math.min(1, 1 - Math.abs(scrollProgress - (idx / cards.length)) * 2));
    card.style.transform = `perspective(1500px) translateZ(${z * 10}px) rotateX(${rotX}rad) rotateY(${rotY}rad) scale(${0.8 + Math.abs(Math.sin(time * 0.2 + idx)) * 0.1})`;
  });

  scene.render();
});

// ============================================================================
// BOOT SEQUENCE
// ============================================================================

function initBoot() {
  const bootEl = document.getElementById('boot');
  setTimeout(() => {
    bootEl.classList.add('hidden');
  }, 2400);
}

// ============================================================================
// COPY TO CLIPBOARD
// ============================================================================

const copyButton = document.getElementById('copy');
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
  engine.resize();
});

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initBoot();
});
