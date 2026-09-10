import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { PotteryGeometryBuilder } from '../pottery/PotteryGeometry'
import {
  renderQinghuaMotif,
  type MotifType,
} from '../pottery/patterns'

export type ShowcasePattern = 'lotus' | 'dragon' | 'fish' | 'ice'
export type ShowcaseGlaze = ShowcasePattern

export interface ShowcasePatternInfo {
  id: ShowcasePattern
  name: string
  fullName: string
  dynasty: string
  desc: string
  motif: MotifType
  dotColor: string
  heightScale: number
  rimScale: number
  bellyScale: number
  roughness: number
  clearcoat: number
  clearcoatRoughness: number
  metalness: number
}

export const SHOWCASE_PATTERNS: Record<ShowcasePattern, ShowcasePatternInfo> = {
  lotus: {
    id: 'lotus',
    name: '青花缠枝莲',
    fullName: '景德镇御窑 · 青花缠枝莲梅瓶',
    dynasty: '明 永乐·宣德',
    desc: '苏麻离青幽靓浓艳，八宝缠枝连绵不绝，生生不息',
    motif: 'lotus',
    dotColor: '#183e78',
    heightScale: 1.05,
    rimScale: 0.96,
    bellyScale: 1.06,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    metalness: 0.02,
  },
  dragon: {
    id: 'dragon',
    name: '御窑云水龙',
    fullName: '景德镇御窑 · 青花云水龙纹梅瓶',
    dynasty: '明 宣德·嘉靖',
    desc: '苍龙腾云破雾，五爪矫健气吞山河，御制皇家威仪',
    motif: 'dragon',
    dotColor: '#0c2146',
    heightScale: 1.15,
    rimScale: 1.04,
    bellyScale: 1.15,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    metalness: 0.02,
  },
  fish: {
    id: 'fish',
    name: '鱼藻清漪图',
    fullName: '景德镇御窑 · 青花鱼藻纹梅瓶',
    dynasty: '明 宣德·成化',
    desc: '游鱼戏藻清漪微澜，成化文人秀雅意趣，灵动悠然',
    motif: 'fish',
    dotColor: '#2671b5',
    heightScale: 1.02,
    rimScale: 0.90,
    bellyScale: 0.98,
    roughness: 0.06,
    clearcoat: 0.98,
    clearcoatRoughness: 0.05,
    metalness: 0.02,
  },
  ice: {
    id: 'ice',
    name: '冰裂散点梅',
    fullName: '御窑仿古 · 哥窑冰裂折枝梅瓶',
    dynasty: '宋·元 仿哥窑',
    desc: '金丝铁线冰裂开片，朱砂折枝红梅暗香浮动，清奇古雅',
    motif: 'ice',
    dotColor: '#8b1e1e',
    heightScale: 0.98,
    rimScale: 1.08,
    bellyScale: 1.10,
    roughness: 0.08,
    clearcoat: 0.95,
    clearcoatRoughness: 0.06,
    metalness: 0.03,
  },
}

export interface SyncVaseState {
  y: number
  tilt: number
  pattern?: ShowcasePattern
  glaze?: ShowcasePattern
}

interface LandingPorcelain3DProps {
  onEnterWorkshop?: (pattern?: ShowcasePattern) => void
  syncVaseRef?: React.MutableRefObject<SyncVaseState>
  onPatternChange?: (pattern: ShowcasePattern) => void
  onGlazeChange?: (glaze: ShowcasePattern) => void
  selectedPattern?: ShowcasePattern
  selectedGlaze?: ShowcasePattern
}

