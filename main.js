import * as THREE from "three";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "./node_modules/three/examples/jsm/postprocessing/EffectComposer.js";
import { SSAOPass } from "./node_modules/three/examples/jsm/postprocessing/SSAOPass.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

import { GUI } from "dat.gui";
import WebGL from "three/addons/capabilities/WebGL.js";

if (!WebGL.isWebGLAvailable()) {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById("container").appendChild(warning);
}

// gui parameters
const parameters = {
  cameraPositionX: 15,
  cameraPositionY: 10,
  cameraPositionZ: 15,
};

const spotlightParams = {
  topSpotlightColor: "#ffffff",
  topSpotlightIntensity: 10,
  topSpotlightAngle: Math.PI * 0.5,
  topSpotlightPenumbra: 0.1,
  topSpotlightDistance: 20,

  frontSpotlightColor: "#ffffff",
  frontSpotlightIntensity: 10,
  frontSpotlightAngle: Math.PI * 0.5,
  frontSpotlightPenumbra: 0.1,
  frontSpotlightDistance: 20,

  rearSpotlightColor: "#ffffff",
  rearSpotlightIntensity: 10,
  rearSpotlightAngle: Math.PI * 0.5,
  rearSpotlightPenumbra: 0.1,
  rearSpotlightDistance: 20,

  rightSpotlightColor: "#ffffff",
  rightSpotlightIntensity: 10,
  rightSpotlightAngle: Math.PI * 0.5,
  rightSpotlightPenumbra: 0.1,
  rightSpotlightDistance: 20,

  leftSpotlightColor: "#ffffff",
  leftSpotlightIntensity: 10,
  leftSpotlightAngle: Math.PI * 0.5,
  leftSpotlightPenumbra: 0.1,
  leftSpotlightDistance: 20,
};

// Initial setup
const canvas = document.querySelector(".webGL");
const windowSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Variable and constructor setup
let angle = 0;
let car1;
const DIRECTIONAL_LIGHT_INTENSITY = 0.05;
let center = new THREE.Vector3();
let loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  20,
  window.innerWidth / window.innerHeight,
  0.1,
  1500
);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  toneMapping: THREE.LinearSRGBColorSpace,
  toneMappingExposure: 1.0, // Adjust this value to control the overall exposure of the scene
});
renderer.setSize(windowSize.width, windowSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/*
  Floor Texture.
  TEX_SCALE is used to ensure that the car does not look like a toy on the floor.
*/
const FLOOR_TEX = "./assets/floor/concrete/Concrete033_2K_Color.png";
const DISPLACEMENT_MAP =
  "./assets/floor/concrete/Concrete033_2K_Displacement.png";
const NORMAL_GL = "./assets/floor/concrete/Concrete033_2K_NormalGL.png";
const ROUGHNESS = "./assets/floor/concrete/Concrete033_2K_Roughness.png";
// const METALNESS = "./assets/floor/metal/Metal046A_2K_Metalness.png";
const AMBIENT_OCCLUSION =
  "./assets/floor/concrete/Concrete033_2K_AmbientOcclusion.png";
const TEX_SCALE = 20;
const PLANE_WIDTH = 400;
const PLANE_HEIGHT = 400;

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
// const metal = textureLoader.load(METALNESS, (texture) => {
//   texture.wrapS = THREE.RepeatWrapping;
//   texture.wrapT = THREE.RepeatWrapping;
//   const scale = TEX_SCALE;
//   texture.repeat.set(scale, scale);
// });
const amb_occ = textureLoader.load(AMBIENT_OCCLUSION, (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  const scale = TEX_SCALE;
  texture.repeat.set(scale, scale);
});
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
  normalMap: normalGL,
  normalMapType: THREE.TangentSpaceNormalMap,
  roughnessMap: rough,
  roughness: 1,
  aoMap: amb_occ,
  aoMapIntensity: 1,
  // metalnessMap: metal,
  // metalness: 1
});

const floor = new THREE.Mesh(geometry, material);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.8;
scene.add(floor);

