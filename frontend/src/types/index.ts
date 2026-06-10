export type SimMode = 'gravity' | 'collision' | 'fluid' | 'vortex'

export type InteractionType = 'attract' | 'repel' | 'neutral'

export interface Particle {
  id: number
  groupId: string
  position: [number, number, number]
  velocity: [number, number, number]
  mass: number
  color: string
  radius: number
}

export interface GroupParams {
  mode: SimMode
  gravity: number
  damping: number
  bounce: number
  attractorStrength: number
}

export interface ParticleGroup {
  id: string
  name: string
  color: string
  particleCount: number
  params: GroupParams
  visible: boolean
}

export interface GroupInteraction {
  sourceGroupId: string
  targetGroupId: string
  type: InteractionType
  strength: number
}

export interface SimulationParams {
  mode: SimMode
  particleCount: number
  gravity: number
  damping: number
  bounce: number
  attractorStrength: number
  slowMotion: boolean
  paused: boolean
}

export interface Preset {
  id: string
  name: string
  params: Partial<SimulationParams>
}

export const GROUP_COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#c084fc', '#f472b6', '#38bdf8', '#fb923c',
  '#a3e635', '#22d3ee',
]

export const DEFAULT_GROUP_PARAMS: GroupParams = {
  mode: 'gravity',
  gravity: 9.8,
  damping: 0.02,
  bounce: 0.7,
  attractorStrength: 5,
}
