import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { PotteryGeometryBuilder, type PresetType } from './PotteryGeometry'
import { PotteryMaterialManager, type GlazeType } from './PotteryMaterials'
import { exportToGLB, exportCertificatePDF, exportPosterPDF, type CeramicMetadata } from './exporters'
import { type MotifType } from './patterns'

export interface PotteryCanvasHandle {
  loadPreset: (preset: PresetType) => void
  applyMotif: (motif: MotifType) => void
  applySvgMotif: (svgCode: string) => void
  setGlaze: (glaze: GlazeType) => void
  applyCustomPBR: (pbr: Record<string, number | string | undefined>) => void
  smoothGeometry: () => void
  trimFoot: () => void
  clearCanvas: () => void
  aiComposePattern: () => void
  triggerFiring: (targetTemp?: number) => void
  applyProfilePoints: (points: Array<{ x?: number; r?: number; y: number }>) => void
  exportGLB: () => Promise<void>
  exportCert: () => Promise<void>
  exportPoster: () => Promise<void>
  resetGeometry: () => void
}

export interface PotteryCanvasProps {
  step: 'forming' | 'trim' | 'pattern' | 'glaze' | 'fire' | 'finish'
  selectedTool?: string | null
  activePreset?: PresetType
  activeMotif?: MotifType
  activeGlaze?: GlazeType
  heightScale?: number
  rimScale?: number
  bellyScale?: number
  glazeThickness?: number
  glazeGloss?: number
  paintColor?: string
  brushSize?: number
  isEraser?: boolean
  onMeasurementsChange?: (heightCm: number, rimCm: number) => void
  onFiringProgress?: (temp: number, isFiring: boolean) => void
  onToast?: (msg: string) => void
}

