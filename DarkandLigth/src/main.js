import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// ==========================================================
// CONSTANTES
// ==========================================================
const VELOCIDAD = 5
const VELOCIDAD_CORRER = 11
const GRAVEDAD = 15
const FUERZA_SALTO = 10

// Hitbox fija de los jugadores: cilindro/caja de radio 0.5 alrededor de (x, z)
const RADIO_HITBOX = 0.5
const ALTURA_HITBOX = 2.5

const TECLAS_BLOQUEADAS = [
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ShiftRight',
  'KeyE',
  'KeyQ',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD'
]

// ==========================================================
// ESCENA, CÁMARA Y RENDERER
// ==========================================================
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

// ==========================================================
// INTERFAZ (HUD, NOTIFICACIÓN Y OVERLAY DE VICTORIA)
// ==========================================================
const app = document.querySelector('#app')
app.innerHTML = `
  <div id="scene"></div>

  <div id="hud" style="
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 10px 18px;
    border-radius: 8px;
    font-family: sans-serif;
    font-weight: bold;
    font-size: 18px;
    z-index: 1000;
    user-select: none;
  ">Diamantes: 0 / 2</div>

  <div id="notification-bar" style="
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-120px);
    background: linear-gradient(135deg, #00b4db, #0083b0);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: sans-serif;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    transition: transform 0.5s ease-in-out;
    z-index: 1000;
    white-space: nowrap;
  "></div>

  <div id="overlay" style="
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    color: white;
    font-family: sans-serif;
  ">
    <h1 style="font-size: 48px; margin-bottom: 24px; color: #ffc107;">¡NIVEL COMPLETADO!</h1>
    <button id="btn-reiniciar" style="
      padding: 14px 32px;
      font-size: 20px;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      background: linear-gradient(135deg, #00b4db, #0083b0);
      color: white;
    ">Reiniciar partida</button>
  </div>
`

app.querySelector('#scene').appendChild(renderer.domElement)

const hud = document.getElementById('hud')
const barraNotificacion = document.getElementById('notification-bar')
const overlay = document.getElementById('overlay')
const btnReiniciar = document.getElementById('btn-reiniciar')

// ==========================================================
// CONTROLES DE CÁMARA
// ==========================================================
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.keys = {}

// ==========================================================
// LUCES Y SUELO
// ==========================================================
const luzDireccional = new THREE.DirectionalLight(0xffffff, 3)
luzDireccional.position.set(3, 5, 5)
scene.add(luzDireccional)

const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.5)
scene.add(luzAmbiente)

const suelo = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x303030 })
)
suelo.rotation.x = -Math.PI / 2
suelo.position.y = -0.01
scene.add(suelo)

// ==========================================================
// METAS (PUERTAS DE SALIDA)
// ==========================================================
function crearMeta(x, z, color) {
  const malla = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.06, 2.5),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.35
    })
  )
  malla.position.set(x, 0.03, z)
  scene.add(malla)
  return malla
}

const meta1 = { x: -2, z: -16, mesh: crearMeta(-2, -16, 0xffc107) } // Dorada (Jugador 1)
const meta2 = { x: 2, z: -16, mesh: crearMeta(2, -16, 0x9b59b6) }   // Morada (Jugador 2)

// ==========================================================
// ENTRADA DE TECLADO
// ==========================================================
const teclas = {}

window.addEventListener('keydown', (e) => {
  if (TECLAS_BLOQUEADAS.includes(e.code)) {
    e.preventDefault()
  }
  teclas[e.code] = true
})

window.addEventListener('keyup', (e) => {
  teclas[e.code] = false
})

window.addEventListener('blur', () => {
  for (const codigo in teclas) {
    teclas[codigo] = false
  }
})

// ==========================================================
// CARGADOR DE MODELOS
// ==========================================================
const loader = new GLTFLoader()
const clock = new THREE.Clock()

function cargarModelo(ruta, x, z, altura, alCargar) {
  loader.load(
    ruta,
    (gltf) => {
      const malla = gltf.scene
      malla.position.set(x, 0, z)

      const caja = new THREE.Box3().setFromObject(malla)
      const tamano = caja.getSize(new THREE.Vector3())
      const escala = altura / tamano.y

      malla.scale.setScalar(escala)
      const baseY = -caja.min.y * escala
      malla.position.y = baseY

      scene.add(malla)
      alCargar(malla, baseY)
    },
    undefined,
    (error) => console.error(`Error al cargar ${ruta}:`, error)
  )
}

// ==========================================================
// OBJETOS DEL NIVEL
// ==========================================================
const cubo = { mesh: null, baseY: 0 }
const pincho = { mesh: null }

const jugador1 = {
  nombre: 'Jugador 1',
  mesh: null,
  baseY: 0,
  vy: 0,
  enSuelo: false,
  inicio: { x: 0, z: 0 },
  controles: {
    arriba: 'KeyW',
    abajo: 'KeyS',
    izquierda: 'KeyA',
    derecha: 'KeyD',
    salto: 'KeyE',
    correr: 'KeyQ'
  }
}

