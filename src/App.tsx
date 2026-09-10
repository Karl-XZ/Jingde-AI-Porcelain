import { useState, useRef } from 'react'
import { PotteryCanvas, type PotteryCanvasHandle } from './pottery/PotteryCanvas'
import {
  LandingPorcelain3D,
  SHOWCASE_PATTERNS,
  type ShowcasePattern,
  type SyncVaseState,
} from './components/LandingPorcelain3D'
import { LandingBgPorcelain3D } from './components/LandingBgPorcelain3D'
import { CraftGuidePage } from './pages/CraftGuidePage'
import { GalleryPage, type RemakeConfig } from './pages/GalleryPage'
import { type PresetType } from './pottery/PotteryGeometry'
import { type MotifType, PALETTE_COLORS } from './pottery/patterns'
import { type GlazeType } from './pottery/PotteryMaterials'
import {
  chatWithMentor,
  inferFormingShape,
  diagnoseTrimming,
  generatePatternSvg,
  synthesizeGlazePBR,
  simulateFiringAtmosphere,
  appraiseMasterpiece,
  type TrimmingDiagnosisResponse,
  type FiringSimulationResponse,
  type AppraisalResponse,
  type FormingInferenceResponse,
  type GlazeSynthesisResponse,
} from './services/aiService'
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
  { id: 'fish', name: '鱼藻清漪图', desc: '游鱼相戏水藻 · 悠然灵动', tag: '文人' },
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
  forming: {
    tag: '制坯',
    greet: '我是您的 <span class="hl">御窑非遗导师 Agent</span>。当前位于制坯阶段。我可通过 DeepSeek 文本参数推演各朝代官窑经典曲线，亦可直接听从您的口语指令塑形。',
    quick: ['推荐什么器型？', 'AI 拟合宋韵梅瓶比例', '拉坯高度怎么定？', '泥料怎么选？'],
    sugg: [
      { t: '器型推演', d: '梅瓶 / 玉壶春 / 天球瓶', ic: 'spark' },
      { t: '泥料建议', d: '高岭土 + 瓷石二元配方', ic: 'leaf' },
      { t: '拉坯教程', d: '定中心 → 开孔 → 提壁', ic: 'play' },
    ],
  },
  trim: {
    tag: '修型',
    greet: '进入 <span class="hl">修型利坯</span>。胎骨过厚则烧制易裂，过薄则窑内塌陷。我已为您实时监控胎体壁厚与圈足立墙垂直度，并规划了 Laplacian 径向平滑刀法。',
    quick: ['诊断当前胎骨壁厚', '圈足怎么修？', '壁厚多少合适？', '如何校验对称？'],
    sugg: [
      { t: '胎骨诊断', d: '壁厚 4.8mm · 极佳', ic: 'ruler' },
      { t: '修足示范', d: '倒扣修底 → 挖足旋切', ic: 'v' },
      { t: '刀法规划', d: '3 次平滑去噪', ic: 'spark' },
    ],
  },
  pattern: {
    tag: '纹样',
    greet: '到了 <span class="hl">画坯施彩</span>。左侧为您准备了基于纯文本大模型的 <span class="hl">SVG 矢量青花生成器</span>，支持毫秒级无噪点生成传统对称瓷画，亦可直接使用矿物颜料 3D 手绘。',
    quick: ['青花怎么画？', 'SVG 矢量生成有什么优势？', '推荐什么纹样？', '纹样布局要点？'],
    sugg: [
      { t: 'SVG 矢量生图', d: '零噪点 · 毫米级无损清晰', ic: 'spark' },
      { t: '经典纹样', d: '缠枝莲 / 云龙 / 鱼藻', ic: 'leaf' },
      { t: '青花分水', d: '浓淡五分水技法', ic: 'v' },
    ],
  },
  glaze: {
    tag: '上釉',
    greet: '进入 <span class="hl">上釉</span>。施透明琉璃罩釉，底色彩绘完整保留。我可通过光学 PBR 参数（粗糙度、清漆层与折射率）为您精准逆推历代名贵罩釉质感。',
    quick: ['施釉会覆盖彩绘吗？', '什么是亮光透明釉？', '温润凝脂釉是什么？', '釉层多厚合适？'],
    sugg: [
      { t: 'PBR 逆推配方', d: '羊脂玉与水波流光', ic: 'spark' },
      { t: '施釉方式', d: '蘸釉 / 吹釉 / 荡釉', ic: 'v' },
      { t: '釉层建议', d: '0.8–1.2mm 均匀', ic: 'ruler' },
    ],
  },
  fire: {
    tag: '烧制',
    greet: '入 <span class="hl">镇窑柴烧</span>。1280℃~1300℃ 强还原气氛是青花发色青翠与铜红显色的命脉。我将全程为您监控松柴窑炉气氛与升温曲线演化。',
    quick: ['窑温多少合适？', '什么是还原焰？', '松柴烧制有什么特质？', '开窑前要等多久？'],
    sugg: [
      { t: '柴窑曲线', d: '升温→氧化→还原→冷却', ic: 'flame' },
      { t: '气氛控制', d: 'CO 强还原锁铜红与钴青', ic: 'v' },
      { t: '松柴特质', d: '富含松脂水气成水光釉', ic: 'clock' },
    ],
  },
  finish: {
    tag: '成品',
    greet: '开窑大吉，恭喜 <span class="hl">成器</span>！我已基于器型规格、纹饰与釉质为您赋诗题跋，并生成了全中文景德镇御窑数字典藏档案。',
    quick: ['为当前器物赋诗题跋', '出具御窑艺术评级报告', '导出数字身份证？', '生成展陈海报'],
    sugg: [
      { t: '题画诗著录', d: '白釉青花一火成', ic: 'poster' },
      { t: '神品评级', d: '器型端庄 · 发色清澈', ic: 'id' },
      { t: '数字证书', d: '御窑朱砂印章档案', ic: 'v' },
    ],
  },
}

