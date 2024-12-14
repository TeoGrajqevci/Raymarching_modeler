import "./style.css";

import { Pane } from "tweakpane";

import ShaderCanvas from "./shaderCanvas";

const shaderCanvas = new ShaderCanvas(
  "src/glsl/frag.glsl",
  window.innerWidth,
  window.innerHeight
);

shaderCanvas.initPromise.then(() => {
  shaderCanvas.setUniform2f(
    "iResolution",
    window.innerWidth,
    window.innerHeight
  );
  update();
});

let blueSphere = {
  pos: [-1.0, 0.0, 4.0],
  radius: 1,
  color: { r: 0, g: 0, b: 255 }, // Updated for Tweakpane color compatibility
  metalness: 0.0,
  roughness: 0.5,
  emissive: { r: 0, g: 0, b: 0 }, // Same here for emissive
  anisotropy: 0.0,
  subsurface: 0.0,
  subsurfaceColor: { r: 0, g: 0, b: 0 },
  sheen: 0.0,
  sheenTint: { r: 0, g: 0, b: 0 },
};

let redSphere = {
  pos: [1.0, 0.0, 4.0],
  radius: 1,
  color: { r: 255, g: 0, b: 0 },
  metalness: 0.0,
  roughness: 0.1,
  emissive: { r: 0, g: 0, b: 0 },
  anisotropy: 0.0,
  subsurface: 0.0,
  subsurfaceColor: { r: 0, g: 0, b: 0 },
  sheen: 0.0,
  sheenTint: { r: 0, g: 0, b: 0 },
};

let camera = {
  pos: [0, 0, -10],
  rot: [0, 0, 0], // [pitch, yaw, roll]
};

// Initialize camera.target to ensure it's defined
camera.target = [
  camera.pos[0] + Math.cos(camera.rot[0]) * Math.sin(camera.rot[1]),
  camera.pos[1] + Math.sin(camera.rot[0]),
  camera.pos[2] + Math.cos(camera.rot[0]) * Math.cos(camera.rot[1]),
];

let selectedSphere = null;
let keysPressed = new Set();

// New Variables for Camera Control
let cameraControlActive = false;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
const cameraSpeed = 0.1; // Adjust movement speed as needed
const rotationSpeed = 0.02; // Adjust rotation speed as needed

// Tweakpane setup
const paneInstance = new Pane();

// Add folders for each sphere
const blueFolder = paneInstance.addFolder({
  title: "Blue Sphere",
  expanded: false,
});
const redFolder = paneInstance.addFolder({
  title: "Red Sphere",
  expanded: false,
});

// Add inputs for Blue Sphere
blueFolder.addBinding(blueSphere, "radius", { min: 0.05, max: 2, step: 0.05 });
blueFolder.addBinding(blueSphere, "metalness", { min: 0, max: 1, step: 0.01 });
blueFolder.addBinding(blueSphere, "roughness", {
  min: 0.01,
  max: 1,
  step: 0.01,
});
blueFolder.addBinding(blueSphere, "color", {
  label: "color",
  picker: "inline",
  expanded: false,
});
blueFolder.addBinding(blueSphere, "emissive", {
  label: "emissive",
  picker: "inline",
  expanded: false,
});
blueFolder.addBinding(blueSphere, "anisotropy", { min: 0, max: 1, step: 0.01 });
blueFolder.addBinding(blueSphere, "subsurface", { min: 0, max: 1, step: 0.01 });
blueFolder.addBinding(blueSphere, "subsurfaceColor", {
  label: "subsurfaceColor",
  picker: "inline",
  expanded: false,
});
blueFolder.addBinding(blueSphere, "sheen", { min: 0, max: 100, step: 0.1 });
blueFolder.addBinding(blueSphere, "sheenTint", {
  label: "sheenTint",
  picker: "inline",
  expanded: false,
});

