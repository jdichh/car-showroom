import * as THREE from "three";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import WebGL from "three/addons/capabilities/WebGL.js";

if (!WebGL.isWebGLAvailable()) {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById("container").appendChild(warning);
}

///////////////////////////////////
////////// INITIAL SETUP //////////
///////////////////////////////////

const canvas = document.querySelector(".webGL");
const windowSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

//////////////////////////////////////////////
////////// VARIABLES & CONSTRUCTORS //////////
//////////////////////////////////////////////

let angle = 0;
let car1;

const DIRECTIONAL_LIGHT_INTENSITY = 0.075;
const spotlightProps = []; 
const WHITE = "#FFFFFF";

const center = new THREE.Vector3();
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  15,
  window.innerWidth / window.innerHeight,
  0.1,
  250
);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  context: canvas.getContext('webgl2'),
  antialias: true, 
});
renderer.setSize(windowSize.width, windowSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

///// Moving these inside the render variable causes shadows and tonemapping not to work.
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25

////////////////////////////////////
////////// FLOOR TEXTURE //////////
///////////////////////////////////

const FLOOR_TEX = "./assets/floor/concrete1k/Concrete042A_1K_Color.png";
const DISPLACEMENT_MAP = "./assets/floor/concrete1k/Concrete042A_1K_Displacement.png";
const NORMAL_GL = "./assets/floor/concrete1k/Concrete042A_1K_NormalGL.png";
const AMBIENT_OCCLUSION = "./assets/floor/concrete1k/Concrete042A_1K_AmbientOcclusion.png";
const TEX_SCALE = 15;
const PLANE_WIDTH = 225;
const PLANE_HEIGHT = 225;

Promise.all([
  textureLoader.load(FLOOR_TEX),
  textureLoader.load(DISPLACEMENT_MAP),
  textureLoader.load(AMBIENT_OCCLUSION),
  textureLoader.load(NORMAL_GL),
]).then(([floorTexture, dispMap, amb_occ, normalGL]) => {

  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  const floorTextureScale = TEX_SCALE;
  floorTexture.repeat.set(floorTextureScale, floorTextureScale);

  dispMap.wrapS = dispMap.wrapT = THREE.RepeatWrapping;
  const dispMapScale = TEX_SCALE;
  dispMap.repeat.set(dispMapScale, dispMapScale);

  amb_occ.wrapS = amb_occ.wrapT = THREE.RepeatWrapping;
  const amb_occScale = TEX_SCALE;
  amb_occ.repeat.set(amb_occScale, amb_occScale);

  normalGL.wrapS = normalGL.wrapT = THREE.RepeatWrapping;
  const normalGLScale = TEX_SCALE;
  normalGL.repeat.set(normalGLScale, normalGLScale);

  const geometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT);
  const material = new THREE.MeshLambertMaterial({
    map: floorTexture,
    displacementMap: dispMap,
    displacementScale: 0.1,
    normalMap: normalGL,
    normalMapType: THREE.TangentSpaceNormalMap,
    aoMap: amb_occ,
    aoMapIntensity: 1,
  });

  const floor = new THREE.Mesh(geometry, material);
  floor.receiveShadow = true;
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.8;
  scene.add(floor);
});

////////////////////////////////////////
////////// PARAMETERS TO APPLY /////////
////////////////////////////////////////

const spotlightParams = {
  topSpotlightColor: WHITE,
  topSpotlightIntensity: 50,
  topSpotlightAngle: 2.7,
  topSpotlightPenumbra: 1.24,
  topSpotlightDistance: 50,
  topSpotlightX: 0,
  topSpotlightY: 9,
  topSpotlightZ: 0,

  frontSpotlightColor: WHITE,
  frontSpotlightIntensity: 40,
  frontSpotlightAngle: 1,
  frontSpotlightPenumbra: 1,
  frontSpotlightDistance: 40,

  rearSpotlightColor: WHITE,
  rearSpotlightIntensity: 45,
  rearSpotlightAngle: 1,
  rearSpotlightPenumbra: 0.65,
  rearSpotlightDistance: 40,

  rightSpotlightColor: WHITE,
  rightSpotlightIntensity: 40,
  rightSpotlightAngle: 1,
  rightSpotlightPenumbra: 1,
  rightSpotlightDistance: 40,

  leftSpotlightColor: WHITE,
  leftSpotlightIntensity: 40,
  leftSpotlightAngle: 1,
  leftSpotlightPenumbra: 1,
  leftSpotlightDistance: 40,
};

