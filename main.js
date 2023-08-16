import * as THREE from "three";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "./node_modules/three/examples/jsm/postprocessing/EffectComposer.js";
import { ShaderPass } from "./node_modules/three/examples/jsm/postprocessing/ShaderPass.js";
import { SSAOPass } from "./node_modules/three/examples/jsm/postprocessing/SSAOPass.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";
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

//////////////////////////////////////////////
////////// VARIABLES & CONSTRUCTORS //////////
//////////////////////////////////////////////

let angle = 0;
let car1;

const DIRECTIONAL_LIGHT_INTENSITY = 0.02;
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
  1500
);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true, 
});
renderer.setSize(windowSize.width, windowSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

///// Moving these inside the render variable causes shadows and tonemapping not to work.
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5

////////////////////////////////////
////////// FLOOR TEXTURE //////////
///////////////////////////////////

const FLOOR_TEX = "./assets/floor/concrete/Concrete033_2K_Color.png";
const DISPLACEMENT_MAP = "./assets/floor/concrete/Concrete033_2K_Displacement.png";
const NORMAL_GL = "./assets/floor/concrete/Concrete033_2K_NormalGL.png";
const ROUGHNESS = "./assets/floor/concrete/Concrete033_2K_Roughness.png";
// const METALNESS = "./assets/floor/metal/Metal046A_2K_Metalness.png";
const AMBIENT_OCCLUSION = "./assets/floor/concrete/Concrete033_2K_AmbientOcclusion.png";
const TEX_SCALE = 5;
const PLANE_WIDTH = 60;
const PLANE_HEIGHT = 60;

Promise.all([
  textureLoader.load(FLOOR_TEX),
  textureLoader.load(DISPLACEMENT_MAP),
  textureLoader.load(ROUGHNESS),
  textureLoader.load(AMBIENT_OCCLUSION),
  textureLoader.load(NORMAL_GL),
]).then(([floorTexture, dispMap, rough, amb_occ, normalGL]) => {
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  const floorTextureScale = TEX_SCALE;
  floorTexture.repeat.set(floorTextureScale, floorTextureScale);

  dispMap.wrapS = dispMap.wrapT = THREE.RepeatWrapping;
  const dispMapScale = TEX_SCALE;
  dispMap.repeat.set(dispMapScale, dispMapScale);

  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  const roughScale = TEX_SCALE;
  rough.repeat.set(roughScale, roughScale);

  amb_occ.wrapS = amb_occ.wrapT = THREE.RepeatWrapping;
  const amb_occScale = TEX_SCALE;
  amb_occ.repeat.set(amb_occScale, amb_occScale);

  normalGL.wrapS = normalGL.wrapT = THREE.RepeatWrapping;
  const normalGLScale = TEX_SCALE;
  normalGL.repeat.set(normalGLScale, normalGLScale);
  const geometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT);
  const material = new THREE.MeshStandardMaterial({
    map: floorTexture,
    displacementMap: dispMap,
    displacementScale: 1,
    normalMap: normalGL,
    normalMapType: THREE.TangentSpaceNormalMap,
    roughnessMap: rough,
    roughness: 0.9,
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
////////// PARAMETERS FROM GUI /////////
////////////////////////////////////////

const parameters = {
  cameraPositionX: 15,
  cameraPositionY: 10,
  cameraPositionZ: 15,
};

const spotlightParams = {
  topSpotlightColor: WHITE,
  topSpotlightIntensity: 45,
  topSpotlightAngle: 2.48.toFixed(2),
  topSpotlightPenumbra: 0.65,
  topSpotlightDistance: 40,
  topSpotlightX: 0,
  topSpotlightY: 8.75,
  topSpotlightZ: 0,

  frontSpotlightColor: WHITE,
  frontSpotlightIntensity: 30,
  frontSpotlightAngle: 1.6,
  frontSpotlightPenumbra: 0.65,
  frontSpotlightDistance: 30,

  rearSpotlightColor: WHITE,
  rearSpotlightIntensity: 30,
  rearSpotlightAngle: 1.57.toFixed(2),
  rearSpotlightPenumbra: 0.65,
  rearSpotlightDistance: 28,

  rightSpotlightColor: WHITE,
  rightSpotlightIntensity: 50,
  rightSpotlightAngle: 2.5,
  rightSpotlightPenumbra: 0.65,
  rightSpotlightDistance: 30,

  leftSpotlightColor: WHITE,
  leftSpotlightIntensity: 50,
  leftSpotlightAngle: 2.5,
  leftSpotlightPenumbra: 0.65,
  leftSpotlightDistance: 30,
};

//////////////////////////////////////////
////////// SHADOWS AND LIGHTING //////////
//////////////////////////////////////////
/*
 To whoever wants to try this out for themselves,
 if you're experiencing shadow artifacting (blurred shadowy lines),
 play around with the shadow bias.
*/

car1 = new THREE.Object3D();
car1.castShadow = true;
car1.receiveShadow = true;
scene.background = new THREE.Color(0x020202);
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
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;

const spotlight = new THREE.SpotLight(WHITE, 5, 20, Math.PI / 3, 0.2);
const frontSpotlight = new THREE.SpotLight(spotlightParams.frontSpotlightColor, 90, 20, Math.PI * 0.1, 0.25);
const rearSpotlight = new THREE.SpotLight(spotlightParams.rearSpotlightColor, 90, 20, Math.PI * 0.1, 0.25);
const rightSpotlight = new THREE.SpotLight(spotlightParams.rearSpotlightColor, 90, 20, Math.PI * 0.1, 0.25);
const leftSpotlight = new THREE.SpotLight(spotlightParams.rearSpotlightColor, 90, 200, Math.PI * 0.1, 0.25);
////////// SETTING UP SPOTLIGHT POSITIONS //////////
const frontOffset = new THREE.Vector3(0, 0, 25); // Front of the car
const rearOffset = new THREE.Vector3(0, 0, -25); // Rear of the car
const leftOffset = new THREE.Vector3(-25, 0, 0); // Left of the car
const rightOffset = new THREE.Vector3(25, 0, 0); // Right of the car
////////// TOP SPOTLIGHT //////////
spotlight.position.set(0, 8.9, 0);
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
frontSpotlight.shadow.camera.near = 0.1;
frontSpotlight.shadow.camera.far = 25;
frontSpotlight.shadow.mapSize.width = 1024;
frontSpotlight.shadow.mapSize.height = 1024;
scene.add(frontSpotlight);
////////// REAR SPOTLIGHT //////////
rearSpotlight.position.set(-5, 10, -11);
rearSpotlight.position.copy(car1.position).add(rearOffset);
rearSpotlight.target = car1;
rearSpotlight.castShadow = true;
rearSpotlight.shadow.camera.near = 0.1;
rearSpotlight.shadow.camera.far = 25;
rearSpotlight.shadow.mapSize.width = 1024;
rearSpotlight.shadow.mapSize.height = 1024;
scene.add(rearSpotlight);
////////// RIGHT SPOTLIGHT //////////
rightSpotlight.position.copy(car1.position).add(rightOffset);
rightSpotlight.target.position.copy(car1.position).add(rightOffset).sub(leftOffset);
rightSpotlight.castShadow = true;
rightSpotlight.shadow.bias = -0.001; // Fixes shadow artifacts.
rightSpotlight.shadow.camera.near = 0.1;
rightSpotlight.shadow.camera.far = 25;
rightSpotlight.shadow.mapSize.width = 1024;
rightSpotlight.shadow.mapSize.height = 1024;
scene.add(rightSpotlight);
////////// LEFT SPOTLIGHT //////////
leftSpotlight.position.copy(car1.position).add(leftOffset);
leftSpotlight.target.position.copy(car1.position).add(leftOffset).sub(rightOffset);
leftSpotlight.castShadow = true;
leftSpotlight.shadow.bias = -0.001; // Fixes shadow artifacts.
leftSpotlight.shadow.camera.near = 5;
leftSpotlight.shadow.camera.far = 25;
leftSpotlight.shadow.mapSize.width = 1024;
leftSpotlight.shadow.mapSize.height = 1024;
scene.add(leftSpotlight);

////////////////////////////////////
////////// POSTPROCESSING //////////
////////////////////////////////////

const effectComposer = new EffectComposer(renderer);

///// SSAO -> I don't recommend it, way too much performance loss for little gain.
// const ssaoPass = new SSAOPass(scene, camera);
// effectComposer.addPass(ssaoPass);
// ssaoPass.intensity = 0.2;


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
  car1.position.y = -0.1;

  // Toyota Supra scale
  car1.scale.set(1.5, 1.5, 1.5);

  // Challenger scale & position
  // car1.position.y = -0.2;
  // car1.scale.set(0.625, 0.625, 0.625);

  // Maserati Ghibli, Polestar 1 scale
  // car1.scale.set(1.75, 1.75, 1.75);

  // BMW M3 E30 scale & position
  // car1.position.z = -0.1;
  // car1.scale.set(1.75, 1.75, 1.75);

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
  spotlightProps[0].position.set(2.5, -0.20, 26);
  spotlightProps[0].rotation.y = 9.425;
  spotlightProps[0].rotation.x = -1.5;

  // Rear of car
  spotlightProps[1] = gltf3.scene;
  spotlightProps[1].position.set(-2.5, -0.20, -26);
  spotlightProps[1].rotation.x = 1.5;

  // Left of car
  spotlightProps[2] = gltf4.scene;
  spotlightProps[2].position.set(-26.025, -0.06, -2.55);
  spotlightProps[2].rotation.y = 3.15;
  spotlightProps[2].rotation.x = 1.57;
  spotlightProps[2].rotation.z = 1.575;

  // Right of car
  spotlightProps[3] = gltf5.scene;
  spotlightProps[3].position.set(26.025, -0.14, -2.55);
 
  spotlightProps[3].rotation.x = 1.57;
  spotlightProps[3].rotation.z = 1.575;

  // Add all spotlightProps to the scene
  for (const spotlightProp of spotlightProps) {
    scene.add(spotlightProp);
  }
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

/* If you want to adjust certain stuff, 
like lighting and angles, uncomment the necessary lines 
*/

////////// FPS COUNTER
// import Stats from "stats.js";
// const stats = new Stats();
// stats.showPanel(0);
// stats.dom.style.position = "absolute";
// stats.dom.style.top = "0";
// stats.dom.style.left = "0";
// document.body.appendChild(stats.dom);

// // ////////// DEV.GUI SETUP //////////
// const gui = new GUI();
// function updateCameraPosition() {
//   camera.position.set(
//     parameters.cameraPositionX,
//     parameters.cameraPositionY,
//     parameters.cameraPositionZ
//   );
// }
// const cameras = gui.addFolder("Camera");
// cameras.add(parameters, "cameraPositionX", -50, 50).onChange(updateCameraPosition);
// cameras.add(parameters, "cameraPositionY", -50, 50).onChange(updateCameraPosition);
// cameras.add(parameters, "cameraPositionZ", -50, 50).onChange(updateCameraPosition);

// ////////// DIRECTIONAL LIGHT GUI
// const lightParameters = {
//   lightIntensity: DIRECTIONAL_LIGHT_INTENSITY,
//   lightX: directionalLight.position.x,
//   lightY: directionalLight.position.y,
//   lightZ: directionalLight.position.z,
// };

// function updateDirectionalLight() {
//   directionalLight.intensity = lightParameters.lightIntensity;
//   directionalLight.position.set(
//     lightParameters.lightX,
//     lightParameters.lightY,
//     lightParameters.lightZ
//   );
// }
// const lightFolder = gui.addFolder("Directional Light");
// lightFolder.add(lightParameters, "lightIntensity", 0, 10).onChange(updateDirectionalLight);
// lightFolder.add(lightParameters, "lightX", -50, 50).onChange(updateDirectionalLight);
// lightFolder.add(lightParameters, "lightY", -50, 50).onChange(updateDirectionalLight);
// lightFolder.add(lightParameters, "lightZ", -50, 50).onChange(updateDirectionalLight);

// ////////// TOP SPOTLIGHT GUI
// const topSpotlightFolder = gui.addFolder("Top Spotlight");
// topSpotlightFolder.addColor(spotlightParams, "topSpotlightColor").onChange(() => {spotlight.color.set(spotlightParams.topSpotlightColor);});
// topSpotlightFolder.add(spotlightParams, "topSpotlightIntensity", 0, 50).onChange(() => {spotlight.intensity = spotlightParams.topSpotlightIntensity;});
// topSpotlightFolder.add(spotlightParams, "topSpotlightAngle", 0, Math.PI).onChange(() => {spotlight.angle = spotlightParams.topSpotlightAngle;});
// topSpotlightFolder.add(spotlightParams, "topSpotlightPenumbra", 0, 2).onChange(() => {spotlight.penumbra = spotlightParams.topSpotlightPenumbra;});
// topSpotlightFolder.add(spotlightParams, "topSpotlightDistance", 1, 90).onChange(() => {spotlight.distance = spotlightParams.topSpotlightDistance;});
// topSpotlightFolder.add(spotlightParams, "topSpotlightX", -50, 50).onChange(() => {spotlight.position.x = spotlightParams.topSpotlightX;});
// topSpotlightFolder.add(spotlightParams, "topSpotlightY", -50, 50).onChange(() => {spotlight.position.y = spotlightParams.topSpotlightY;});
// topSpotlightFolder.add(spotlightParams, "topSpotlightZ", -50, 50).onChange(() => {spotlight.position.z = spotlightParams.topSpotlightZ;});

// ////////// FRONT SPOTLIGHT GUI
// const frontSpotlightFolder = gui.addFolder("Front Spotlight");
// frontSpotlightFolder.addColor(spotlightParams, "frontSpotlightColor").onChange(() => {frontSpotlight.color.set(spotlightParams.frontSpotlightColor);});
// frontSpotlightFolder.add(spotlightParams, "frontSpotlightIntensity", 0, 50).onChange(() => {frontSpotlight.intensity = spotlightParams.frontSpotlightIntensity;});
// frontSpotlightFolder.add(spotlightParams, "frontSpotlightAngle", 0, Math.PI).onChange(() => {frontSpotlight.angle = spotlightParams.frontSpotlightAngle;});
// frontSpotlightFolder.add(spotlightParams, "frontSpotlightPenumbra", 0, 2).onChange(() => {frontSpotlight.penumbra = spotlightParams.frontSpotlightPenumbra;});
// frontSpotlightFolder.add(spotlightParams, "frontSpotlightDistance", 1, 90).onChange(() => {frontSpotlight.distance = spotlightParams.frontSpotlightDistance;});

// ////////// REAR SPOTLIGHT GUI
// const rearSpotlightFolder = gui.addFolder("Rear Spotlight");
// rearSpotlightFolder.addColor(spotlightParams, "rearSpotlightColor").onChange(() => {rearSpotlight.color.set(spotlightParams.rearSpotlightColor);});
// rearSpotlightFolder.add(spotlightParams, "rearSpotlightIntensity", 0, 50).onChange(() => {rearSpotlight.intensity = spotlightParams.rearSpotlightIntensity;});
// rearSpotlightFolder.add(spotlightParams, "rearSpotlightAngle", 0, Math.PI).onChange(() => {rearSpotlight.angle = spotlightParams.rearSpotlightAngle;});
// rearSpotlightFolder.add(spotlightParams, "rearSpotlightPenumbra", 0, 2).onChange(() => {rearSpotlight.penumbra = spotlightParams.rearSpotlightPenumbra;});
// rearSpotlightFolder.add(spotlightParams, "rearSpotlightDistance", 1, 90).onChange(() => {rearSpotlight.distance = spotlightParams.rearSpotlightDistance;});

// ////////// RIGHT SPOTLIGHT GUI
// const rightSpotlightFolder = gui.addFolder("Right Spotlight");
// rightSpotlightFolder.addColor(spotlightParams, "rightSpotlightColor").onChange(() => {rightSpotlight.color.set(spotlightParams.rightSpotlightColor);});
// rightSpotlightFolder.add(spotlightParams, "rightSpotlightIntensity", 0, 50).onChange(() => {rightSpotlight.intensity = spotlightParams.rightSpotlightIntensity;});
// rightSpotlightFolder.add(spotlightParams, "rightSpotlightAngle", 0, Math.PI).onChange(() => {rightSpotlight.angle = spotlightParams.rightSpotlightAngle;});
// rightSpotlightFolder.add(spotlightParams, "rightSpotlightPenumbra", 0, 2).onChange(() => {rightSpotlight.penumbra = spotlightParams.rightSpotlightPenumbra;});
// rightSpotlightFolder.add(spotlightParams, "rightSpotlightDistance", 1, 90).onChange(() => {rightSpotlight.distance = spotlightParams.rightSpotlightDistance;});

// ////////// LEFT SPOTLIGHT GUI
// const leftSpotlightFolder = gui.addFolder("Left Spotlight");
// leftSpotlightFolder.addColor(spotlightParams, "leftSpotlightColor").onChange(() => {leftSpotlight.color.set(spotlightParams.leftSpotlightColor);});
// leftSpotlightFolder.add(spotlightParams, "leftSpotlightIntensity", 0, 50).onChange(() => {leftSpotlight.intensity = spotlightParams.leftSpotlightIntensity;});
// leftSpotlightFolder.add(spotlightParams, "leftSpotlightAngle", 0, Math.PI).onChange(() => {leftSpotlight.angle = spotlightParams.leftSpotlightAngle;});
// leftSpotlightFolder.add(spotlightParams, "leftSpotlightPenumbra", 0, 2).onChange(() => {leftSpotlight.penumbra = spotlightParams.leftSpotlightPenumbra;});
// leftSpotlightFolder.add(spotlightParams, "leftSpotlightDistance", 1, 80).onChange(() => {leftSpotlight.distance = spotlightParams.leftSpotlightDistance;});

// //////// DEBUG CAM (DISABLED WHEN AUTO ROTATE IS ENABLED IN THE FUNCTION.)
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
// camera.position.z = 55;
// camera.position.y = 15;

//////////////////////////////////////////
////////// END OF DEVTOOLS AREA //////////
//////////////////////////////////////////

////////////////////////////////
////////// MAIN STUFF //////////
////////////////////////////////

const distance = 25; // Distance to model.
const yOffset = 1.2; // Camera height.

function showOnCanvas() {
  // Devtools (including the stats.end())
  // stats.begin();
  // controls.update();
  // updateDirectionalLight();

  // effectComposer.render(); -> Postprocessing effects.

  // Camera rotation.
  angle += 0.0008;
  const x = center.x + distance * Math.cos(angle);
  const z = center.z + distance * Math.sin(angle);
  camera.position.set(x, center.y + yOffset, z);
  camera.lookAt(center);

  renderer.render(scene, camera);
  requestAnimationFrame(showOnCanvas);
  // stats.end();
}
