import { useState } from 'react'
import { useSimStore } from '../store/simulation'
import type { SimMode, InteractionType, GroupParams } from '../types'
import { GROUP_COLORS } from '../types'

const MODES: { value: SimMode; label: string; icon: string }[] = [
  { value: 'gravity', label: '重力吸引', icon: '🌍' },
  { value: 'collision', label: '弹性碰撞', icon: '💥' },
  { value: 'fluid', label: '流体模拟', icon: '💧' },
  { value: 'vortex', label: '漩涡旋转', icon: '🌀' },
]

const INTERACTION_TYPES: { value: InteractionType; label: string; icon: string }[] = [
  { value: 'attract', label: '吸引', icon: '🧲' },
  { value: 'repel', label: '排斥', icon: '💨' },
  { value: 'neutral', label: '无', icon: '➖' },
]

type TabType = 'groups' | 'global' | 'interactions'

export default function ControlPanel() {
  const [tab, setTab] = useState<TabType>('groups')
  const store = useSimStore()
  const activeGroup = store.groups.find(g => g.id === store.activeGroupId) ?? null

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white mb-2">粒子物理模拟器</h2>
        <div className="flex gap-1 bg-gray-800 p-1 rounded">
          {(['groups', 'interactions', 'global'] as TabType[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition ${
                tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'groups' ? '🎨 分组' : t === 'interactions' ? '🔗 交互' : '⚙️ 全局'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'groups' && (
          <GroupsPanel
            groups={store.groups}
            activeGroupId={store.activeGroupId}
            setActiveGroup={store.setActiveGroup}
            addGroup={() => store.addGroup()}
            removeGroup={store.removeGroup}
            setGroupName={store.setGroupName}
            setGroupColor={store.setGroupColor}
            setGroupVisible={store.setGroupVisible}
            setGroupParticleCount={store.setGroupParticleCount}
            setGroupParam={store.setGroupParam}
            useGroupParams={store.useGroupParams}
            activeGroup={activeGroup}
          />
        )}
        {tab === 'interactions' && (
          <InteractionsPanel
            groups={store.groups}
            interactions={store.interactions}
            setInteraction={store.setInteraction}
          />
        )}
        {tab === 'global' && (
          <GlobalPanel store={store} />
        )}
      </div>

      <div className="p-4 border-t border-gray-700 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => store.setParam('paused', !store.paused)}
            className={`flex-1 py-2 rounded font-medium text-sm ${store.paused ? 'bg-green-600' : 'bg-red-600'} text-white`}
          >
            {store.paused ? '▶ 继续' : '⏸ 暂停'}
          </button>
          <button
            onClick={() => store.setParam('slowMotion', !store.slowMotion)}
            className={`flex-1 py-2 rounded font-medium text-sm ${store.slowMotion ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            🐌 慢动作
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => store.reset()}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            🔄 重置粒子
          </button>
          <button
            onClick={() => store.resetGroups()}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            🔁 重置分组
          </button>
        </div>
      </div>
    </div>
  )
}

function GroupsPanel(props: {
  groups: ReturnType<typeof useSimStore.getState>['groups']
  activeGroupId: string | null
  setActiveGroup: (id: string | null) => void
  addGroup: () => void
  removeGroup: (id: string) => void
  setGroupName: (id: string, name: string) => void
  setGroupColor: (id: string, color: string) => void
  setGroupVisible: (id: string, v: boolean) => void
  setGroupParticleCount: (id: string, count: number) => void
  setGroupParam: <K extends keyof GroupParams>(id: string, key: K, value: GroupParams[K]) => void
  useGroupParams: boolean
  activeGroup: ReturnType<typeof useSimStore.getState>['groups'][number] | null
}) {
  const {
    groups, activeGroupId, setActiveGroup, addGroup, removeGroup,
    setGroupName, setGroupColor, setGroupVisible, setGroupParticleCount,
    setGroupParam, useGroupParams, activeGroup,
  } = props

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">粒子分组 ({groups.length})</label>
        <button
          onClick={addGroup}
          disabled={groups.length >= GROUP_COLORS.length}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded"
        >
          ➕ 新建组
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`relative group flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition border-2 ${
              activeGroupId === g.id
                ? 'border-white'
                : 'border-transparent hover:border-gray-500'
            } ${g.visible ? '' : 'opacity-50'}`}
            style={{ backgroundColor: g.color + '33', color: g.color }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: g.color }}
            />
            <span className="max-w-20 truncate">{g.name}</span>
            <span className="text-[10px] opacity-70">({g.particleCount})</span>
            {groups.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); removeGroup(g.id) }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] leading-4 hidden group-hover:flex items-center justify-center hover:bg-red-400"
                title="删除组"
              >
                ×
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 cursor-pointer flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={useGroupParams}
            onChange={e => useSimStore.setState({ useGroupParams: e.target.checked })}
            className="accent-blue-500"
          />
          每组独立参数
        </label>
      </div>

      {activeGroup && (
        <div className="flex flex-col gap-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeGroup.color }}
            />
            <span className="font-medium text-sm" style={{ color: activeGroup.color }}>
              {activeGroup.name}
            </span>
            <button
              onClick={() => setGroupVisible(activeGroup.id, !activeGroup.visible)}
              className={`ml-auto text-xs px-2 py-1 rounded ${activeGroup.visible ? 'bg-green-700 text-white' : 'bg-gray-600 text-gray-300'}`}
            >
              {activeGroup.visible ? '👁 显示' : '🙈 隐藏'}
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">组名称</label>
            <input
              type="text"
              value={activeGroup.name}
              onChange={e => setGroupName(activeGroup.id, e.target.value)}
              className="w-full bg-gray-700 text-white text-sm px-2 py-1.5 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">组颜色</label>
            <div className="flex gap-1.5 flex-wrap">
              {GROUP_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setGroupColor(activeGroup.id, c)}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    activeGroup.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400">粒子数量: {activeGroup.particleCount}</label>
            <input
              type="range" min={10} max={400} step={10}
              value={activeGroup.particleCount}
              onChange={e => setGroupParticleCount(activeGroup.id, Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {useGroupParams && (
            <>
              <div>
                <label className="text-xs text-gray-400 block mb-1">模拟模式</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {MODES.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setGroupParam(activeGroup.id, 'mode', m.value)}
                      className={`px-2 py-1.5 rounded text-xs font-medium transition ${
                        activeGroup.params.mode === m.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <SliderRow
                label={`重力: ${activeGroup.params.gravity.toFixed(1)}`}
                value={activeGroup.params.gravity}
                min={-20} max={20} step={0.5}
                onChange={v => setGroupParam(activeGroup.id, 'gravity', v)}
                accent="green"
              />
              <SliderRow
                label={`阻尼: ${activeGroup.params.damping.toFixed(3)}`}
                value={activeGroup.params.damping}
                min={0} max={0.5} step={0.005}
                onChange={v => setGroupParam(activeGroup.id, 'damping', v)}
                accent="yellow"
              />
              <SliderRow
                label={`弹性: ${activeGroup.params.bounce.toFixed(2)}`}
                value={activeGroup.params.bounce}
                min={0} max={1} step={0.05}
                onChange={v => setGroupParam(activeGroup.id, 'bounce', v)}
                accent="orange"
              />
              <SliderRow
                label={`吸引力: ${activeGroup.params.attractorStrength.toFixed(1)}`}
                value={activeGroup.params.attractorStrength}
                min={0} max={20} step={0.5}
                onChange={v => setGroupParam(activeGroup.id, 'attractorStrength', v)}
                accent="pink"
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function InteractionsPanel(props: {
  groups: ReturnType<typeof useSimStore.getState>['groups']
  interactions: ReturnType<typeof useSimStore.getState>['interactions']
  setInteraction: (sourceId: string, targetId: string, type: InteractionType, strength: number) => void
}) {
  const { groups, interactions, setInteraction } = props

  const getInteraction = (sourceId: string, targetId: string) => {
    return interactions.find(
      i => i.sourceGroupId === sourceId && i.targetGroupId === targetId
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 block mb-2">组间交互规则</label>
        <p className="text-[11px] text-gray-500 mb-3">
          设置「源组」对「目标组」的作用力：吸引会让目标组被源组吸引，排斥则推开。
        </p>
      </div>

      {groups.length < 2 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          至少需要 2 个分组才能设置交互
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(source => (
            <div key={source.id} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                <span className="font-medium text-sm" style={{ color: source.color }}>
                  {source.name} →
                </span>
                <span className="text-xs text-gray-500">作用于:</span>
              </div>

              <div className="flex flex-col gap-3">
                {groups
                  .filter(t => t.id !== source.id)
                  .map(target => {
                    const inter = getInteraction(source.id, target.id)
                    const type = inter?.type ?? 'neutral'
                    const strength = inter?.strength ?? 1
                    return (
                      <div key={target.id} className="bg-gray-900 rounded p-2.5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: target.color }} />
                          <span className="text-xs text-gray-300">{target.name}</span>
                          <div className="ml-auto flex gap-1">
                            {INTERACTION_TYPES.map(it => (
                              <button
                                key={it.value}
                                onClick={() => setInteraction(source.id, target.id, it.value, strength)}
                                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                                  type === it.value
                                    ? it.value === 'attract' ? 'bg-pink-600 text-white'
                                      : it.value === 'repel' ? 'bg-cyan-600 text-white'
                                      : 'bg-gray-600 text-white'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                                title={it.label}
                              >
                                {it.icon} {it.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {type !== 'neutral' && (
                          <div>
                            <label className="text-[11px] text-gray-500">
                              强度: {strength.toFixed(1)}
                            </label>
                            <input
                              type="range"
                              min={0.1}
                              max={10}
                              step={0.1}
                              value={strength}
                              onChange={e => setInteraction(source.id, target.id, type, Number(e.target.value))}
                              className={`w-full ${type === 'attract' ? 'accent-pink-500' : 'accent-cyan-500'}`}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 p-3 bg-gray-800 rounded-lg">
        <label className="text-xs text-gray-300 font-medium block mb-2">⚡ 快速预设</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              groups.forEach((s, i) => {
                groups.forEach((t, j) => {
                  if (i !== j) setInteraction(s.id, t.id, 'attract', 3)
                })
              })
            }}
            className="py-1.5 bg-pink-700 hover:bg-pink-600 text-white text-xs rounded"
          >
            全部互相吸引
          </button>
          <button
            onClick={() => {
              groups.forEach((s, i) => {
                groups.forEach((t, j) => {
                  if (i !== j) setInteraction(s.id, t.id, 'repel', 3)
                })
              })
            }}
            className="py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs rounded"
          >
            全部互相排斥
          </button>
          <button
            onClick={() => {
              for (let i = 0; i < groups.length - 1; i++) {
                setInteraction(groups[i].id, groups[i + 1].id, 'attract', 4)
                setInteraction(groups[i + 1].id, groups[i].id, 'attract', 4)
              }
            }}
            className="py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded"
          >
            链式吸引
          </button>
          <button
            onClick={() => {
              groups.forEach((s, i) => {
                groups.forEach((t, j) => {
                  if (i !== j) setInteraction(s.id, t.id, 'neutral', 1)
                })
              })
            }}
            className="py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
          >
            清空全部
          </button>
        </div>
      </div>
    </div>
  )
}

function GlobalPanel({ store }: { store: ReturnType<typeof useSimStore.getState> }) {
  const PRESETS = [
    { id: 'solar', name: '太阳系', params: { mode: 'gravity' as SimMode, gravity: 5, attractorStrength: 8, damping: 0.01 } },
    { id: 'billiards', name: '台球碰撞', params: { mode: 'collision' as SimMode, gravity: 0, damping: 0.005, bounce: 0.95 } },
    { id: 'lava', name: '熔岩灯', params: { mode: 'fluid' as SimMode, gravity: 3, damping: 0.05 } },
    { id: 'tornado', name: '龙卷风', params: { mode: 'vortex' as SimMode, gravity: 2, attractorStrength: 12, damping: 0.02 } },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-400 block mb-1">预设场景</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => store.applyPreset(p.params)}
              className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-full"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">全局模拟模式</label>
        <div className="grid grid-cols-2 gap-1.5">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => store.setMode(m.value)}
              className={`px-2 py-1.5 rounded text-xs font-medium transition ${
                store.mode === m.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        {store.useGroupParams && (
          <p className="text-[11px] text-amber-500 mt-1.5">
            ⚠️ 每组已独立设置模式，全局设置仅对未启用独立参数的组生效
          </p>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-400">总粒子数量: {store.particleCount}</label>
        <input
          type="range" min={20} max={1200} step={20}
          value={store.particleCount}
          onChange={e => store.setParticleCount(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      <SliderRow
        label={`重力: ${store.gravity.toFixed(1)}`}
        value={store.gravity}
        min={-20} max={20} step={0.5}
        onChange={v => store.setParam('gravity', v)}
        accent="green"
      />
      <SliderRow
        label={`阻尼: ${store.damping.toFixed(3)}`}
        value={store.damping}
        min={0} max={0.5} step={0.005}
        onChange={v => store.setParam('damping', v)}
        accent="yellow"
      />
      <SliderRow
        label={`弹性: ${store.bounce.toFixed(2)}`}
        value={store.bounce}
        min={0} max={1} step={0.05}
        onChange={v => store.setParam('bounce', v)}
        accent="orange"
      />
      <SliderRow
        label={`吸引力: ${store.attractorStrength.toFixed(1)}`}
        value={store.attractorStrength}
        min={0} max={20} step={0.5}
        onChange={v => store.setParam('attractorStrength', v)}
        accent="pink"
      />
    </div>
  )
}

function SliderRow(props: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  accent: 'blue' | 'green' | 'yellow' | 'orange' | 'pink' | 'cyan'
}) {
  const accentMap: Record<string, string> = {
    blue: 'accent-blue-500',
    green: 'accent-green-500',
    yellow: 'accent-yellow-500',
    orange: 'accent-orange-500',
    pink: 'accent-pink-500',
    cyan: 'accent-cyan-500',
  }
  return (
    <div>
      <label className="text-xs text-gray-400">{props.label}</label>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={e => props.onChange(Number(e.target.value))}
        className={`w-full ${accentMap[props.accent]}`}
      />
    </div>
  )
}
