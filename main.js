import * as THREE from "three";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "./node_modules/three/examples/jsm/postprocessing/EffectComposer.js";
import { ShaderPass } from "./node_modules/three/examples/jsm/postprocessing/ShaderPass.js";
import { SSAOPass } from "./node_modules/three/examples/jsm/postprocessing/SSAOPass.js";

import { GUI } from "dat.gui";
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

const WHITE = "#FFFFFF";

////////////////////////////////////////
////////// PARAMETERS FROM GUI /////////
////////////////////////////////////////

const parameters = {
  cameraPositionX: 15,
  cameraPositionY: 10,
  cameraPositionZ: 15,
};

const spotlightParams = {
  topSpotlightColor: WHITE,
  topSpotlightIntensity: 30,
  topSpotlightAngle: 2.2,
  topSpotlightPenumbra: 0,
  topSpotlightDistance: 45,

  rearSpotlightColor: WHITE,
  rearSpotlightIntensity: 15,
  rearSpotlightAngle: 1.5,
  rearSpotlightPenumbra: 1,
  rearSpotlightDistance: 23,

  frontSpotlightColor: WHITE,
  frontSpotlightIntensity: 15,
  frontSpotlightAngle: 1.6,
  frontSpotlightPenumbra: 1,
  frontSpotlightDistance: 45,

  rightSpotlightColor: WHITE,
  rightSpotlightIntensity: 15,
  rightSpotlightAngle: 1.6,
  rightSpotlightPenumbra: 1,
  rightSpotlightDistance: 23,

  leftSpotlightColor: WHITE,
  leftSpotlightIntensity: 15,
  leftSpotlightAngle: 1.6,
  leftSpotlightPenumbra: 1,
  leftSpotlightDistance: 23,
};

//////////////////////////////////////////////
////////// VARIABLES & CONSTRUCTORS //////////
//////////////////////////////////////////////

