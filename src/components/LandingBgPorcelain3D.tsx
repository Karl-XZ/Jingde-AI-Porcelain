import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { PotteryGeometryBuilder } from '../pottery/PotteryGeometry'
import { renderQinghuaMotif } from '../pottery/patterns'
import {
  SHOWCASE_PATTERNS,
  type ShowcasePattern,
  type ShowcaseGlaze,
  type SyncVaseState,
} from './LandingPorcelain3D'

interface LandingBgPorcelain3DProps {
  syncVaseRef?: React.MutableRefObject<SyncVaseState>
  currentGlaze?: ShowcaseGlaze
  currentPattern?: ShowcasePattern
}

/**
 * 首页背景巨型半透明 3D 陶瓷
 * 与前台 3D 展台陶瓷保持绝对 1:1 同步旋转、同一器型、同一经典纹样款式；
 * 采用半透明玉质/琉璃材质与窑火底光照明，形成磅礴宏大的虚实相生意境。
 */
export function LandingBgPorcelain3D({
  syncVaseRef,
  currentGlaze,
  currentPattern = 'lotus',
}: LandingBgPorcelain3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  // Three.js 内部对象引用
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const bgGroupRef = useRef<THREE.Group | null>(null)
  const bgMeshRef = useRef<THREE.Mesh | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const builderRef = useRef<PotteryGeometryBuilder | null>(null)
  // 纹理材质缓存
  const texturesRef = useRef<Record<string, THREE.CanvasTexture | null>>({})

  const activePattern = (currentPattern || currentGlaze || 'lotus') as ShowcasePattern
  const currentPatternRef = useRef<ShowcasePattern>(activePattern)
  useEffect(() => {
    currentPatternRef.current = (currentPattern || currentGlaze || 'lotus') as ShowcasePattern
  }, [currentPattern, currentGlaze])

  // 1. 生成或获取经典纹样高精度贴图
  const getTexture = useCallback((patternKey: string): THREE.CanvasTexture => {
    if (texturesRef.current[patternKey]) {
      return texturesRef.current[patternKey]!
    }

    const info = SHOWCASE_PATTERNS[patternKey as ShowcasePattern] || SHOWCASE_PATTERNS.lotus
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) renderQinghuaMotif(ctx, 1024, 1024, info.motif)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
    texturesRef.current[patternKey] = texture
    return texture
  }, [])

  // 2. 初始化全屏背景 Three.js 场景
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // 广角相机置于背景纵深层
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 150)
    camera.position.set(0, 3.5, 38)
    camera.lookAt(0, 3.0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.18
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // --- 背景窑火专属艺术照明系统 ---
    // 暖调环境底光
    const ambientLight = new THREE.AmbientLight(0xfef2e2, 0.42)
    scene.add(ambientLight)

    // 底部主窑火光晕光源：炽热暖橙红光，自下而上浸润巨型瓷器腹部与圈足
    const kilnPoint = new THREE.PointLight(0xff5511, 4.8, 70)
    kilnPoint.position.set(6, -15, 8)
    scene.add(kilnPoint)

    // 底部次级余烬暖光（照拂向左侧文案延伸区）
    const emberLight = new THREE.PointLight(0xff7722, 2.6, 50)
    emberLight.position.set(-4, -11, 10)
    scene.add(emberLight)

    // 顶部背侧天青冷色轮廓光（营造“上纳天青、下承窑火”的晶莹折射边缘）
    const rimLight = new THREE.DirectionalLight(0x408de0, 1.85)
    rimLight.position.set(-16, 20, -10)
    scene.add(rimLight)

    // 展台正面柔和微光
    const frontLight = new THREE.DirectionalLight(0xffeedd, 0.75)
    frontLight.position.set(4, 12, 18)
    scene.add(frontLight)

    // --- 3D 巨型半透明陶瓷主体 ---
    const bgGroup = new THREE.Group()
    bgGroup.scale.set(1.92, 1.92, 1.92)

    // 根据屏幕宽度自动计算 X 轴黄金分割偏置（宽屏偏右，窄屏居中）
    const calcPositionX = (w: number) => (w > 1200 ? 6.6 : w > 860 ? 4.2 : 0)
    bgGroup.position.set(calcPositionX(width), -1.2, -6)
    scene.add(bgGroup)
    bgGroupRef.current = bgGroup

    // 构建与前台完全一致的经典官窑梅瓶
    const builder = new PotteryGeometryBuilder(56, 56, 14.2, 0.45)
    builder.loadPreset('meiping')
    builderRef.current = builder
    const curPattern = currentPatternRef.current
    const info = SHOWCASE_PATTERNS[curPattern] || SHOWCASE_PATTERNS.lotus
    builder.adjustParameters(info.heightScale, info.rimScale, info.bellyScale)
    const vaseGeometry = builder.buildGeometry()
    vaseGeometry.computeVertexNormals()

    const initialTexture = getTexture(curPattern)
    const vaseMaterial = new THREE.MeshPhysicalMaterial({
      map: initialTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.26, // 典雅半透明，既现器韵神形，又不抢文字焦点
      roughness: 0.12,
      metalness: 0.03,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      ior: 1.52,
      reflectivity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false, // 避免透明重叠时切面瑕疵
    })

    const bgMesh = new THREE.Mesh(vaseGeometry, vaseMaterial)
    bgMesh.position.y = 0
    bgGroup.add(bgMesh)
    bgMeshRef.current = bgMesh

    // --- 动画循环：与前台 3D 陶瓷 100% 同步旋转 ---
    const clock = new THREE.Clock()
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      const time = clock.getElapsedTime()

      if (bgGroup) {
        // 1. 绝对同步自转与倾斜
        if (syncVaseRef?.current) {
          bgGroup.rotation.y = syncVaseRef.current.y
          bgGroup.rotation.x = syncVaseRef.current.tilt * 0.4

          // 检查前台 pattern 是否切换，同步背景
          const syncKey = (syncVaseRef.current.pattern || syncVaseRef.current.glaze) as ShowcasePattern | undefined
          if (syncKey && syncKey !== currentPatternRef.current && bgMeshRef.current && builderRef.current) {
            currentPatternRef.current = syncKey
            const synInfo = SHOWCASE_PATTERNS[syncKey] || SHOWCASE_PATTERNS.lotus
            const mat = bgMeshRef.current.material as THREE.MeshPhysicalMaterial
            mat.map = getTexture(syncKey)
            mat.needsUpdate = true
            builderRef.current.adjustParameters(synInfo.heightScale, synInfo.rimScale, synInfo.bellyScale)
            const newGeom = builderRef.current.buildGeometry()
            newGeom.computeVertexNormals()
            bgMeshRef.current.geometry.dispose()
            bgMeshRef.current.geometry = newGeom
          }
        } else {
          bgGroup.rotation.y += 0.0055
        }

        // 2. 灵动上下轻柔浮动（呼吸感）
        bgGroup.position.y = -1.2 + Math.sin(time * 0.8) * 0.35

        // 3. 底部窑火光芒微闪烁
        kilnPoint.intensity = 4.8 + Math.sin(time * 3.2) * 0.45 + Math.cos(time * 5.8) * 0.25
      }

      renderer.render(scene, camera)
    }
    animate()

    // 视口自适应
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      if (bgGroupRef.current) {
        bgGroupRef.current.position.x = calcPositionX(w)
      }
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

  // 3. 动态响应前台切换纹样款式
  useEffect(() => {
    if (!bgMeshRef.current || !builderRef.current) return
    const key = (currentPattern || currentGlaze || 'lotus') as ShowcasePattern
    const info = SHOWCASE_PATTERNS[key] || SHOWCASE_PATTERNS.lotus
    const mat = bgMeshRef.current.material as THREE.MeshPhysicalMaterial
    mat.map = getTexture(key)
    mat.needsUpdate = true

    builderRef.current.adjustParameters(info.heightScale, info.rimScale, info.bellyScale)
    const newGeom = builderRef.current.buildGeometry()
    newGeom.computeVertexNormals()
    bgMeshRef.current.geometry.dispose()
    bgMeshRef.current.geometry = newGeom
  }, [currentPattern, currentGlaze, getTexture])

  return (
    <div className="landing-bg-porcelain-wrapper">
      <div ref={mountRef} className="landing-bg-porcelain-canvas" />
    </div>
  )
}
