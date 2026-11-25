import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x151515)

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

camera.position.set(0, 4, 8)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

document.querySelector('#app').innerHTML = `
  <div id="scene"></div>
  <div id="notification-bar" style="
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: linear-gradient(135deg, #00b4db, #0083b0);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: sans-serif;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    transition: transform 0.5s ease-in-out;
    z-index: 1000;
  ">
    ¡Diamante recogido: Punto 1!
  </div>
`

document.querySelector('#scene').appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05

const light = new THREE.DirectionalLight(0xffffff, 3)
light.position.set(3, 5, 5)
scene.add(light)

const ambient = new THREE.AmbientLight(0xffffff, 1.5)
scene.add(ambient)

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x303030 })
)

floor.rotation.x = -Math.PI / 2
floor.position.y = -0.01
scene.add(floor)

const loader = new GLTFLoader()
const clock = new THREE.Clock()

let diamante = {
  mesh: null,
  vy: 0,
  isJumping: false,
  baseY: 0
}
let jugador2 = {
  mesh: null,
  vy: 0,
  isJumping: false,
  baseY: 0
}


let cubo = {
  mesh: null,
  baseY: 0
}

let pincho = {
  mesh: null
}

let diamantePunto1 = {
  mesh: null,
  collected: false
}

let diamantePunto2 = {
  mesh: null
}

const activeKeys = {}

window.addEventListener('keydown', (e) => {
  activeKeys[e.code] = true
})

window.addEventListener('keyup', (e) => {
  activeKeys[e.code] = false
})

// Personaje Principal (Diamante)
loader.load(
  '/models/Diamante.glb',
  function (gltf) {
    diamante.mesh = gltf.scene
    diamante.mesh.position.set(0, 0, 0)
    
    const box = new THREE.Box3().setFromObject(diamante.mesh)
    const size = box.getSize(new THREE.Vector3())
    const scale = 2.5 / size.y
    diamante.mesh.scale.setScalar(scale)
    diamante.baseY = -box.min.y * scale
    diamante.mesh.position.y = diamante.baseY

    scene.add(diamante.mesh)
  },
  undefined,
  (error) => console.error('Error al cargar personaje Diamante:', error)
)

// Cubo 3D
loader.load(
  '/models/cubo.glb',
  function (gltf) {
    cubo.mesh = gltf.scene
    cubo.mesh.position.set(0, 0, -3)
    
    const box = new THREE.Box3().setFromObject(cubo.mesh)
    const size = box.getSize(new THREE.Vector3())
    const scale = 2 / size.y
    cubo.mesh.scale.setScalar(scale)
    cubo.baseY = -box.min.y * scale
    cubo.mesh.position.y = cubo.baseY

    scene.add(cubo.mesh)
  },
  undefined,
  (error) => console.error('Error al cargar Cubo:', error)
)
// Segundo Jugador Provisional (Caramelo)
loader.load(
  '/models/caramelo.glb',
  function (gltf) {
    jugador2.mesh = gltf.scene
    jugador2.mesh.position.set(2, 0, 0)
    
    const box = new THREE.Box3().setFromObject(jugador2.mesh)
    const size = box.getSize(new THREE.Vector3())
    const scale = 2.5 / size.y
    jugador2.mesh.scale.setScalar(scale)
    jugador2.baseY = -box.min.y * scale
    jugador2.mesh.position.y = jugador2.baseY

    scene.add(jugador2.mesh)
  },
  undefined,
  (error) => console.error('Error al cargar Jugador 2:', error)
)


// Pincho
loader.load(
  '/models/pincho.glb',
  function (gltf) {
    pincho.mesh = gltf.scene
    pincho.mesh.position.set(5, 0, -10)
    
    const box = new THREE.Box3().setFromObject(pincho.mesh)
    const size = box.getSize(new THREE.Vector3())
    const scale = 1.5 / size.y
    pincho.mesh.scale.setScalar(scale)
    pincho.mesh.position.y = -box.min.y * scale

    scene.add(pincho.mesh)
  },
  undefined,
  (error) => console.error('Error al cargar Pincho:', error)
)

// --- CARGAR PUNTO1.GLB (Más lejos y al lado izquierdo del par) ---
loader.load(
  '/models/punto1.glb',
  function (gltf) {
    diamantePunto1.mesh = gltf.scene
    diamantePunto1.mesh.position.set(-0.8, 0, -12) // Lejos (z: -12) y juntos (x: -0.8)
    
    const box = new THREE.Box3().setFromObject(diamantePunto1.mesh)
    const size = box.getSize(new THREE.Vector3())
    const scale = 1.5 / size.y
    diamantePunto1.mesh.scale.setScalar(scale)
    diamantePunto1.mesh.position.y = -box.min.y * scale

    scene.add(diamantePunto1.mesh)
  },
  undefined,
  (error) => console.error('Error al cargar punto1.glb:', error)
)

