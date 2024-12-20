import { Pane } from 'tweakpane'
import ShaderCanvas from './shaderCanvas'
import CameraController from './cameraController'

const shaderCanvas = new ShaderCanvas(window.innerWidth, window.innerHeight)

const cameraController = new CameraController([0, 0, -5], [0, 0, 0])

// Initialize the canvas and uniforms
shaderCanvas.initPromise.then(() => {
  shaderCanvas.setUniform2f('iResolution', window.innerWidth, window.innerHeight)
  update()
})

// Attach event listeners for camera
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC') {
    cameraController.toggleFlyMode()
  }
  cameraController.handleKeyDown(e)
})

document.addEventListener('keyup', (e) => {
  cameraController.handleKeyUp(e)
})

document.addEventListener('mousemove', (e) => {
  cameraController.handleMouseMove(e)
})

shaderCanvas.initPromise.then(() => {
  shaderCanvas.setUniform2f('iResolution', window.innerWidth, window.innerHeight)
  update()
})

let blueSphere = {
  pos: [-1.0, 0.0, 4.0],
  radius: 1,
  color: { r: 0, g: 0, b: 255 },
  metalness: 0.0,
  roughness: 0.5,
  emissive: { r: 0, g: 0, b: 0 },
  anisotropy: 0.0,
  subsurface: 0.0,
  subsurfaceColor: { r: 0, g: 0, b: 0 },
  sheen: 0.0,
  sheenTint: { r: 255, g: 255, b: 255 }
}

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
  sheenTint: { r: 255, g: 255, b: 255 }
}

// Tweakpane setup
const paneInstance = new Pane()

// Add folders for each sphere
const blueFolder = paneInstance.addFolder({
  title: 'Blue Sphere',
  expanded: false
})
const redFolder = paneInstance.addFolder({
  title: 'Red Sphere',
  expanded: false
})

// Add inputs for Blue Sphere
blueFolder.addBinding(blueSphere, 'radius', { min: 0.05, max: 2, step: 0.05 })
blueFolder.addBinding(blueSphere, 'metalness', { min: 0, max: 1, step: 0.01 })
blueFolder.addBinding(blueSphere, 'roughness', {
  min: 0.01,
  max: 1,
  step: 0.01
})
blueFolder.addBinding(blueSphere, 'color', {
  label: 'color',
  picker: 'inline',
  expanded: false
})
blueFolder.addBinding(blueSphere, 'emissive', {
  label: 'emissive',
  picker: 'inline',
  expanded: false
})
blueFolder.addBinding(blueSphere, 'anisotropy', { min: 0, max: 1, step: 0.01 })
blueFolder.addBinding(blueSphere, 'subsurface', { min: 0, max: 1, step: 0.01 })
blueFolder.addBinding(blueSphere, 'subsurfaceColor', {
  label: 'subsurfaceColor',
  picker: 'inline',
  expanded: false
})
blueFolder.addBinding(blueSphere, 'sheen', { min: 0, max: 100, step: 0.1 })
blueFolder.addBinding(blueSphere, 'sheenTint', {
  label: 'sheenTint',
  picker: 'inline',
  expanded: false
})

// Add inputs for Red Sphere
redFolder.addBinding(redSphere, 'radius', { min: 0.05, max: 2, step: 0.05 })
redFolder.addBinding(redSphere, 'metalness', { min: 0, max: 1, step: 0.01 })
redFolder.addBinding(redSphere, 'roughness', {
  min: 0.01,
  max: 1,
  step: 0.01
})
redFolder.addBinding(redSphere, 'color', {
  label: 'color',
  picker: 'inline',
  expanded: false
})
redFolder.addBinding(redSphere, 'emissive', {
  label: 'emissive',
  picker: 'inline',
  expanded: false
})
redFolder.addBinding(redSphere, 'anisotropy', { min: 0, max: 1, step: 0.01 })
redFolder.addBinding(redSphere, 'subsurface', { min: 0, max: 1, step: 0.01 })
redFolder.addBinding(redSphere, 'subsurfaceColor', {
  label: 'subsurfaceColor',
  picker: 'inline',
  expanded: false
})
redFolder.addBinding(redSphere, 'sheen', { min: 0, max: 100, step: 0.1 })
redFolder.addBinding(redSphere, 'sheenTint', {
  label: 'sheenTint',
  picker: 'inline',
  expanded: false
})