// Shadows & lighting
car1 = new THREE.Object3D();
car1.castShadow = true;
car1.receiveShadow = true;
scene.background = new THREE.Color(0x0f0e0d);
const directionalLight = new THREE.DirectionalLight(
  0xffffff,
  DIRECTIONAL_LIGHT_INTENSITY
);
directionalLight.position.set(11, 33, 11);
scene.add(directionalLight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.shadowMap.autoUpdate = true;

directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 10;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

const spotlight = new THREE.SpotLight("#ffffff", 5, 20, Math.PI / 3, 0.2);
const frontSpotlight = new THREE.SpotLight(
  spotlightParams.frontSpotlightColor,
  90,
  15,
  Math.PI * 0.1,
  0.25
);
const rearSpotlight = new THREE.SpotLight(
  spotlightParams.rearSpotlightColor,
  90,
  15,
  Math.PI * 0.1,
  0.25
);
const frontOffset = new THREE.Vector3(0, 0, 30);
const rearOffset = new THREE.Vector3(0, 0, -30);
const leftOffset = new THREE.Vector3(-30, 0, 0);
const rightOffset = new THREE.Vector3(30, 0, 0);
// Big spotlight from the top
spotlight.position.set(0, 10, 0);
spotlight.target = car1;
spotlight.castShadow = true;
spotlight.shadow.camera.near = 0.1;
spotlight.shadow.camera.far = 30;
spotlight.shadow.mapSize.width = 1024;
spotlight.shadow.mapSize.height = 1024;
scene.add(spotlight);
// Spotlight for rear
rearSpotlight.position.set(-5, 10, -11);
rearSpotlight.position.copy(car1.position).add(rearOffset);
rearSpotlight.target = car1;
rearSpotlight.castShadow = true;
rearSpotlight.shadow.camera.near = 0.1;
rearSpotlight.shadow.camera.far = 30;
rearSpotlight.shadow.mapSize.width = 1024;
rearSpotlight.shadow.mapSize.height = 1024;
scene.add(rearSpotlight);
// Spotlight for front
frontSpotlight.position.set(-10, 10, 40);
frontSpotlight.position.copy(car1.position).add(frontOffset);
frontSpotlight.target = car1;
frontSpotlight.castShadow = true;
frontSpotlight.shadow.camera.near = 0.1;
frontSpotlight.shadow.camera.far = 30;
frontSpotlight.shadow.mapSize.width = 1024;
frontSpotlight.shadow.mapSize.height = 1024;
scene.add(frontSpotlight);
// Spotlight for right
const rightSpotlight = new THREE.SpotLight(
  "#FFFFFF",
  90,
  15,
  Math.PI * 0.1,
  0.25
);
rightSpotlight.position.copy(car1.position).add(rightOffset);
rightSpotlight.target.position
  .copy(car1.position)
  .add(rightOffset)
  .sub(leftOffset); // Set target to face the left side
rightSpotlight.castShadow = true;
rightSpotlight.shadow.camera.near = 0.1;
rightSpotlight.shadow.camera.far = 30;
rightSpotlight.shadow.mapSize.width = 1024;
rightSpotlight.shadow.mapSize.height = 2048;
scene.add(rightSpotlight);
// Spotlight for left
const leftSpotlight = new THREE.SpotLight(
  "#FFFFFF",
  90,
  15,
  Math.PI * 0.1,
  0.25
);
leftSpotlight.position.copy(car1.position).add(leftOffset);
leftSpotlight.target.position
  .copy(car1.position)
  .add(leftOffset)
  .sub(rightOffset); // Set target to face the right side
leftSpotlight.castShadow = true;
leftSpotlight.shadow.camera.near = 0.1;
leftSpotlight.shadow.camera.far = 30;
leftSpotlight.shadow.mapSize.width = 1024;
leftSpotlight.shadow.mapSize.height = 1024;
scene.add(leftSpotlight);

// Postprocessing stuff
const efxComposer = new EffectComposer(renderer);
const ssaoPass = new SSAOPass(scene, camera);
efxComposer.addPass(ssaoPass);
ssaoPass.intensity = 0.5;

// Load models
Promise.all([
  new Promise((resolve) => loader.load("/assets/a90_supra.glb", resolve)),
]).then(([gltf1]) => {
  car1 = gltf1.scene;
  car1.position.y = -0.1;

  // a90 supra
  car1.scale.set(2.5, 2.5, 2.5);

  // r32
  // car1.scale.set(1.325, 1.325, 1.325);

  // ghibli
  // car1.scale.set(3, 3, 3);
  car1.castShadow = true;

  // Setting up shadow according to the car's meshes.
  car1.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });

  scene.add(car1);
  showOnCanvas();
});

