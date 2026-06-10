import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../store/simulation'
import { applyPhysics } from '../simulations/physics'

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

export default function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particles = useSimStore(s => s.particles)
  const groups = useSimStore(s => s.groups)
  const interactions = useSimStore(s => s.interactions)
  const mode = useSimStore(s => s.mode)
  const gravity = useSimStore(s => s.gravity)
  const damping = useSimStore(s => s.damping)
  const bounce = useSimStore(s => s.bounce)
  const attractorStrength = useSimStore(s => s.attractorStrength)
  const slowMotion = useSimStore(s => s.slowMotion)
  const paused = useSimStore(s => s.paused)
  const useGroupParams = useSimStore(s => s.useGroupParams)
  const setFps = useSimStore(s => s.setFps)
  const setTotalEnergy = useSimStore(s => s.setTotalEnergy)

  const groupMap = useMemo(() => {
    const m = new Map<string, boolean>()
    groups.forEach(g => m.set(g.id, g.visible))
    return m
  }, [groups])

  const colorArray = useMemo(
    () => new Float32Array(particles.length * 3),
    [particles.length]
  )

  useMemo(() => {
    particles.forEach((p, i) => {
      tempColor.set(p.color)
      colorArray[i * 3] = tempColor.r
      colorArray[i * 3 + 1] = tempColor.g
      colorArray[i * 3 + 2] = tempColor.b
    })
  }, [particles, colorArray])

  const fpsCounter = useRef({ frames: 0, lastTime: performance.now() })
  const particlesRef = useRef(particles)
  particlesRef.current = particles

  useFrame((_, delta) => {
    if (!meshRef.current || paused) return
    const dt = slowMotion ? delta * 0.1 : delta

    const updated = applyPhysics(
      particlesRef.current,
      groups,
      interactions,
      mode,
      gravity,
      damping,
      bounce,
      attractorStrength,
      useGroupParams,
      dt
    )
    particlesRef.current = updated

    let totalEnergy = 0
    let visibleCount = 0
    updated.forEach((p, i) => {
      const isVisible = groupMap.get(p.groupId) ?? true
      if (!isVisible) {
        tempObject.position.set(9999, 9999, 9999)
        tempObject.scale.set(0, 0, 0)
      } else {
        tempObject.position.set(...p.position)
        const scale = p.radius * 2
        tempObject.scale.set(scale, scale, scale)
        visibleCount++
      }
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)
      if (isVisible) {
        totalEnergy += 0.5 * p.mass * (p.velocity[0] ** 2 + p.velocity[1] ** 2 + p.velocity[2] ** 2)
      }
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.count = particles.length
    setTotalEnergy(totalEnergy)

    fpsCounter.current.frames++
    const now = performance.now()
    if (now - fpsCounter.current.lastTime > 1000) {
      setFps(fpsCounter.current.frames)
      fpsCounter.current.frames = 0
      fpsCounter.current.lastTime = now
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 8, 8]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </sphereGeometry>
      <meshPhongMaterial vertexColors toneMapped={false} shininess={80} />
    </instancedMesh>
  )
}