// Add inputs for Red Sphere
redFolder.addBinding(redSphere, "radius", { min: 0.05, max: 2, step: 0.05 });
redFolder.addBinding(redSphere, "metalness", { min: 0, max: 1, step: 0.01 });
redFolder.addBinding(redSphere, "roughness", {
  min: 0.01,
  max: 1,
  step: 0.01,
});
redFolder.addBinding(redSphere, "color", {
  label: "color",
  picker: "inline",
  expanded: false,
});
redFolder.addBinding(redSphere, "emissive", {
  label: "emissive",
  picker: "inline",
  expanded: false,
});
redFolder.addBinding(redSphere, "anisotropy", { min: 0, max: 1, step: 0.01 });
redFolder.addBinding(redSphere, "subsurface", { min: 0, max: 1, step: 0.01 });
redFolder.addBinding(redSphere, "subsurfaceColor", {
  label: "subsurfaceColor",
  picker: "inline",
  expanded: false,
});
redFolder.addBinding(redSphere, "sheen", { min: 0, max: 100, step: 0.1 });
redFolder.addBinding(redSphere, "sheenTint", {
  label: "sheenTint",
  picker: "inline",
  expanded: false,
});

// Event Listeners for Keyboard Controls
document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "c") {
    cameraControlActive = !cameraControlActive;
    if (cameraControlActive) {
      // Change cursor to indicate camera control is active
      document.body.style.cursor = "move";
      // Optionally, request pointer lock for seamless mouse movement
      document.body.requestPointerLock && document.body.requestPointerLock();
    } else {
      // Revert cursor to default
      document.body.style.cursor = "default";
      // Release pointer lock if it was acquired
      document.exitPointerLock && document.exitPointerLock();
    }
    event.preventDefault(); // Prevent default behavior
    return; // Exit to prevent further processing
  }

  if (cameraControlActive) {
    const movementKeys = ["w", "a", "s", "d", "q", "e"];
    const rotationKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright"];
    if (movementKeys.includes(key) || rotationKeys.includes(key)) {
      keysPressed.add(event.key);
      event.preventDefault(); // Prevent default behavior (e.g., scrolling)
    }
  } else {
    // Existing behavior: '1', '2', arrow keys
    switch (event.key) {
      case "1":
        selectedSphere = blueSphere;
        break;
      case "2":
        selectedSphere = redSphere;
        break;
      default:
        // Handle arrow keys
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
            event.key
          )
        ) {
          keysPressed.add(event.key);
          event.preventDefault(); // Prevent default scrolling
        }
        break;
    }
  }
});

document.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();

  if (cameraControlActive) {
    const movementKeys = ["w", "a", "s", "d", "q", "e"];
    const rotationKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright"];
    if (movementKeys.includes(key) || rotationKeys.includes(key)) {
      keysPressed.delete(event.key);
      event.preventDefault();
    }
  } else {
    // Existing behavior: '1', '2', arrow keys
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      keysPressed.delete(event.key);
      event.preventDefault();
    }
  }
});

// Event Listeners for Mouse Controls (Camera Rotation)
document.addEventListener("mousedown", (event) => {
  if (cameraControlActive && event.button === 0) {
    // Left mouse button
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    // Capture the mouse to receive events outside the window
    document.body.requestPointerLock && document.body.requestPointerLock();
  }
});

document.addEventListener("mousemove", (event) => {
  if (cameraControlActive && isDragging) {
    const deltaX =
      event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const deltaY =
      event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    const rotationSensitivity = 0.002; // Adjust rotation sensitivity as needed

    // Update camera rotation based on mouse movement
    camera.rot[1] += deltaX * rotationSensitivity; // Yaw
    camera.rot[0] += deltaY * rotationSensitivity; // Pitch

    // Clamp the pitch to prevent flipping
    const maxPitch = Math.PI / 2 - 0.01;
    camera.rot[0] = Math.max(-maxPitch, Math.min(maxPitch, camera.rot[0]));

    // Ensure no rotation around the Z-axis
    camera.rot[2] = 0.0;
  }
});

