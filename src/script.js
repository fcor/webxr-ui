import * as THREE from "three";
import { XRButton } from "three/examples/jsm/webxr/XRButton.js";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";
import { OculusHandModel } from "three/examples/jsm/webxr/OculusHandModel.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { reversePainterSortStable, Container, Root, Text, Image } from "@pmndrs/uikit";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer;
let controller1, controller2;
let hand1, hand2;
let controllerGrip1, controllerGrip2;
let root, panelRoot;
let controls;
let counter = 0;
let tempUi, x;
let panelAnchor;
let button1, button2;

let hoveredButton = null;
const HOVER_DISTANCE = 0.05;
const HAND_TRIGGER_DISTANCE = 0.05;

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
  // scene.add(grid);

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

  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  /*** UI ***/
  const ui = new THREE.Group();
  ui.position.set(0, 1.5, -0.6);
  scene.add(ui);

  root = new Root(camera, renderer, {
    flexDirection: "row",
    gap: 0,
    width: 32,
    borderRadius: 2,
    padding: 1,
    alignItems: "center",
    backgroundColor: 0x5c45eb,
    backgroundOpacity: 0.8,
  });
  ui.add(root);

  tempUi = new Text("Temperature: " + counter, { fontSize: 3, color: "white" });

  const engine = new Text("Engine: Amber", { fontSize: 3, color: "white" });

  const textContainer = new Container({
    padding: 2,
    height: "100%",
    width: "100%",
    justifyContent: "flex-start",
    flexDirection: "column",
    gap: 2,
  });
  root.add(textContainer);
  textContainer.add(tempUi, engine);

  panelAnchor = new THREE.Group();
  scene.add(panelAnchor);

  panelRoot = new Root(camera, renderer, {
    flexDirection: "column",
    gap: 0,
    width: 32,
    borderRadius: 2,
    padding: 1,
    alignItems: "center",
    backgroundColor: 0x5c45eb,
    backgroundOpacity: 0.8,
  });

  panelAnchor.add(panelRoot);

  const panelText = new Text("Panel Info", { fontSize: 3, color: "white" });

  const panelContainer = new Container({
    padding: 2,
    height: "100%",
    width: "100%",
    justifyContent: "flex-start",
    flexDirection: "column",
    gap: 2,
  });

  const buttonContainer = new Container({
    padding: 1,
    height: "100%",
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row",
    gap: 2,
  });

  const buttonStyles = {
    padding: 1,
    height: "100%",
    width: "100%",
    backgroundColor: 0x9bf99f,
    borderRadius: 1,
    fontSize: 2,
    color: 0x4432b0,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    hover: { backgroundColor: 0x51f55a },
    onClick: (e) => {
      e.object.setStyle({ backgroundColor: 0xfbfaff, color: 0x9bf99f });
      setTimeout(() => {
        e.object.setStyle({ backgroundColor: 0x9bf99f, color: 0x4432b0, hover: { backgroundColor: 0x51f55a } });
      }, 200);
    },
  };

  button1 = new Text("Increase", buttonStyles);
  button2 = new Text("Decrease", buttonStyles);

  buttonContainer.add(button1, button2);
  panelRoot.add(panelContainer, buttonContainer);
  panelContainer.add(panelText);

  renderer.setPixelRatio(window.devicePixelRatio, 2);
  renderer.setSize(sizes.width, sizes.height);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  renderer.localClippingEnabled = true;
  renderer.setTransparentSort(reversePainterSortStable);
  document.body.appendChild(
    XRButton.createButton(renderer, {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "unbounded"],
    })
  );

  // Controllers
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("connected", onControllerConnected);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("connected", onControllerConnected);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  // Hand1
  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  controllerGrip1.addEventListener("selectstart", onSelectStart);
  controllerGrip1.addEventListener("selectend", onSelectEnd);
  scene.add(controllerGrip1);

  hand1 = renderer.xr.getHand(0);
  hand1.add(new OculusHandModel(hand1));
  hand1.addEventListener("pinchstart", onPinchStart);
  hand1.addEventListener("pinchend", onPinchEnd);
  scene.add(hand1);

  // Hand2
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  controllerGrip2.addEventListener("selectstart", onSelectStart);
  controllerGrip2.addEventListener("selectend", onSelectEnd);
  scene.add(controllerGrip2);

  hand2 = renderer.xr.getHand(1);
  hand2.add(new OculusHandModel(hand2));
  hand2.addEventListener("pinchstart", onPinchStart);
  hand2.addEventListener("pinchend", onPinchEnd);
  scene.add(hand2);

  const pivot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.01, 3));
  pivot.name = "pivot";
  pivot.position.z = -0.05;
  pivot.position.y = -0.03;
  const group = new THREE.Group();
  group.add(pivot);

  controllerGrip1.add(group.clone());
  controllerGrip2.add(group.clone());
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
  tempUi.setText("Temperature: " + counter);
  root.update(delta);
  if (controller1) {
    controller1.getWorldPosition(panelAnchor.position);
    panelAnchor.position.y += 0.1;
    panelAnchor.lookAt(camera.position);
    panelRoot.update(delta);
    checkButtonHover();
  }
  controls.update(delta);
  renderer.render(scene, camera);
}

