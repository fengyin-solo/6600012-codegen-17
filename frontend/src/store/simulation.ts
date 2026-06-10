import { create } from 'zustand'
import type {
  SimMode,
  SimulationParams,
  Particle,
  ParticleGroup,
  GroupInteraction,
  GroupParams,
  InteractionType,
} from '../types'
import { GROUP_COLORS, DEFAULT_GROUP_PARAMS } from '../types'

let _particleIdCounter = 0
let _groupIdCounter = 0

function nextParticleId() {
  return _particleIdCounter++
}

function nextGroupId() {
  return `group-${++_groupIdCounter}`
}

function createParticlesForGroup(
  groupId: string,
  color: string,
  count: number
): Particle[] {
  return Array.from({ length: count }, () => ({
    id: nextParticleId(),
    groupId,
    position: [
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
    ] as [number, number, number],
    velocity: [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ] as [number, number, number],
    mass: 0.5 + Math.random() * 2,
    color,
    radius: 0.15 + Math.random() * 0.35,
  }))
}

function createDefaultGroup(index: number, count: number): { group: ParticleGroup; particles: Particle[] } {
  const id = nextGroupId()
  const color = GROUP_COLORS[index % GROUP_COLORS.length]
  const group: ParticleGroup = {
    id,
    name: `组 ${index + 1}`,
    color,
    particleCount: count,
    params: { ...DEFAULT_GROUP_PARAMS },
    visible: true,
  }
  const particles = createParticlesForGroup(id, color, count)
  return { group, particles }
}

function createInitialState() {
  _particleIdCounter = 0
  _groupIdCounter = 0
  const g1 = createDefaultGroup(0, 150)
  const g2 = createDefaultGroup(1, 150)

  const groups: ParticleGroup[] = [g1.group, g2.group]
  const particles: Particle[] = [...g1.particles, ...g2.particles]

  const interactions: GroupInteraction[] = [
    { sourceGroupId: g1.group.id, targetGroupId: g2.group.id, type: 'attract', strength: 3 },
    { sourceGroupId: g2.group.id, targetGroupId: g1.group.id, type: 'attract', strength: 3 },
  ]

  return { groups, particles, interactions }
}

const initial = createInitialState()

interface SimStore extends SimulationParams {
  particles: Particle[]
  fps: number
  totalEnergy: number
  groups: ParticleGroup[]
  interactions: GroupInteraction[]
  activeGroupId: string | null
  useGroupParams: boolean
  setMode: (mode: SimMode) => void
  setParticleCount: (count: number) => void
  setParam: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void
  reset: () => void
  setFps: (fps: number) => void
  setTotalEnergy: (e: number) => void
  applyPreset: (preset: Partial<SimulationParams>) => void
  addGroup: (name?: string, count?: number) => void
  removeGroup: (groupId: string) => void
  setActiveGroup: (groupId: string | null) => void
  setGroupVisible: (groupId: string, visible: boolean) => void
  setGroupName: (groupId: string, name: string) => void
  setGroupParticleCount: (groupId: string, count: number) => void
  setGroupParam: <K extends keyof GroupParams>(groupId: string, key: K, value: GroupParams[K]) => void
  setGroupColor: (groupId: string, color: string) => void
  setInteraction: (sourceId: string, targetId: string, type: InteractionType, strength: number) => void
  resetGroups: () => void
  setUseGroupParams: (v: boolean) => void
}