const jugador2 = {
  nombre: 'Jugador 2',
  mesh: null,
  baseY: 0,
  vy: 0,
  enSuelo: false,
  inicio: { x: 2, z: 0 },
  controles: {
    arriba: 'ArrowUp',
    abajo: 'ArrowDown',
    izquierda: 'ArrowLeft',
    derecha: 'ArrowRight',
    salto: 'Space',
    correr: 'ShiftRight'
  }
}

const diamantes = [
  {
    mesh: null,
    recogido: false,
    propietario: jugador1,
    x: -0.8,
    z: -12,
    ruta: '/models/punto1.glb'
  },
  {
    mesh: null,
    recogido: false,
    propietario: jugador2,
    x: 0.8,
    z: -12,
    ruta: '/models/punto2.glb'
  }
]

let recogidos = 0
let ganado = false

// Carga del personaje 1 (Diamante)
cargarModelo('/models/Diamante.glb', jugador1.inicio.x, jugador1.inicio.z, 2.5, (malla, baseY) => {
  jugador1.mesh = malla
  jugador1.baseY = baseY
  malla.position.y = baseY
})

// Carga del personaje 2 (Caramelo, provisional)
cargarModelo('/models/caramelo.glb', jugador2.inicio.x, jugador2.inicio.z, 2.5, (malla, baseY) => {
  jugador2.mesh = malla
  jugador2.baseY = baseY
  malla.position.y = baseY
})

// Cubo (plataforma y obstáculo)
cargarModelo('/models/cubo.glb', 0, -3, 2, (malla, baseY) => {
  cubo.mesh = malla
  cubo.baseY = baseY
})

// Pincho (mortal para ambos)
cargarModelo('/models/pincho.glb', 5, -10, 1.5, (malla) => {
  pincho.mesh = malla
})

// Diamantes recogibles
diamantes.forEach((d) => {
  cargarModelo(d.ruta, d.x, d.z, 1.5, (malla) => {
    d.mesh = malla
  })
})

// ==========================================================
// UTILIDADES
// ==========================================================
function caja(malla) {
  return new THREE.Box3().setFromObject(malla)
}

// Hitbox fija del jugador: caja de radio 0.5 alrededor de (x, z),
// independiente de la espada u otras partes del modelo que sobresalgan.
function hitboxJugador(jugador) {
  const p = jugador.mesh.position
  return new THREE.Box3(
    new THREE.Vector3(p.x - RADIO_HITBOX, p.y, p.z - RADIO_HITBOX),
    new THREE.Vector3(p.x + RADIO_HITBOX, p.y + ALTURA_HITBOX, p.z + RADIO_HITBOX)
  )
}

function actualizarHUD() {
  hud.textContent = `Diamantes: ${recogidos} / 2`
}

let temporizadorNotificacion = null

function mostrarNotificacion(texto) {
  barraNotificacion.textContent = texto
  barraNotificacion.style.transform = 'translateX(-50%) translateY(0)'

  clearTimeout(temporizadorNotificacion)
  temporizadorNotificacion = setTimeout(() => {
    barraNotificacion.style.transform = 'translateX(-50%) translateY(-120px)'
  }, 2500)
}

// ==========================================================
// COLISIONES Y FÍSICA
// ==========================================================
// Colisión lateral con el cubo: solo bloquea si el personaje
// está por debajo de la cara superior del cubo.
function hayColisionCubo(jugador) {
  if (!cubo.mesh || !jugador.mesh) return false

  const hitbox = hitboxJugador(jugador)
  const cajaCubo = caja(cubo.mesh)

  if (!hitbox.intersectsBox(cajaCubo)) return false

  return hitbox.min.y < cajaCubo.max.y - 0.3
}

// Altura del suelo bajo el personaje (suelo base o cara superior del cubo)
function alturaSuelo(jugador) {
  let suelo = jugador.baseY

  if (cubo.mesh) {
    const cajaCubo = caja(cubo.mesh)
    const x = jugador.mesh.position.x
    const z = jugador.mesh.position.z

    const sobreCuboXZ =
      x >= cajaCubo.min.x - 0.2 &&
      x <= cajaCubo.max.x + 0.2 &&
      z >= cajaCubo.min.z - 0.2 &&
      z <= cajaCubo.max.z + 0.2

    if (sobreCuboXZ && jugador.mesh.position.y >= cajaCubo.max.y - 0.5) {
      suelo = Math.max(suelo, cajaCubo.max.y)
    }
  }

  return suelo
}

