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
scene.background = new THREE.Color(0x0F0E0D);
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

const spotlightTarget = new THREE.Object3D();
const spotlightTarget2 = new THREE.Object3D();

const spotlight = new THREE.SpotLight("#001DFF", 90, 15, Math.PI * 0.1, 0.25);
const spotlight2 = new THREE.SpotLight("#FF9000", 200, 15, Math.PI * 0.1, 0.25);
spotlight.castShadow = true;

spotlight.shadow.camera.near = 1;
spotlight.shadow.camera.far = 30;
spotlight.shadow.mapSize.width = 2048;
spotlight.shadow.mapSize.height = 2048;

spotlight.position.set(-5, 5, -11);
spotlightTarget.position.set(8, 2, 3);
spotlight2.position.set(-10, 5, 8);
spotlightTarget2.position.set(-8, 2, -3);

spotlight.target = spotlightTarget;
spotlight2.target = spotlightTarget2;

scene.add(spotlight);
scene.add(spotlightTarget);
scene.add(spotlight2);
scene.add(spotlightTarget2);

// Postprocessing stuff
const efxComposer = new EffectComposer(renderer);
const ssaoPass = new SSAOPass(scene, camera);
efxComposer.addPass(ssaoPass);
ssaoPass.intensity = 0.5;

// Load models
Promise.all([
  new Promise((resolve) => loader.load("/assets/a90.glb", resolve)),
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
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
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
/// cameras
const parameters = {
  cameraPositionX: 15,
  cameraPositionY: 10,
  cameraPositionZ: 15,
};

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

/// directional light
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

const spotlightParams = {
  rightSpotlightColor: "#001DFF",
  rightSpotlightIntensity: 1,
  rightSpotlightAngle: Math.PI * 0.1,
  rightSpotlightPenumbra: 0.25,
  leftSpotlightColor: "#FF9000",
  leftSpotlightIntensity: 1,
  leftSpotlightAngle: Math.PI * 0.1,
  leftSpotlightPenumbra: 0.25,
  rightSpotlightTargetX: 0.25,
  rightSpotlightTargetY: 0.25,
  rightSpotlightTargetZ: 0.25,
  leftSpotlightTargetX: 0.25,
  leftSpotlightTargetY: 0.25,
  leftSpotlightTargetZ: 0.25,
};
// Right spotlight folder
const rightSpotlightFolder = gui.addFolder("Right Spotlight");
rightSpotlightFolder
  .addColor(spotlightParams, "rightSpotlightColor")
  .onChange(() => {
    spotlight.color.set(spotlightParams.rightSpotlightColor);
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightIntensity", 0, 50)
  .onChange(() => {
    spotlight.intensity = spotlightParams.rightSpotlightIntensity;
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightAngle", 0, Math.PI)
  .onChange(() => {
    spotlight.angle = spotlightParams.rightSpotlightAngle;
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightPenumbra", 0, 1)
  .onChange(() => {
    spotlight.penumbra = spotlightParams.rightSpotlightPenumbra;
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightTargetX", -100, 100)
  .onChange(() => {
    spotlight.target.position.x = spotlightParams.rightSpotlightTargetX;
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightTargetY", -100, 100)
  .onChange(() => {
    spotlight.target.position.y = spotlightParams.rightSpotlightTargetY;
  });
rightSpotlightFolder
  .add(spotlightParams, "rightSpotlightTargetZ", -100, 100)
  .onChange(() => {
    spotlight.target.position.z = spotlightParams.rightSpotlightTargetZ;
  });
rightSpotlightFolder.open();

// Left spotlight folder
const leftSpotlightFolder = gui.addFolder("Left Spotlight");
leftSpotlightFolder
  .addColor(spotlightParams, "leftSpotlightColor")
  .onChange(() => {
    spotlight2.color.set(spotlightParams.leftSpotlightColor);
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightIntensity", 0, 50)
  .onChange(() => {
    spotlight2.intensity = spotlightParams.leftSpotlightIntensity;
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightAngle", 0, Math.PI)
  .onChange(() => {
    spotlight2.angle = spotlightParams.leftSpotlightAngle;
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightPenumbra", 0, 1)
  .onChange(() => {
    spotlight2.penumbra = spotlightParams.leftSpotlightPenumbra;
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightTargetX", -100, 100)
  .onChange(() => {
    spotlight2.target.position.x = spotlightParams.leftSpotlightTargetX;
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightTargetY", -100, 100)
  .onChange(() => {
    spotlight2.target.position.y = spotlightParams.leftSpotlightTargetY;
  });
leftSpotlightFolder
  .add(spotlightParams, "leftSpotlightTargetZ", -100, 100)
  .onChange(() => {
    spotlight2.target.position.z = spotlightParams.leftSpotlightTargetZ;
  });
leftSpotlightFolder.open();

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
