import * as THREE from '../../node_modules/three/build/three.module.js';
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

// Initialisation de la scène, de la caméra et du renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // Position initiale de la caméra
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ajout d'une lumière directionnelle
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

let model = null; // Variable pour stocker le modèle chargé

// Chargement de la texture
const textureLoader = new THREE.TextureLoader();
const faceTexture = textureLoader.load(
  '../assets/textures/faceP.jpg',
  () => {
    console.log('Texture chargée avec succès');
  },
  undefined,
  (error) => console.error('Erreur lors du chargement de la texture :', error)
);

// Chargement du modèle GLTF
const loader = new GLTFLoader();
loader.load(
  './assets/3D/face4.glb',
  (gltf) => {
    model = gltf.scene;

    // Création d'un matériau utilisant la texture chargée
    const faceMaterial = new THREE.MeshStandardMaterial({ map: faceTexture });

    // Appliquer le matériau à tous les maillages du modèle
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = faceMaterial; // Appliquer le matériau uniquement aux Mesh
      }
    });

    // Ajouter le modèle à la scène
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error('Erreur lors du chargement du modèle :', error);
  }
);

// Variables pour la gestion du drag
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Gestion des événements de la souris
window.addEventListener('mousedown', () => {
  isDragging = true;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', (event) => {
  if (isDragging && model) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y
    };

    // Rotation du modèle selon le mouvement de la souris
    model.rotation.y += deltaMove.x * 0.005;
    model.rotation.x += deltaMove.y * 0.005;
  }

  previousMousePosition = { x: event.clientX, y: event.clientY };
});

// Gestion du zoom avec la molette
window.addEventListener('wheel', (event) => {
  const zoomSpeed = 0.1;

  // Ajuster la position de la caméra en fonction de la direction de la molette
  camera.position.z += event.deltaY * zoomSpeed;

  // Limiter le zoom pour éviter de passer à travers ou trop s'éloigner
  camera.position.z = Math.max(1, Math.min(50, camera.position.z));
});

// Animation
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