// --- CARGAR PUNTO2.GLB (Más lejos y al lado derecho del par) ---
loader.load(
  '/models/punto2.glb',
  function (gltf) {
    diamantePunto2.mesh = gltf.scene
    diamantePunto2.mesh.position.set(0.8, 0, -12) // Lejos (z: -12) y juntos (x: 0.8)
    
    const box = new THREE.Box3().setFromObject(diamantePunto2.mesh)
    const size = box.getSize(new THREE.Vector3())
    const scale = 1.5 / size.y
    diamantePunto2.mesh.scale.setScalar(scale)
    diamantePunto2.mesh.position.y = -box.min.y * scale

    scene.add(diamantePunto2.mesh)
  },
  undefined,
  (error) => console.error('Error al cargar punto2.glb:', error)
)

const normalSpeed = 5
const sprintSpeed = 11
const gravity = 15
const jumpForce = 10

function morir() {
  if (diamante.mesh) {
    diamante.mesh.position.set(0, diamante.baseY, 0)
    diamante.vy = 0
    diamante.isJumping = false
  }
  if (jugador2.mesh) {
    jugador2.mesh.position.set(2, jugador2.baseY, 0)
    jugador2.vy = 0
    jugador2.isJumping = false
  }
}


function mostrarNotificacion() {
  const bar = document.getElementById('notification-bar')
  if (bar) {
    bar.style.transform = 'translateX(-50%) translateY(0)'
    setTimeout(() => {
      bar.style.transform = 'translateX(-50%) translateY(-100px)'
    }, 3000)
  }
}