export const PotteryCanvas = forwardRef<PotteryCanvasHandle, PotteryCanvasProps>(function PotteryCanvas(
  {
    step,
    selectedTool,
    activePreset = 'meiping',
    activeMotif = 'lotus',
    activeGlaze: propGlaze,
    heightScale = 1.0,
    rimScale = 1.0,
    bellyScale = 1.0,
    glazeThickness = 1.0,
    glazeGloss = 0.85,
    paintColor: propPaintColor,
    brushSize: propBrushSize,
    isEraser: propIsEraser,
    onMeasurementsChange,
    onFiringProgress,
    onToast,
  },
  ref
) {
  const mountRef = useRef<HTMLDivElement>(null)

  // 核心 Three.js 对象
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const builderRef = useRef<PotteryGeometryBuilder>(new PotteryGeometryBuilder())
  const matManagerRef = useRef<PotteryMaterialManager | null>(null)
  const clayMeshRef = useRef<THREE.Mesh | null>(null)
  const turntableGroupRef = useRef<THREE.Group | null>(null)
  const kilnFireLightRef = useRef<THREE.PointLight | null>(null)

  // 纹样与绘制状态
  const patternInitializedRef = useRef(false)
  const [currentGlaze] = useState<GlazeType>('gloss')
  const [isGlazingAnimation, setIsGlazingAnimation] = useState(false)

  const actualPaintColor = propPaintColor ?? '#183e78'
  const actualBrushSize = propBrushSize ?? 10
  const actualIsEraser = propIsEraser ?? false
  const activeGlaze: GlazeType = propGlaze || (
    ['gloss', 'jade', 'matte', 'crackle', 'ripple', 'qing', 'lang', 'hua', 'cha'].includes(selectedTool as string)
      ? (selectedTool as GlazeType)
      : currentGlaze
  )

  // 烧制状态
  const [isFiringActive, setIsFiringActive] = useState(false)
  const [firingTemp, setFiringTemp] = useState(25)
  const [isHoveringClay, setIsHoveringClay] = useState(false)

  // 交互状态与持久化引用
  const isInteractingRef = useRef(false)
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const activeHitYRef = useRef<number | null>(null)
  const prevSlidersRef = useRef({ heightScale: 1.0, rimScale: 1.0, bellyScale: 1.0 })

  const stepRef = useRef(step)
  const onMeasurementsChangeRef = useRef(onMeasurementsChange)
  const onFiringProgressRef = useRef(onFiringProgress)
  const onToastRef = useRef(onToast)

  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    onMeasurementsChangeRef.current = onMeasurementsChange
  }, [onMeasurementsChange])

  useEffect(() => {
    onFiringProgressRef.current = onFiringProgress
  }, [onFiringProgress])

  useEffect(() => {
    onToastRef.current = onToast
  }, [onToast])

  // 1. 初始化 Three.js 场景与画布
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 600
    const height = container.clientHeight || 500

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(0, 10, 25)
    camera.lookAt(0, 6.5, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 灯光体系
    const ambientLight = new THREE.AmbientLight(0xf8f2e4, 0.85)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfffdf5, 1.8)
    keyLight.position.set(12, 22, 16)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x4a8fcf, 0.65)
    rimLight.position.set(-16, 14, -12)
    scene.add(rimLight)

    const kilnLight = new THREE.PointLight(0xff5511, 0, 35)
    kilnLight.position.set(0, 4, 8)
    scene.add(kilnLight)
    kilnFireLightRef.current = kilnLight

    // 材质管理器
    const matManager = new PotteryMaterialManager(1024, 1024)
    matManagerRef.current = matManager

    // 默认应用青花缠枝莲底图
    if (!patternInitializedRef.current) {
      matManager.applyPattern('lotus')
      patternInitializedRef.current = true
    }

    // 旋转底盘组
    const turntableGroup = new THREE.Group()
    scene.add(turntableGroup)
    turntableGroupRef.current = turntableGroup

    // 木质陶轮底盘
    const wheelGeom = new THREE.CylinderGeometry(8.5, 9.2, 1.2, 48)
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x3d2716,
      roughness: 0.7,
      metalness: 0.15,
    })
    const wheelMesh = new THREE.Mesh(wheelGeom, wheelMat)
    wheelMesh.position.y = -0.6
    turntableGroup.add(wheelMesh)

    // 陶轮刻度同心环
    const ringGeom = new THREE.RingGeometry(2.5, 8.0, 32)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x5a3d24, side: THREE.DoubleSide })
    const ringMesh = new THREE.Mesh(ringGeom, ringMat)
    ringMesh.rotation.x = -Math.PI / 2
    ringMesh.position.y = 0.02
    turntableGroup.add(ringMesh)

    // 构建泥坯网格
    const builder = builderRef.current
    const clayGeom = builder.buildGeometry()
    const clayMesh = new THREE.Mesh(clayGeom, matManager.material)
    turntableGroup.add(clayMesh)
    clayMeshRef.current = clayMesh

    if (onMeasurementsChangeRef.current) {
      onMeasurementsChangeRef.current(
        parseFloat((builder.height * 2.2).toFixed(1)),
        parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1))
      )
    }

    // 渲染主循环
    let animId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      clock.getDelta()

      if (turntableGroupRef.current) {
        const curStep = stepRef.current
        // 制坯、修型阶段转速较快；手绘绘制中慢速方便落笔；成品阶段慢速展示
        if (curStep === 'forming' || curStep === 'trim') {
          turntableGroupRef.current.rotation.y += 0.022
        } else if (curStep === 'pattern') {
          // 如果正在手绘，停止自转以防笔触偏移；空闲时极微速慢转
          if (!isInteractingRef.current) {
            turntableGroupRef.current.rotation.y += 0.002
          }
        } else if (curStep === 'glaze') {
          if (!isInteractingRef.current) {
            turntableGroupRef.current.rotation.y += 0.0025
          }
        } else if (curStep === 'finish') {
          if (!isInteractingRef.current) {
            turntableGroupRef.current.rotation.y += 0.002
          }
        }
      }

      if (kilnFireLightRef.current && kilnFireLightRef.current.intensity > 0) {
        kilnFireLightRef.current.intensity = 2.4 + Math.sin(clock.elapsedTime * 12) * 0.7 + Math.random() * 0.3
      }

      renderer.render(scene, camera)
    }
    animate()

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
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // 2. 滑块参数调节（仅在用户真正调整滑块时才执行，绝不抹除手工形变）
  useEffect(() => {
    const prev = prevSlidersRef.current
    if (
      prev.heightScale === heightScale &&
      prev.rimScale === rimScale &&
      prev.bellyScale === bellyScale
    ) {
      return
    }
    prevSlidersRef.current = { heightScale, rimScale, bellyScale }

    const builder = builderRef.current
    const mesh = clayMeshRef.current
    if (!mesh) return

    builder.adjustParameters(heightScale, rimScale, bellyScale)
    builder.updateGeometryPositions(mesh.geometry)

    if (onMeasurementsChangeRef.current) {
      onMeasurementsChangeRef.current(
        parseFloat((builder.height * 2.2).toFixed(1)),
        parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1))
      )
    }
  }, [heightScale, rimScale, bellyScale])

  // 3. 响应外部案例真实 3D 模型导入 (Preset & Motif)
  const prevPresetRef = useRef<PresetType | undefined>(undefined)
  useEffect(() => {
    if (activePreset && activePreset !== prevPresetRef.current && clayMeshRef.current) {
      prevPresetRef.current = activePreset
      const builder = builderRef.current
      builder.loadPreset(activePreset)
      if (activePreset === 'bowl') {
        builder.adjustParameters(0.75, 1.48, 1.0)
      } else if (activePreset === 'yuhuchun') {
        builder.adjustParameters(0.96, 1.08, 1.14)
      } else if (activePreset === 'meiping') {
        builder.adjustParameters(1.02, 0.95, 1.04)
      }
      builder.syncBaseline()
      builder.updateGeometryPositions(clayMeshRef.current.geometry)
      if (onMeasurementsChangeRef.current) {
        onMeasurementsChangeRef.current(
          parseFloat((builder.height * 2.2).toFixed(1)),
          parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1))
        )
      }
    }
  }, [activePreset])

  const prevMotifRef = useRef<MotifType | undefined>(undefined)
  useEffect(() => {
    if (activeMotif && activeMotif !== prevMotifRef.current && matManagerRef.current) {
      prevMotifRef.current = activeMotif
      matManagerRef.current.applyPattern(activeMotif)
    }
  }, [activeMotif])

  // 4. 工艺阶段切换（保护用户器型与手绘纹样，绝不强制覆盖重置）
  useEffect(() => {
    const matManager = matManagerRef.current
    const kilnLight = kilnFireLightRef.current
    if (!matManager) return

    if (step === 'forming' || step === 'trim') {
      matManager.setGlaze('clay', false)
      if (kilnLight) kilnLight.intensity = 0
    } else if (step === 'pattern') {
      // 保持当前手绘或纹饰，不作无端覆盖重置
      matManager.setGlaze('qing', false)
      if (kilnLight) kilnLight.intensity = 0
      if (turntableGroupRef.current) {
        turntableGroupRef.current.rotation.y = 0
      }
    } else if (step === 'glaze') {
      // 根据用户选择的名釉切换真实材质贴图与厚度光泽
      matManager.setGlaze(activeGlaze, false)
      matManager.setGlazeThickness(glazeThickness)
      matManager.setGlazeGloss(glazeGloss)
      if (kilnLight) kilnLight.intensity = 0
    } else if (step === 'fire') {
      if (kilnLight) kilnLight.intensity = 2.8
    } else if (step === 'finish') {
      if (kilnLight) kilnLight.intensity = 0
      matManager.setGlaze(activeGlaze, true)
      if (turntableGroupRef.current) {
        turntableGroupRef.current.rotation.y = 0
      }
    }
  }, [step, activeGlaze, glazeThickness, glazeGloss])

  // 4. 柴窑烧制升温控制 (支持任意目标温度与强还原焰动态热力光晕)
  const triggerFiring = useCallback((targetTemp = 1280) => {
    if (isFiringActive) return
    setIsFiringActive(true)
    onFiringProgressRef.current?.(25, true)
    onToastRef.current?.('点火升温！柴窑松柴强还原焰闭窑烧制中…')

    let temp = 25
    const stepDelta = Math.max(20, Math.round((targetTemp - 25) / 28))
    const interval = window.setInterval(() => {
      temp += stepDelta
      if (temp >= targetTemp) {
        temp = targetTemp
        clearInterval(interval)
        setIsFiringActive(false)
        onFiringProgressRef.current?.(targetTemp, false)
        onToastRef.current?.(`窑温已达 ${targetTemp}°C！强还原气氛定色，釉层完全熔融玻化，开窑大吉！`)
        if (kilnFireLightRef.current) {
          kilnFireLightRef.current.intensity = 0
        }
      } else {
        onFiringProgressRef.current?.(temp, true)
        if (kilnFireLightRef.current) {
          const ratio = (temp - 25) / (targetTemp - 25)
          kilnFireLightRef.current.intensity = 3.6 * Math.sin(ratio * Math.PI)
        }
      }
      setFiringTemp(temp)
      const progress = (temp - 25) / (targetTemp - 25)
      matManagerRef.current?.updateFiringProgress(progress)
    }, 50)
  }, [isFiringActive])

  // 5. 鼠标拉坯形变、利坯修型与 3D 自由手绘上色
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = mountRef.current?.getBoundingClientRect()
    if (!rect || !cameraRef.current || !clayMeshRef.current) return

    isInteractingRef.current = true
    prevMouseRef.current = { x: e.clientX, y: e.clientY }

    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current)
    const hits = raycaster.intersectObject(clayMeshRef.current)

    if (hits.length > 0) {
      const hit = hits[0]
      activeHitYRef.current = hit.point.y

      // 纹样手绘模式下落笔着色
      if (step === 'pattern' && hit.uv && matManagerRef.current) {
        matManagerRef.current.paintAtUV(hit.uv.x, hit.uv.y, actualBrushSize, actualPaintColor, 0.9, actualIsEraser)
      }
    } else {
      activeHitYRef.current = null
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = mountRef.current?.getBoundingClientRect()
    if (!rect) return

    const deltaX = e.clientX - prevMouseRef.current.x
    const deltaY = e.clientY - prevMouseRef.current.y
    prevMouseRef.current = { x: e.clientX, y: e.clientY }

    if (cameraRef.current && clayMeshRef.current) {
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current)
      const hits = raycaster.intersectObject(clayMeshRef.current)
      setIsHoveringClay(hits.length > 0)

      // 按住手绘连续涂画
      if (isInteractingRef.current && step === 'pattern' && hits.length > 0) {
        const hit = hits[0]
        if (hit.uv && matManagerRef.current) {
          matManagerRef.current.paintAtUV(hit.uv.x, hit.uv.y, actualBrushSize, actualPaintColor, 0.85, actualIsEraser)
        }
        return
      }
    }

    if (!isInteractingRef.current) return

    // 模式 A：制坯 (拉坯拉伸/挤压)
    if (step === 'forming' && activeHitYRef.current !== null) {
      const builder = builderRef.current
      const mesh = clayMeshRef.current
      if (!mesh) return

      const screenCenterX = rect.left + rect.width / 2
      const isRightSide = e.clientX >= screenCenterX
      const direction = isRightSide ? 1 : -1
      const deltaR = deltaX * 0.045 * direction

      builder.deformAt(activeHitYRef.current, deltaR, 2.8, 'expand')
      builder.updateGeometryPositions(mesh.geometry)

      if (onMeasurementsChangeRef.current) {
        onMeasurementsChangeRef.current(
          parseFloat((builder.height * 2.2).toFixed(1)),
          parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1))
        )
      }
    }
    // 模式 B：修型 (利坯平滑微调)
    else if (step === 'trim' && activeHitYRef.current !== null) {
      const builder = builderRef.current
      const mesh = clayMeshRef.current
      if (!mesh) return

      builder.deformAt(activeHitYRef.current, 0, 3.4, 'smooth')
      builder.updateGeometryPositions(mesh.geometry)
    }
    // 模式 C：成品 360° 自由旋转检视
    else if (step === 'finish' && turntableGroupRef.current) {
      turntableGroupRef.current.rotation.y += deltaX * 0.015
      if (cameraRef.current) {
        cameraRef.current.position.y = Math.max(3, Math.min(22, cameraRef.current.position.y - deltaY * 0.04))
        cameraRef.current.lookAt(0, 6.5, 0)
      }
    }
  }

  const handlePointerUp = () => {
    isInteractingRef.current = false
    activeHitYRef.current = null
    builderRef.current.syncBaseline()
  }

  // 6. 导出方法 (GLB 3D模型, PDF海报, PDF身份证)
  const getSnapshot = useCallback((): string => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return ''
    rendererRef.current.render(sceneRef.current, cameraRef.current)
    return rendererRef.current.domElement.toDataURL('image/png')
  }, [])

  const handleExportGLB = useCallback(async () => {
    if (!clayMeshRef.current) return
    onToast?.('正在导出 3D 瓷器 (.glb) 模型…')
    await exportToGLB(clayMeshRef.current, 'jingdezhen-porcelain.glb')
    onToast?.('3D 模型已下载！可在 Win10/11 3D查看器打开')
  }, [onToast])

  const handleExportPoster = useCallback(async () => {
    const snap = getSnapshot()
    const builder = builderRef.current
    const meta: CeramicMetadata = {
      id: 'JDZ-' + Math.floor(1000 + Math.random() * 9000),
      name: '青花缠枝莲梅瓶 (数字孪生)',
      heightCm: parseFloat((builder.height * 2.2).toFixed(1)),
      rimCm: parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1)),
      glazeName:
        activeGlaze === 'matte' || activeGlaze === 'cha'
          ? '丝绸哑光微晶釉 (低反光 · 丝绢缎面)'
          : activeGlaze === 'jade'
          ? '温润凝脂羊脂玉釉 (柔光内敛 · 温润如脂)'
          : activeGlaze === 'crackle'
          ? '哥窑冰裂开片釉 (纹片折光 · 通透晶莹)'
          : activeGlaze === 'ripple' || activeGlaze === 'hua'
          ? '柴窑波浪水光釉 (橘皮微澜 · 水波微光)'
          : '高光玻璃透明釉 (晶莹纯澈 · 镜面反光)',
      kiln: '景德镇御窑厂遗址官窑',
      temperature: '1280 °C 柴窑还原气氛',
      date: new Date().toLocaleDateString('zh-CN'),
    }
    onToast?.('正在生成中文高清展陈海报 PDF…')
    await exportPosterPDF(meta, snap)
    onToast?.('中文展陈海报 PDF 已生成下载！')
  }, [getSnapshot, onToast, activeGlaze])

  const handleExportCert = useCallback(async () => {
    const snap = getSnapshot()
    const builder = builderRef.current
    const meta: CeramicMetadata = {
      id: 'JDZ-2026-' + Math.floor(1000 + Math.random() * 9000),
      name: '青花缠枝莲梅瓶',
      heightCm: parseFloat((builder.height * 2.2).toFixed(1)),
      rimCm: parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1)),
      glazeName:
        activeGlaze === 'matte' || activeGlaze === 'cha'
          ? '丝绸哑光微晶釉 (低反光 · 丝绢缎面)'
          : activeGlaze === 'jade'
          ? '温润凝脂羊脂玉釉 (柔光内敛 · 温润如脂)'
          : activeGlaze === 'crackle'
          ? '哥窑冰裂开片釉 (纹片折光 · 通透晶莹)'
          : activeGlaze === 'ripple' || activeGlaze === 'hua'
          ? '柴窑波浪水光釉 (橘皮微澜 · 水波微光)'
          : '高光玻璃透明釉 (晶莹纯澈 · 镜面反光)',
      kiln: '景德镇御窑厂遗址官窑',
      temperature: '1280 °C 柴窑高温强还原焰',
      date: new Date().toISOString().split('T')[0],
    }
    onToast?.('正在生成中文数字瓷器身份证 PDF…')
    await exportCertificatePDF(meta, snap)
    onToast?.('中文数字瓷器身份证 PDF 已生成下载！')
  }, [getSnapshot, onToast, activeGlaze])

  // 10. 暴露命令式句柄供左侧工具栏直接调用
  useImperativeHandle(ref, () => ({
    loadPreset: (preset: PresetType) => {
      const builder = builderRef.current
      const mesh = clayMeshRef.current
      if (!mesh) return
      builder.loadPreset(preset)
      builder.syncBaseline()
      builder.updateGeometryPositions(mesh.geometry)
      onMeasurementsChangeRef.current?.(
        parseFloat((builder.height * 2.2).toFixed(1)),
        parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1))
      )
    },
    applyMotif: (motif: MotifType) => {
      matManagerRef.current?.applyPattern(motif)
    },
    applySvgMotif: (svgCode: string) => {
      matManagerRef.current?.applySvgCode(svgCode)
      if (turntableGroupRef.current) {
        turntableGroupRef.current.rotation.y = 0
      }
    },
    setGlaze: (glaze: GlazeType) => {
      setIsGlazingAnimation(true)
      matManagerRef.current?.setGlaze(glaze, false)
      setTimeout(() => setIsGlazingAnimation(false), 800)
    },
    applyCustomPBR: (pbr: Record<string, number | string | undefined>) => {
      setIsGlazingAnimation(true)
      matManagerRef.current?.applyCustomPbr(pbr)
      setTimeout(() => setIsGlazingAnimation(false), 800)
    },
    smoothGeometry: () => {
      const builder = builderRef.current
      const mesh = clayMeshRef.current
      if (!mesh) return
      builder.smoothAll(3)
      builder.updateGeometryPositions(mesh.geometry)
      onMeasurementsChangeRef.current?.(
        parseFloat((builder.height * 2.2).toFixed(1)),
        parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1))
      )
      onToastRef.current?.('已完成利坯匀壁：高频抖动已消除，表面平顺光润！')
    },
    trimFoot: () => {
      const builder = builderRef.current
      const mesh = clayMeshRef.current
      if (!mesh) return
      builder.trimFoot(-0.15)
      builder.updateGeometryPositions(mesh.geometry)
      onMeasurementsChangeRef.current?.(
        parseFloat((builder.height * 2.2).toFixed(1)),
        parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1))
      )
      onToastRef.current?.('已完成修整圈足：倒扣修底足，圈足立墙挺拔规整！')
    },
    clearCanvas: () => {
      matManagerRef.current?.clearCanvas('#f8f6f0')
      onToastRef.current?.('已清空白胎，可直接进行自主手绘涂画！')
    },
    aiComposePattern: () => {
      matManagerRef.current?.aiGeneratePattern()
      onToastRef.current?.('AI 智能构图：已在瓶身绘制御窑对称如意云肩与缠枝宝相花纹饰！')
    },
    triggerFiring,
    applyProfilePoints: (points: Array<{ x?: number; r?: number; y: number }>) => {
      const builder = builderRef.current
      const mesh = clayMeshRef.current
      if (!mesh) return
      builder.applyProfilePoints(points)
      builder.syncBaseline()
      builder.updateGeometryPositions(mesh.geometry)
      onMeasurementsChangeRef.current?.(
        parseFloat((builder.height * 2.2).toFixed(1)),
        parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1))
      )
    },
    exportGLB: handleExportGLB,
    exportCert: handleExportCert,
    exportPoster: handleExportPoster,
    resetGeometry: () => {
      const builder = builderRef.current
      const mesh = clayMeshRef.current
      if (!mesh) return
      builder.loadPreset(activePreset)
      builder.adjustParameters(1.0, 1.0, 1.0)
      builder.syncBaseline()
      builder.updateGeometryPositions(mesh.geometry)
      onMeasurementsChangeRef.current?.(
        parseFloat((builder.height * 2.2).toFixed(1)),
        parseFloat((builder.outerRadii[builder.ringCount - 1] * 2.5).toFixed(1))
      )
      onToastRef.current?.('已复位泥料原始尺寸与形态')
    },
  }))

  return (
    <div
      className={`pottery-canvas-root ${isGlazingAnimation ? 'glazing-active' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor:
          step === 'forming'
            ? isHoveringClay ? 'ew-resize' : 'grab'
            : step === 'pattern'
            ? 'crosshair'
            : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* 柴窑阶段：纯光晕氛围，无阻挡按钮 */}
      {step === 'fire' && (
        <div className="fire-overlay">
          <div className="fire-glow-circle" />
        </div>
      )}

      {/* 手势操作提示指示徽章 (底部居中) */}
      <div className="canvas-hint-tag">
        {step === 'forming' && '✦ 鼠标在 3D 泥坯上左右拖拽拉坯，或通过左侧控制面板微调器型与尺寸'}
        {step === 'trim' && '✦ 鼠标在器物表面平滑利坯修足，或点击左侧「利坯匀壁」「修整圈足」自动精修'}
        {step === 'pattern' && '✦ 选用左侧传统纹样或矿物颜料调色盘，直接在 3D 瓶身涂画绘制！'}
        {step === 'glaze' && '✦ 左侧切换 5 款真实透明琉璃罩釉：底色彩绘完好保留，仅变换釉面反光与质感'}
        {step === 'fire' && `✦ 柴窑烧制中：当前窑温 ${firingTemp}°C · 1280°C 高温还原气氛熔融玻化成瓷`}
        {step === 'finish' && '✦ 鼠标拖拽 3D 瓷器可 360° 自由旋转环视，左侧支持导出 3D 模型与中文证书海报'}
      </div>
    </div>
  )
})