//////////////////////////////////////////
////////// SHADOWS AND LIGHTING //////////
//////////////////////////////////////////
/*
 To whoever wants to try this out for themselves,
 if you're experiencing shadow artifacting (blurred shadowy lines),
 play around with the shadow bias.

 NOTE: Will turn these into functions to minify code.
*/

car1 = new THREE.Object3D();
car1.castShadow = true;
car1.receiveShadow = true;
scene.background = new THREE.Color(0x0B0A0A);
const directionalLight = new THREE.DirectionalLight(0xffffff, DIRECTIONAL_LIGHT_INTENSITY);
directionalLight.position.set(0, 36, 0);
scene.add(directionalLight);

directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 10;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 512;
directionalLight.shadow.mapSize.height = 512;

const spotlight = new THREE.SpotLight(WHITE, 5, 20, Math.PI / 3, 0.2);
const frontSpotlight = new THREE.SpotLight(spotlightParams.frontSpotlightColor, 90, 20, Math.PI * 0.1, 0.25);
const rearSpotlight = new THREE.SpotLight(spotlightParams.rearSpotlightColor, 90, 20, Math.PI * 0.1, 0.25);
const rightSpotlight = new THREE.SpotLight(spotlightParams.rearSpotlightColor, 90, 20, Math.PI * 0.1, 0.25);
const leftSpotlight = new THREE.SpotLight(spotlightParams.rearSpotlightColor, 90, 200, Math.PI * 0.1, 0.25);
////////// SETTING UP SPOTLIGHT POSITIONS //////////
const frontOffset = new THREE.Vector3(0, 0, 18); // Front of the car
const rearOffset = new THREE.Vector3(0, 0, -18); // Rear of the car
const leftOffset = new THREE.Vector3(-18, 0, 0); // Left of the car
const rightOffset = new THREE.Vector3(18, 0, 0); // Right of the car
////////// TOP SPOTLIGHT //////////
spotlight.position.set(0, 9, 0);
spotlight.target = car1;
spotlight.castShadow = true;
spotlight.shadow.bias = -0.001; // Fixes shadow artifacts.
spotlight.shadow.camera.near = 0.1;
spotlight.shadow.camera.far = 30;
spotlight.shadow.mapSize.width = 1024;
spotlight.shadow.mapSize.height = 1024;
scene.add(spotlight);
////////// FRONT SPOTLIGHT //////////
frontSpotlight.position.set(-10, 10, 40);
frontSpotlight.position.copy(car1.position).add(frontOffset);
frontSpotlight.target = car1;
frontSpotlight.castShadow = true;
frontSpotlight.shadow.bias = -0.001; // Fixes shadow artifacts.
frontSpotlight.shadow.camera.near = 0.1;
frontSpotlight.shadow.camera.far = 25;
frontSpotlight.shadow.mapSize.width = 512;
frontSpotlight.shadow.mapSize.height = 512;
scene.add(frontSpotlight);
////////// REAR SPOTLIGHT //////////
rearSpotlight.position.set(-5, 10, -11);
rearSpotlight.position.copy(car1.position).add(rearOffset);
rearSpotlight.target = car1;
rearSpotlight.castShadow = true;
rearSpotlight.shadow.camera.near = 0.
frontSpotlight.shadow.bias = -0.001; // Fixes shadow artifacts.1;
rearSpotlight.shadow.camera.far = 25;
rearSpotlight.shadow.mapSize.width = 512;
rearSpotlight.shadow.mapSize.height = 512;
scene.add(rearSpotlight);
////////// RIGHT SPOTLIGHT //////////
rightSpotlight.position.copy(car1.position).add(rightOffset);
rightSpotlight.target.position.copy(car1.position).add(rightOffset).sub(leftOffset);
rightSpotlight.castShadow = true;
rightSpotlight.shadow.bias = -0.001; // Fixes shadow artifacts.
rightSpotlight.shadow.camera.near = 0.1;
rightSpotlight.shadow.camera.far = 25;
rightSpotlight.shadow.mapSize.width = 512;
rightSpotlight.shadow.mapSize.height = 512;
scene.add(rightSpotlight);
////////// LEFT SPOTLIGHT //////////
leftSpotlight.position.copy(car1.position).add(leftOffset);
leftSpotlight.target.position.copy(car1.position).add(leftOffset).sub(rightOffset);
leftSpotlight.castShadow = true;
leftSpotlight.shadow.bias = -0.002; // Fixes shadow artifacts.
leftSpotlight.shadow.camera.near = 5;
leftSpotlight.shadow.camera.far = 25;
leftSpotlight.shadow.mapSize.width = 512;
leftSpotlight.shadow.mapSize.height = 512;
scene.add(leftSpotlight);