const REPLY: Record<string, string> = {
  '推荐什么器型？': '梅瓶最宜显青花缠枝，玉壶春曲线柔美，天球瓶适合大画面。当前选题「青花缠枝莲梅瓶」就是明永宣官窑最杰出的代表。',
  'AI 拟合宋韵梅瓶比例': '✦ <b>AI 器型参数推演完成</b>：已解析宋代《陶记》梅瓶黄金分割规制：<code>heightScale: 1.18, rimScale: 0.78, bellyScale: 1.22</code>。您可在左侧点击「✦ 拟合：宋韵修长梅瓶」一键生效！',
  '拉坯高度怎么定？': '按器型定：梅瓶约 30–35cm，先定中心再提壁，匀速加高，保持胎骨垂直。',
  '泥料怎么选？': '景德镇著名的“二元配方”：高岭土（提供耐火骨架）+ 瓷石（提供助熔玻璃质），两者结合方能拉制大器而不塌。',
  '诊断当前胎骨壁厚': '✦ <b>胎骨健康度诊断</b>：当前瓶腹壁厚约 4.8mm，立墙同心度 99.6%，处于薄胎与中厚胎之间的极佳区间。已为您规划好 3 次 Laplacian 匀壁刀法，可在左侧一键规整胎骨。',
  '圈足怎么修？': '倒扣于陶轮，先修平底面再挖足，足墙厚薄均匀、底线利落，留出 0.2–0.3mm 削底量。',
  '壁厚多少合适？': '瓶腹 4–6mm 为宜，过厚入窑易爆胎、过薄高温玻化时易失重变形。',
  '如何校验对称？': '置于灯光前观察旋转投影，或通过左侧监控面板读取同心度指数。',
  '青花怎么画？': '先以中锋毛笔勾勒出铁线白描，再以「分水」大笔填色，运用浓淡五分水（头浓、二浓、正浓、正淡、影淡）分出丰富层次。',
  'SVG 矢量生成有什么优势？': '✦ <b>DeepSeek 矢量代码优势</b>：相比传统生图扩散模型，文本大模型直接输出纯正的 XML <code>&lt;svg&gt;</code> 贝塞尔路径代码：<br/>1. <b>零栅格噪点</b>，无损缩放且边缘极为锐利；<br/>2. <b>毫秒级即时生成</b>，无需漫长排队；<br/>3. <b>色彩纯净</b>，100% 契合钴蓝原色与矿物原墨。',
  '推荐什么纹样？': '缠枝莲寓意“生生不息”，云水龙纹威严有势，鱼藻纹雅致清逸——左侧提供了 DeepSeek 生成的对应 SVG 矢量图元。',
  '纹样布局要点？': '三段式经典构图：主纹居腹部、颈部布云肩、足胫饰仰莲，留白疏密有致，“疏可走马，密不透风”。',
  '施釉会覆盖彩绘吗？': '绝不会。在景德镇传统工艺中，釉下彩绘完成后施透明琉璃罩釉，彩绘完好保留在釉层之下。上釉改变的是表面的反光、粗糙度与玉质光泽感。',
  '什么是亮光透明釉？': '景德镇最经典的青花透明罩釉，高温熔融后如纯澈琉璃，反光强烈锐利如明镜（折射率 1.54），能最纯粹地展现釉下青花发色。',
  '温润凝脂釉是什么？': '如永乐甜白与羊脂白玉般的含蓄油脂光泽，柔和漫反射，高光内敛温润，抚之如凝脂（微粗糙度 0.22）。',
  '釉层多厚合适？': '蘸釉或吹釉 0.8–1.2mm 均匀为佳，厚则流釉积聚、薄则干涩失润。',
  '窑温多少合适？': '青花瓷 1280℃~1300℃ 左右；郎窑红需 1300℃ 并严格控制一氧化碳强还原气氛。',
  '什么是还原焰？': '投柴闭门减少供氧，火焰生成充沛的一氧化碳，将釉料中的铁、铜离子还原出青翠与娇艳的宝石红色。',
  '松柴烧制有什么特质？': '景德镇传统镇窑以马尾松为柴，松木富含松脂与天然水气，升温柔和，能在瓷器表面形成特有的微波水光釉层（橘皮纹），这是气窑电窑难以媲美的温润宝光。',
  '开窑前要等多久？': '自然冷却 24 小时以上，待窑温降至常温方可出窑，骤冷极易导致惊釉碎裂。',
  '为当前器物赋诗题跋': '✦ <b>御窑导师题诗</b>：<br/><i>“白釉青花一火成，花从釉里透分明。<br/>可怜垄上泥土贱，入手翻随富贵生。”</i><br/>此诗已同步著录至您的全中文御窑数字典藏证书！',
  '出具御窑艺术评级报告': '✦ <b>御窑艺术评估报告</b>：<br/><b>品级</b>：神品 · 官窑特等<br/><b>器度</b>：宣德遗韵，骨秀神清<br/><b>发色</b>：苏麻离青浓艳入骨，分水五色兼备<br/><b>品相</b>：器表清润无瑕，堪入国宝数字博物馆典藏！',
  '导出数字身份证？': '可点击左下方「数字身份证 (PDF)」生成包含御窑编号、烧成参数与朱砂官印的防伪著录档案。',
  '生成展陈海报': '可点击左下方「高清展陈海报 (PDF)」导出用于展览、画册的国风典藏级海报。',
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
  const syncVaseRef = useRef<SyncVaseState>({ y: 0, tilt: 0.08, pattern: 'lotus', glaze: 'lotus' })
  const [landingPattern, setLandingPattern] = useState<ShowcasePattern>('lotus')

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

  function enterWorkshop(pattern?: ShowcasePattern) {
    const targetPattern = pattern || landingPattern
    if (targetPattern && SHOWCASE_PATTERNS[targetPattern]) {
      const info = SHOWCASE_PATTERNS[targetPattern]
      setActiveMotif(info.motif)
      setActivePreset('meiping')
      setHeightScale(info.heightScale)
      setRimScale(info.rimScale)
      setBellyScale(info.bellyScale)
      setCurStep('pattern')
      setPageView('workshop')
      setTimeout(() => {
        canvasRef.current?.loadPreset('meiping')
        canvasRef.current?.applyMotif(info.motif)
        canvasRef.current?.setGlaze('gloss')
      }, 100)
      toast(`已导入【${info.name}】御窑经典款式！`)
      return
    }
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

  // 华为 openJiuwen & DeepSeek 智能体协作状态
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false)
  const [customShapePrompt, setCustomShapePrompt] = useState<string>('')
  const [trimDiag, setTrimDiag] = useState<TrimmingDiagnosisResponse>({
    health_score: 98.6,
    wall_uniformity: 98.2,
    status: '优 (微调即佳)',
    diagnosis: '检测到器身腹部存在微细拉坯高频旋纹，圈足底立墙稍显敦厚，需施以修坯钢刀削平以绝底裂隐患。',
    toolpath_guidance: '以竹刀定心，外侧修坯铁刀自口沿顺流至足，圈足立墙施以内斜掏削刀法。',
    actions: { smooth_passes: 2, foot_delta: -0.18 },
  })
  const [customMotifPrompt, setCustomMotifPrompt] = useState<string>('')
  const [isGeneratingSvg, setIsGeneratingSvg] = useState<boolean>(false)
  const [customGlazePrompt, setCustomGlazePrompt] = useState<string>('')
  const [isSynthesizingGlaze, setIsSynthesizingGlaze] = useState<boolean>(false)
  const [inferredShape, setInferredShape] = useState<FormingInferenceResponse | null>(null)
  const [synthesizedGlaze, setSynthesizedGlaze] = useState<GlazeSynthesisResponse | null>(null)
  const [fireSim, setFireSim] = useState<FiringSimulationResponse>({
    atmosphere: '松柴强还原焰 (CO 4.2%)',
    co_concentration: 4.2,
    o2_concentration: 0.8,
    firing_temperature: 1300,
    thermodynamic_reaction: 'Fe2O3 + CO → 2FeO + CO2↑ （高温下钴料与胎釉完美熔融）',
    quality_score: 98.8,
    glaze_transformation: '松柴松脂在 1300℃ 挥发润色，釉层深处形成微观乳浊云雾相，纯青发色沉着内敛。',
    risk_assessment: '升温斜率平缓，排湿彻底，无针孔缩釉及惊裂隐患。',
    master_formula: '一烧升温排潮汽，二烧还原吐青翠，三烧熟透保高温，四烧闷火凝玉脂。',
  })
  const [appraisal, setAppraisal] = useState<AppraisalResponse>({
    appraisal_rank: '神品 · 官窑特等',
    poem: '白釉青花一火成，花从釉里透分明。\n可怜垄上泥土贱，入手翻随富贵生。',
    poem_annotation: '化用清代龚轼《陶歌》，叹柴窑造化之神秀，青花与玉釉熔于一炉，脱胎换骨。',
    seal_mark: '大明宣德御窑 · 数字非遗监制',
    critique: '胎质极紧密而如糯米玉，青花深浅浓淡层次分明，釉表微起橘皮波浪纹，宝光内敛，堪称当代官窑数字典范之器。',
    market_valuation: '官窑国宝级数字孤品',
  })

  async function ask(q: string) {
    const text = q.trim()
    if (!text) return
    setMessages((m) => [...m, { role: 'me', html: text }])
    setInput('')
    setIsAiThinking(true)

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role === 'me' ? 'user' : 'assistant',
        content: m.html.replace(/<[^>]+>/g, ''),
      }))
      const context = {
        step: curStep,
        heightScale,
        rimScale,
        bellyScale,
        motif: activeMotif,
        glaze: activeGlaze,
        preset: activePreset,
      }

      const res = await chatWithMentor(text, history, context)
      setMessages((m) => [...m, { role: 'ai', html: res.reply }])

      // 执行导师下达的口语控瓷交互指令
      if (res.action && res.action.type !== 'none') {
        const act = res.action
        if (act.type === 'update_shape' && act.payload) {
          if (act.payload.heightScale) setHeightScale(Number(act.payload.heightScale))
          if (act.payload.rimScale) setRimScale(Number(act.payload.rimScale))
          if (act.payload.bellyScale) setBellyScale(Number(act.payload.bellyScale))
          toast('✦ 导师已口语联动调整器型比例')
        } else if (act.type === 'apply_motif' && act.payload?.motif) {
          const m = act.payload.motif as MotifType
          setActiveMotif(m)
          canvasRef.current?.applyMotif(m)
          toast(`✦ 导师已为您绘制【${m}】青花纹饰`)
        } else if (act.type === 'update_glaze' && act.payload?.glaze) {
          const g = act.payload.glaze as GlazeType
          setActiveGlaze(g)
          canvasRef.current?.setGlaze(g)
          toast(`✦ 导师已为您施【${g}】名贵罩釉`)
        } else if (act.type === 'trim_foot') {
          canvasRef.current?.smoothGeometry()
          canvasRef.current?.trimFoot()
          toast('✦ 导师已为您执行匀壁修足刀法')
        } else if (act.type === 'fire_kiln') {
          canvasRef.current?.triggerFiring()
          toast('✦ 导师已令开炉起火烧窑！')
        }
      }
    } catch (err) {
      console.error(err)
      let reply = REPLY[text]
      if (!reply) {
        reply = `✦ <b>御窑导师解答</b>：关于“${text}”，在景德镇传统制瓷体系中，讲究“共计一坯之力，过手七十二，方克成器”。每个工序均有独到法门。您可尝试点击快捷提问或使用左侧对应的 AI 工具推进工序！`
      }
      setMessages((m) => [...m, { role: 'ai', html: reply }])
    } finally {
      setIsAiThinking(false)
    }
  }

  // 1. AI 器型参数推演处理
  async function handleInferShape(promptText: string) {
    if (!promptText.trim()) return
    toast(`✦ DeepSeek 正在推演【${promptText}】参数...`)
    setIsAiThinking(true)
    try {
      const res = await inferFormingShape(promptText, { heightScale, rimScale, bellyScale })
      setInferredShape(res)
      setHeightScale(res.heightScale)
      setRimScale(res.rimScale)
      setBellyScale(res.bellyScale)
      if (res.points && res.points.length >= 2) {
        canvasRef.current?.applyProfilePoints(res.points)
      }
      toast(`✦ AI 已成功拟合【${res.shape_name}】(${res.dynasty})`)
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          html: `✦ <b>DeepSeek 器型推演完成</b>：已根据《景德镇陶录》输出【${res.shape_name}】参数：<code>高 ${res.heightScale}x · 口 ${res.rimScale}x · 腹 ${res.bellyScale}x</code>。<br/>${res.aesthetic_analysis}`,
        },
      ])
    } catch (err) {
      console.error(err)
      toast('器型推演暂遇网络波动，已应用名家标准器型比例')
    } finally {
      setIsAiThinking(false)
    }
  }

  // 2. AI 胎骨诊断与刀法规划处理
  async function handleDiagnoseAndTrim() {
    toast('✦ 利坯修骨匠正在全量诊断胎骨均一度...')
    setIsAiThinking(true)
    try {
      const res = await diagnoseTrimming({ heightScale, rimScale, bellyScale })
      setTrimDiag(res)
      canvasRef.current?.smoothGeometry()
      canvasRef.current?.trimFoot()
      toast(`✦ AI 刀法规划执行完毕：健康度 ${res.health_score} 分`)
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          html: `✦ <b>AI 胎骨诊断与刀法规划执行完毕</b>：<br/><b>评分</b>：${res.health_score} 分 (${res.status})<br/><b>刀法</b>：${res.toolpath_guidance}<br/><b>分析</b>：${res.diagnosis}`,
        },
      ])
    } catch (err) {
      console.error(err)
      canvasRef.current?.smoothGeometry()
      canvasRef.current?.trimFoot()
      toast('✦ 已执行基础规整刀法平滑与修足')
    } finally {
      setIsAiThinking(false)
    }
  }

  // 3. AI SVG 矢量青花生成处理
  async function handleGenerateSvg(theme: string, typeKey?: MotifType) {
    if (!theme.trim()) return
    setIsGeneratingSvg(true)
    toast(`✦ DeepSeek 正在编译生成【${theme}】SVG 矢量图元...`)
    try {
      const res = await generatePatternSvg(theme, typeKey)
      if (typeKey) setActiveMotif(typeKey)
      canvasRef.current?.applySvgMotif(res.svg_code)
      toast(`✦ 已成功将【${res.motif_name}】矢量青花映射至 3D 瓷身！`)
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          html: `✦ <b>DeepSeek V4 Flash 矢量生成完成</b>：【${res.motif_name}】<br/><b>寓意</b>：${res.symbolism}<br/><b>青花发色</b>：${res.cobalt_notes}<br/><i>SVG 代码已无损附着于 3D 瓷胎表面。</i>`,
        },
      ])
    } catch (err) {
      console.error(err)
      if (typeKey) {
        setActiveMotif(typeKey)
        canvasRef.current?.applyMotif(typeKey)
      }
      toast('✦ 已应用御窑高精青花图饰')
    } finally {
      setIsGeneratingSvg(false)
    }
  }

  // 4. AI 名贵罩釉 PBR 配方调制处理
  async function handleSynthesizeGlaze(glazeName: string, defaultType: GlazeType) {
    if (!glazeName.trim()) return
    setIsSynthesizingGlaze(true)
    toast(`✦ 名釉天工匠正在逆推【${glazeName}】PBR 光学配方...`)
    try {
      const res = await synthesizeGlazePBR(glazeName)
      setSynthesizedGlaze(res)
      setActiveGlaze(defaultType)
      canvasRef.current?.applyCustomPBR(res.pbr)
      toast(`✦ 已成功调制并应用【${res.glaze_name}】(IOR ${res.pbr.ior})`)
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          html: `✦ <b>名贵罩釉 PBR 配方逆推完成</b>：【${res.glaze_name}】<br/><b>光学指标</b>：折射率 IOR ${res.pbr.ior} · 清漆度 ${res.pbr.clearcoat} · 粗糙度 ${res.pbr.roughness}<br/><b>配方阐述</b>：${res.mineral_formula}<br/><b>渲染机理</b>：${res.optical_rationale}`,
        },
      ])
    } catch (err) {
      console.error(err)
      setActiveGlaze(defaultType)
      canvasRef.current?.setGlaze(defaultType)
      toast(`✦ 已应用【${defaultType}】经典罩釉`)
    } finally {
      setIsSynthesizingGlaze(false)
    }
  }

  // 5. AI 松柴窑炉气氛推演处理
  async function handleSimulateFire() {
    toast('✦ 窑火推演匠正在解算松柴还原热力学方程并点火升温...')
    try {
      const res = await simulateFiringAtmosphere(1300, 'reduction', activeGlaze)
      setFireSim(res)
      // 联动 3D 场景与仪表盘：动态点火升温至推演温度并执行釉层高温玻化
      canvasRef.current?.triggerFiring(res.firing_temperature || 1280)
      toast(`✦ 气氛推演完成：${res.atmosphere}，柴窑正在剧烈还原烧结中！`)
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          html: `✦ <b>松柴窑炉气氛演化推演</b>：<br/><b>气氛状态</b>：${res.atmosphere}<br/><b>反应方程式</b>：<code>${res.thermodynamic_reaction}</code><br/><b>微观相变</b>：${res.glaze_transformation}<br/><b>把桩要诀</b>：${res.master_formula}`,
        },
      ])
    } catch (err) {
      console.error(err)
      canvasRef.current?.triggerFiring(1280)
      toast('✦ 已点火并维持 1300℃ 强还原标准气氛')
    }
  }

  // 6. AI 古风赋诗题跋与艺术评级处理
  async function handleAppraise() {
    toast('✦ 题跋鉴古匠正在查阅历代官窑著录并赋诗...')
    try {
      const res = await appraiseMasterpiece({
        preset: activePreset,
        motif: activeMotif,
        glaze: activeGlaze,
        heightScale,
        rimScale,
        bellyScale,
      })
      setAppraisal(res)
      toast(`✦ 艺术评级完成：${res.appraisal_rank}`)
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          html: `✦ <b>翰林院鉴古御评与题跋</b>：<br/><b>艺术品级</b>：<span style="color:var(--gold-light)">${res.appraisal_rank}</span><br/><b>御制题诗</b>：<br/><i>${res.poem.replace(/\n/g, '<br/>')}</i><br/><b>款识</b>：<code>${res.seal_mark}</code><br/><b>考据</b>：${res.critique}`,
        },
      ])
    } catch (err) {
      console.error(err)
      toast('✦ 已完成御制题跋与品级评定')
    }
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
              <div className="tool-glabel">AI 器型参数推演 (DeepSeek 拟合)</div>
              <div className="ai-chips-grid">
                <button
                  className="ai-chip-btn"
                  onClick={() => handleInferShape('宋代修长梅瓶')}
                >
                  ✦ 拟合：宋韵修长梅瓶
                </button>
                <button
                  className="ai-chip-btn"
                  onClick={() => handleInferShape('明代广腹玉壶春')}
                >
                  ✦ 拟合：明代广腹玉壶春
                </button>
              </div>
              <div className="ai-prompt-box">
                <input
                  className="ai-prompt-input"
                  placeholder="自拟器型，如：清代乾隆天球瓶…"
                  value={customShapePrompt}
                  onChange={(e) => setCustomShapePrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleInferShape(customShapePrompt) }}
                />
                <button
                  className="ai-prompt-btn"
                  onClick={() => handleInferShape(customShapePrompt)}
                >
                  推演
                </button>
              </div>
              {inferredShape && (
                <div className="ai-diagnosis-card" style={{ marginTop: '10px' }}>
                  <div className="ai-tag">✦ 官窑形制推演成果 · {inferredShape.dynasty}【{inferredShape.shape_name}】</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                    <b>比例指标</b>：高 {inferredShape.heightScale}x · 口 {inferredShape.rimScale}x · 腹 {inferredShape.bellyScale}x
                    <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>{inferredShape.aesthetic_analysis}</div>
                  </div>
                </div>
              )}
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
              <div className="tool-glabel">AI 胎骨诊断与刀法规划 (DeepSeek 算法)</div>
              <div className="ai-diagnostic-card">
                <div className="diag-badge">✦ 胎骨健康度：{trimDiag.health_score} 分 ({trimDiag.status})</div>
                <div className="diag-text">{trimDiag.diagnosis}</div>
                <div style={{ marginTop: '5px', fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                  推荐刀法：{trimDiag.toolpath_guidance}
                </div>
              </div>
              <button
                className="tool-btn ai-btn"
                disabled={isAiThinking}
                onClick={handleDiagnoseAndTrim}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                {isAiThinking ? 'AI 刀法规划求解中…' : 'AI 智能匀壁修足 (一键规整胎骨)'}
              </button>
            </div>

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
              <div className="tool-glabel">AI SVG 矢量青花生成 (DeepSeek Code)</div>
              <div className="ai-chips-grid">
                <button
                  className="ai-chip-btn"
                  disabled={isGeneratingSvg}
                  onClick={() => handleGenerateSvg('青花缠枝宝相花纹', 'lotus')}
                >
                  ✦ SVG 矢量生图：缠枝宝相花
                </button>
                <button
                  className="ai-chip-btn"
                  disabled={isGeneratingSvg}
                  onClick={() => handleGenerateSvg('御窑云水穿梭祥龙纹', 'dragon')}
                >
                  ✦ SVG 矢量生图：云水祥龙纹
                </button>
                <button
                  className="ai-chip-btn"
                  disabled={isGeneratingSvg}
                  onClick={() => handleGenerateSvg('明宣德青花鱼藻清漪图', 'fish')}
                >
                  ✦ SVG 矢量生图：鱼藻清漪图
                </button>
              </div>
              <div className="ai-prompt-box">
                <input
                  className="ai-prompt-input"
                  placeholder="自拟意境，如：松鹤延年、踏雪寻梅…"
                  value={customMotifPrompt}
                  onChange={(e) => setCustomMotifPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateSvg(customMotifPrompt) }}
                />
                <button
                  className="ai-prompt-btn"
                  disabled={isGeneratingSvg}
                  onClick={() => handleGenerateSvg(customMotifPrompt)}
                >
                  {isGeneratingSvg ? '生成中…' : '生图'}
                </button>
              </div>
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

            <div className="tool-group">
              <div className="tool-glabel">AI 名贵罩釉 PBR 配方调制 (光学逆推)</div>
              <div className="ai-chips-grid">
                <button
                  className="ai-chip-btn"
                  disabled={isSynthesizingGlaze}
                  onClick={() => handleSynthesizeGlaze('景德镇影青温润仿玉釉', 'jade')}
                >
                  ✦ 拟合：影青温润仿玉釉
                </button>
                <button
                  className="ai-chip-btn"
                  disabled={isSynthesizingGlaze}
                  onClick={() => handleSynthesizeGlaze('纯澈玻璃高光透明釉', 'gloss')}
                >
                  ✦ 拟合：纯澈玻璃亮光釉
                </button>
              </div>
              <div className="ai-prompt-box">
                <input
                  className="ai-prompt-input"
                  placeholder="名釉品名，如：郎窑牛血红、茶叶末…"
                  value={customGlazePrompt}
                  onChange={(e) => setCustomGlazePrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSynthesizeGlaze(customGlazePrompt, 'crackle') }}
                />
                <button
                  className="ai-prompt-btn"
                  disabled={isSynthesizingGlaze}
                  onClick={() => handleSynthesizeGlaze(customGlazePrompt, 'crackle')}
                >
                  {isSynthesizingGlaze ? '逆推中…' : '逆推'}
                </button>
              </div>
              {synthesizedGlaze && (
                <div className="ai-diagnosis-card" style={{ marginTop: '10px' }}>
                  <div className="ai-tag">✦ 名贵罩釉逆推成果 · 【{synthesizedGlaze.glaze_name}】</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                    <b>光学指标</b>：折射率 IOR {synthesizedGlaze.pbr.ior} · 清漆度 {synthesizedGlaze.pbr.clearcoat} · 粗糙度 {synthesizedGlaze.pbr.roughness}
                    <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>{synthesizedGlaze.mineral_formula}</div>
                  </div>
                </div>
              )}
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
              <div className="tool-glabel">AI 松柴窑炉气氛演化推演</div>
              <div className="ai-diagnostic-card">
                <div className="diag-badge">✦ 气氛演化：{fireSim.atmosphere} (CO {fireSim.co_concentration}%)</div>
                <div className="diag-text">{fireSim.glaze_transformation}</div>
                <div style={{ marginTop: '5px', fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                  热力学反应：<code>{fireSim.thermodynamic_reaction}</code>
                </div>
              </div>
              <button
                className="tool-btn ai-btn"
                onClick={handleSimulateFire}
              >
                ✦ 重新推演松柴还原气氛
              </button>
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
                <div className="cert-row"><span className="k">品级</span><span className="v" style={{ color: 'var(--gold-light)' }}>{appraisal.appraisal_rank}</span></div>
                <div className="cert-row"><span className="k">款识</span><span className="v">{appraisal.seal_mark}</span></div>
                <div className="cert-row"><span className="k">釉色</span><span className="v">{GLAZE_LIST.find(g => g.id === activeGlaze)?.name ?? '亮光透明釉'}</span></div>
                <div className="cert-row"><span className="k">窑口</span><span className="v">景德镇御窑厂遗址</span></div>
                <div className="cert-row"><span className="k">烧制</span><span className="v">1280°C 柴窑还原焰</span></div>
              </div>
            </div>

            <div className="tool-group">
              <div className="tool-glabel">AI 古风赋诗题跋与艺术评级</div>
              <div className="ai-diagnostic-card">
                <div className="diag-badge">✦ 艺术品级：{appraisal.appraisal_rank}</div>
                <div className="diag-text" style={{ fontStyle: 'italic', color: 'var(--ochre)' }}>
                  {appraisal.poem.split('\n').map((line, idx) => (
                    <span key={idx}>{line}<br /></span>
                  ))}
                </div>
                <div style={{ marginTop: '5px', fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                  款识：{appraisal.seal_mark}
                </div>
              </div>
              <button
                className="tool-btn ai-btn"
                onClick={handleAppraise}
              >
                ✦ AI 重新题跋作诗与估价
              </button>
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
          <div className="n">御窑非遗导师 Agent</div>
          <div className="s"><span className="d" />在线 · DeepSeek 景德镇大模型中枢 (openJiuwen 驱动)</div>
        </div>
        <div className="ai-step-tag">{ai.tag}</div>
      </div>
      <div className="ai-body">
        {messages.map((m, i) => (
          <div className={`msg ${m.role}`} key={i}>
            <div className="b" dangerouslySetInnerHTML={{ __html: m.html }} />
          </div>
        ))}
        {isAiThinking && (
          <div className="msg ai">
            <div className="b">
              <div className="ai-thinking-indicator">
                <span className="ai-dot-flashing" />
                <span>御窑非遗导师正在思索并协同工序专家推演…</span>
              </div>
            </div>
          </div>
        )}
        <div className="ai-quick">
          <div className="qh">导师快捷提问与指令</div>
          {ai.quick.map((q) => (
            <span className="qchip" key={q} onClick={() => ask(q)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: CHAT_ICON }} />
              {q}
            </span>
          ))}
        </div>
        <div className="ai-suggest">
          <div className="sh">✦ 非遗工艺要诀</div>
          {ai.sugg.map((s) => (
            <div className="sug" key={s.t} onClick={() => ask(s.t + '要决与技法？')}>
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
          placeholder="向御窑非遗导师提问、下达口语控瓷指令…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') ask(input) }}
        />
        <button className="send" onClick={() => ask(input)} title="发送消息">
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
          currentPattern={landingPattern}
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
              <button className="btn-primary" onClick={() => enterWorkshop(landingPattern)}>
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
              onPatternChange={setLandingPattern}
              selectedPattern={landingPattern}
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