// Movimiento con colisión separada por ejes:
// si el eje X está bloqueado, el personaje sigue deslizándose en Z y viceversa.
function moverJugador(jugador, delta) {
  if (!jugador.mesh) return

  const c = jugador.controles
  let mx = 0
  let mz = 0

  if (teclas[c.arriba]) mz -= 1
  if (teclas[c.abajo]) mz += 1
  if (teclas[c.izquierda]) mx -= 1
  if (teclas[c.derecha]) mx += 1

  if (mx === 0 && mz === 0) return

  const longitud = Math.hypot(mx, mz)
  mx /= longitud
  mz /= longitud

  const velocidad = teclas[c.correr] ? VELOCIDAD_CORRER : VELOCIDAD
  const paso = velocidad * delta

  // Eje X
  jugador.mesh.position.x += mx * paso
  if (hayColisionCubo(jugador)) {
    jugador.mesh.position.x -= mx * paso
  }

  // Eje Z
  jugador.mesh.position.z += mz * paso
  if (hayColisionCubo(jugador)) {
    jugador.mesh.position.z -= mz * paso
  }

  jugador.mesh.rotation.y = Math.atan2(mx, mz)
}

// Salto y gravedad
function aplicarFisica(jugador, delta) {
  if (!jugador.mesh) return

  const c = jugador.controles

  if (teclas[c.salto] && jugador.enSuelo) {
    jugador.vy = FUERZA_SALTO
    jugador.enSuelo = false
  }

  const suelo = alturaSuelo(jugador)

  jugador.vy -= GRAVEDAD * delta
  jugador.mesh.position.y += jugador.vy * delta

  if (jugador.mesh.position.y <= suelo && jugador.vy <= 0) {
    jugador.mesh.position.y = suelo
    jugador.vy = 0
    jugador.enSuelo = true
  } else {
    jugador.enSuelo = false
  }
}

function procesarJugador(jugador, delta) {
  moverJugador(jugador, delta)
  aplicarFisica(jugador, delta)
}

// ==========================================================
// MUERTE, REINICIO Y RECOGIDA
// ==========================================================
function resetearPosiciones() {
  for (const jugador of [jugador1, jugador2]) {
    if (!jugador.mesh) continue
    jugador.mesh.position.set(jugador.inicio.x, jugador.baseY, jugador.inicio.z)
    jugador.mesh.rotation.y = 0
    jugador.vy = 0
    jugador.enSuelo = false
  }
}

function reiniciarDiamantes() {
  recogidos = 0
  for (const d of diamantes) {
    if (d.mesh && d.recogido) {
      d.recogido = false
      scene.add(d.mesh)
    }
  }
  actualizarHUD()
}

// Muerte cooperativa: si uno muere, mueren los dos
function morir() {
  resetearPosiciones()
  reiniciarDiamantes()
  mostrarNotificacion('☠ ¡Habéis muerto! Reintentando...')
}

function comprobarPincho() {
  if (!pincho.mesh) return

  const cajaPincho = caja(pincho.mesh)

  for (const jugador of [jugador1, jugador2]) {
    if (!jugador.mesh) continue
    if (hitboxJugador(jugador).intersectsBox(cajaPincho)) {
      morir()
      return
    }
  }
}

function comprobarDiamantes() {
  for (const d of diamantes) {
    if (!d.mesh || d.recogido) continue
    if (!d.propietario.mesh) continue
    if (!hitboxJugador(d.propietario).intersectsBox(caja(d.mesh))) continue

    d.recogido = true
    scene.remove(d.mesh)
    recogidos++
    actualizarHUD()
    mostrarNotificacion(`¡Diamante recogido por ${d.propietario.nombre}!`)
  }
}

// ==========================================================
// VICTORIA
// ==========================================================
function enMeta(jugador, meta) {
  if (!jugador.mesh || !jugador.enSuelo) return false

  const x = jugador.mesh.position.x
  const z = jugador.mesh.position.z

  return Math.abs(x - meta.mesh.position.x) <= 1.25 &&
         Math.abs(z - meta.mesh.position.z) <= 1.25
}

function comprobarVictoria() {
  if (ganado) return

  const ambosEnMeta =
    enMeta(jugador1, meta1) &&
    enMeta(jugador2, meta2)

  if (recogidos === 2 && ambosEnMeta) {
    ganado = true
    overlay.style.display = 'flex'
  }
}

btnReiniciar.addEventListener('click', () => {
  ganado = false
  overlay.style.display = 'none'
  resetearPosiciones()
  reiniciarDiamantes()
  mostrarNotificacion('¡Nueva partida!')
})

// ==========================================================
// BUCLE PRINCIPAL
// ==========================================================
function animate() {
  requestAnimationFrame(animate)

  const delta = Math.min(clock.getDelta(), 0.05)

  if (!ganado) {
    procesarJugador(jugador1, delta)
    procesarJugador(jugador2, delta)

    comprobarPincho()
    comprobarDiamantes()
    comprobarVictoria()
  }

  // Giro suave de los diamantes
  for (const d of diamantes) {
    if (d.mesh && !d.recogido) {
      d.mesh.rotation.y += delta * 1.5
    }
  }

  // La cámara sigue el punto medio entre los dos jugadores
  const posiciones = [jugador1, jugador2]
    .filter((j) => j.mesh)
    .map((j) => j.mesh.position)

  if (posiciones.length > 0) {
    const medio = new THREE.Vector3()
    posiciones.forEach((p) => medio.add(p))
    medio.divideScalar(posiciones.length)
    controls.target.lerp(medio, 0.1)
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()

// ==========================================================
// RESIZE
// ==========================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})