// Enable shadow receiving for the floor
floor.receiveShadow = true;

// Set up shadow properties for the directional light
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 10;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Shadow quality

///// DEVTOOLS AREA /////
// FPS Counter
import Stats from "stats.js";
const stats = new Stats();
stats.showPanel(0);
stats.dom.style.position = "absolute";
stats.dom.style.top = "0";
stats.dom.style.left = "0";
document.body.appendChild(stats.dom);

const gui = new GUI();
///// CAMERA
function updateCameraPosition() {
  camera.position.set(
    parameters.cameraPositionX,
    parameters.cameraPositionY,
    parameters.cameraPositionZ
  );
}
const cameras = gui.addFolder("Camera");
cameras
  .add(parameters, "cameraPositionX", -50, 50)
  .onChange(updateCameraPosition);
cameras
  .add(parameters, "cameraPositionY", -50, 50)
  .onChange(updateCameraPosition);
cameras
  .add(parameters, "cameraPositionZ", -50, 50)
  .onChange(updateCameraPosition);

///// DIRECTIONAL LIGHT
const lightParameters = {
  lightIntensity: DIRECTIONAL_LIGHT_INTENSITY,
  lightX: directionalLight.position.x,
  lightY: directionalLight.position.y,
  lightZ: directionalLight.position.z,
};

function updateDirectionalLight() {
  directionalLight.intensity = lightParameters.lightIntensity;
  directionalLight.position.set(
    lightParameters.lightX,
    lightParameters.lightY,
    lightParameters.lightZ
  );
}
const lightFolder = gui.addFolder("Directional Light");
lightFolder
  .add(lightParameters, "lightIntensity", 0, 10)
  .onChange(updateDirectionalLight);
lightFolder
  .add(lightParameters, "lightX", -50, 50)
  .onChange(updateDirectionalLight);
lightFolder
  .add(lightParameters, "lightY", -50, 50)
  .onChange(updateDirectionalLight);
lightFolder
  .add(lightParameters, "lightZ", -50, 50)
  .onChange(updateDirectionalLight);

///// TOP SPOTLIGHT
const topSpotlightFolder = gui.addFolder("Top Spotlight");
topSpotlightFolder
  .addColor(spotlightParams, "topSpotlightColor")
  .onChange(() => {
    spotlight.color.set(spotlightParams.topSpotlightColor);
  });
topSpotlightFolder
  .add(spotlightParams, "topSpotlightIntensity", 0, 50)
  .onChange(() => {
    spotlight.intensity = spotlightParams.topSpotlightIntensity;
  });
topSpotlightFolder
  .add(spotlightParams, "topSpotlightAngle", 0, Math.PI)
  .onChange(() => {
    spotlight.angle = spotlightParams.topSpotlightAngle;
  });
topSpotlightFolder
  .add(spotlightParams, "topSpotlightPenumbra", 0, 1)
  .onChange(() => {
    spotlight.penumbra = spotlightParams.topSpotlightPenumbra;
  });
topSpotlightFolder
  .add(spotlightParams, "topSpotlightDistance", 0, 50)
  .onChange(() => {
    spotlight.distance = spotlightParams.topSpotlightDistance;
  });
///// REAR SPOTLIGHT
const rearSpotlightFolder = gui.addFolder("Rear Spotlight");
rearSpotlightFolder
  .addColor(spotlightParams, "rearSpotlightColor")
  .onChange(() => {
    rearSpotlight.color.set(spotlightParams.rearSpotlightColor);
  });
rearSpotlightFolder
  .add(spotlightParams, "rearSpotlightIntensity", 0, 50)
  .onChange(() => {
    rearSpotlight.intensity = spotlightParams.rearSpotlightIntensity;
  });
rearSpotlightFolder
  .add(spotlightParams, "rearSpotlightAngle", 0, Math.PI)
  .onChange(() => {
    rearSpotlight.angle = spotlightParams.rearSpotlightAngle;
  });
rearSpotlightFolder
  .add(spotlightParams, "rearSpotlightPenumbra", 0, 1)
  .onChange(() => {
    rearSpotlight.penumbra = spotlightParams.rearSpotlightPenumbra;
  });
