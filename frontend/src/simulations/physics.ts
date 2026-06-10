import type { Particle, ParticleGroup, GroupInteraction, SimMode } from '../types'

const BOUND = 12

function applyGroupForces(
  particles: Particle[],
  groups: ParticleGroup[],
  interactions: GroupInteraction[],
  dt: number
): Map<number, [number, number, number]> {
  const forces = new Map<number, [number, number, number]>()
  particles.forEach(p => forces.set(p.id, [0, 0, 0]))

  const groupParticleMap = new Map<string, Particle[]>()
  groups.forEach(g => {
    groupParticleMap.set(g.id, particles.filter(p => p.groupId === g.id))
  })

  for (const interaction of interactions) {
    if (interaction.type === 'neutral') continue
    const sourceParticles = groupParticleMap.get(interaction.sourceGroupId) || []
    const targetParticles = groupParticleMap.get(interaction.targetGroupId) || []
    if (sourceParticles.length === 0 || targetParticles.length === 0) continue

    const sign = interaction.type === 'attract' ? 1 : -1
    const strength = interaction.strength * sign

    for (const src of sourceParticles) {
      for (const tgt of targetParticles) {
        if (src.id === tgt.id) continue
        const dx = src.position[0] - tgt.position[0]
        const dy = src.position[1] - tgt.position[1]
        const dz = src.position[2] - tgt.position[2]
        const distSq = dx * dx + dy * dy + dz * dz
        const dist = Math.sqrt(distSq) + 0.01
        if (dist > 15) continue

        const force = strength / (distSq + 0.5) * dt * 2
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        const fz = (dz / dist) * force

        const tgtForce = forces.get(tgt.id)!
        tgtForce[0] += fx
        tgtForce[1] += fy
        tgtForce[2] += fz
      }
    }
  }

  return forces
}

export function applyPhysics(
  particles: Particle[],
  groups: ParticleGroup[],
  interactions: GroupInteraction[],
  globalMode: SimMode,
  globalGravity: number,
  globalDamping: number,
  globalBounce: number,
  globalAttractorStrength: number,
  useGroupParams: boolean,
  dt: number
): Particle[] {
  const groupMap = new Map<string, ParticleGroup>()
  groups.forEach(g => groupMap.set(g.id, g))

  const interForces = applyGroupForces(particles, groups, interactions, dt)

  return particles.map(p => {
    const group = groupMap.get(p.groupId)
    const visible = group?.visible ?? true
    if (!visible) return p

    let mode = globalMode
    let gravity = globalGravity
    let damping = globalDamping
    let bounce = globalBounce
    let attractorStrength = globalAttractorStrength

    if (useGroupParams && group) {
      mode = group.params.mode
      gravity = group.params.gravity
      damping = group.params.damping
      bounce = group.params.bounce
      attractorStrength = group.params.attractorStrength
    }

    const vel: [number, number, number] = [...p.velocity]
    const pos: [number, number, number] = [...p.position]

    const extraForce = interForces.get(p.id) || [0, 0, 0]
    vel[0] += extraForce[0]
    vel[1] += extraForce[1]
    vel[2] += extraForce[2]

    if (mode === 'gravity') {
      vel[1] -= gravity * dt
      const dx = -pos[0], dy = -pos[1], dz = -pos[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01
      const f = attractorStrength / (dist * dist) * dt
      vel[0] += dx / dist * f
      vel[1] += dy / dist * f
      vel[2] += dz / dist * f
    } else if (mode === 'collision') {
      vel[1] -= gravity * dt
      const sameGroup = particles.filter(q => q.groupId === p.groupId)
      for (const q of sameGroup) {
        if (q.id === p.id) continue
        const dx = q.position[0] - pos[0]
        const dy = q.position[1] - pos[1]
        const dz = q.position[2] - pos[2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < p.radius + q.radius + 0.1) {
          const nx = dx / (dist + 0.001)
          const ny = dy / (dist + 0.001)
          const nz = dz / (dist + 0.001)
          vel[0] -= nx * 0.5
          vel[1] -= ny * 0.5
          vel[2] -= nz * 0.5
        }
      }
    } else if (mode === 'fluid') {
      const pressure = 2.0
      const sameGroup = particles.filter(q => q.groupId === p.groupId)
      for (const q of sameGroup) {
        if (q.id === p.id) continue
        const dx = q.position[0] - pos[0]
        const dy = q.position[1] - pos[1]
        const dz = q.position[2] - pos[2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < 2.0) {
          const h = 2.0 - dist
          const force = pressure * h * h * dt
          vel[0] -= (dx / (dist + 0.001)) * force
          vel[1] -= (dy / (dist + 0.001)) * force - gravity * dt * 0.3
          vel[2] -= (dz / (dist + 0.001)) * force
        }
      }
      vel[1] -= gravity * dt * 0.5
    } else if (mode === 'vortex') {
      const r = Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2]) + 0.01
      const omega = attractorStrength / (r + 1) * dt
      vel[0] += -pos[2] / r * omega
      vel[2] += pos[0] / r * omega
      vel[1] -= gravity * dt * 0.2
      vel[0] -= pos[0] / r * dt * 2
      vel[2] -= pos[2] / r * dt * 2
    }

    const d = 1 - damping
    vel[0] *= d; vel[1] *= d; vel[2] *= d

    pos[0] += vel[0] * dt * 10
    pos[1] += vel[1] * dt * 10
    pos[2] += vel[2] * dt * 10

    for (let i = 0; i < 3; i++) {
      if (pos[i] > BOUND) { pos[i] = BOUND; vel[i] *= -bounce }
      if (pos[i] < -BOUND) { pos[i] = -BOUND; vel[i] *= -bounce }
    }

    return { ...p, position: pos, velocity: vel }
  })
}
