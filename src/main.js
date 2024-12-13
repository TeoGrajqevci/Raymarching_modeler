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
  pos: [-1.0, 1.0, 4.0],
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
  pos: [1.0, 1.0, 4.0],
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

let selectedSphere = null;
let keysPressed = new Set();

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
redFolder.addBinding(redSphere, "roughness", { min: 0.01, max: 1, step: 0.01 });
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

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "1":
      selectedSphere = blueSphere;
      break;
    case "2":
      selectedSphere = redSphere;
      break;
    default:
      keysPressed.add(event.key);
      break;
  }
});

document.addEventListener("keyup", (event) => {
  keysPressed.delete(event.key);
});

function moveSphere() {
  if (!selectedSphere) return;

  const speed = 0.05;

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

function update() {
  requestAnimationFrame(update);

  const time = performance.now() / 1000;

  moveSphere();

  shaderCanvas.setUniform1f("iTime", time);

  shaderCanvas.setUniform3f("blueSpherePos", ...blueSphere.pos);
  shaderCanvas.setUniform1f("blueSphereRadius", redSphere.radius);
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

  shaderCanvas.setUniform3f("redSpherePos", ...redSphere.pos);
  shaderCanvas.setUniform1f("redSphereRadius", blueSphere.radius);
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

  shaderCanvas.draw();
}
