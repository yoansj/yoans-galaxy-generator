import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { randFloat, randInt } from "three/src/math/MathUtils";
import { faker } from "@faker-js/faker";
import gsap from "gsap-trial";
import html2canvas from "html2canvas";
import galaxyVertexShader from "./shaders/galaxy/vertex.glsl";
import galaxyFragmentShader from "./shaders/galaxy/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new dat.GUI({
  title: "Galaxy Generator",
});

// Define sample method on Array type
Array.prototype.sample = function () {
  return this[Math.floor(Math.random() * this.length)];
};

// Galaxy name element
const galaxyNameEl = document.querySelector("h1.galaxy-name");

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

const cubeLoader = new THREE.CubeTextureLoader();

// Load textures
// https://opengameart.org/content/space-skyboxes-0
const skybox = cubeLoader.load([
  "/textures/skybox/right.png", //px
  "/textures/skybox/left.png", //nx
  "/textures/skybox/top.png", //py
  "/textures/skybox/bot.png", //ny
  "/textures/skybox/front.png", //pz
  "/textures/skybox/back.png", // nz
]);

// scene.background = skybox;

/**
 * Galaxy generator
 */

const parameters = {
  count: 100000,
  size: 15,
  radius: 5,
  branches: 3,
  spin: 1,
  randomness: 0.2,
  randomnessPower: 3,
  insideColor: "#ff6030",
  outsideColor: "#1b3984",
  speed: 0.1,
  showSkybox: true,
  showGalaxyName: true,
  showInstructions: true,
  hideMenuOnScreenshot: true,
};

let geometry = null;
let material = null;
let particles = null;

const generateGalaxy = () => {
  if (particles !== null) {
    geometry.dispose();
    material.dispose();
    scene.remove(particles);
  }

  /**
   * Create the geometry
   * Create the positions and colors array
   */
  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);
  const scales = new Float32Array(parameters.count);
  const randomness = new Float32Array(parameters.count * 3);

  const colorInside = new THREE.Color(parameters.insideColor);
  const colorOutside = new THREE.Color(parameters.outsideColor);

  /**
   * Loop and fill the arrays
   * Fill 3 by 3
   */
  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;
    const radius = Math.random() * parameters.radius;
    const spinAngle = radius * parameters.spin;
    const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    /**
     * const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
     */
    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius; //randFloat(parameters.minRange, parameters.maxRange);

    randomness[i3] = randomX;
    randomness[i3 + 1] = randomY;
    randomness[i3 + 2] = randomZ;

    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / parameters.radius);
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;

    scales[i] = Math.random();
  }

  /**
   * Set the attributes
   */
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("scales", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("randomness", new THREE.BufferAttribute(randomness, 3));

  /**
   * Create the material
   */
  material = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader,
    uniforms: {
      uSize: { value: parameters.size * renderer.getPixelRatio() },
      uTime: { value: 0 },
    },
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
};

/**
 * Tweaks
 */
const particlesFolder = gui.addFolder("Particles");
particlesFolder.add(parameters, "count").min(10).max(999999).step(100).listen().onFinishChange(generateGalaxy);
particlesFolder.add(parameters, "size").min(0.001).max(50).step(0.001).listen().onFinishChange(generateGalaxy);

const galaxyFolder = gui.addFolder("Galaxy");
galaxyFolder.add(parameters, "radius").min(0.01).max(20).step(0.01).listen().onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, "branches").min(2).max(20).step(1).listen().onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, "spin").min(-5).max(5).step(0.001).listen().onFinishChange(generateGalaxy);

const randomnessFolder = gui.addFolder("Randomness");
randomnessFolder.add(parameters, "randomness").min(0).max(5).step(0.001).listen().onFinishChange(generateGalaxy);
randomnessFolder.add(parameters, "randomnessPower").min(1).max(10).step(0.01).listen().onFinishChange(generateGalaxy);

