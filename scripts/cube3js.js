import * as THREE from '../../node_modules/three/build/three.module.js';

//Initialiser une scène, une caméra et un renderer.
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ajout d'un cube
const geometry = new THREE.BoxGeometry();
//const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

//pour gérer la lumi`ere
const material = new THREE.MeshStandardMaterial({ color: 0xff00ff });

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

//positionnement de la camera
camera.position.z = 3;

// Ajouter une lumière directionnelle : si MeshStandardMaterial
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);

scene.add(light);
// Lumi`ere ambiante pour un ´eclairage global doux
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

let isDragging = false;
let previousMousePosition = {x:0, y:0};
//Evenements souris
window.addEventListener('mousedown', () => {isDragging = true});
window.addEventListener('mouseup', () => {isDragging = false});
window.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y
    };

    // Rotation cube selon mouvement souris
    cube.rotation.y += deltaMove.x*0.005;
    cube.rotation.x += deltaMove.y*0.005;

  }

  previousMousePosition = { x: event.clientX, y: event.clientY };
});

  //Gestion du zoom molette
  window.addEventListener('wheel', (event) => {
    const zoomSpeed = 0.001; // Vitesse de zoom

    // Ajuster la position de la caméra en fonction de la direction de la molette
    camera.position.z += event.deltaY * zoomSpeed;

    // Limiter le zoom pour éviter de passer à travers ou trop s'éloigner
    camera.position.z = Math.max(1, Math.min(50, camera.position.z));
  });


// Animation
function animate() {
requestAnimationFrame(animate);
//cube.rotation.x += 0.01;
//cube.rotation.y += 0.01;
renderer.render(scene, camera);
}
animate();