/////////////////////////////////
////////// LOAD MODELS //////////
/////////////////////////////////

const loadingSpinner = document.getElementById('loading-spinner');
Promise.all([
  new Promise((resolve) => loader.load("/assets/cars/toy_sup_red.glb", resolve)),
]).then(([gltf1]) => {

  // Car Model Setup
  car1 = gltf1.scene;

  // Default setting
  car1.position.y = -0.75;

  // Toyota Supra scale
  car1.scale.set(1.5, 1.5, 1.5);

  // Maserati Ghibli, Polestar 1 scale
  // car1.scale.set(1.75, 1.75, 1.75);

  // NFSMW M3 scale & position
  // car1.position.z = -0.1;
  // car1.scale.set(2,2,2);

  // Setting up shadow according to the car's meshes.
  car1.castShadow = true;
  car1.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(car1);
  
  loadingSpinner.style.display = 'none';
  canvas.style.display = 'block';

  showOnCanvas();
}).catch((error) => {
  console.error("Error loading car model:", error);
});

Promise.all([
  new Promise((resolve) => loader.load("/assets/props/spotlight.glb", resolve)),
  new Promise((resolve) => loader.load("/assets/props/spotlight.glb", resolve)),
  new Promise((resolve) => loader.load("/assets/props/spotlight.glb", resolve)),
  new Promise((resolve) => loader.load("/assets/props/spotlight.glb", resolve)),
]).then(([gltf2, gltf3, gltf4, gltf5]) => {
  // Front of car
  spotlightProps[0] = gltf2.scene;
  spotlightProps[0].position.set(2.45, -0.8, 18.5);
  spotlightProps[0].rotation.y = 9.425;
  spotlightProps[0].rotation.x = -1.5;

  // Rear of car
  spotlightProps[1] = gltf3.scene;
  spotlightProps[1].position.set(-2.5, -0.8, -18.5);
  spotlightProps[1].rotation.x = 1.5;

  // Left of car
  spotlightProps[2] = gltf4.scene;
  spotlightProps[2].position.set(-18.5, -0.66, -2.45);
  spotlightProps[2].rotation.y = 3.15;
  spotlightProps[2].rotation.x = 1.57;
  spotlightProps[2].rotation.z = 1.575;

  // Right of car
  spotlightProps[3] = gltf5.scene;
  spotlightProps[3].position.set(18.5, -0.73, -2.45);
 
  spotlightProps[3].rotation.x = 1.57;
  spotlightProps[3].rotation.z = 1.575;

  // Add all spotlightProps to the scene
  for (const spotlightProp of spotlightProps) {
    scene.add(spotlightProp);
  }

});

////////////////////////////////////
////////// APPLY SETTINGS //////////
////////////////////////////////////

spotlight.color.set(spotlightParams.topSpotlightColor);
spotlight.intensity = spotlightParams.topSpotlightIntensity;
spotlight.angle = spotlightParams.topSpotlightAngle;
spotlight.penumbra = spotlightParams.topSpotlightPenumbra;
spotlight.distance = spotlightParams.topSpotlightDistance;

frontSpotlight.color.set(spotlightParams.frontSpotlightColor);
frontSpotlight.intensity = spotlightParams.frontSpotlightIntensity;
frontSpotlight.angle = spotlightParams.frontSpotlightAngle;
frontSpotlight.penumbra = spotlightParams.frontSpotlightPenumbra;
frontSpotlight.distance = spotlightParams.frontSpotlightDistance;

rearSpotlight.color.set(spotlightParams.rearSpotlightColor);
rearSpotlight.intensity = spotlightParams.rearSpotlightIntensity;
rearSpotlight.angle = spotlightParams.rearSpotlightAngle;
rearSpotlight.penumbra = spotlightParams.rearSpotlightPenumbra;
rearSpotlight.distance = spotlightParams.rearSpotlightDistance;

leftSpotlight.color.set(spotlightParams.leftSpotlightColor);
leftSpotlight.intensity = spotlightParams.leftSpotlightIntensity;
leftSpotlight.angle = spotlightParams.leftSpotlightAngle;
leftSpotlight.penumbra = spotlightParams.leftSpotlightPenumbra;
leftSpotlight.distance = spotlightParams.leftSpotlightDistance;

