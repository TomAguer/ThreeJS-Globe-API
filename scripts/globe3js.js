import * as THREE from '../../node_modules/three/build/three.module.js';

//Utilisation de chat GPT pour la création des marqueurs, requete : "créé moi des marqueurs en fonction de la longitude et latitude de ma bdd, ils seront plus ou moins gros en fonction de la population (ajout des scripts location.php et globe3.js)"

//Utilisation de ChatGPT pour la création du tooltip : "Créé moi une petite page d'information au survol en fonction des données de ma bdd lorsque je passe ma souris sur des marqueurs"

// Variables globales pour le contrôle
let autoRotate = true;
let selectedMarker = null;
let rotationSpeed = 0.001;
let isTooltipLocked = false;
let activeFilters = {
    population: 0
};

// Création du panneau de contrôle
const controlPanel = document.createElement('div');
controlPanel.style.position = 'absolute';
controlPanel.style.top = '20px';
controlPanel.style.right = '20px';
controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
controlPanel.style.padding = '15px';
controlPanel.style.borderRadius = '10px';
controlPanel.style.color = 'white';
controlPanel.style.zIndex = '1000';
controlPanel.innerHTML = `
    <div style="margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0;">Filtre par population</h3>
        <div>
            <label>Population minimale :</label>
            <input type="range" id="populationFilter" min="0" max="30000000" step="1000000" value="0" style="width: 100%;">
            <div id="populationValue" style="text-align: center;">0</div>
        </div>
    </div>
    <div id="stats" style="font-size: 12px; margin-top: 10px; border-top: 1px solid white; padding-top: 10px;">
        Villes affichées: 0
    </div>
    <button id="fullscreenButton" style="width: 100%; margin-top: 10px; padding: 5px; border-radius: 5px; border: none; cursor: pointer;">
        Plein écran
    </button>
`;
document.body.appendChild(controlPanel);

// On crée un tooltip HTML en créant une div pour afficher les informations au survol du marqueur
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
tooltip.style.color = 'white';
tooltip.style.padding = '10px';
tooltip.style.borderRadius = '5px';
tooltip.style.fontSize = '14px';
tooltip.style.fontFamily = 'Arial, sans-serif';
tooltip.style.display = 'none';
tooltip.style.zIndex = '1000';
tooltip.style.pointerEvents = 'none';
tooltip.style.cursor = 'pointer';
document.body.appendChild(tooltip);

// On initialise la scène en créant une caméra avec une vue 3D et un champ de vision de 75°, le moteur webGL affiche la scene sur la page web
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// On convertit les coordonnées latitude/longitude en un vecteur 3D
function latLongToVector3(lat, long, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (long + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = (radius * Math.cos(phi));
    const z = (radius * Math.sin(phi) * Math.sin(theta));

    return new THREE.Vector3(x, y, z);
}

// Formatage des nombres
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Fonction pour appliquer les filtres
function applyFilters() {
    let visibleCount = 0;
    markersGroup.children.forEach(marker => {
        const location = marker.userData;
        const populationMatch = location.population >= activeFilters.population;
        marker.visible = populationMatch;
        if (marker.visible) visibleCount++;
    });

    document.getElementById('stats').textContent = `Villes affichées: ${visibleCount}`;

    if (selectedMarker && !selectedMarker.visible) {
        isTooltipLocked = false;
        selectedMarker = null;
        tooltip.style.display = 'none';
    }
}

// Gestionnaire d'événement pour le filtre de population
document.getElementById('populationFilter').addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    activeFilters.population = value;
    document.getElementById('populationValue').textContent = formatNumber(value);
    applyFilters();
});

// Fonction pour créer un marqueur
function createMarker(location) {
    // Taille du marqueur proportionnelle à la population (avec un facteur d'échelle)
    const size = Math.max(0.02, Math.min(0.2, location.population / 500000000 * 0.5));

    // Couleur fixe avec marqueur en rond
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000, // Rouge
        opacity: 0.9,
        transparent: true
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.userData = {
        ...location,
        originalScale: size,
        originalColor: 0xff0000
    };
    return marker;
}

// Fonction pour gérer la surbrillance des marqueurs
function highlightMarker(marker, highlight = true) {
    if (!marker) return;

    if (highlight) {
        marker.material.color.setHex(0xffff00);
        marker.scale.set(1.3, 1.3, 1.3);
    } else {
        marker.material.color.setHex(marker.userData.originalColor);
        marker.scale.set(1, 1, 1);
    }
}

// On créé une sphère géometrique à laquelle on ajoute la texture globe.jpg récupérée sur le site de la nasa
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('./assets/textures/globe.jpg');
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshStandardMaterial({ map: texture });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Groupe pour rassembler tous les marqueurs
const markersGroup = new THREE.Group();
sphere.add(markersGroup);