function update() {
  requestAnimationFrame(update)

  const time = performance.now() / 1000
  const frameCount = Math.floor(time * 60)

  // Update camera
  const deltaTime = 1.0 / 60.0
  cameraController.update(deltaTime)

  shaderCanvas.setUniform1i('iFrame', frameCount)
  shaderCanvas.setUniform1f('iTime', time)

  // Set Uniforms for Blue Sphere
  shaderCanvas.setUniform3f('blueSpherePos', ...blueSphere.pos)
  shaderCanvas.setUniform1f('blueSphereRadius', blueSphere.radius)
  shaderCanvas.setUniform3f(
    'blueSphereColor',
    blueSphere.color.r / 255,
    blueSphere.color.g / 255,
    blueSphere.color.b / 255
  )
  shaderCanvas.setUniform1f('blueSphereMetalness', blueSphere.metalness)
  shaderCanvas.setUniform1f('blueSphereRoughness', blueSphere.roughness)
  shaderCanvas.setUniform3f(
    'blueSphereEmissive',
    blueSphere.emissive.r / 255,
    blueSphere.emissive.g / 255,
    blueSphere.emissive.b / 255
  )
  shaderCanvas.setUniform1f('blueSphereAnisotropy', blueSphere.anisotropy)
  shaderCanvas.setUniform1f('blueSphereSubsurface', blueSphere.subsurface)
  shaderCanvas.setUniform3f(
    'blueSphereSubsurfaceColor',
    blueSphere.subsurfaceColor.r / 255,
    blueSphere.subsurfaceColor.g / 255,
    blueSphere.subsurfaceColor.b / 255
  )
  shaderCanvas.setUniform1f('blueSphereSheen', blueSphere.sheen)
  shaderCanvas.setUniform3f(
    'blueSphereSheenColor',
    blueSphere.sheenTint.r / 255,
    blueSphere.sheenTint.g / 255,
    blueSphere.sheenTint.b / 255
  )

  // Set Uniforms for Red Sphere
  shaderCanvas.setUniform3f('redSpherePos', ...redSphere.pos)
  shaderCanvas.setUniform1f('redSphereRadius', redSphere.radius)
  shaderCanvas.setUniform3f(
    'redSphereColor',
    redSphere.color.r / 255,
    redSphere.color.g / 255,
    redSphere.color.b / 255
  )
  shaderCanvas.setUniform1f('redSphereMetalness', redSphere.metalness)
  shaderCanvas.setUniform1f('redSphereRoughness', redSphere.roughness)
  shaderCanvas.setUniform3f(
    'redSphereEmissive',
    redSphere.emissive.r / 255,
    redSphere.emissive.g / 255,
    redSphere.emissive.b / 255
  )
  shaderCanvas.setUniform1f('redSphereAnisotropy', redSphere.anisotropy)
  shaderCanvas.setUniform1f('redSphereSubsurface', redSphere.subsurface)
  shaderCanvas.setUniform3f(
    'redSphereSubsurfaceColor',
    redSphere.subsurfaceColor.r / 255,
    redSphere.subsurfaceColor.g / 255,
    redSphere.subsurfaceColor.b / 255
  )
  shaderCanvas.setUniform1f('redSphereSheen', redSphere.sheen)
  shaderCanvas.setUniform3f(
    'redSphereSheenColor',
    redSphere.sheenTint.r / 255,
    redSphere.sheenTint.g / 255,
    redSphere.sheenTint.b / 255
  )

  // Set Uniforms for Camera
  shaderCanvas.setUniform3f('cameraPos', ...cameraController.pos)
  shaderCanvas.setUniform3f('cameraRot', ...cameraController.rot)

  shaderCanvas.draw()
}
