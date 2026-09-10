import { useState, useRef } from 'react'
import { PotteryCanvas, type PotteryCanvasHandle } from './pottery/PotteryCanvas'
import { LandingPorcelain3D, type ShowcaseGlaze, type SyncVaseState } from './components/LandingPorcelain3D'
import { LandingBgPorcelain3D } from './components/LandingBgPorcelain3D'
import { CraftGuidePage } from './pages/CraftGuidePage'
import { GalleryPage, type RemakeConfig } from './pages/GalleryPage'
import { type PresetType } from './pottery/PotteryGeometry'
import { type MotifType, PALETTE_COLORS } from './pottery/patterns'
import { type GlazeType } from './pottery/PotteryMaterials'
import './App.css'

/* ====================== 类型与数据 ====================== */

type PageView = 'landing' | 'craft' | 'gallery' | 'workshop'
type StepKey = 'forming' | 'trim' | 'pattern' | 'glaze' | 'fire' | 'finish'

interface StepDef { key: StepKey; n: string; k: string; d: string }
const STEPS: StepDef[] = [
  { key: 'forming', n: '制坯', k: 'STEP 01', d: '以陶轮拉坯，定器型与基本尺寸。' },
  { key: 'trim', n: '修型', k: 'STEP 02', d: '利坯修足，校准壁厚与对称。' },
  { key: 'pattern', n: '纹样', k: 'STEP 03', d: '以青花等装饰技法绘制纹饰。' },
  { key: 'glaze', n: '上釉', k: 'STEP 04', d: '施釉包裹，决定成瓷釉色质感。' },
  { key: 'fire', n: '烧制', k: 'STEP 05', d: '入窑高温烧成，窑火定色。' },
  { key: 'finish', n: '成品', k: 'STEP 06', d: '开窑检视，数字身份与展陈。' },
]

interface PresetDef { id: PresetType; name: string; desc: string }
const PRESET_LIST: PresetDef[] = [
  { id: 'meiping', name: '传统梅瓶', desc: '小口丰肩窄足 · 明清官窑' },
  { id: 'yuhuchun', name: '玉壶春瓶', desc: '撇口细颈垂腹 · 曲线优美' },
  { id: 'bowl', name: '葵口斗笠碗', desc: '大口深腹平底 · 宋代斗茶' },
  { id: 'cylinder', name: '初始圆柱', desc: '规整圆柱生坯 · 自由塑造' },
]

interface MotifDef { id: MotifType; name: string; desc: string; tag: string }
const MOTIF_LIST: MotifDef[] = [
  { id: 'lotus', name: '青花缠枝莲', desc: '经典明代官窑 · 生生不息', tag: '经典' },
  { id: 'dragon', name: '御窑云水龙', desc: '苍龙破雾穿云 · 气势磅礴', tag: '御窑' },
  { id: 'ice', name: '冰裂散点梅', desc: '哥窑断纹折光 · 疏影横斜', tag: '雅致' },
  { id: 'banana', name: '蕉叶如意纹', desc: '商周青铜变体 · 典雅端庄', tag: '古朴' },
  { id: 'blank', name: '纯白素瓷胎', desc: '羊脂素胎留白 · 自由手绘', tag: '自主' },
]

interface GlazeDef { id: GlazeType; name: string; desc: string; sw: string }
const GLAZE_LIST: GlazeDef[] = [
  { id: 'gloss', name: '亮光透明釉', desc: '高光镜面 · 晶莹纯澈强反光', sw: 'gloss' },
  { id: 'jade', name: '温润凝脂釉', desc: '羊脂白玉 · 柔和漫反射如脂', sw: 'jade' },
  { id: 'matte', name: '丝绸哑光釉', desc: '微晶亚光 · 丝绢缎面低光泽', sw: 'matte' },
  { id: 'crackle', name: '冰裂开片釉', desc: '哥窑开片 · 纹片折光流彩', sw: 'crackle' },
  { id: 'ripple', name: '柴窑水光釉', desc: '橘皮微澜 · 柴窑波浪流光', sw: 'ripple' },
]