export const useSimStore = create<SimStore>((set, get) => ({
  mode: 'gravity',
  particleCount: 300,
  gravity: 9.8,
  damping: 0.02,
  bounce: 0.7,
  attractorStrength: 5,
  slowMotion: false,
  paused: false,
  particles: initial.particles,
  fps: 0,
  totalEnergy: 0,
  groups: initial.groups,
  interactions: initial.interactions,
  activeGroupId: initial.groups[0]?.id ?? null,
  useGroupParams: true,

  setMode: (mode) => set({ mode }),
  setParticleCount: (count) => {
    const { groups } = get()
    if (groups.length === 0) {
      set({ particleCount: count })
      return
    }
    const perGroup = Math.max(10, Math.floor(count / groups.length))
    const newParticles: Particle[] = []
    const newGroups = groups.map(g => ({ ...g, particleCount: perGroup }))
    for (const g of newGroups) {
      newParticles.push(...createParticlesForGroup(g.id, g.color, perGroup))
    }
    set({ particleCount: count, groups: newGroups, particles: newParticles })
  },
  setParam: (key, value) => set({ [key]: value } as any),
  reset: () => {
    const { groups } = get()
    const newParticles: Particle[] = []
    for (const g of groups) {
      newParticles.push(...createParticlesForGroup(g.id, g.color, g.particleCount))
    }
    set({ particles: newParticles })
  },
  setFps: (fps) => set({ fps }),
  setTotalEnergy: (e) => set({ totalEnergy: e }),
  applyPreset: (preset) => {
    set({ ...preset } as any)
    get().reset()
  },

  addGroup: (name, count = 100) => {
    const { groups, interactions } = get()
    const index = groups.length
    const id = nextGroupId()
    const color = GROUP_COLORS[index % GROUP_COLORS.length]
    const newGroup: ParticleGroup = {
      id,
      name: name ?? `组 ${index + 1}`,
      color,
      particleCount: count,
      params: { ...DEFAULT_GROUP_PARAMS },
      visible: true,
    }
    const newParticles = createParticlesForGroup(id, color, count)
    const newInteractions: GroupInteraction[] = []
    for (const g of groups) {
      newInteractions.push({ sourceGroupId: id, targetGroupId: g.id, type: 'neutral', strength: 1 })
      newInteractions.push({ sourceGroupId: g.id, targetGroupId: id, type: 'neutral', strength: 1 })
    }
    set({
      groups: [...groups, newGroup],
      particles: [...get().particles, ...newParticles],
      interactions: [...interactions, ...newInteractions],
      activeGroupId: id,
      particleCount: get().particleCount + count,
    })
  },

  removeGroup: (groupId) => {
    const { groups, interactions, activeGroupId } = get()
    if (groups.length <= 1) return
    const newGroups = groups.filter(g => g.id !== groupId)
    const newParticles = get().particles.filter(p => p.groupId !== groupId)
    const newInteractions = interactions.filter(
      i => i.sourceGroupId !== groupId && i.targetGroupId !== groupId
    )
    const removedGroup = groups.find(g => g.id === groupId)
    set({
      groups: newGroups,
      particles: newParticles,
      interactions: newInteractions,
      activeGroupId: activeGroupId === groupId ? newGroups[0]?.id ?? null : activeGroupId,
      particleCount: get().particleCount - (removedGroup?.particleCount ?? 0),
    })
  },

  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

  setGroupVisible: (groupId, visible) => {
    const groups = get().groups.map(g => g.id === groupId ? { ...g, visible } : g)
    set({ groups })
  },

  setGroupName: (groupId, name) => {
    const groups = get().groups.map(g => g.id === groupId ? { ...g, name } : g)
    set({ groups })
  },

  setGroupParticleCount: (groupId, count) => {
    const { groups } = get()
    const targetGroup = groups.find(g => g.id === groupId)
    if (!targetGroup) return
    const otherParticles = get().particles.filter(p => p.groupId !== groupId)
    const newGroupParticles = createParticlesForGroup(groupId, targetGroup.color, count)
    const newGroups = groups.map(g => g.id === groupId ? { ...g, particleCount: count } : g)
    const totalCount = newGroups.reduce((sum, g) => sum + g.particleCount, 0)
    set({
      groups: newGroups,
      particles: [...otherParticles, ...newGroupParticles],
      particleCount: totalCount,
    })
  },

  setGroupParam: (groupId, key, value) => {
    const groups = get().groups.map(g =>
      g.id === groupId ? { ...g, params: { ...g.params, [key]: value } } : g
    )
    set({ groups })
  },

  setGroupColor: (groupId, color) => {
    const groups = get().groups.map(g => g.id === groupId ? { ...g, color } : g)
    const particles = get().particles.map(p => p.groupId === groupId ? { ...p, color } : p)
    set({ groups, particles })
  },

  setInteraction: (sourceId, targetId, type, strength) => {
    const { interactions } = get()
    const idx = interactions.findIndex(
      i => i.sourceGroupId === sourceId && i.targetGroupId === targetId
    )
    const newInteraction: GroupInteraction = {
      sourceGroupId: sourceId,
      targetGroupId: targetId,
      type,
      strength,
    }
    let newInteractions: GroupInteraction[]
    if (idx >= 0) {
      newInteractions = [...interactions]
      newInteractions[idx] = newInteraction
    } else {
      newInteractions = [...interactions, newInteraction]
    }
    set({ interactions: newInteractions })
  },

  resetGroups: () => {
    const fresh = createInitialState()
    set({
      groups: fresh.groups,
      particles: fresh.particles,
      interactions: fresh.interactions,
      activeGroupId: fresh.groups[0]?.id ?? null,
      particleCount: fresh.particles.length,
    })
  },

  setUseGroupParams: (v) => set({ useGroupParams: v }),
}))