function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()
  const currentSpeed = activeKeys['KeyQ'] ? sprintSpeed : normalSpeed
  const moveDistance = currentSpeed * delta

  if (diamante.mesh) {
    let moveX = 0
    let moveZ = 0

    if (activeKeys['KeyW']) moveZ -= 1
    if (activeKeys['KeyS']) moveZ += 1
    if (activeKeys['KeyA']) moveX -= 1
    if (activeKeys['KeyD']) moveX += 1

    if (moveX !== 0 || moveZ !== 0) {
      const vector = new THREE.Vector3(moveX, 0, moveZ).normalize()

      const oldX = diamante.mesh.position.x
      const oldZ = diamante.mesh.position.z

      diamante.mesh.position.x += vector.x * moveDistance
      diamante.mesh.position.z += vector.z * moveDistance
      diamante.mesh.rotation.y = Math.atan2(vector.x, vector.z)

      // Colisión con el cubo
      if (cubo.mesh) {
        diamante.mesh.updateMatrixWorld(true)
        cubo.mesh.updateMatrixWorld(true)

        const boxDiamante = new THREE.Box3().setFromObject(diamante.mesh)
        const boxCubo = new THREE.Box3().setFromObject(cubo.mesh)

        if (boxDiamante.intersectsBox(boxCubo)) {
          if (diamante.mesh.position.y < boxCubo.max.y - 0.3) {
            diamante.mesh.position.x = oldX
            diamante.mesh.position.z = oldZ
          }
        }
      }
    }

    // Muerte con el pincho
    if (pincho.mesh) {
      diamante.mesh.updateMatrixWorld(true)
      pincho.mesh.updateMatrixWorld(true)

      const boxDiamante = new THREE.Box3().setFromObject(diamante.mesh)
      const boxPincho = new THREE.Box3().setFromObject(pincho.mesh)

      if (boxDiamante.intersectsBox(boxPincho)) {
        morir()
      }
    }

    // Colisión con punto1.glb (Recogible)
    if (diamantePunto1.mesh && !diamantePunto1.collected) {
      diamante.mesh.updateMatrixWorld(true)
      diamantePunto1.mesh.updateMatrixWorld(true)

      const boxDiamante = new THREE.Box3().setFromObject(diamante.mesh)
      const boxPunto1 = new THREE.Box3().setFromObject(diamantePunto1.mesh)

      if (boxDiamante.intersectsBox(boxPunto1)) {
        diamantePunto1.collected = true
        scene.remove(diamantePunto1.mesh)
        mostrarNotificacion()
      }
    }

    // Salto con la letra E
    if (activeKeys['KeyE'] && !diamante.isJumping) {
      diamante.vy = jumpForce
      diamante.isJumping = true
    }

    // Plataforma y gravedad
    let sueloActual = diamante.baseY

    if (cubo.mesh) {
      diamante.mesh.updateMatrixWorld(true)
      cubo.mesh.updateMatrixWorld(true)

      const boxCubo = new THREE.Box3().setFromObject(cubo.mesh)

      const sobreCuboXZ = 
        diamante.mesh.position.x >= boxCubo.min.x - 0.4 &&
        diamante.mesh.position.x <= boxCubo.max.x + 0.4 &&
        diamante.mesh.position.z >= boxCubo.min.z - 0.4 &&
        diamante.mesh.position.z <= boxCubo.max.z + 0.4

      if (sobreCuboXZ && diamante.mesh.position.y >= boxCubo.max.y - 0.5) {
        sueloActual = boxCubo.max.y
      }
    }

    if (diamante.isJumping || diamante.mesh.position.y > sueloActual) {
      diamante.mesh.position.y += diamante.vy * delta
      diamante.vy -= gravity * delta

      if (diamante.mesh.position.y <= sueloActual) {
        diamante.mesh.position.y = sueloActual
        diamante.isJumping = false
        diamante.vy = 0
      }
    } else {
      diamante.mesh.position.y = sueloActual
    }

    controls.target.copy(diamante.mesh.position)
  }

  controls.update()
  renderer.render(scene, camera)
    // --- LÓGICA DEL JUGADOR 2 (Flechas + Espacio) ---
  if (jugador2.mesh) {
    let moveX2 = 0
    let moveZ2 = 0

    if (activeKeys['ArrowUp']) moveZ2 -= 1
    if (activeKeys['ArrowDown']) moveZ2 += 1
    if (activeKeys['ArrowLeft']) moveX2 -= 1
    if (activeKeys['ArrowRight']) moveX2 += 1

    if (moveX2 !== 0 || moveZ2 !== 0) {
      const vector2 = new THREE.Vector3(moveX2, 0, moveZ2).normalize()
      const oldX2 = jugador2.mesh.position.x
      const oldZ2 = jugador2.mesh.position.z

      jugador2.mesh.position.x += vector2.x * moveDistance
      jugador2.mesh.position.z += vector2.z * moveDistance
      jugador2.mesh.rotation.y = Math.atan2(vector2.x, vector2.z)

      // Colisión lateral con el cubo
      if (cubo.mesh) {
        jugador2.mesh.updateMatrixWorld(true)
        cubo.mesh.updateMatrixWorld(true)
        const boxJ2 = new THREE.Box3().setFromObject(jugador2.mesh)
        const boxCubo = new THREE.Box3().setFromObject(cubo.mesh)

        if (boxJ2.intersectsBox(boxCubo) && jugador2.mesh.position.y < boxCubo.max.y - 0.3) {
          jugador2.mesh.position.x = oldX2
          jugador2.mesh.position.z = oldZ2
        }
      }
    }

    // Muerte cooperativa con el pincho
    if (pincho.mesh) {
      jugador2.mesh.updateMatrixWorld(true)
      pincho.mesh.updateMatrixWorld(true)
      const boxJ2 = new THREE.Box3().setFromObject(jugador2.mesh)
      const boxPincho = new THREE.Box3().setFromObject(pincho.mesh)

      if (boxJ2.intersectsBox(boxPincho)) {
        morir()
      }
    }

    // Salto con Espacio (Space)
    if (activeKeys['Space'] && !jugador2.isJumping) {
      jugador2.vy = jumpForce
      jugador2.isJumping = true
    }

    // Gravedad y plataforma para Jugador 2
    let sueloJ2 = jugador2.baseY
    if (cubo.mesh) {
      jugador2.mesh.updateMatrixWorld(true)
      cubo.mesh.updateMatrixWorld(true)
      const boxCubo = new THREE.Box3().setFromObject(cubo.mesh)
      const sobreCuboXZ2 =
        jugador2.mesh.position.x >= boxCubo.min.x - 0.4 &&
        jugador2.mesh.position.x <= boxCubo.max.x + 0.4 &&
        jugador2.mesh.position.z >= boxCubo.min.z - 0.4 &&
        jugador2.mesh.position.z <= boxCubo.max.z + 0.4

      if (sobreCuboXZ2 && jugador2.mesh.position.y >= boxCubo.max.y - 0.2) {
        sueloJ2 = boxCubo.max.y
      }
    }

    if (jugador2.isJumping || jugador2.mesh.position.y > sueloJ2) {
      jugador2.mesh.position.y += jugador2.vy * delta
      jugador2.vy -= gravity * delta

      if (jugador2.mesh.position.y <= sueloJ2) {
        jugador2.mesh.position.y = sueloJ2
        jugador2.vy = 0
        jugador2.isJumping = false
      }
    }
  }

}

animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})