rearSpotlightFolder
  .add(spotlightParams, "rearSpotlightDistance", 0, 50)
  .onChange(() => {
    rearSpotlight.distance = spotlightParams.rearSpotlightDistance;
  });
///// FRONT SPOTLIGHT
const frontSpotlightFolder = gui.addFolder("Front Spotlight");
frontSpotlightFolder
  .addColor(spotlightParams, "frontSpotlightColor")
  .onChange(() => {
    frontSpotlight.color.set(spotlightParams.frontSpotlightColor);
  });
frontSpotlightFolder
  .add(spotlightParams, "frontSpotlightIntensity", 0, 50)
  .onChange(() => {
    frontSpotlight.intensity = spotlightParams.frontSpotlightIntensity;
  });
frontSpotlightFolder
  .add(spotlightParams, "frontSpotlightAngle", 0, Math.PI)
  .onChange(() => {
    frontSpotlight.angle = spotlightParams.frontSpotlightAngle;
  });
frontSpotlightFolder
  .add(spotlightParams, "frontSpotlightPenumbra", 0, 1)
  .onChange(() => {
    frontSpotlight.penumbra = spotlightParams.frontSpotlightPenumbra;
  });
frontSpotlightFolder
  .add(spotlightParams, "frontSpotlightDistance", 0, 50)
  .onChange(() => {
    frontSpotlight.distance = spotlightParams.frontSpotlightDistance;
  });
// RIGHT SPOTLIGHT
const rightSpotlightFolder = gui.addFolder("Right Spotlight");
rightSpotlightFolder
  .addColor(spotlightParams, "rightSpotlightColor")
  .onChange(() => {
    rightSpotlight.color.set(spotlightParams.rightSpotlightColor);
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightIntensity", 0, 50)
  .onChange(() => {
    rightSpotlight.intensity = spotlightParams.rightSpotlightIntensity;
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightAngle", 0, Math.PI)
  .onChange(() => {
    rightSpotlight.angle = spotlightParams.rightSpotlightAngle;
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightPenumbra", 0, 1)
  .onChange(() => {
    rightSpotlight.penumbra = spotlightParams.rightSpotlightPenumbra;
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightDistance", 0, 50)
  .onChange(() => {
    rightSpotlight.distance = spotlightParams.rightSpotlightDistance;
  });
// LEFT SPOTLIGHT
const leftSpotlightFolder = gui.addFolder("Left Spotlight");
leftSpotlightFolder
  .addColor(spotlightParams, "leftSpotlightColor")
  .onChange(() => {
    leftSpotlight.color.set(spotlightParams.leftSpotlightColor);
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightIntensity", 0, 50)
  .onChange(() => {
    leftSpotlight.intensity = spotlightParams.leftSpotlightIntensity;
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightAngle", 0, Math.PI)
  .onChange(() => {
    leftSpotlight.angle = spotlightParams.leftSpotlightAngle;
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightPenumbra", 0, 1)
  .onChange(() => {
    leftSpotlight.penumbra = spotlightParams.leftSpotlightPenumbra;
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightDistance", 0, 50)
  .onChange(() => {
    leftSpotlight.distance = spotlightParams.leftSpotlightDistance;
  });

// Debug Cam
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
camera.position.z = 55;
camera.position.y = 15;
///// END OF DEVTOOLS AREA /////

// Resize Events
window.addEventListener("resize", () => {
  windowSize.width = window.innerWidth;
  windowSize.height = window.innerHeight;

  renderer.setSize(windowSize.width, windowSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio), 2);

  camera.aspect = windowSize.width / windowSize.height;
  camera.updateProjectionMatrix();
});

function showOnCanvas() {
  stats.begin();
  controls.update();
  // SSAO
  // efxComposer.render();
  angle += 0.001;
  const distance = 32.5; // Distance to model.
  const yOffset = 4; // Adjust camera height
  const x = center.x + distance * Math.cos(angle);
  const z = center.z + distance * Math.sin(angle);
  camera.position.set(x, center.y + yOffset, z); // Adjust the y-coordinate

  updateDirectionalLight();

  camera.lookAt(center);
  renderer.render(scene, camera);
  requestAnimationFrame(showOnCanvas);
  stats.end();
}
