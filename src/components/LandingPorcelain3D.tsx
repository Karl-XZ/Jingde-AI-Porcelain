import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { PotteryGeometryBuilder } from '../pottery/PotteryGeometry'
import {
  renderQinghuaMotif,
  generateLangyaoCanvas,
  generateHuayouCanvas,
  generateChayemoCanvas,
  type MotifType,
} from '../pottery/patterns'

export type ShowcaseGlaze = 'qing' | 'lang' | 'hua' | 'cha'

export interface SyncVaseState {
  y: number
  tilt: number
  glaze: ShowcaseGlaze
}

interface LandingPorcelain3DProps {
  onEnterWorkshop?: () => void
  syncVaseRef?: React.MutableRefObject<SyncVaseState>
  onGlazeChange?: (glaze: ShowcaseGlaze) => void
  selectedGlaze?: ShowcaseGlaze
}

export function LandingPorcelain3D({
  onEnterWorkshop,
  syncVaseRef,
  onGlazeChange,
  selectedGlaze: propGlaze,
}: LandingPorcelain3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [internalGlaze, setInternalGlaze] = useState<ShowcaseGlaze>('qing')
  const selectedGlaze = propGlaze ?? internalGlaze
  const [isHovered, setIsHovered] = useState(false)

  const selectedGlazeRef = useRef(selectedGlaze)
  useEffect(() => {
    selectedGlazeRef.current = selectedGlaze
  }, [selectedGlaze])

  // Three.js 内部对象引用
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const vaseGroupRef = useRef<THREE.Group | null>(null)
  const vaseMeshRef = useRef<THREE.Mesh | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // 纹理材质缓存
  const texturesRef = useRef<Record<ShowcaseGlaze, THREE.CanvasTexture | null>>({
    qing: null,
    lang: null,
    hua: null,
    cha: null,
  })

  // 交互与缓动状态
  const isDraggingRef = useRef(false)
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const rotVelocityRef = useRef(0.0055)
  const tiltRef = useRef(0.08)

  // 1. 生成各款名釉高精度物理贴图
  const getTexture = useCallback((glaze: ShowcaseGlaze): THREE.CanvasTexture => {
    if (texturesRef.current[glaze]) {
      return texturesRef.current[glaze]!
    }

    let canvas: HTMLCanvasElement
    if (glaze === 'qing') {
      canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      if (ctx) renderQinghuaMotif(ctx, 1024, 1024, 'lotus' as MotifType)
    } else if (glaze === 'lang') {
      canvas = generateLangyaoCanvas(1024, 1024)
    } else if (glaze === 'hua') {
      canvas = generateHuayouCanvas(1024, 1024)
    } else {
      canvas = generateChayemoCanvas(1024, 1024)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
    texturesRef.current[glaze] = texture
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
    const builder = new PotteryGeometryBuilder(56, 56, 14.2, 0.45)
    builder.loadPreset('meiping')
    // 调教极其典雅的梅瓶神韵比例：修长秀美、丰肩圆润、小巧唇口
    builder.adjustParameters(1.05, 0.96, 1.06)
    const vaseGeometry = builder.buildGeometry()
    vaseGeometry.computeVertexNormals()

    const qingTexture = getTexture('qing')
    const vaseMaterial = new THREE.MeshPhysicalMaterial({
      map: qingTexture,
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
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
          syncVaseRef.current.glaze = selectedGlazeRef.current
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

  // 3. 响应釉色切换
  useEffect(() => {
    if (!vaseMeshRef.current) return
    const mat = vaseMeshRef.current.material as THREE.MeshPhysicalMaterial
    const tex = getTexture(selectedGlaze)

    mat.map = tex
    if (selectedGlaze === 'qing') {
      mat.roughness = 0.05
      mat.clearcoat = 1.0
      mat.clearcoatRoughness = 0.04
      mat.metalness = 0.02
    } else if (selectedGlaze === 'lang') {
      mat.roughness = 0.07
      mat.clearcoat = 1.0
      mat.clearcoatRoughness = 0.03
      mat.metalness = 0.04
    } else if (selectedGlaze === 'hua') {
      mat.roughness = 0.09
      mat.clearcoat = 0.95
      mat.clearcoatRoughness = 0.06
      mat.metalness = 0.03
    } else {
      mat.roughness = 0.52
      mat.clearcoat = 0.2
      mat.clearcoatRoughness = 0.3
      mat.metalness = 0.12
    }
    mat.needsUpdate = true
  }, [selectedGlaze, getTexture])

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

  const glazeNames: Record<ShowcaseGlaze, string> = {
    qing: '青花缠枝莲',
    lang: '郎窑红',
    hua: '窑变花釉',
    cha: '茶叶末',
  }

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
        <span className="badge-text">景德镇御窑 · 青花缠枝莲梅瓶</span>
        <span className="badge-dynasty">明 永乐·宣德</span>
      </div>

      {/* 底部互动信息与四大名釉快捷预览 */}
      <div className="showcase-bottom-bar">
        <div className="showcase-glaze-pills">
          {(['qing', 'lang', 'hua', 'cha'] as ShowcaseGlaze[]).map((g) => (
            <button
              key={g}
              className={`glaze-mini-pill ${selectedGlaze === g ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setInternalGlaze(g)
                onGlazeChange?.(g)
                if (syncVaseRef?.current) {
                  syncVaseRef.current.glaze = g
                }
              }}
            >
              <span className={`pill-color-dot ${g}`} />
              {glazeNames[g]}
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
                onEnterWorkshop()
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
