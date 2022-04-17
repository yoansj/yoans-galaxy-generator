import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { randFloat, randInt } from "three/src/math/MathUtils";
import { faker } from "@faker-js/faker";
import gsap from "gsap-trial";
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

scene.background = skybox;

/**
 * Galaxy generator
 */

const parameters = {
  count: 100000,
  size: 0.01,
  radius: 5,
  branches: 3,
  spin: 1,
  randomness: 0.2,
  randomnessPower: 3,
  insideColor: "#ff6030",
  outsideColor: "#1b3984",
  speed: 0.1,
  showSkybox: true,
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

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ; //randFloat(parameters.minRange, parameters.maxRange);

    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / parameters.radius);
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  /**
   * Set the attributes
   */
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  /**
   * Create the material
   */
  material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    color: "white",
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
};

generateGalaxy();

/**
 * Tweaks
 */
const particlesFolder = gui.addFolder("Particles");
particlesFolder.add(parameters, "count").min(10).max(999999).step(100).listen().onFinishChange(generateGalaxy);
particlesFolder.add(parameters, "size").min(0.001).max(5).step(0.001).listen().onFinishChange(generateGalaxy);

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

  // Creates the galaxy
  generateGalaxy();

  /**
   * Generates a random name for the galaxy
   */
  const wordsNb = randInt(1, 5);
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
gui.add(parameters, "generateRandomGalaxy").name("Generate Random Galaxy");

parameters.generateRandomGalaxy();

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
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();
  if (particles !== null) {
    particles.rotation.y = elapsedTime * parameters.speed;
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
