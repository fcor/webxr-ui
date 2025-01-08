import * as THREE from "three";
import { XRButton } from "three/examples/jsm/webxr/XRButton.js";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { reversePainterSortStable, Container, Root, Text, Image } from "@pmndrs/uikit";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let root;
let controls;
let counter = 0;
let tempUi, x;

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

init();

function init() {
  const canvas = document.querySelector("canvas.webgl");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 50);
  camera.position.set(0, 1.6, 1);
  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1.6, 0);
  controls.update();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  const grid = new THREE.GridHelper(4, 1, 0x111111, 0x111111);
  scene.add(grid);

  scene.add(new THREE.HemisphereLight(0x888877, 0x777788, 3));

  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(0, 4, 0);
  scene.add(light);

  const material = new THREE.MeshNormalMaterial({
    flatShading: true,
    side: THREE.DoubleSide,
  });

  const geometry = new THREE.CylinderGeometry(0.005, 0.005, 0.05);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 1.5, -0.5);
  // scene.add(mesh);

  const ui = new THREE.Group();
  ui.position.set(0, 1.5, -0.6);
  scene.add(ui);

  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  /*** UI ***/
  root = new Root(camera, renderer, {
    flexDirection: "row",
    gap: 0,
    width: 32,
    borderRadius: 4,
    padding: 1,
    alignItems: "center",
    backgroundColor: 0x5c45eb,
    backgroundOpacity: 0.8,
  });
  ui.add(root);

  tempUi = new Text("Temperature: " + counter, { fontSize: 3, color: "white" });

  const engine = new Text("Engine: Amber", { fontSize: 3, color: "white" });

  x = new Container({
    padding: 2,
    height: "100%",
    width: "100%",
    justifyContent: "flex-start",
    flexDirection: "column",
    gap: 2,
  });
  root.add(x);
  x.add(tempUi, engine);

  renderer.setPixelRatio(window.devicePixelRatio, 2);
  renderer.setSize(sizes.width, sizes.height);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  renderer.localClippingEnabled = true;
  renderer.setTransparentSort(reversePainterSortStable);
  document.body.appendChild(
    XRButton.createButton(
      renderer
      //   {
      //   optionalFeatures: ["depth-sensing"],
      //   depthSensing: { usagePreference: ["gpu-optimized"], dataFormatPreference: [] },
      // }
    )
  );

  const controllerModelFactory = new XRControllerModelFactory();

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("connected", onControllerConnected);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  controller1.addEventListener("squeezestart", onSqueezeStart);
  controller1.addEventListener("squeezeend", onSqueezeEnd);
  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller1.addEventListener("connected", onControllerConnected);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);
  controller2.addEventListener("squeezestart", onSqueezeStart);
  controller2.addEventListener("squeezeend", onSqueezeEnd);
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);
  scene.add(controller2);
}

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

let prev = null;
function animate(time) {
  const delta = prev == null ? 0 : time - prev;
  prev = time;
  counter = Math.floor(time / 1000);
  tempUi.setText("Temperature: " + counter);
  root.update(delta);
  controls.update(delta);
  renderer.render(scene, camera);
}

function onSqueezeStart(e) {
  console.log(e);
}
function onSqueezeEnd(e) {
  console.log(e);
}

function onControllerConnected(e) {
  console.log(e);
}

function onSelectStart(e) {
  console.log(e);
}

function onSelectEnd(e) {
  console.log(e);
}