interface SugDef { t: string; d: string; ic: string }
interface AIContent { tag: string; greet: string; quick: string[]; sugg: SugDef[] }
const AI: Record<StepKey, AIContent> = {
  forming: { tag: '制坯', greet: '我们正位于 <span class="hl">制坯</span> 阶段。先用陶轮定出器型骨架——拉坯决定日后纹样与釉色的载体。',
    quick: ['推荐什么器型？', '拉坯高度怎么定？', '泥料怎么选？'],
    sugg: [{ t: '器型库', d: '梅瓶 / 玉壶春 / 天球瓶', ic: 'v' }, { t: '泥料建议', d: '高岭土 + 瓷石二元配方', ic: 'leaf' }, { t: '拉坯教程', d: '定中心 → 开孔 → 提壁', ic: 'play' }] },
  trim: { tag: '修型', greet: '进入 <span class="hl">修型</span>。利坯要修出均匀的壁厚与规整的圈足，器壁过厚烧制易裂。',
    quick: ['圈足怎么修？', '壁厚多少合适？', '如何校验对称？'],
    sugg: [{ t: '修足示范', d: '倒扣修底 → 挖足', ic: 'v' }, { t: '厚度标准', d: '瓶腹 4–6mm', ic: 'ruler' }, { t: '对称检测', d: '灯光投影校验', ic: 'play' }] },
  pattern: { tag: '纹样', greet: '到了 <span class="hl">纹样</span> 阶段。左侧可选青花等技法绘制纹饰，或让 AI 生成缠枝、云水、莲纹构图。',
    quick: ['青花怎么画？', '推荐什么纹样？', 'AI 生成一幅缠枝莲', '纹样布局要点？'],
    sugg: [{ t: '青花分水', d: '浓淡五分水技法', ic: 'v' }, { t: '经典纹样', d: '缠枝莲 / 云龙 / 冰裂', ic: 'leaf' }, { t: '一键构图', d: 'AI 生成对称纹样', ic: 'spark' }] },
  glaze: { tag: '上釉', greet: '进入 <span class="hl">上釉</span>。施透明琉璃罩釉，底色彩绘将被完全保护在透明釉层之下。左侧可切换亮光透明釉、温润凝脂釉、丝绸哑光釉、冰裂开片釉、柴窑水光釉等，预览釉面反光与光泽质感。',
    quick: ['施釉会覆盖彩绘吗？', '什么是亮光透明釉？', '温润凝脂釉是什么？', '釉层多厚合适？'],
    sugg: [{ t: '施釉方式', d: '蘸釉 / 吹釉 / 荡釉', ic: 'v' }, { t: '反光质感', d: '高光镜面 vs 凝脂润玉', ic: 'leaf' }, { t: '釉层建议', d: '0.8–1.2mm 均匀', ic: 'ruler' }] },
  fire: { tag: '烧制', greet: '入 <span class="hl">烧制</span> 阶段。窑温升至 1280℃ 左右，氧化—还原气氛决定釉色最终的呈现。',
    quick: ['窑温多少合适？', '什么是还原焰？', '开窑前要等多久？', '窑变怎么控制？'],
    sugg: [{ t: '柴窑曲线', d: '升温→氧化→还原→冷却', ic: 'v' }, { t: '气氛控制', d: '还原焰锁铜红', ic: 'flame' }, { t: '冷却时长', d: '自然冷却 24h+', ic: 'clock' }] },
  finish: { tag: '成品', greet: '开窑成 <span class="hl">成品</span>。可 360° 检视、生成数字瓷器身份证，并一键导出展陈海报。',
    quick: ['导出数字身份证？', '生成展陈海报', '360° 怎么旋转？', '估价与著录？'],
    sugg: [{ t: '数字身份证', d: '编号 / 釉色 / 窑口', ic: 'id' }, { t: '展陈海报', d: '国风版式一键生成', ic: 'poster' }, { t: '著录卡片', d: '入藏品数字档案', ic: 'v' }] },
}

