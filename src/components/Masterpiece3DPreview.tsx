import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { PotteryGeometryBuilder, type PresetType } from '../pottery/PotteryGeometry'
import {
  renderQinghuaMotif,
  generateLangyaoCanvas,
  generateHuayouCanvas,
  generateChayemoCanvas,
  type MotifType,
} from '../pottery/patterns'
import { type GlazeType } from '../pottery/PotteryMaterials'

interface Masterpiece3DPreviewProps {
  preset: PresetType
  glaze: GlazeType
  motif: MotifType
  colorTheme: string
  name: string
}

/**
 * 案例欣赏卡片内部的真实 3D 瓷器模型预览组件
 * 支持 360° 缓慢自动旋转与鼠标悬停/拖拽赏鉴
 */
export function Masterpiece3DPreview({
  preset,
  glaze,
  motif,
  colorTheme,
  name,
}: Masterpiece3DPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isInteracting, setIsInteracting] = useState(false)

  const isDraggingRef = useRef(false)
  const prevMouseXRef = useRef(0)
  const groupRef = useRef<THREE.Group | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const speedRef = useRef(0.009)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 320
    const height = container.clientHeight || 200

    const scene = new THREE.Scene()

    // 针对碗与瓶不同高宽比，调整相机距离与俯视角
    const isBowl = preset === 'bowl'
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100)
    if (isBowl) {
      // 斗笠碗：较大俯视角度以便观察敞口刻花与碗内壁
      camera.position.set(0, 8.5, 23)
      camera.lookAt(0, 3.8, 0)
    } else {
      // 梅瓶/观音尊/双耳瓶：直立端庄视距
      camera.position.set(0, 6.2, 28)
      camera.lookAt(0, 5.8, 0)
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // 灯光体系：暖调主光 + 边缘轮廓冷光
    const ambientLight = new THREE.AmbientLight(0xfcf6ed, 1.1)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.4)
    keyLight.position.set(10, 18, 14)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x5ca0e5, 1.3)
    rimLight.position.set(-14, 12, -12)
    scene.add(rimLight)

    const groundLight = new THREE.PointLight(0xc98c48, 0.5, 15)
    groundLight.position.set(0, -2, 6)
    scene.add(groundLight)

    // 旋转实体组
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    groupRef.current = modelGroup

    // 1. 根据真实器型预设构建 3D 双壁几何体
    const builder = new PotteryGeometryBuilder(44, 44, isBowl ? 7.8 : 13.0, 0.42)
    builder.loadPreset(preset)

    if (preset === 'bowl') {
      builder.adjustParameters(0.75, 1.48, 1.0)
    } else if (preset === 'yuhuchun') {
      builder.adjustParameters(0.96, 1.08, 1.14)
    } else if (preset === 'meiping') {
      builder.adjustParameters(1.02, 0.95, 1.04)
    }

    const geometry = builder.buildGeometry()
    geometry.computeVertexNormals()

    // 2. 生成贴图与 PBR 陶瓷物理材质
    let canvas: HTMLCanvasElement
    if (glaze === 'lang') {
      canvas = generateLangyaoCanvas(512, 512)
    } else if (glaze === 'hua') {
      canvas = generateHuayouCanvas(512, 512)
    } else if (glaze === 'cha') {
      canvas = generateChayemoCanvas(512, 512)
    } else {
      // 青花或影青
      canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      if (ctx) {
        if (preset === 'bowl') {
          // 北宋影青暗刻水波纹
          ctx.fillStyle = '#edf6f3'
          ctx.fillRect(0, 0, 512, 512)
          ctx.strokeStyle = '#93c2b7'
          ctx.lineWidth = 1.6
          ctx.globalAlpha = 0.5
          for (let r = 80; r < 480; r += 70) {
            ctx.beginPath()
            ctx.arc(256, 256, r, 0, Math.PI * 2)
            ctx.stroke()
          }
        } else {
          renderQinghuaMotif(ctx, 512, 512, motif)
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true

    const material = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0xffffff,
      roughness: glaze === 'cha' ? 0.52 : glaze === 'lang' ? 0.07 : 0.06,
      metalness: glaze === 'cha' ? 0.12 : 0.02,
      clearcoat: glaze === 'cha' ? 0.25 : 1.0,
      clearcoatRoughness: glaze === 'cha' ? 0.3 : 0.04,
      ior: 1.52,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = isBowl ? 0.4 : 0.5
    modelGroup.add(mesh)

    // 3. 仿紫檀雕花微型底座
    const baseGeo = new THREE.CylinderGeometry(
      isBowl ? 3.0 : 2.5,
      isBowl ? 3.2 : 2.7,
      0.35,
      32
    )
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1c100a,
      roughness: 0.6,
      metalness: 0.1,
    })
    const baseMesh = new THREE.Mesh(baseGeo, baseMat)
    baseMesh.position.y = isBowl ? 0.18 : 0.25
    modelGroup.add(baseMesh)

    // 4. 动画与自转循环
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)

      if (modelGroup && !isDraggingRef.current) {
        modelGroup.rotation.y += speedRef.current
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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      texture.dispose()
      baseGeo.dispose()
      baseMat.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [preset, glaze, motif])

  // 鼠标交互控制
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    prevMouseXRef.current = e.clientX
    setIsInteracting(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !groupRef.current) return
    const deltaX = e.clientX - prevMouseXRef.current
    prevMouseXRef.current = e.clientX
    groupRef.current.rotation.y += deltaX * 0.015
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
    setIsInteracting(false)
  }

  return (
    <div
      className="masterpiece-3d-wrapper"
      style={{ '--halo-color': colorTheme } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onMouseEnter={() => { speedRef.current = 0.018 }}
      onMouseLeave={() => { speedRef.current = 0.009 }}
      title={`${name} · 按住鼠标可 360° 旋转观察`}
    >
      <div className="preview-ambient-glow" />
      <div ref={mountRef} className="masterpiece-3d-canvas" />
      <div className="preview-float-tag">
        <span className="p-dot" />
        <span className="p-text">{isInteracting ? '拖拽旋转中' : '3D 真实模型'}</span>
      </div>
    </div>
  )
}