// Raycaster pour la détection avec la souris
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Fonction de mise à jour du tooltip avec indentation particulière, on utilise les données de la bdd stockée dans location
function updateTooltip(event, location) {
    if (!isTooltipLocked || selectedMarker?.userData === location) {
        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY + 15}px`;
        tooltip.innerHTML = `
            🏙️ Capitale: ${location.name}<br>
            🌍 Pays: ${location.countryname}<br>
            📍 Coordonnées: ${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°<br>
            👥 Population: ${formatNumber(location.population)}
            <div id="lockStatus" style="font-size: 12px; margin-top: 5px;">
                ${isTooltipLocked ? '(Cliquez pour déverrouiller)' : '(Cliquez pour verrouiller)'}
            </div>
        `;
        tooltip.style.display = 'block';
    }
}

// On récupère les données JSON de l'api via le lien localhost/api/locations et on crée un marqueur à la position des capitales
async function loadLocations() {
    try {
        console.log('Chargement des données...');
        const response = await fetch('http://localhost:8000/api/locations');
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

        const data = await response.json();
        console.log(`Locations reçues: ${data['hydra:member'].length}`);

        data['hydra:member'].forEach(location => {
            const marker = createMarker(location);
            const basePosition = latLongToVector3(
                location.latitude,
                location.longitude,
                1.01 // Rayon de base
            );

            // Ajuster la hauteur du marqueur en fonction de la population
            const heightFactor = Math.min(0.5, location.population / 1000000000); // Limiter la hauteur à 0.5
            const elevatedPosition = basePosition.clone().multiplyScalar(1 + heightFactor);

            marker.position.copy(elevatedPosition);
            marker.lookAt(marker.position.clone().multiplyScalar(2));
            markersGroup.add(marker);
        });

        applyFilters();
        console.log('Marqueurs ajoutés avec succès');
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Configuration de base
camera.position.z = 3;

// Éclairage
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Contrôles
let isDragging = false;
let previousMousePosition = {x: 0, y: 0};

// Gestionnaire de clic pour le verrouillage du tooltip
window.addEventListener('click', (event) => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markersGroup.children);

    if (intersects.length > 0) {
        const marker = intersects[0].object;

        if (selectedMarker === marker) {
            isTooltipLocked = false;
            selectedMarker = null;
            highlightMarker(marker, false);
        } else {
            if (selectedMarker) {
                highlightMarker(selectedMarker, false);
            }
            isTooltipLocked = true;
            selectedMarker = marker;
            highlightMarker(marker, true);
            updateTooltip(event, marker.userData);
        }
    } else if (!intersects.length && isTooltipLocked) {
        isTooltipLocked = false;
        highlightMarker(selectedMarker, false);
        selectedMarker = null;
        tooltip.style.display = 'none';
    }
});

window.addEventListener('mousedown', (event) => {
    // Vérifie si le clic est sur le panneau de contrôle
    if (!controlPanel.contains(event.target)) {
        isDragging = true;
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Ne faire tourner le globe que si on ne clique pas sur le panneau de contrôle
    if (isDragging && !controlPanel.contains(event.target)) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        sphere.rotation.y += deltaMove.x * 0.005;
        sphere.rotation.x += deltaMove.y * 0.005;
        autoRotate = false;
    } else {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(markersGroup.children.filter(marker => marker.visible));

        markersGroup.children.forEach(marker => {
            if (marker !== selectedMarker && marker.visible) {
                highlightMarker(marker, false);
            }
        });

        if (intersects.length > 0) {
            const marker = intersects[0].object;
            if (marker !== selectedMarker) {
                highlightMarker(marker, true);
                if (!isTooltipLocked) {
                    updateTooltip(event, marker.userData);
                }
            }
        } else if (!isTooltipLocked) {
            tooltip.style.display = 'none';
        }
    }
    previousMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener('wheel', (event) => {
    const zoomSpeed = 0.001;
    camera.position.z += event.deltaY * zoomSpeed;
    camera.position.z = Math.max(1, Math.min(50, camera.position.z));
});

// Ajout d'un gestionnaire pour réactiver la rotation automatique après un délai d'inactivité
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (!isTooltipLocked) {
            autoRotate = true;
        }
    }, 5000); // Réactive la rotation après 5 secondes d'inactivité
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Fonction pour gérer le mode plein écran
function toggleFullScreen() {
  if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
          console.log(`Erreur lors du passage en plein écran : ${err.message}`);
      });
  } else {
      document.exitFullscreen();
  }
}

// Gestionnaire d'événement pour le bouton plein écran
document.getElementById('fullscreenButton').addEventListener('click', toggleFullScreen);

window.addEventListener('mousemove', resetInactivityTimer);
window.addEventListener('mousedown', resetInactivityTimer);
window.addEventListener('mouseup', resetInactivityTimer);
window.addEventListener('wheel', resetInactivityTimer);

// Animation
function animate() {
    requestAnimationFrame(animate);
    if (autoRotate && !isDragging) {
        sphere.rotation.y += rotationSpeed;
    }
    renderer.render(scene, camera);
}

// Démarrage
loadLocations().then(() => {
    animate();
});