const REPLY: Record<string, string> = {
  '推荐什么器型？': '梅瓶最宜显青花缠枝，玉壶春曲线柔美，天球瓶适合大画面。当前选题「青花缠枝莲梅瓶」就很经典。',
  '拉坯高度怎么定？': '按器型定：梅瓶约 30–35cm，先定中心再提壁，匀速加高。',
  '泥料怎么选？': '景德镇二元配方：高岭土 + 瓷石，可塑性与耐火兼具。',
  '圈足怎么修？': '倒扣于陶轮，先修底再挖足，足墙厚薄均匀、底线利落。',
  '壁厚多少合适？': '瓶腹 4–6mm 为宜，过厚烧制易裂、过薄易变形。',
  '如何校验对称？': '置灯光前投影，或慢转观察轮廓是否匀称。',
  '青花怎么画？': '先勾线再以「分水」填色，浓淡五分水（头浓→五厘）分出层次。',
  '推荐什么纹样？': '缠枝莲寓意连绵不断，云龙显气势，冰裂纹雅致——按器型疏密布白。',
  'AI 生成一幅缠枝莲': '（占位）将调用文生纹样模型，生成对称缠枝莲构图供描摹。',
  '纹样布局要点？': '主纹居中、辅纹口足，留白透气，疏可走马密不透风。',
  '施釉会覆盖彩绘吗？': '绝不会。在景德镇传统工艺中，釉下彩绘完成后施透明罩釉包裹，彩绘完好保留在釉层之下。上釉改变的是表面的反光、粗糙度与玉质光泽感。',
  '什么是亮光透明釉？': '景德镇最经典的青花透明罩釉，玻化熔融后晶莹剔透，反光强烈锐利如明镜，能最纯粹地展现釉下青花发色。',
  '温润凝脂釉是什么？': '如永乐甜白与羊脂白玉般的含蓄油脂光泽，柔和漫反射，高光内敛温润，抚之如凝脂。',
  '釉层多厚合适？': '蘸釉或吹釉 0.8–1.2mm 均匀为佳，厚则流釉、薄则失润。',
  '窑温多少合适？': '青花瓷 1280℃ 左右；郎红需更高并严格还原。',
  '什么是还原焰？': '减少供氧使火焰含一氧化碳，还原铜铁发色（如铜红）。',
  '开窑前要等多久？': '自然冷却 24 小时以上，骤冷易惊釉开裂。',
  '窑变怎么控制？': '控气氛与升降温曲线，窑变仍具随机性，是其魅力所在。',
  '导出数字身份证？': '（占位）生成编号 / 釉色 / 窑口 / 烧制参数并区块链存证。',
  '生成展陈海报': '（占位）一键输出国风版式展陈海报（含器型图与著录）。',
  '360° 怎么旋转？': '在成品页拖动陶器即可环视，支持自动旋转。',
  '估价与著录？': '（占位）可按釉色、品相、窑口生成著录与参考估价。',
}

const SUG_ICONS: Record<string, string> = {
  v: '<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7L10 5H5a2 2 0 0 0-2 2z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 8-4 14-9 14z"/>',
  play: '<path d="M6 4l14 8-14 8z"/>',
  ruler: '<path d="M3 8l18-4v12l-18 4z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  flame: '<path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s3 1 4 4c0-3 0-6 0-10z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  id: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M14 9h4M14 13h4M6 15h12"/>',
  poster: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/>',
}

const CHAT_ICON = '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-1L3 20l1.1-4A8.4 8.4 0 1 1 21 11.5z"/>'
const SEND_ICON = '<line x1="22" y1="2" x2="11" y2="13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>'

/* ====================== 主应用 ====================== */
interface Msg { role: 'ai' | 'me'; html: string }