export function LandingPorcelain3D({
  onEnterWorkshop,
  syncVaseRef,
  onPatternChange,
  onGlazeChange,
  selectedPattern: propPattern,
  selectedGlaze: propGlaze,
}: LandingPorcelain3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [internalPattern, setInternalPattern] = useState<ShowcasePattern>('lotus')
  const selectedPattern: ShowcasePattern = propPattern ?? propGlaze ?? internalPattern
  const [isHovered, setIsHovered] = useState(false)

  const selectedPatternRef = useRef(selectedPattern)
  useEffect(() => {
    selectedPatternRef.current = selectedPattern
  }, [selectedPattern])

  // Three.js 内部对象引用
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const vaseGroupRef = useRef<THREE.Group | null>(null)
  const vaseMeshRef = useRef<THREE.Mesh | null>(null)
  const builderRef = useRef<PotteryGeometryBuilder>(new PotteryGeometryBuilder(56, 56, 14.2, 0.45))
  const animFrameRef = useRef<number | null>(null)

  // 纹理材质缓存
  const texturesRef = useRef<Record<ShowcasePattern, THREE.CanvasTexture | null>>({
    lotus: null,
    dragon: null,
    fish: null,
    ice: null,
  })

  // 交互与缓动状态
  const isDraggingRef = useRef(false)
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const rotVelocityRef = useRef(0.0055)
  const tiltRef = useRef(0.08)

  // 1. 生成各款名窑纹饰高精度贴图
  const getTexture = useCallback((pattern: ShowcasePattern): THREE.CanvasTexture => {
    const validPattern = SHOWCASE_PATTERNS[pattern] ? pattern : 'lotus'
    if (texturesRef.current[validPattern]) {
      return texturesRef.current[validPattern]!
    }

    const info = SHOWCASE_PATTERNS[validPattern]
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) {
      renderQinghuaMotif(ctx, 1024, 1024, info.motif)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
    texturesRef.current[validPattern] = texture
    return texture
  }, [])

  // 2. 初始化 Three.js 场景与渲染
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 460
    const height = container.clientHeight || 460

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // 透视相机：调整焦距与视距，确保小口、丰肩、修腹与紫檀底座完整优雅置于窗口内，并留出充裕上下呼吸空间
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100)
    camera.position.set(0, 6.5, 45)
    camera.lookAt(0, 5.2, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // --- 博物馆级布光体系 ---
    // 暖白环境光
    const ambientLight = new THREE.AmbientLight(0xfdf7eb, 1.1)
    scene.add(ambientLight)

    // 主展台聚光（前上方暖光）
    const keyLight = new THREE.DirectionalLight(0xfff8ea, 2.5)
    keyLight.position.set(10, 22, 16)
    scene.add(keyLight)

    // 天青色背侧轮廓光（勾勒出陶瓷冰裂与莹润边际）
    const rimLight = new THREE.DirectionalLight(0x4896e0, 1.2)
    rimLight.position.set(-16, 14, -14)
    scene.add(rimLight)

    // 展台底部温润漫射光
    const groundBounce = new THREE.PointLight(0xc98c48, 0.6, 20)
    groundBounce.position.set(0, -2, 8)
    scene.add(groundBounce)

    // 展台整体旋转组（适度缩小比例，使全貌与底座更舒展雅致）
    const displayGroup = new THREE.Group()
    displayGroup.scale.set(0.85, 0.85, 0.85)
    scene.add(displayGroup)
    vaseGroupRef.current = displayGroup

    // --- A. 景德镇官窑梅瓶几何体与 PBR 陶瓷材质 ---
    const builder = builderRef.current
    builder.loadPreset('meiping')
    const initialInfo = SHOWCASE_PATTERNS[selectedPattern] || SHOWCASE_PATTERNS.lotus
    builder.adjustParameters(initialInfo.heightScale, initialInfo.rimScale, initialInfo.bellyScale)
    const vaseGeometry = builder.buildGeometry()
    vaseGeometry.computeVertexNormals()

    const initialTexture = getTexture(initialInfo.id)
    const vaseMaterial = new THREE.MeshPhysicalMaterial({
      map: initialTexture,
      color: 0xffffff,
      roughness: initialInfo.roughness,
      metalness: initialInfo.metalness,
      clearcoat: initialInfo.clearcoat,
      clearcoatRoughness: initialInfo.clearcoatRoughness,
      ior: 1.52,
      reflectivity: 0.85,
      side: THREE.DoubleSide,
    })

    const vaseMesh = new THREE.Mesh(vaseGeometry, vaseMaterial)
    vaseMesh.position.y = 0.6
    displayGroup.add(vaseMesh)
    vaseMeshRef.current = vaseMesh

    // --- B. 紫檀木雕花多层尊贵底座 (Rosewood Display Plinth) ---
    const baseGroup = new THREE.Group()
    displayGroup.add(baseGroup)

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x1e120c,
      roughness: 0.58,
      metalness: 0.12,
    })

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd6a84f,
      roughness: 0.28,
      metalness: 0.85,
    })

    // 底座上托环
    const topRing = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.85, 0.4, 48), woodMat)
    topRing.position.y = 0.4
    baseGroup.add(topRing)

    // 底座铜金镶边线
    const brassRing = new THREE.Mesh(new THREE.CylinderGeometry(2.88, 2.88, 0.1, 48), brassMat)
    brassRing.position.y = 0.18
    baseGroup.add(brassRing)

    // 底座腰部回纹雕刻层
    const midRing = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.45, 0.65, 48), woodMat)
    midRing.position.y = -0.2
    baseGroup.add(midRing)

    // 底座外展足承台
    const footPlinth = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.25, 0.5, 48), woodMat)
    footPlinth.position.y = -0.75
    baseGroup.add(footPlinth)

    // 展台柔和阴影贴地圆盘
    const shadowGeo = new THREE.RingGeometry(0.1, 5.2, 48)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
    })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.rotation.x = -Math.PI / 2
    shadowMesh.position.y = -1.02
    displayGroup.add(shadowMesh)

    // --- 动画与自转循环 ---
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)

      if (displayGroup) {
        // 如果未在拖拽，平滑维持缓慢自动 3D 自转
        if (!isDraggingRef.current) {
          rotVelocityRef.current += (0.0055 - rotVelocityRef.current) * 0.05
          displayGroup.rotation.y += rotVelocityRef.current
        }

        // 微妙呼吸俯仰角
        displayGroup.rotation.x += (tiltRef.current - displayGroup.rotation.x) * 0.08

        // 同步 3D 旋转角度给背景巨型半透明陶瓷
        if (syncVaseRef?.current) {
          syncVaseRef.current.y = displayGroup.rotation.y
          syncVaseRef.current.tilt = displayGroup.rotation.x
          syncVaseRef.current.pattern = selectedPatternRef.current
          syncVaseRef.current.glaze = selectedPatternRef.current
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    // 响应视口缩放
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      vaseGeometry.dispose()
      vaseMaterial.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [getTexture, syncVaseRef])

  // 3. 响应不同花纹款式切换（材质与 3D 几何比例同频演进）
  useEffect(() => {
    if (!vaseMeshRef.current || !builderRef.current) return
    const info = SHOWCASE_PATTERNS[selectedPattern] || SHOWCASE_PATTERNS.lotus
    const mat = vaseMeshRef.current.material as THREE.MeshPhysicalMaterial
    const tex = getTexture(info.id)

    mat.map = tex
    mat.roughness = info.roughness
    mat.clearcoat = info.clearcoat
    mat.clearcoatRoughness = info.clearcoatRoughness
    mat.metalness = info.metalness
    mat.needsUpdate = true

    // 动态调整款式 3D 几何外轮廓 (高、口、腹微调)
    const builder = builderRef.current
    builder.loadPreset('meiping')
    builder.adjustParameters(info.heightScale, info.rimScale, info.bellyScale)
    builder.updateGeometryPositions(vaseMeshRef.current.geometry)
  }, [selectedPattern, getTexture])

  // 4. 鼠标 360° 拖拽赏鉴事件处理
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    prevMouseRef.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !vaseGroupRef.current) return
    const deltaX = e.clientX - prevMouseRef.current.x
    const deltaY = e.clientY - prevMouseRef.current.y
    prevMouseRef.current = { x: e.clientX, y: e.clientY }

    vaseGroupRef.current.rotation.y += deltaX * 0.012
    rotVelocityRef.current = deltaX * 0.008

    // 限制上下倾斜幅度，保持尊贵端庄
    const nextTilt = tiltRef.current + deltaY * 0.005
    tiltRef.current = Math.max(-0.15, Math.min(0.25, nextTilt))

    if (syncVaseRef?.current) {
      syncVaseRef.current.y = vaseGroupRef.current.rotation.y
      syncVaseRef.current.tilt = tiltRef.current
    }
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
  }

  const currentInfo = SHOWCASE_PATTERNS[selectedPattern] || SHOWCASE_PATTERNS.lotus

  return (
    <div
      className="showcase-3d-wrapper"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D 渲染画布容器 */}
      <div ref={mountRef} className="showcase-3d-canvas" />

      {/* 顶部御窑铭牌 */}
      <div className="showcase-badge-top">
        <span className="seal-dot" />
        <span className="badge-text">{currentInfo.fullName}</span>
        <span className="badge-dynasty">{currentInfo.dynasty}</span>
      </div>

      {/* 底部互动信息与四大经典纹样款式快捷预览 */}
      <div className="showcase-bottom-bar">
        <div className="showcase-glaze-pills">
          {(['lotus', 'dragon', 'fish', 'ice'] as ShowcasePattern[]).map((p) => (
            <button
              key={p}
              className={`glaze-mini-pill ${selectedPattern === p ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setInternalPattern(p)
                onPatternChange?.(p)
                onGlazeChange?.(p)
                if (syncVaseRef?.current) {
                  syncVaseRef.current.pattern = p
                  syncVaseRef.current.glaze = p
                }
              }}
            >
              <span className={`pill-color-dot ${p}`} />
              {SHOWCASE_PATTERNS[p].name}
            </button>
          ))}
        </div>

        <div className="showcase-meta-line">
          <span className="meta-hint">
            {isHovered ? '✦ 按住鼠标可 360° 拖拽鉴赏' : '✦ 缓慢 3D 旋转中 · 1280°C 高温柴窑烧成'}
          </span>
          {onEnterWorkshop && (
            <button
              className="showcase-remake-btn"
              onClick={(e) => {
                e.stopPropagation()
                onEnterWorkshop(selectedPattern)
              }}
            >
              在工坊制作同款 →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