const colorsFolder = gui.addFolder("Galaxy colors");
colorsFolder.addColor(parameters, "insideColor").listen().onFinishChange(generateGalaxy);
colorsFolder.addColor(parameters, "outsideColor").listen().onFinishChange(generateGalaxy);

const animationFolder = gui.addFolder("Animation and others");
animationFolder.add(parameters, "speed").min(-2).max(2).step(0.1).listen();
animationFolder.add(parameters, "showSkybox").onChange((v) => {
  if (v === true) {
    scene.background = skybox;
  } else {
    scene.background = null;
  }
});
animationFolder
  .add(parameters, "showGalaxyName")
  .name("Display Galaxy Name")
  .onChange((v) => {
    if (v === true) {
      document.querySelector(".galaxy-name").style.visibility = "visible";
    } else {
      document.querySelector(".galaxy-name").style.visibility = "hidden";
    }
  });
animationFolder
  .add(parameters, "showInstructions")
  .name("Display Instructions")
  .onChange((v) => {
    if (v === true) {
      document.querySelector("#info2").style.visibility = "visible";
    } else {
      document.querySelector("#info2").style.visibility = "hidden";
    }
  });

/**
 * Generates a random galaxy on call
 */
parameters.generateRandomGalaxy = () => {
  /**
   * Sets random parameters
   */
  parameters.radius = randFloat(0, 20);
  parameters.branches = randInt(2, 20);
  parameters.spin = randFloat(-5, 5);
  parameters.randomness = randFloat(0, 2);
  parameters.randomnessPower = randFloat(1, 10);
  const insideColor = new THREE.Color();
  const outsideColor = new THREE.Color();
  insideColor.r = randFloat(0, 1);
  insideColor.g = randFloat(0, 1);
  insideColor.b = randFloat(0, 1);
  outsideColor.r = randFloat(0, 1);
  outsideColor.g = randFloat(0, 1);
  outsideColor.b = randFloat(0, 1);
  parameters.insideColor = "#" + insideColor.getHexString();
  parameters.outsideColor = "#" + outsideColor.getHexString();
  parameters.speed = randFloat(-2, 2);

  /**
   * Generates a random name for the galaxy
   */
  const wordsNb = randInt(1, 4);
  const romanNumber = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"].sample();
  const decorator = ["Major", "Alpha", "Beta", "Omgea", "", "Prime", "Bonus"].sample();
  let galaxyName = "";

  for (let i = 0; i !== wordsNb; i++) {
    galaxyName += faker.lorem.word() + " ";
  }
  galaxyName += romanNumber + " " + decorator;
  galaxyNameEl.innerHTML = galaxyName.toUpperCase();

  /**
   * Animates the generated name
   */
  gsap.from("h1.galaxy-name", {
    yPercent: 600,
    stagger: 0.05,
    ease: "back.out",
    duration: 0.6,
  });
};

// Nécessaire à cause des modifs
parameters.trueGenerateRandomGalaxy = () => {
  parameters.generateRandomGalaxy();
  generateGalaxy();
};

gui.add(parameters, "trueGenerateRandomGalaxy").name("Generate Random Galaxy");

const saveBlob = (function () {
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  return function saveData(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    document.body.removeChild(a);
  };
})();

parameters.screenshot = () => {
  const canvas = document.querySelector("canvas");
  canvas.toBlob((blob) => {
    saveBlob(blob, `galaxy-generator-${canvas.width}x${canvas.height}.png`);
  });
};
gui.add(parameters, "screenshot").name("Screenshot");

parameters.generateRandomGalaxy();

window.addEventListener("keypress", (ev) => {
  if (ev.key === "g") {
    parameters.generateRandomGalaxy();
  }
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  preserveDrawingBuffer: true, // For screenshots
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

generateGalaxy();

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();
  if (material !== null) {
    // particles.rotation.y = elapsedTime * parameters.speed;
    material.uniforms.uTime.value = elapsedTime;
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
