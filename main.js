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
let a80, a90;
let center = new THREE.Vector3();
let loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(windowSize.width, windowSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Floor texture
const FLOOR_TEX = "./assets/floor/Marble016_2K_Color.png";
const DISPLACEMENT_MAP = "./assets/floor/Marble016_2K_Displacement.png";
const ROUGHNESS = "./assets/floor/Marble016_2K_Roughness.png";
// const AMBIENT_OCCLUSION = "./assets/floor/PavingStones049_2K_AmbientOcclusion.png"
const NORMAL_GL = "./assets/floor/Marble016_2K_NormalGL.png";

const TEX_SCALE = 25;
const PLANE_WIDTH = 100;
const PLANE_HEIGHT = 100;

const floorTexture = textureLoader.load(FLOOR_TEX, (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  const scale = TEX_SCALE;
  texture.repeat.set(scale, scale);
});
const dispMap = textureLoader.load(DISPLACEMENT_MAP, (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  const scale = TEX_SCALE;
  texture.repeat.set(scale, scale);
});
const rough = textureLoader.load(ROUGHNESS, (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  const scale = TEX_SCALE;
  texture.repeat.set(scale, scale);
});
// const ambientOcc = textureLoader.load(AMBIENT_OCCLUSION, (texture) => {
//   texture.wrapS = THREE.RepeatWrapping;
//   texture.wrapT = THREE.RepeatWrapping;
//   const scale = TEX_SCALE
//   texture.repeat.set(scale, scale);
// });
const normalGL = textureLoader.load(NORMAL_GL, (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  const scale = TEX_SCALE;
  texture.repeat.set(scale, scale);
});

const geometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT);
const material = new THREE.MeshStandardMaterial({
  map: floorTexture,
  displacementMap: dispMap,
  displacementScale: 1,
  // aoMap: ambientOcc,
  normalMap: normalGL,
  normalMapType: THREE.TangentSpaceNormalMap,
  roughnessMap: rough,
  roughness: 1,
  // metalnessMap: metal,
  // metalness: 1,
});

const floor = new THREE.Mesh(geometry, material);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.8;
scene.add(floor);

// Lighting and cameras
scene.background = new THREE.Color(0xaaaaaa);
const DIRECTIONAL_LIGHT_INTENSITY = 1.5;
const directionalLight = new THREE.DirectionalLight(
  0xffffff,
  DIRECTIONAL_LIGHT_INTENSITY
);
directionalLight.position.set(1, 1, 1); // Position of the light
scene.add(directionalLight);



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
  const distance = 45; // Distance to models.
  const y = 30; // Higher values means higher angles. Opposite for lower.
  const x = center.x + distance * Math.cos(angle);
  const z = center.z + distance * Math.sin(angle);
  camera.position.set(x, y, z);
  camera.lookAt(center);
  renderer.render(scene, camera);
  requestAnimationFrame(showOnCanvas);
  stats.end();
}