let angle = 0;
let car1, spotlightProp1, spotlightProp2, spotlightProp3, spotlightProp4;
const DIRECTIONAL_LIGHT_INTENSITY = 0.015;
let center = new THREE.Vector3();
let loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  20,
  window.innerWidth / window.innerHeight,
  0.1,
  300
);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true // MSAA
});
renderer.setSize(windowSize.width, windowSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;

////////////////////////////////////
////////// FLOOR TEXTURE //////////
///////////////////////////////////

const FLOOR_TEX = "./assets/floor/concrete/Concrete033_2K_Color.png";
const DISPLACEMENT_MAP =
  "./assets/floor/concrete/Concrete033_2K_Displacement.png";
const NORMAL_GL = "./assets/floor/concrete/Concrete033_2K_NormalGL.png";
const ROUGHNESS = "./assets/floor/concrete/Concrete033_2K_Roughness.png";
// const METALNESS = "./assets/floor/metal/Metal046A_2K_Metalness.png";
const AMBIENT_OCCLUSION =
  "./assets/floor/concrete/Concrete033_2K_AmbientOcclusion.png";
const TEX_SCALE = 25;
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

//////////////////////////////////////////
////////// SHADOWS AND LIGHTING //////////
//////////////////////////////////////////

car1 = new THREE.Object3D();
car1.castShadow = true;
car1.receiveShadow = true;
scene.background = new THREE.Color(0x050505);
const directionalLight = new THREE.DirectionalLight(
  0xffffff,
  DIRECTIONAL_LIGHT_INTENSITY
);
directionalLight.position.set(0, 25, 0);
scene.add(directionalLight);

floor.receiveShadow = true;
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 10;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;

const spotlight = new THREE.SpotLight(WHITE, 5, 20, Math.PI / 3, 0.2);
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
const rightSpotlight = new THREE.SpotLight(
  WHITE,
  90,
  15,
  Math.PI * 0.1,
  0.25
);
const leftSpotlight = new THREE.SpotLight(
  WHITE,
  90,
  15,
  Math.PI * 0.1,
  0.25
);
const frontOffset = new THREE.Vector3(0, 0, 20);
const rearOffset = new THREE.Vector3(0, 0, -20);
const leftOffset = new THREE.Vector3(-20, 0, 0);
const rightOffset = new THREE.Vector3(20, 0, 0);

////////// TOP SPOTLIGHT //////////

spotlight.position.set(0, 10, 0);
spotlight.target = car1;
spotlight.castShadow = true;
spotlight.shadow.bias = -0.001;
spotlight.shadow.camera.near = 1;
spotlight.shadow.camera.far = 100;
spotlight.shadow.mapSize.width = 2048;
spotlight.shadow.mapSize.height = 2048;
spotlight.intensity;
scene.add(spotlight);

////////// REAR SPOTLIGHT //////////

rearSpotlight.position.set(-5, 10, -11);
rearSpotlight.position.copy(car1.position).add(rearOffset);
rearSpotlight.target = car1;
rearSpotlight.castShadow = true;
rearSpotlight.shadow.camera.near = 0.1;
rearSpotlight.shadow.camera.far = 30;
rearSpotlight.shadow.mapSize.width = 1024;
rearSpotlight.shadow.mapSize.height = 1024;
scene.add(rearSpotlight);

////////// FRONT SPOTLIGHT //////////

frontSpotlight.position.set(-10, 10, 40);
frontSpotlight.position.copy(car1.position).add(frontOffset);
frontSpotlight.target = car1;
frontSpotlight.castShadow = true;
frontSpotlight.shadow.camera.near = 0.1;
frontSpotlight.shadow.camera.far = 30;
frontSpotlight.shadow.mapSize.width = 1024;
frontSpotlight.shadow.mapSize.height = 1024;
scene.add(frontSpotlight);

////////// RIGHT SPOTLIGHT //////////

rightSpotlight.position.copy(car1.position).add(rightOffset);
rightSpotlight.target.position
  .copy(car1.position)
  .add(rightOffset)
  .sub(leftOffset);
rightSpotlight.castShadow = true;
rightSpotlight.shadow.camera.near = 0.1;
rightSpotlight.shadow.camera.far = 30;
rightSpotlight.shadow.mapSize.width = 1024;
rightSpotlight.shadow.mapSize.height = 1024;
scene.add(rightSpotlight);

////////// LEFT SPOTLIGHT //////////

leftSpotlight.position.copy(car1.position).add(leftOffset);
leftSpotlight.target.position
  .copy(car1.position)
  .add(leftOffset)
  .sub(rightOffset);
leftSpotlight.castShadow = true;
leftSpotlight.shadow.camera.near = 0.1;
leftSpotlight.shadow.camera.far = 30;
leftSpotlight.shadow.mapSize.width = 1024;
leftSpotlight.shadow.mapSize.height = 1024;
scene.add(leftSpotlight);

////////////////////////////////////
////////// POSTPROCESSING //////////
////////////////////////////////////

const efxComposer = new EffectComposer(renderer);

//// SSAO
const ssaoPass = new SSAOPass(scene, camera);
efxComposer.addPass(ssaoPass);
ssaoPass.intensity = 0.5;

/////////////////////////////////
////////// LOAD MODELS //////////
/////////////////////////////////

Promise.all([
  new Promise((resolve) => loader.load("/assets/cars/a90_supra.glb", resolve)),
  new Promise((resolve) => loader.load("/assets/props/spotlight.glb", resolve)),
  new Promise((resolve) => loader.load("/assets/props/spotlight.glb", resolve)),
  new Promise((resolve) => loader.load("/assets/props/spotlight.glb", resolve)),
  new Promise((resolve) => loader.load("/assets/props/spotlight.glb", resolve)),
]).then(([gltf1, gltf2, gltf3, gltf4, gltf5]) => {
  car1 = gltf1.scene;
  car1.position.y = -0.1;
  
  // ghibli
  // car1.scale.set(1.75, 1.75, 1.75);

  // a90 supra
  car1.scale.set(1.5, 1.5, 1.5)

  // r32
  // car1.scale.set(1.325, 1.325, 1.325);

  car1.castShadow = true;
  // Setting up shadow according to the car's meshes.
  car1.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Front of car
  spotlightProp1 = gltf2.scene;
  spotlightProp1.position.set(0, 0, 19.5)
  spotlightProp1.rotation.y = 9.4

  // Rear of car
  spotlightProp2 = gltf3.scene;
  spotlightProp2.position.set(0, 0, -19.5)

  // Left of car
  spotlightProp3 = gltf4.scene;
  spotlightProp3.position.set(-19.5, 0, 0)

  // Right of car
  spotlightProp4 = gltf5.scene;
  spotlightProp4.position.set(19.5, 0, 0)


  scene.add(car1);
  scene.add(spotlightProp1);
  scene.add(spotlightProp2);
  scene.add(spotlightProp3);
  scene.add(spotlightProp4);
  showOnCanvas();
});

////////////////////////////////////
////////// APPLY SETTINGS //////////
////////////////////////////////////

spotlight.color.set(spotlightParams.topSpotlightColor);
spotlight.intensity = spotlightParams.topSpotlightIntensity;
spotlight.angle = spotlightParams.topSpotlightAngle;
spotlight.penumbra = spotlightParams.topSpotlightPenumbra;
spotlight.distance = spotlightParams.topSpotlightDistance;

frontSpotlight.color.set(spotlightParams.rearSpotlightColor);
frontSpotlight.intensity = spotlightParams.rearSpotlightIntensity;
frontSpotlight.angle = spotlightParams.rearSpotlightAngle;
frontSpotlight.penumbra = spotlightParams.rearSpotlightPenumbra;
frontSpotlight.distance = spotlightParams.rearSpotlightDistance;

rearSpotlight.color.set(spotlightParams.rearSpotlightColor);
rearSpotlight.intensity = spotlightParams.rearSpotlightIntensity;
rearSpotlight.angle = spotlightParams.rearSpotlightAngle;
rearSpotlight.penumbra = spotlightParams.rearSpotlightPenumbra;
rearSpotlight.distance = spotlightParams.rearSpotlightDistance;

leftSpotlight.color.set(spotlightParams.rearSpotlightColor);
leftSpotlight.intensity = spotlightParams.rearSpotlightIntensity;
leftSpotlight.angle = spotlightParams.rearSpotlightAngle;
leftSpotlight.penumbra = spotlightParams.rearSpotlightPenumbra;
leftSpotlight.distance = spotlightParams.rearSpotlightDistance;

rightSpotlight.color.set(spotlightParams.rearSpotlightColor);
rightSpotlight.intensity = spotlightParams.rearSpotlightIntensity;
rightSpotlight.angle = spotlightParams.rearSpotlightAngle;
rightSpotlight.penumbra = spotlightParams.rearSpotlightPenumbra;
rightSpotlight.distance = spotlightParams.rearSpotlightDistance;

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

///////////////////////////////////
////////// DEVTOOLS AREA //////////
///////////////////////////////////

////////// FPS COUNTER

import Stats from "stats.js";
const stats = new Stats();
stats.showPanel(0);
stats.dom.style.position = "absolute";
stats.dom.style.top = "0";
stats.dom.style.left = "0";
document.body.appendChild(stats.dom);

////////// DEV.GUI SETUP //////////

const gui = new GUI();
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

////////// TOP SPOTLIGHT

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

////////// REAR SPOTLIGHT

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

////////// FRONT SPOTLIGHT

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

////////// RIGHT SPOTLIGHT

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

////////// LEFT SPOTLIGHT

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

////////// DEBUG CAM

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
camera.position.z = 55;
camera.position.y = 15;

//////////////////////////////////////////
////////// END OF DEVTOOLS AREA //////////
//////////////////////////////////////////

////////////////////////////////
////////// MAIN STUFF //////////
////////////////////////////////

function showOnCanvas() {
  stats.begin();
  controls.update();
  updateDirectionalLight();

  // Postprocessing
  // efxComposer.render();

  // angle += 0.0015;
  // const distance = 20; // Distance to model.
  // const yOffset = 1; // Camera height.
  // const x = center.x + distance * Math.cos(angle);
  // const z = center.z + distance * Math.sin(angle);
  // camera.position.set(x, center.y + yOffset, z);
  // camera.lookAt(center);

  renderer.render(scene, camera);
  requestAnimationFrame(showOnCanvas);
  stats.end();
}