document.addEventListener("mouseup", (event) => {
  if (cameraControlActive && event.button === 0) {
    // Left mouse button
    isDragging = false;
    // Release the pointer lock if it was acquired
    document.exitPointerLock && document.exitPointerLock();
  }
});

// Function to Move the Camera Based on Keys Pressed
function moveCamera() {
  if (!cameraControlActive) return;

  const speed = cameraSpeed;

  // Calculate forward and right vectors based on camera rotation
  const forward = [
    Math.cos(camera.rot[0]) * Math.sin(camera.rot[1]),
    Math.sin(camera.rot[0]),
    Math.cos(camera.rot[0]) * Math.cos(camera.rot[1]),
  ];

  const right = [
    Math.sin(camera.rot[1] - Math.PI / 2),
    0,
    Math.cos(camera.rot[1] - Math.PI / 2),
  ];

  const up = [0, 1, 0]; // World up vector

  if (keysPressed.has("w") || keysPressed.has("W")) {
    camera.pos[0] += forward[0] * speed;
    camera.pos[1] += forward[1] * speed;
    camera.pos[2] += forward[2] * speed;
  }
  if (keysPressed.has("s") || keysPressed.has("S")) {
    camera.pos[0] -= forward[0] * speed;
    camera.pos[1] -= forward[1] * speed;
    camera.pos[2] -= forward[2] * speed;
  }
  if (keysPressed.has("a") || keysPressed.has("A")) {
    camera.pos[0] -= right[0] * speed;
    camera.pos[1] -= right[1] * speed;
    camera.pos[2] -= right[2] * speed;
  }
  if (keysPressed.has("d") || keysPressed.has("D")) {
    camera.pos[0] += right[0] * speed;
    camera.pos[1] += right[1] * speed;
    camera.pos[2] += right[2] * speed;
  }
  if (keysPressed.has("q") || keysPressed.has("Q")) {
    camera.pos[0] += up[0] * speed;
    camera.pos[1] += up[1] * speed;
    camera.pos[2] += up[2] * speed;
  }
  if (keysPressed.has("e") || keysPressed.has("E")) {
    camera.pos[0] -= up[0] * speed;
    camera.pos[1] -= up[1] * speed;
    camera.pos[2] -= up[2] * speed;
  }
}

// Function to Rotate the Camera Based on Arrow Keys Pressed
function rotateCamera() {
  if (!cameraControlActive) return;

  const rotSpeed = rotationSpeed;

  if (keysPressed.has("ArrowUp")) {
    camera.rot[0] += rotSpeed;
  }
  if (keysPressed.has("ArrowDown")) {
    camera.rot[0] -= rotSpeed;
  }
  if (keysPressed.has("ArrowLeft")) {
    camera.rot[1] -= rotSpeed;
  }
  if (keysPressed.has("ArrowRight")) {
    camera.rot[1] += rotSpeed;
  }

  // Clamp the pitch to prevent flipping
  const maxPitch = Math.PI / 2 - 0.01;
  camera.rot[0] = Math.max(-maxPitch, Math.min(maxPitch, camera.rot[0]));

  // Ensure no rotation around the Z-axis
  camera.rot[2] = 0.0;
}

// Existing Function to Move Spheres
function moveSphere() {
  if (cameraControlActive) return; // Disable sphere movement when camera control is active
  if (!selectedSphere) return;

  const speed = 0.08;

  if (keysPressed.has("ArrowUp")) {
    selectedSphere.pos[1] += speed;
  }
  if (keysPressed.has("ArrowDown")) {
    selectedSphere.pos[1] -= speed;
  }
  if (keysPressed.has("ArrowLeft")) {
    selectedSphere.pos[0] -= speed;
  }
  if (keysPressed.has("ArrowRight")) {
    selectedSphere.pos[0] += speed;
  }
}

