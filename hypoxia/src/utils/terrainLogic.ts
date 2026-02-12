import * as THREE from 'three';

// Génère une courbe sinueuse pour la rivière
export const riverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-50, 0, -50),
    new THREE.Vector3(-20, 0, -25),
    new THREE.Vector3(10, 0, 0),
    new THREE.Vector3(-10, 0, 25),
    new THREE.Vector3(20, 0, 50),
]);

// Fonction pour récupérer la hauteur du terrain à une position donnée (x, z)
export function getTerrainHeight(x: number, z: number) {
    // Distance au point le plus proche sur la courbe de la rivière
    // Sampling simple
    let minDist = 1000;

    // On itère sur 50 points de la courbe pour trouver le plus proche
    for (let j = 0; j <= 50; j++) {
        const point = riverCurve.getPoint(j / 50);
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        if (dist < minDist) minDist = dist;
    }

    // River Bed Logic:
    let height = 0;

    // Steeper banks logic:
    // River: < 3.5
    // Banks: 3.5 -> 6 (Steep slope)
    // Terrain: > 6

    if (minDist < 3.5) {
        height = -2.2; // Fond de la rivière
    } else if (minDist < 6) {
        // Pente Abrupte (Falaise d'argile)
        const t = (minDist - 3.5) / (6 - 3.5); // 0 à 1
        height = -2.2 + (t * 2.2); // Remonte jusqu'à 0
    } else {
        height = 0; // Terrain
        // Ajout de bruit léger pour le terrain (simulé)
        height += Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.3;
    }

    return height;
}