function onPinchStart(e) {
  console.log(e);
}
function onPinchEnd(e) {
  console.log(e);
}

function onControllerConnected(e) {
  console.log(e);
}

function onSelectStart(e) {
  if (hoveredButton) {
    if (hoveredButton === button1) {
      counter++;
    } else if (hoveredButton === button2) {
      if (counter > 0) {
        counter--;
      }
    }

    hoveredButton.dispatchEvent({
      type: "click",
      distance: 0,
      nativeEvent: {},
      object: hoveredButton,
      point: new THREE.Vector3(),
      pointerId: -1,
    });
  }
}

function onSelectEnd(e) {
  console.log(e);
}

function checkButtonHover() {
  let closestButton = null;
  let closestDistance = HOVER_DISTANCE;
  const buttons = [button1, button2];
  const inputPoints = [];

  // Collect all possible interaction points
  if (controllerGrip1) {
    const pivot = controllerGrip1.getObjectByName("pivot");
    if (pivot) {
      const point = new THREE.Vector3();
      pivot.getWorldPosition(point);
      inputPoints.push(point);
    }
  }

  if (controllerGrip2) {
    const pivot = controllerGrip2.getObjectByName("pivot");
    if (pivot) {
      const point = new THREE.Vector3();
      pivot.getWorldPosition(point);
      inputPoints.push(point);
    }
  }

  // Find the closest button from any input point
  buttons.forEach((button) => {
    if (button) {
      const buttonPosition = new THREE.Vector3();
      button.getWorldPosition(buttonPosition);

      // Check distance from each input point to this button
      inputPoints.forEach((inputPoint) => {
        const distance = inputPoint.distanceTo(buttonPosition);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestButton = button;
        }
      });
    }
  });

  // Handle hover state changes
  if (hoveredButton !== closestButton) {
    if (hoveredButton) {
      hoveredButton.dispatchEvent({
        type: "pointerout",
        distance: 0,
        nativeEvent: {},
        object: hoveredButton,
        point: new THREE.Vector3(),
        pointerId: -1,
      });
    }

    if (closestButton) {
      closestButton.dispatchEvent({
        type: "pointerover",
        distance: 0,
        nativeEvent: {},
        object: closestButton,
        point: new THREE.Vector3(),
        pointerId: -1,
      });
    }

    hoveredButton = closestButton;
  }

  checkHandInteractions();
}

function checkHandInteractions() {
  const buttons = [button1, button2];

  const checkHand = (hand) => {
    if (hand?.joints?.["index-finger-tip"]) {
      const fingerTip = new THREE.Vector3();
      hand.joints["index-finger-tip"].getWorldPosition(fingerTip);
      
      buttons.forEach((button) => {
        if (button) {
          const buttonPosition = new THREE.Vector3();
          button.getWorldPosition(buttonPosition);
          const distance = fingerTip.distanceTo(buttonPosition);
          
          if (distance < HAND_TRIGGER_DISTANCE) {
            console.log("hey")
            // Trigger click when finger is very close
            if (button === button1) {
              counter++;
            } else if (button === button2 && counter > 0) {
              counter--;
            }

            button.dispatchEvent({
              type: "click",
              distance: 0,
              nativeEvent: {},
              object: button,
              point: new THREE.Vector3(),
              pointerId: -1,
            });
          }
        }
      });
    }
  };

  checkHand(hand1);
  checkHand(hand2);
}
