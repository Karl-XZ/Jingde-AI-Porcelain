/**
 * 景德镇御窑 AI 智能体前端客户端服务
 * 深度集成华为 openJiuwen 多智能体协作蜂群与 DeepSeek V4 Flash
 */

const API_BASE = 'http://127.0.0.1:8000/api'

export interface MentorChatResponse {
  reply: string
  action?: {
    type: 'update_shape' | 'apply_motif' | 'update_glaze' | 'trim_foot' | 'fire_kiln' | 'appraise' | 'none'
    payload?: Record<string, unknown>
  }
}

export interface FormingInferenceResponse {
  dynasty: string
  shape_name: string
  heightScale: number
  rimScale: number
  bellyScale: number
  points?: Array<{ x: number; y: number }>
  aesthetic_analysis: string
}

export interface TrimmingDiagnosisResponse {
  health_score: number
  wall_uniformity: number
  status: string
  diagnosis: string
  toolpath_guidance: string
  actions: {
    smooth_passes: number
    foot_delta: number
  }
}

export interface PatternSvgResponse {
  motif_name: string
  symbolism: string
  cobalt_notes: string
  svg_code: string
}

export interface GlazeSynthesisResponse {
  glaze_name: string
  pbr: {
    roughness: number
    metalness: number
    clearcoat: number
    clearcoatRoughness: number
    transmission: number
    ior: number
    colorTint: string
    sheen: number
  }
  mineral_formula: string
  optical_rationale: string
}

export interface FiringSimulationResponse {
  atmosphere: string
  co_concentration: number
  o2_concentration: number
  firing_temperature: number
  thermodynamic_reaction: string
  quality_score: number
  glaze_transformation: string
  risk_assessment: string
  master_formula: string
}

export interface AppraisalResponse {
  appraisal_rank: string
  poem: string
  poem_annotation: string
  seal_mark: string
  critique: string
  market_valuation: string
}

// 统一请求包装器，带超时与容错
async function fetchApi<T>(endpoint: string, body: unknown, fallback: T): Promise<T> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      console.warn(`[AI Service] API request failed with status ${res.status}, using fallback`)
      return fallback
    }

    const data = await res.json()
    if (data.code === 0 && data.data) {
      return data.data as T
    }
    return fallback
  } catch (err) {
    console.warn(`[AI Service] Network error calling ${endpoint}:`, err)
    return fallback
  }
}

/**
 * 1. 御窑非遗导师对话与口语控瓷
 */
export async function chatWithMentor(
  message: string,
  history: Array<{ role: string; content: string }> = [],
  context?: Record<string, unknown>
): Promise<MentorChatResponse> {
  const fallback: MentorChatResponse = {
    reply: '督陶官已收到您的提问。景德镇瓷业过手七十二道工序，方克成器。请随时向我咨询各阶段工艺或下达控瓷指令。',
    action: { type: 'none', payload: {} },
  }

  return fetchApi<MentorChatResponse>(
    '/chat',
    { message, history, context },
    fallback
  )
}

/**
 * 2. AI 器型参数推演 (DeepSeek 拟合)
 */
export async function inferFormingShape(
  prompt: string,
  currentParams?: Record<string, unknown>
): Promise<FormingInferenceResponse> {
  const fallback: FormingInferenceResponse = {
    dynasty: '宋代',
    shape_name: '宋韵修长梅瓶',
    heightScale: 1.18,
    rimScale: 0.78,
    bellyScale: 1.22,
    aesthetic_analysis: '小口微翻，短颈丰肩，腹下轻敛，线条流转挺拔，兼具宋代典雅理性之美与盛水储酒之工学巧思。',
  }

  return fetchApi<FormingInferenceResponse>(
    '/forming/infer',
    { prompt, currentParams },
    fallback
  )
}

/**
 * 3. AI 胎骨诊断与刀法规划 (DeepSeek 算法)
 */
export async function diagnoseTrimming(
  geometryData?: Record<string, unknown>
): Promise<TrimmingDiagnosisResponse> {
  const fallback: TrimmingDiagnosisResponse = {
    health_score: 98.6,
    wall_uniformity: 98.2,
    status: '优 (微调即佳)',
    diagnosis: '检测到器身腹部存在微细拉坯高频旋纹，圈足底立墙稍显敦厚，需施以修坯钢刀削平以绝底裂隐患。',
    toolpath_guidance: '以竹刀定心，外侧修坯铁刀自口沿顺流至足，圈足立墙施以内斜掏削刀法。',
    actions: {
      smooth_passes: 2,
      foot_delta: -0.18,
    },
  }

  return fetchApi<TrimmingDiagnosisResponse>(
    '/trim/diagnose',
    { geometry_data: geometryData },
    fallback
  )
}

/**
 * 4. AI SVG 矢量青花生成 (DeepSeek Code)
 */
