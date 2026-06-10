import { useSimStore } from '../store/simulation'

export default function StatsOverlay() {
  const fps = useSimStore(s => s.fps)
  const count = useSimStore(s => s.particleCount)
  const mode = useSimStore(s => s.mode)
  const energy = useSimStore(s => s.totalEnergy)
  const groups = useSimStore(s => s.groups)
  const useGroupParams = useSimStore(s => s.useGroupParams)

  const visibleCount = groups.reduce((sum, g) => sum + (g.visible ? g.particleCount : 0), 0)

  return (
    <div className="absolute top-3 left-3 bg-black/60 rounded px-3 py-2 text-xs font-mono space-y-1 pointer-events-none">
      <div className="text-green-400">FPS: {fps}</div>
      <div className="text-blue-400">粒子数: {count} {visibleCount !== count && <span className="text-blue-300">(显示 {visibleCount})</span>}</div>
      <div className="text-yellow-400">模式: {mode} {useGroupParams && <span className="text-yellow-300">(独立)</span>}</div>
      <div className="text-pink-400">总动能: {energy.toFixed(1)}</div>
      <div className="pt-1 border-t border-white/20 mt-1">
        <div className="text-gray-400 mb-1">分组 ({groups.length}):</div>
        {groups.map(g => (
          <div key={g.id} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
            <span className={g.visible ? 'text-gray-200' : 'text-gray-500 line-through'}>
              {g.name}: {g.particleCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