export default function App() {
  function initStep(): StepKey {
    const p = new URLSearchParams(location.search).get('step')
    return p && STEPS.some((s) => s.key === p) ? (p as StepKey) : 'forming'
  }
  const INIT_STEP = initStep()
  const hasUrlParams = Boolean(new URLSearchParams(location.search).get('step'))
  const [pageView, setPageView] = useState<PageView>(hasUrlParams ? 'workshop' : 'landing')
  const [curStep, setCurStep] = useState<StepKey>(INIT_STEP)
  const [messages, setMessages] = useState<Msg[]>(() => [{ role: 'ai', html: AI[INIT_STEP].greet }])

  // 首页 3D 前景展台与背景巨型半透明陶瓷同步引用
  const syncVaseRef = useRef<SyncVaseState>({ y: 0, tilt: 0.08, glaze: 'qing' })
  const [landingGlaze, setLandingGlaze] = useState<ShowcaseGlaze>('qing')

  // 统一 3D 瓷器控制状态 (唯一真理来源)
  const [activePreset, setActivePreset] = useState<PresetType>('meiping')
  const [activeMotif, setActiveMotif] = useState<MotifType>('lotus')
  const [activeGlaze, setActiveGlaze] = useState<GlazeType>('gloss')
  const [paintColor, setPaintColor] = useState<string>('#183e78')
  const [brushSize, setBrushSize] = useState<number>(10)
  const [isEraser, setIsEraser] = useState<boolean>(false)
  const [heightScale, setHeightScale] = useState<number>(1.0)
  const [rimScale, setRimScale] = useState<number>(1.0)
  const [bellyScale, setBellyScale] = useState<number>(1.0)
  const [measuredHeight, setMeasuredHeight] = useState<number>(30.8)
  const [measuredRim, setMeasuredRim] = useState<number>(9.6)
  const [glazeThickness, setGlazeThickness] = useState<number>(1.0)
  const [glazeGloss, setGlazeGloss] = useState<number>(0.85)
  const [firingTemp, setFiringTemp] = useState<number>(25)
  const [isFiringActive, setIsFiringActive] = useState<boolean>(false)

  const canvasRef = useRef<PotteryCanvasHandle>(null)

  function handleMeasurementsChange(h: number, r: number) {
    setMeasuredHeight(h)
    setMeasuredRim(r)
  }

  function enterWorkshop() {
    setPageView('workshop')
  }

  const [input, setInput] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)

  const showLeft = pageView === 'workshop'

  function toast(msg: string) {
    setToastMsg(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 1700)
  }

  function handleRemake(cfg: RemakeConfig) {
    setActivePreset(cfg.preset)
    setActiveMotif(cfg.motif)
    setCurStep(cfg.step)
    setActiveGlaze(cfg.glaze)
    setPageView('workshop')
    canvasRef.current?.loadPreset(cfg.preset)
    canvasRef.current?.applyMotif(cfg.motif)
    canvasRef.current?.setGlaze(cfg.glaze)
    toast(`已导入【${cfg.name}】真实 3D 模型！您可直接在左侧面板或陶轮上塑型修改。`)
  }

  function goStep(k: StepKey) {
    setCurStep(k)
    setMessages([{ role: 'ai', html: AI[k].greet }])
  }

  function ask(q: string) {
    const text = q.trim()
    if (!text) return
    setMessages((m) => [...m, { role: 'me', html: text }])
    setInput('')
    const reply = REPLY[text] ?? '（占位）AI 陶艺助手将在此给出景德镇工艺建议。'
    window.setTimeout(() => setMessages((m) => [...m, { role: 'ai', html: reply }]), 350)
  }

  /* ---- 顶栏流程导航 ---- */
  const idx = STEPS.findIndex((s) => s.key === curStep)
  const stepper = (
    <div className="stepper">
      {STEPS.map((s, i) => {
        const cls = i < idx ? 'done' : i === idx ? 'active' : ''
        return (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step ${cls}`} onClick={() => goStep(s.key)}>
              <span className="num">{i < idx ? '✓' : i + 1}</span>
              <span className="lab">{s.n}</span>
            </div>
            {i < STEPS.length - 1 && <span className="step-arrow" />}
          </span>
        )
      })}
    </div>
  )

  /* ---- 左侧统一工具台 ---- */
  const renderLeftStepContent = () => {
    switch (curStep) {
      case 'forming':
        return (
          <>
            <div className="tool-group">
              <div className="tool-glabel">经典器型骨架预设</div>
              <div className="preset-grid">
                {PRESET_LIST.map((p) => (
                  <div
                    key={p.id}
                    className={`preset-card ${activePreset === p.id ? 'sel' : ''}`}
                    onClick={() => {
                      setActivePreset(p.id)
                      canvasRef.current?.loadPreset(p.id)
                      toast(`已切换器型：${p.name}`)
                    }}
                  >
                    <div className="preset-name">{p.name}</div>
                    <div className="preset-desc">{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tool-group">
              <div className="tool-glabel">器坯尺寸微调 (拉坯)</div>
              <div className="slider-group">
                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-lbl">高度比例</span>
                    <span className="slider-val">{measuredHeight} cm</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="130"
                    value={Math.round(heightScale * 100)}
                    onChange={(e) => setHeightScale(Number(e.target.value) / 100)}
                  />
                </div>
                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-lbl">口径比例</span>
                    <span className="slider-val">{measuredRim} cm</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="150"
                    value={Math.round(rimScale * 100)}
                    onChange={(e) => setRimScale(Number(e.target.value) / 100)}
                  />
                </div>
                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-lbl">腹部弧度</span>
                    <span className="slider-val">{bellyScale > 1.15 ? '丰肩' : bellyScale < 0.88 ? '秀美' : '匀称'}</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="150"
                    value={Math.round(bellyScale * 100)}
                    onChange={(e) => setBellyScale(Number(e.target.value) / 100)}
                  />
                </div>
              </div>
            </div>

            <div className="tool-group">
              <div className="tool-glabel">生坯辅助操作</div>
              <button
                className="tool-btn"
                onClick={() => {
                  setHeightScale(1.0)
                  setRimScale(1.0)
                  setBellyScale(1.0)
                  canvasRef.current?.resetGeometry()
                  toast('已复位泥料原始形态与拉坯参数')
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                复位生坯尺寸
              </button>
            </div>

            <div className="left-cta-wrap">
              <button
                className="left-cta-btn primary"
                onClick={() => {
                  goStep('trim')
                  toast('生坯拉制完成，进入利坯修型！')
                }}
              >
                定坯完成，进入修型 →
              </button>
            </div>
          </>
        )

      case 'trim':
        return (
          <>
            <div className="tool-group">
              <div className="tool-glabel">利坯修型工艺动作</div>
              <button
                className="tool-btn"
                onClick={() => canvasRef.current?.smoothGeometry()}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                利坯匀壁 (平顺微小凹凸)
              </button>
              <button
                className="tool-btn"
                onClick={() => canvasRef.current?.trimFoot()}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                修整圈足 (挖足平正底立墙)
              </button>
              <button
                className="tool-btn"
                onClick={() => toast('利坯检测：瓶腹厚度 4.8mm，圈足立墙挺拔，旋转同心度 99.6%')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                壁厚与同心度校验
              </button>
            </div>

            <div className="tool-group">
              <div className="tool-glabel">器身精修微调</div>
              <div className="slider-group">
                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-lbl">高度精调</span>
                    <span className="slider-val">{measuredHeight} cm</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="130"
                    value={Math.round(heightScale * 100)}
                    onChange={(e) => setHeightScale(Number(e.target.value) / 100)}
                  />
                </div>
                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-lbl">口沿厚薄</span>
                    <span className="slider-val">{measuredRim} cm</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="150"
                    value={Math.round(rimScale * 100)}
                    onChange={(e) => setRimScale(Number(e.target.value) / 100)}
                  />
                </div>
                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-lbl">腹壁曲线</span>
                    <span className="slider-val">{bellyScale > 1.15 ? '丰肩' : bellyScale < 0.88 ? '秀美' : '匀称'}</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="150"
                    value={Math.round(bellyScale * 100)}
                    onChange={(e) => setBellyScale(Number(e.target.value) / 100)}
                  />
                </div>
              </div>
            </div>

            <div className="left-cta-wrap">
              <button
                className="left-cta-btn primary"
                onClick={() => {
                  goStep('pattern')
                  toast('修型完成，进入纹样绘制工序！')
                }}
              >
                修型完成，进入纹样 →
              </button>
            </div>
          </>
        )

      case 'pattern':
        return (
          <>
            <div className="tool-group">
              <div className="tool-glabel">传统纹样贴图</div>
              <div className="motif-list">
                {MOTIF_LIST.map((m) => (
                  <div
                    key={m.id}
                    className={`tool ${activeMotif === m.id ? 'sel' : ''}`}
                    onClick={() => {
                      setActiveMotif(m.id)
                      canvasRef.current?.applyMotif(m.id)
                      toast(`已应用纹饰：${m.name}`)
                    }}
                  >
                    <div className="motif-tag">{m.tag}</div>
                    <div className="ti">
                      <div className="n">{m.name}</div>
                      <div className="d">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tool-group">
              <div className="tool-glabel">矿物颜料调色盘 (3D 手绘)</div>
              <div className="palette-strip-left">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    className={`palette-dot ${paintColor === c.hex && !isEraser ? 'selected' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    title={`${c.name} (${c.desc})`}
                    onClick={() => {
                      setPaintColor(c.hex)
                      setIsEraser(false)
                      toast(`已选矿物颜料：${c.name} (${c.desc})，可在 3D 瓶身涂画`)
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="tool-group">
              <div className="tool-glabel">毛笔笔触与工具</div>
              <div className="brush-chips">
                <button
                  className={`brush-chip ${brushSize === 4 && !isEraser ? 'active' : ''}`}
                  onClick={() => { setBrushSize(4); setIsEraser(false); toast('毛笔：细勾线 (4px)') }}
                >
                  细勾线 4px
                </button>
                <button
                  className={`brush-chip ${brushSize === 10 && !isEraser ? 'active' : ''}`}
                  onClick={() => { setBrushSize(10); setIsEraser(false); toast('毛笔：中楷描绘 (10px)') }}
                >
                  中楷 10px
                </button>
                <button
                  className={`brush-chip ${brushSize === 24 && !isEraser ? 'active' : ''}`}
                  onClick={() => { setBrushSize(24); setIsEraser(false); toast('毛笔：分水染料 (24px)') }}
                >
                  分水染 24px
                </button>
              </div>
              <div className="brush-actions">
                <button
                  className={`tool-btn-sm ${isEraser ? 'active' : ''}`}
                  onClick={() => {
                    setIsEraser(!isEraser)
                    toast(isEraser ? '已切换回彩绘毛笔' : '已切换为白瓷橡皮擦')
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z" />
                  </svg>
                  {isEraser ? '使用中：橡皮擦' : '橡皮擦'}
                </button>
                <button
                  className="tool-btn-sm"
                  onClick={() => {
                    canvasRef.current?.clearCanvas()
                    setActiveMotif('blank')
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  清空画板
                </button>
              </div>
            </div>

            <div className="tool-group">
              <div className="tool-glabel">AI 智能辅助</div>
              <button
                className="tool-btn ai-btn"
                onClick={() => {
                  canvasRef.current?.aiComposePattern()
                  setActiveMotif('lotus')
                  setMessages((m) => [
                    ...m,
                    {
                      role: 'ai',
                      html: '✦ <b>AI 构图已完成</b>：已在瓶身绘出景德镇经典的<b>如意云头纹肩饰</b>与<b>缠枝宝相花主纹</b>，线条严整对称，留白疏密有致。您可在此基础上继续使用矿物颜料着色点缀。',
                    },
                  ])
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                AI 智能对称构图 (御窑缠枝莲)
              </button>
            </div>

            <div className="left-cta-wrap">
              <button
                className="left-cta-btn primary"
                onClick={() => {
                  goStep('glaze')
                  toast('纹饰确认，进入施透明罩釉工序！')
                }}
              >
                确认纹样，进入上釉 →
              </button>
            </div>
          </>
        )

      case 'glaze':
        return (
          <>
            <div className="tool-group">
              <div className="tool-glabel">透明罩釉质感 (不改变底色)</div>
              {GLAZE_LIST.map((g) => (
                <div
                  key={g.id}
                  className={`tool ${activeGlaze === g.id ? 'sel' : ''}`}
                  onClick={() => {
                    setActiveGlaze(g.id)
                    canvasRef.current?.setGlaze(g.id)
                    toast(`已施【${g.name}】：底色彩绘完好保留，仅变换釉面反光与质感！`)
                  }}
                >
                  <div className={`sw ${g.sw}`} />
                  <div className="ti">
                    <div className="n">{g.name}</div>
                    <div className="d">{g.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="tool-group">
              <div className="tool-glabel">釉层物理参数微调</div>
              <div className="slider-group">
                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-lbl">施釉厚度</span>
                    <span className="slider-val">{glazeThickness.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={Math.round(glazeThickness * 10)}
                    onChange={(e) => setGlazeThickness(Number(e.target.value) / 10)}
                  />
                </div>
                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-lbl">釉面光泽度</span>
                    <span className="slider-val">{Math.round(glazeGloss * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round(glazeGloss * 100)}
                    onChange={(e) => setGlazeGloss(Number(e.target.value) / 100)}
                  />
                </div>
              </div>
            </div>

            <div className="left-cta-wrap">
              <button
                className="left-cta-btn primary"
                onClick={() => {
                  goStep('fire')
                  toast('施釉完成，入柴窑点火烧制！')
                }}
              >
                施釉完成，入窑烧制 →
              </button>
            </div>
          </>
        )

      case 'fire':
        return (
          <>
            <div className="tool-group">
              <div className="tool-glabel">柴窑状态与窑温仪表</div>
              <div className="kiln-gauge-card">
                <div className="gauge-val-wrap">
                  <span className="gauge-val">{firingTemp}</span>
                  <span className="gauge-unit">°C</span>
                </div>
                <div className="gauge-bar-bg">
                  <div
                    className="gauge-bar-fill"
                    style={{ width: `${Math.min(100, Math.max(0, ((firingTemp - 25) / (1280 - 25)) * 100))}%` }}
                  />
                </div>
                <div className="gauge-stage-desc">
                  {firingTemp < 500
                    ? '① 慢火排湿阶段 (去水分)'
                    : firingTemp < 1050
                    ? '② 强还原气氛阶段 (一氧化碳还原铜铁)'
                    : firingTemp < 1280
                    ? '③ 高温玻化阶段 (釉层熔融平滑)'
                    : '④ 1280°C 熔融成瓷，进入冷却！'}
                </div>
              </div>
            </div>

            <div className="tool-group">
              <div className="tool-glabel">点火升温控制</div>
              <button
                className={`left-cta-btn ${isFiringActive ? '' : 'fire-btn'}`}
                onClick={() => canvasRef.current?.triggerFiring()}
                disabled={isFiringActive}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s3 1 4 4c0-3 0-6 0-10z" />
                </svg>
                {isFiringActive ? '烧制中… 柴窑还原焰正烈' : '点火升温 (1280°C)'}
              </button>
            </div>

            <div className="left-cta-wrap">
              <button
                className="left-cta-btn primary"
                onClick={() => {
                  goStep('finish')
                  toast('开窑成瓷！查看 3D 成品与数字身份证')
                }}
              >
                开窑检视成瓷 →
              </button>
            </div>
          </>
        )

      case 'finish':
        return (
          <>
            <div className="tool-group">
              <div className="tool-glabel">数字瓷器档案著录</div>
              <div className="cert-card-left">
                <div className="cert-header">
                  <span className="cert-title">数字瓷器档案</span>
                  <div className="cert-seal">御</div>
                </div>
                <div className="cert-row"><span className="k">编号</span><span className="v">JDZ-2026-0427</span></div>
                <div className="cert-row"><span className="k">器型</span><span className="v">{PRESET_LIST.find(p => p.id === activePreset)?.name ?? '青花梅瓶'}</span></div>
                <div className="cert-row"><span className="k">尺寸</span><span className="v">H {measuredHeight}cm · ⌀{measuredRim}cm</span></div>
                <div className="cert-row"><span className="k">釉色</span><span className="v">{GLAZE_LIST.find(g => g.id === activeGlaze)?.name ?? '亮光透明釉'}</span></div>
                <div className="cert-row"><span className="k">窑口</span><span className="v">景德镇御窑厂遗址</span></div>
                <div className="cert-row"><span className="k">烧制</span><span className="v">1280°C 柴窑还原焰</span></div>
              </div>
            </div>

            <div className="tool-group">
              <div className="tool-glabel">数字资产导出</div>
              <button className="tool-btn primary-action" onClick={() => canvasRef.current?.exportGLB()}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                导出 3D 模型 (.glb)
              </button>
              <button className="tool-btn" onClick={() => canvasRef.current?.exportCert()}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="10" r="2" />
                  <path d="M14 9h4M14 13h4M6 15h12" />
                </svg>
                数字身份证 (PDF)
              </button>
              <button className="tool-btn" onClick={() => canvasRef.current?.exportPoster()}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 15l5-5 4 4 3-3 6 6" />
                </svg>
                高清展陈海报 (PDF)
              </button>
            </div>

            <div className="left-cta-wrap">
              <button
                className="left-cta-btn"
                onClick={() => {
                  goStep('forming')
                  toast('重开陶轮，制作新瓷器！')
                }}
              >
                重开陶轮 · 制作新器
              </button>
            </div>
          </>
        )
    }
  }

  const leftHeadTitles: Record<StepKey, { title: string; sub: string }> = {
    forming: { title: '制坯工序 · 定型拉坯', sub: '陶轮定骨架，支持选择器型预设与尺寸微调' },
    trim: { title: '修型工序 · 利坯修足', sub: '刮削泥屑，校准器壁厚度与规整圈足' },
    pattern: { title: '纹样工序 · 装饰彩绘', sub: '选择传统纹饰，或使用 7 色矿物颜料 3D 手绘' },
    glaze: { title: '上釉工序 · 施透明罩釉', sub: '施透明琉璃罩釉（底色彩绘完整保留，仅变质感反光）' },
    fire: { title: '烧制工序 · 柴窑入火', sub: '柴窑高温 1280°C 还原气氛，熔融定色' },
    finish: { title: '成品检视 · 著录展陈', sub: '360° 检视成瓷，导出 3D 模型与中文证书海报' },
  }

  const leftTools = (
    <div className="leftbar-inner">
      <div className="left-head">
        <div className="left-title">
          <span className="dot" />
          {leftHeadTitles[curStep].title}
        </div>
        <div className="left-sub">{leftHeadTitles[curStep].sub}</div>
      </div>
      <div className="left-scroll">
        {renderLeftStepContent()}
      </div>
    </div>
  )

  /* ---- 中央舞台 ---- */
  const cur = STEPS[idx]
  const stage = (
    <div className="stage">
      <div className="stage-glow" />
      <div className="step-title">
        <div className="st-k">{cur.k}</div>
        <div className="st-n">{cur.n}</div>
        <div className="st-d">{cur.d}</div>
      </div>
      <div className="wheel-stage" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <PotteryCanvas
          ref={canvasRef}
          step={curStep}
          activePreset={activePreset}
          activeMotif={activeMotif}
          activeGlaze={activeGlaze}
          heightScale={heightScale}
          rimScale={rimScale}
          bellyScale={bellyScale}
          glazeThickness={glazeThickness}
          glazeGloss={glazeGloss}
          paintColor={paintColor}
          brushSize={brushSize}
          isEraser={isEraser}
          onMeasurementsChange={handleMeasurementsChange}
          onFiringProgress={(temp, isFiring) => {
            setFiringTemp(temp)
            setIsFiringActive(isFiring)
          }}
          onToast={toast}
        />
      </div>
    </div>
  )

  /* ---- 右侧 AI 助手 ---- */
  const ai = AI[curStep]
  const aiPanel = (
    <div className="aipanel">
      <div className="ai-head">
        <div className="ai-it">
          <div className="n">AI 陶艺助手</div>
          <div className="s"><span className="d" />在线 · 景德镇工艺模型</div>
        </div>
        <div className="ai-step-tag">{ai.tag}</div>
      </div>
      <div className="ai-body">
        {messages.map((m, i) => (
          <div className={`msg ${m.role}`} key={i}>
            <div className="b" dangerouslySetInnerHTML={{ __html: m.html }} />
          </div>
        ))}
        <div className="ai-quick">
          <div className="qh">快捷提问</div>
          {ai.quick.map((q) => (
            <span className="qchip" key={q} onClick={() => ask(q)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: CHAT_ICON }} />
              {q}
            </span>
          ))}
        </div>
        <div className="ai-suggest">
          <div className="sh">✦ 建议入口</div>
          {ai.sugg.map((s) => (
            <div className="sug" key={s.t} onClick={() => toast('打开：' + s.t + '（占位）')}>
              <div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: SUG_ICONS[s.ic] ?? SUG_ICONS.v }} /></div>
              <div className="st"><div className="t">{s.t}</div><div className="d">{s.d}</div></div>
              <div className="arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}><path d="M9 18l6-6-6-6" /></svg></div>
            </div>
          ))}
        </div>
      </div>
      <div className="ai-input">
        <input
          className="box"
          value={input}
          placeholder="向陶艺助手提问…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') ask(input) }}
        />
        <button className="send" onClick={() => ask(input)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: SEND_ICON }} />
        </button>
      </div>
    </div>
  )

  /* ====================== 页面分支 ====================== */
  if (pageView === 'craft') {
    return (
      <CraftGuidePage
        onBack={() => setPageView('landing')}
        onEnterWorkshop={(step) => {
          if (step) goStep(step)
          setPageView('workshop')
        }}
      />
    )
  }

  if (pageView === 'gallery') {
    return (
      <GalleryPage
        onBack={() => setPageView('landing')}
        onRemake={handleRemake}
        onEnterWorkshop={() => setPageView('workshop')}
      />
    )
  }

  if (pageView === 'landing') {
    return (
      <div className="landing-root">
        {/* 窑火光晕底色与动态光焰层 */}
        <div className="landing-bg">
          <div className="landing-fire-glow" />
          <div className="landing-sparks-layer" />
        </div>

        {/* 首页背景：与前台完全同步旋转的巨型半透明 3D 陶瓷 */}
        <LandingBgPorcelain3D
          syncVaseRef={syncVaseRef}
          currentGlaze={landingGlaze}
        />

        <div className="landing-wrap">
          <div className="landing-left">
            <div className="landing-kicker">景德镇陶瓷数字工坊 · 数字孪生</div>
            <h1 className="landing-title">
              千年窑火<br />
              <span className="landing-accent">数字永续</span>
            </h1>
            <p className="landing-desc">
              从一捧瓷土到一方青花，AI 辅助制坯、纹样、施釉与烧制的完整流程，<br />
              让传统柴窑工艺在数字空间中获得永续生命。
            </p>
            <div className="landing-actions">
              <button className="btn-primary" onClick={enterWorkshop}>
                <span>进入工坊</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <button className="btn-secondary" onClick={() => setPageView('craft')}>
                <span>了解工艺</span>
              </button>
              <button className="btn-secondary" onClick={() => setPageView('gallery')}>
                <span>案例欣赏</span>
              </button>
            </div>
          </div>

          <div className="landing-right">
            <LandingPorcelain3D
              onEnterWorkshop={enterWorkshop}
              syncVaseRef={syncVaseRef}
              onGlazeChange={setLandingGlaze}
              selectedGlaze={landingGlaze}
            />
          </div>
        </div>
      </div>
    )
  }

  /* ---- 渲染工坊模式 ---- */
  return (
    <div className={`app${showLeft ? ' show-left' : ''}`}>
      <div className="bg-texture" />
      <nav className="topnav">
        <div
          className="brand"
          onClick={() => setPageView('landing')}
          style={{ cursor: 'pointer' }}
          title="点击返回首页"
        >
          <div className="brand-text">
            <div className="brand-name">数字景德镇陶艺工坊</div>
            <div className="brand-sub">Jingdezhen · Digital Kiln</div>
          </div>
        </div>
        {stepper}
        <div className="top-chips">
          <div className="tchip" onClick={() => setPageView('landing')} title="返回首页" style={{ cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <b>返回首页</b>
          </div>
          <div className="tchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></svg>窑口 <b>御窑厂</b></div>
          <div className="tchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>工艺 <b>手工拉坯</b></div>
        </div>
      </nav>
      <aside className="leftbar">{showLeft && leftTools}</aside>
      <main className="center">{stage}</main>
      {aiPanel}
      <footer className="footbar">
        <div className="fl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /></svg>项目：青花缠枝莲纹梅瓶</div>
        <div className="fl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>自动保存 <span className="ok">已同步</span></div>
        <div className="spacer" />
        <div className="fl">数字景德镇 · 陶瓷工艺数字孪生 v0.9</div>
      </footer>
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}