// Main Update Loop
function update() {
  requestAnimationFrame(update);

  const time = performance.now() / 1000;

  const frameCount = Math.floor(time * 60);
  shaderCanvas.setUniform1i("iFrame", frameCount);

  // Uncomment the following line if you want to limit console logs
  // console.log(frameCount);

  moveSphere();
  moveCamera();
  rotateCamera();

  shaderCanvas.setUniform1f("iTime", time);

  // Update camera.target based on new position and rotation
  camera.target = [
    camera.pos[0] + Math.cos(camera.rot[0]) * Math.sin(camera.rot[1]),
    camera.pos[1] + Math.sin(camera.rot[0]),
    camera.pos[2] + Math.cos(camera.rot[0]) * Math.cos(camera.rot[1]),
  ];

  // Set Uniforms for Blue Sphere
  shaderCanvas.setUniform3f("blueSpherePos", ...blueSphere.pos);
  shaderCanvas.setUniform1f("blueSphereRadius", blueSphere.radius); // Corrected to blueSphere.radius
  shaderCanvas.setUniform3f(
    "blueSphereColor",
    blueSphere.color.r / 255,
    blueSphere.color.g / 255,
    blueSphere.color.b / 255
  );
  shaderCanvas.setUniform1f("blueSphereMetalness", blueSphere.metalness);
  shaderCanvas.setUniform1f("blueSphereRoughness", blueSphere.roughness);
  shaderCanvas.setUniform3f(
    "blueSphereEmissive",
    blueSphere.emissive.r / 255,
    blueSphere.emissive.g / 255,
    blueSphere.emissive.b / 255
  );
  shaderCanvas.setUniform1f("blueSphereAnisotropy", blueSphere.anisotropy);

  shaderCanvas.setUniform1f("blueSphereSubsurface", blueSphere.subsurface);
  shaderCanvas.setUniform3f(
    "blueSphereSubsurfaceColor",
    blueSphere.subsurfaceColor.r / 255,
    blueSphere.subsurfaceColor.g / 255,
    blueSphere.subsurfaceColor.b / 255
  );
  shaderCanvas.setUniform1f("blueSphereSheen", blueSphere.sheen);
  shaderCanvas.setUniform3f(
    "blueSphereSheenColor",
    blueSphere.sheenTint.r / 255,
    blueSphere.sheenTint.g / 255,
    blueSphere.sheenTint.b / 255
  );

  // Set Uniforms for Red Sphere
  shaderCanvas.setUniform3f("redSpherePos", ...redSphere.pos);
  shaderCanvas.setUniform1f("redSphereRadius", redSphere.radius); // Corrected to redSphere.radius
  shaderCanvas.setUniform3f(
    "redSphereColor",
    redSphere.color.r / 255,
    redSphere.color.g / 255,
    redSphere.color.b / 255
  );
  shaderCanvas.setUniform1f("redSphereMetalness", redSphere.metalness);
  shaderCanvas.setUniform1f("redSphereRoughness", redSphere.roughness);
  shaderCanvas.setUniform3f(
    "redSphereEmissive",
    redSphere.emissive.r / 255,
    redSphere.emissive.g / 255,
    redSphere.emissive.b / 255
  );
  shaderCanvas.setUniform1f("redSphereAnisotropy", redSphere.anisotropy);

  shaderCanvas.setUniform1f("redSphereSubsurface", redSphere.subsurface);
  shaderCanvas.setUniform3f(
    "redSphereSubsurfaceColor",
    redSphere.subsurfaceColor.r / 255,
    redSphere.subsurfaceColor.g / 255,
    redSphere.subsurfaceColor.b / 255
  );
  shaderCanvas.setUniform1f("redSphereSheen", redSphere.sheen);
  shaderCanvas.setUniform3f(
    "redSphereSheenColor",
    redSphere.sheenTint.r / 255,
    redSphere.sheenTint.g / 255,
    redSphere.sheenTint.b / 255
  );

  // Set Uniforms for Camera
  shaderCanvas.setUniform3f("cameraPos", ...camera.pos);
  shaderCanvas.setUniform3f("cameraRot", ...camera.rot);

  shaderCanvas.draw();
}
