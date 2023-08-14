import * as THREE from "three";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

import WebGL from "three/addons/capabilities/WebGL.js";

if (!WebGL.isWebGLAvailable()) {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById("container").appendChild(warning);
}

///// DEVTOOLS
// FPS Counter
import Stats from "stats.js";
const stats = new Stats();
stats.showPanel(0);
stats.dom.style.position = "absolute";
stats.dom.style.top = "0";
stats.dom.style.left = "0";
document.body.appendChild(stats.dom);
///// DEVTOOLS

// Initial setup
const canvas = document.querySelector(".webGL");
const windowSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Utils setup
const textureLoader = new THREE.TextureLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  20,
  windowSize.width / windowSize.height,
  0.1,
  150
);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(windowSize.width, windowSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lighting and cameras
scene.background = new THREE.Color(0xaaaaaa);
const DIRECTIONAL_LIGHT_INTENSITY = 1.5;
const directionalLight = new THREE.DirectionalLight(
  0xffffff,
  DIRECTIONAL_LIGHT_INTENSITY
);
directionalLight.position.set(1, 1, 1); // Position of the light
scene.add(directionalLight);

// Load model
// Wait for both models to be loaded before positioning the camera
let a80, a90;
let loader = new GLTFLoader();
let center = new THREE.Vector3();

Promise.all([
  new Promise((resolve) => loader.load("/assets/a80_supra.glb", resolve)),
  new Promise((resolve) => loader.load("/assets/a90_supra.glb", resolve)),
]).then(([gltf1, gltf2]) => {
  a80 = gltf1.scene;
  a80.position.set(-5, 0, -2);
  a80.rotation.y = -0.8;
  scene.add(a80);

  a90 = gltf2.scene;
  a90.position.set(3, 0, 6);
  a90.rotation.y = 0.1;
  a90.scale.set(4.5, 4.5, 4.5);
  scene.add(a90);

  // Calculate the center position between the two models
  center.addVectors(a80.position, a90.position).multiplyScalar(0.5);
  controls.target = center;

  // Start the render loop
  showOnCanvas();
});

// Resize Events
window.addEventListener("resize", () => {
  windowSize.width = window.innerWidth;
  windowSize.height = window.innerHeight;

  renderer.setSize(windowSize.width, windowSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio), 2);
});

// Debug Cam
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

let angle = 0;

function showOnCanvas() {
  stats.begin();
  controls.update();
  angle += 0.0015;
  const distance = 35; // Distance to models.
  const y = 55; // Higher values means higher angles. Opposite for lower.
  const x = center.x + distance * Math.cos(angle);
  const z = center.z + distance * Math.sin(angle);
  camera.position.set(x, y, z);
  camera.lookAt(center);
  renderer.render(scene, camera);
  requestAnimationFrame(showOnCanvas);
  stats.end();
}