rightSpotlight.color.set(spotlightParams.rightSpotlight);
rightSpotlight.intensity = spotlightParams.rightSpotlightIntensity;
rightSpotlight.angle = spotlightParams.rightSpotlightAngle;
rightSpotlight.penumbra = spotlightParams.rightSpotlightPenumbra;
rightSpotlight.distance = spotlightParams.rightSpotlightDistance;

///////////////////////////////////////////
////////// MAINTAIN ASPECT RATIO //////////
///////////////////////////////////////////

window.addEventListener("resize", () => {
  windowSize.width = window.innerWidth;
  windowSize.height = window.innerHeight;

  renderer.setSize(windowSize.width, windowSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio), 2);

  camera.aspect = windowSize.width / windowSize.height;
  camera.updateProjectionMatrix();
});

///////////////////////////
////////// MUSIC //////////
///////////////////////////
const musicFiles = [
  "./assets/music/music1.mp3",
  "./assets/music/music2.mp3",
  "./assets/music/music3.mp3",
  "./assets/music/music4.mp3",
  "./assets/music/music5.mp3",
  "./assets/music/music6.mp3",
  "./assets/music/music7.mp3",
];

const preloadedMusicFiles = musicFiles.map((musicFile) => {
  const audio = new Audio();
  audio.src = musicFile;
  audio.preload = "auto";
  audio.volume = 0.2;
  audio.addEventListener("error", (event) => {
    console.error("Error loading audio:", event);
  });
  return audio;
});

let currentMusicIndex;
let MUSIC;
let isMusicPlaying = true;

const musicToggleButton = document.createElement("button");
musicToggleButton.setAttribute("id", "music-toggle-button");
musicToggleButton.addEventListener("click", toggleMusic);

const iconElement = document.createElement("i");
iconElement.classList.add("fas", "fa-stop", "fa-sm");
musicToggleButton.appendChild(iconElement);

const volumeUpButton = document.createElement("button");
volumeUpButton.setAttribute("id", "volume-up-button");
volumeUpButton.classList.add("fas", "fa-plus", "fa-sm");
volumeUpButton.addEventListener("click", increaseVolume);

const volumeDownButton = document.createElement("button");
volumeDownButton.setAttribute("id", "volume-down-button");
volumeDownButton.classList.add("fas", "fa-minus", "fa-sm");
volumeDownButton.addEventListener("click", decreaseVolume);

canvas.parentNode.appendChild(musicToggleButton);
canvas.parentNode.appendChild(volumeUpButton);
canvas.parentNode.appendChild(volumeDownButton);

function increaseVolume() {
  if (MUSIC.volume < 1) {
    MUSIC.volume += 0.1;
  }
}

function decreaseVolume() {
  if (MUSIC.volume > 0) {
    MUSIC.volume -= 0.1;
  }
}

function toggleMusic() {
  if (isMusicPlaying) {
    MUSIC.pause();
    iconElement.classList.remove("fas", "fa-play", "fa-sm");
    iconElement.classList.add("fas", "fa-stop", "fa-sm");
  } else {
    playNextTrack()
    MUSIC.play();
    iconElement.classList.remove("fas", "fa-stop", "fa-sm");
    iconElement.classList.add("fas", "fa-play", "fa-sm");
  }
  isMusicPlaying = !isMusicPlaying;
}

function playNextTrack() {
  const previousMusicIndex = currentMusicIndex;
  do {
    currentMusicIndex = Math.floor(Math.random() * musicFiles.length);
  } while (currentMusicIndex === previousMusicIndex);

  MUSIC = preloadedMusicFiles[currentMusicIndex];
  MUSIC.currentTime = 0;
  //   MUSIC.playbackRate = 3.5; // For testing if music will proceed to the next one, and to check if looping works.
  MUSIC.removeEventListener("ended", playNextTrack);
  MUSIC.addEventListener("ended", playNextTrack);

  if (isMusicPlaying) {
    MUSIC.play();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  currentMusicIndex = Math.floor(Math.random() * musicFiles.length);
  MUSIC = preloadedMusicFiles[currentMusicIndex];
  MUSIC.loop = true;
  playNextTrack();
});

////////////////////////////////
////////// MAIN STUFF //////////
////////////////////////////////

const distance = 26; // Distance to model.
const yOffset = 2; // Camera height.

function showOnCanvas() {
  angle += 0.0011;
  const x = center.x + distance * Math.cos(angle);
  const z = center.z + distance * Math.sin(angle);
  camera.position.set(x, center.y + yOffset, z);
  camera.lookAt(center);

  renderer.render(scene, camera);
  requestAnimationFrame(showOnCanvas);
}