export async function generatePatternSvg(
  theme: string,
  motifType?: string
): Promise<PatternSvgResponse> {
  const fallback: PatternSvgResponse = {
    motif_name: theme,
    symbolism: '传统御窑青花经典图式，工法考究，气韵生动。',
    cobalt_notes: '苏料浓重青翠，笔触见水墨晕染之妙。',
    svg_code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#f8f6f0" />
  <g stroke="#183e78" stroke-width="4" fill="none">
    <line x1="0" y1="80" x2="1024" y2="80" />
    <line x1="0" y1="120" x2="1024" y2="120" />
    <line x1="0" y1="900" x2="1024" y2="900" stroke="#0c2146" stroke-width="6" />
  </g>
  <path d="M 0 512 Q 256 350, 512 512 T 1024 512" fill="none" stroke="#0c2146" stroke-width="8"/>
  <circle cx="256" cy="430" r="48" fill="rgba(28, 68, 130, 0.45)" stroke="#0c2146" stroke-width="3"/>
  <circle cx="768" cy="590" r="48" fill="rgba(28, 68, 130, 0.45)" stroke="#0c2146" stroke-width="3"/>
</svg>`,
  }

  return fetchApi<PatternSvgResponse>(
    '/pattern/svg',
    { theme, motif_type: motifType },
    fallback
  )
}

/**
 * 5. AI 名贵罩釉 PBR 配方调制 (光学逆推)
 */
export async function synthesizeGlazePBR(
  glazeName: string,
  targetOptical?: Record<string, unknown>
): Promise<GlazeSynthesisResponse> {
  const fallback: GlazeSynthesisResponse = {
    glaze_name: glazeName,
    pbr: {
      roughness: 0.12,
      metalness: 0.02,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06,
      transmission: 0.22,
      ior: 1.48,
      colorTint: '#dff2f2',
      sheen: 0.45,
    },
    mineral_formula: '长石、石英、高岭土配伍，微量氧化铁还原发天青色。',
    optical_rationale: '折射率设为 1.48，清漆适度柔化仿羊脂白玉触感。',
  }

  return fetchApi<GlazeSynthesisResponse>(
    '/glaze/synthesize',
    { glaze_name: glazeName, target_optical: targetOptical },
    fallback
  )
}

/**
 * 6. AI 松柴窑炉气氛演化推演
 */
export async function simulateFiringAtmosphere(
  temperature: number = 1300,
  atmosphereMode: string = 'reduction',
  glazeType: string = 'jade'
): Promise<FiringSimulationResponse> {
  const fallback: FiringSimulationResponse = {
    atmosphere: '松柴强还原焰 (CO 4.2%)',
    co_concentration: 4.2,
    o2_concentration: 0.8,
    firing_temperature: temperature,
    thermodynamic_reaction: 'Fe2O3 + CO → 2FeO + CO2↑ （高温下钴料与胎釉完美熔融）',
    quality_score: 98.8,
    glaze_transformation: '松柴松脂在 1300℃ 挥发润色，釉层深处形成微观乳浊云雾相，纯青发色沉着内敛。',
    risk_assessment: '升温斜率平缓，排湿彻底，无针孔缩釉及惊裂隐患。',
    master_formula: '一烧升温排潮汽，二烧还原吐青翠，三烧熟透保高温，四烧闷火凝玉脂。',
  }

  return fetchApi<FiringSimulationResponse>(
    '/fire/simulate',
    { temperature, atmosphere_mode: atmosphereMode, glaze_type: glazeType },
    fallback
  )
}

/**
 * 7. AI 古风赋诗题跋与艺术评级
 */
export async function appraiseMasterpiece(
  pieceInfo?: Record<string, unknown>
): Promise<AppraisalResponse> {
  const fallback: AppraisalResponse = {
    appraisal_rank: '神品 · 官窑特等',
    poem: '白釉青花一火成，花从釉里透分明。可怜垄上泥土贱，入手翻随富贵生。',
    poem_annotation: '化用清代龚轼《陶歌》，叹柴窑造化之神秀，青花与玉釉熔于一炉，脱胎换骨。',
    seal_mark: '大明宣德御窑 · 数字非遗监制',
    critique: '胎质极紧密而如糯米玉，青花深浅浓淡层次分明，釉表微起橘皮波浪纹，宝光内敛，堪称当代官窑数字典范之器。',
    market_valuation: '官窑国宝级数字孤品',
  }

  return fetchApi<AppraisalResponse>(
    '/finish/appraise',
    { piece_info: pieceInfo },
    fallback
  )
}

/**
 * 8. 获取 XMOV 数字人服务配置
 */
export interface AvatarConfigResponse {
  appId: string
  appSecret: string
  gatewayServer: string
  avatarLook: string
}

export async function getAvatarConfig(): Promise<AvatarConfigResponse> {
  const fallback: AvatarConfigResponse = {
    appId: '9e366289805f4fd7ad9a6879bf64c698',
    appSecret: 'fca83e091ace40d59acb2c812e469499',
    gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',
    avatarLook: 'N_Wuliping_14333_new',
  }
  return fetchApi<AvatarConfigResponse>('/avatar/config', {}, fallback)
}
