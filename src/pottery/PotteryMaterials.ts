import * as THREE from 'three'
import {
  renderQinghuaMotif,
  renderAICompositeMotif,
  generateLangyaoCanvas,
  generateHuayouCanvas,
  generateChayemoCanvas,
  type MotifType,
} from './patterns'

export type GlazeType = 'clay' | 'gloss' | 'jade' | 'matte' | 'crackle' | 'ripple' | 'qing' | 'lang' | 'hua' | 'cha'

export class PotteryMaterialManager {
  // 基础贴图画布 (承载用户手绘与青花纹样)
  public canvas: HTMLCanvasElement
  public ctx: CanvasRenderingContext2D
  public texture: THREE.CanvasTexture

  // 名釉专属高精物理材质贴图
  // 泥料生坯真实拉坯指纹旋纹贴图
  public clayTexture: THREE.CanvasTexture

  // 名釉专属高精物理材质贴图
  public langyaoTexture: THREE.CanvasTexture
  public huayouTexture: THREE.CanvasTexture
  public chayemoTexture: THREE.CanvasTexture

  // PBR 物理级材质
  public material: THREE.MeshPhysicalMaterial
  private currentGlaze: GlazeType = 'clay'
  public currentMotif: MotifType = 'lotus'
  public hasUserPainting = false

  constructor(width = 1024, height = 1024) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    const context = this.canvas.getContext('2d')
    if (!context) throw new Error('Cannot get 2D context')
    this.ctx = context

    // 默认初始为陶土生坯泥料色
    this.ctx.fillStyle = '#c5a075'
    this.ctx.fillRect(0, 0, width, height)

    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.wrapS = THREE.RepeatWrapping
    this.texture.wrapT = THREE.ClampToEdgeWrapping

    // 预先生成景德镇高岭土拉坯旋纹贴图
    this.clayTexture = this.createClayTexture(width, height)

    // 预先生成景德镇国宝名釉的真实纹理贴图
    const langCanvas = generateLangyaoCanvas(width, height)
    this.langyaoTexture = new THREE.CanvasTexture(langCanvas)
    this.langyaoTexture.wrapS = THREE.RepeatWrapping
    this.langyaoTexture.wrapT = THREE.ClampToEdgeWrapping

    const huaCanvas = generateHuayouCanvas(width, height)
    this.huayouTexture = new THREE.CanvasTexture(huaCanvas)
    this.huayouTexture.wrapS = THREE.RepeatWrapping
    this.huayouTexture.wrapT = THREE.ClampToEdgeWrapping

    const chaCanvas = generateChayemoCanvas(width, height)
    this.chayemoTexture = new THREE.CanvasTexture(chaCanvas)
    this.chayemoTexture.wrapS = THREE.RepeatWrapping
    this.chayemoTexture.wrapT = THREE.ClampToEdgeWrapping

    // 默认 PBR 物理材质 (真实高岭土生坯)
    this.material = new THREE.MeshPhysicalMaterial({
      map: this.clayTexture,
      roughness: 0.88,
      metalness: 0.01,
      clearcoat: 0.0,
      clearcoatRoughness: 0.5,
      side: THREE.DoubleSide,
    })
  }

  /**
   * 生成景德镇麻仓高岭土真实微观矿物颗粒与陶轮拉坯指痕旋纹贴图
   */
  private createClayTexture(width = 1024, height = 1024): THREE.CanvasTexture {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    const ctx = c.getContext('2d')!

    // 1. 高岭土温润黄褐基色
    ctx.fillStyle = '#c79f72'
    ctx.fillRect(0, 0, width, height)

    // 2. 陶轮旋转指纹拉坯旋纹 (Throwing rings & grooves)
    for (let y = 0; y < height; y += 4) {
      const wave = Math.sin(y * 0.12) * 5 + Math.sin(y * 0.035) * 7
      const alpha = 0.06 + Math.sin(y * 0.22) * 0.04
      ctx.fillStyle = wave > 0 ? `rgba(240, 222, 198, ${alpha})` : `rgba(142, 102, 65, ${alpha})`
      ctx.fillRect(0, y, width, 4)
    }

    // 3. 高岭土细微矿物颗粒噪点
    const imgData = ctx.getImageData(0, 0, width, height)
    const d = imgData.data
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16
      d[i] = Math.min(255, Math.max(0, d[i] + noise))
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise))
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise))
    }
    ctx.putImageData(imgData, 0, 0)

    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    return tex
  }

  /**
   * 应用传统纹饰预设（缠枝莲、云水龙、冰裂梅、蕉叶纹、素白素胎）
   */
  public applyPattern(motif: MotifType = 'lotus') {
    this.currentMotif = motif
    renderQinghuaMotif(this.ctx, this.canvas.width, this.canvas.height, motif)
    this.texture.needsUpdate = true
    this.material.map = this.texture
    this.material.color.setHex(0xffffff)
    this.material.needsUpdate = true
    this.hasUserPainting = false
  }

  /**
   * AI 智能辅助构图：生成对称如意云肩与缠枝宝相花构图
   */
  public aiGeneratePattern() {
    renderAICompositeMotif(this.ctx, this.canvas.width, this.canvas.height)
    this.texture.needsUpdate = true
    this.material.map = this.texture
    this.material.color.setHex(0xffffff)
    this.material.needsUpdate = true
    this.hasUserPainting = true
    this.currentMotif = 'lotus'
  }

  /**
   * 应用 DeepSeek 生成的 SVG 矢量青花/彩绘代码 (圆周无缝连续映射)
   */
  public applySvgCode(svgCode: string): Promise<void> {
    return new Promise((resolve) => {
      if (!svgCode || !svgCode.includes('<svg')) {
        resolve()
        return
      }

      // 清洗并规范化 SVG 代码
      let cleanSvg = svgCode.trim()
      cleanSvg = cleanSvg.replace(/^```(?:xml|svg)?/i, '').replace(/```$/, '').trim()

      // 补齐 xmlns 与 viewBox 属性，确保浏览器 Image 对象 100% 能够解析渲染
      if (!cleanSvg.includes('xmlns=')) {
        cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      }
      if (!cleanSvg.includes('viewBox=')) {
        cleanSvg = cleanSvg.replace('<svg', '<svg viewBox="0 0 1024 1024"')
      }
      if (!cleanSvg.includes('width=')) {
        cleanSvg = cleanSvg.replace('<svg', '<svg width="1024" height="1024"')
      }

      // 客户端自愈：使用 DOMParser 检测是否有 parsererror
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(cleanSvg, 'image/svg+xml')
        if (doc.querySelector('parsererror')) {
          console.warn('[PotteryMaterials] XML parsererror detected, auto-healing container tags...')
          const containers = ['g', 'defs', 'linearGradient', 'radialGradient', 'pattern']
          for (const c of containers) {
            const openCount = (cleanSvg.match(new RegExp(`<${c}[\\s>]`, 'g')) || []).length
            const closeCount = (cleanSvg.match(new RegExp(`</${c}>`, 'g')) || []).length
            if (openCount > closeCount) {
              cleanSvg += `\n</${c}>`.repeat(openCount - closeCount)
            }
          }
          if (!cleanSvg.includes('</svg>')) {
            cleanSvg += '\n</svg>'
          }
        }
      } catch (e) {
        console.warn('[PotteryMaterials] DOMParser exception:', e)
      }

      const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        // 1. 底层填白瓷羊脂白胎基色
        this.ctx.fillStyle = '#f8f6f0'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        // 2. 将正统青花大作按圆周环形映射
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height)

        this.texture.needsUpdate = true
        this.material.map = this.texture
        this.material.color.setHex(0xffffff)
        this.material.needsUpdate = true
        this.hasUserPainting = true
        URL.revokeObjectURL(url)
        resolve()
      }
      img.onerror = (err) => {
        console.warn('[PotteryMaterials] SVG image render error, applying fallback motif:', err)
        this.applyPattern('lotus')
        URL.revokeObjectURL(url)
        resolve()
      }
      img.src = url
    })
  }

  /**
   * 应用 DeepSeek 逆推生成的名贵罩釉 PBR 光学参数
   */
  public applyCustomPbr(pbr: {
    roughness?: number
    metalness?: number
    clearcoat?: number
    clearcoatRoughness?: number
    transmission?: number
    ior?: number
    colorTint?: string
    sheen?: number
  }) {
    if (pbr.roughness !== undefined) this.material.roughness = pbr.roughness
    if (pbr.metalness !== undefined) this.material.metalness = pbr.metalness
    if (pbr.clearcoat !== undefined) this.material.clearcoat = pbr.clearcoat
    if (pbr.clearcoatRoughness !== undefined) this.material.clearcoatRoughness = pbr.clearcoatRoughness
    // 透光率限制在半透玉质感范围内，防止过高透光导致瓷瓶变透明玻璃
    if (pbr.transmission !== undefined) this.material.transmission = Math.min(0.22, pbr.transmission)
    if (pbr.ior !== undefined) this.material.ior = pbr.ior
    if (pbr.sheen !== undefined) {
      this.material.sheen = pbr.sheen
      this.material.sheenRoughness = 0.35
      this.material.sheenColor.set(pbr.colorTint || '#dff2f2')
    }
    if (pbr.colorTint) {
      this.material.color.set(pbr.colorTint)
    } else {
      this.material.color.setHex(0xffffff)
    }
    this.material.needsUpdate = true
  }

  /**
   * 清空白胎，方便用户 100% 自主手绘
   */
  public clearCanvas(color = '#f8f6f0') {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.texture.needsUpdate = true
    this.material.map = this.texture
    this.material.color.setHex(0xffffff)
    this.material.needsUpdate = true
    this.hasUserPainting = false
    this.currentMotif = 'blank'
  }

  /**
   * 在 3D 瓷瓶表面手绘上色或橡皮擦
   * @param u UV横坐标 (0~1)
   * @param v UV纵坐标 (0~1)
   * @param brushSize 笔刷粗细
   * @param color 矿物颜料色彩
   * @param alpha 透明度 / 水墨浓淡
   * @param isEraser 是否为橡皮擦
   */
  public paintAtUV(
    u: number,
    v: number,
    brushSize = 12,
    color = '#183e78',
    alpha = 0.9,
    isEraser = false
  ) {
    const x = u * this.canvas.width
    // Three.js UV 中 v=0 为底，v=1 为顶；Canvas 中 y=0 为顶
    const y = (1 - v) * this.canvas.height

    this.ctx.save()

    if (isEraser) {
      // 橡皮擦：擦除回复白瓷胎骨底色
      this.ctx.globalAlpha = 1.0
      this.ctx.fillStyle = '#f8f6f0'
      this.ctx.beginPath()
      this.ctx.arc(x, y, brushSize * 1.5, 0, Math.PI * 2)
      this.ctx.fill()
    } else {
      // 毛笔着色
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = color
      this.ctx.beginPath()
      this.ctx.arc(x, y, brushSize, 0, Math.PI * 2)
      this.ctx.fill()

      // 水墨毛笔边缘晕染微渗透质感
      this.ctx.globalAlpha = alpha * 0.35
      this.ctx.beginPath()
      this.ctx.arc(x, y, brushSize * 1.5, 0, Math.PI * 2)
      this.ctx.fill()
    }

    this.ctx.restore()

    this.hasUserPainting = true
    this.texture.needsUpdate = true
    this.material.map = this.texture
    this.material.color.setHex(0xffffff)
  }

  /**
   * 切换真实名贵罩釉质感与反光效果
   * 核心准则：上釉过程不改变任何颜色（底色彩绘与手绘完全保留在透明罩釉层之下），但全面改变表面粗糙度、清漆厚度、折射与镜面高光反光质感！
   */
  public setGlaze(glaze: GlazeType, isFired = false) {
    this.currentGlaze = glaze

    if (glaze === 'clay') {
      // 生坯 / 修型素胎阶段：真实高岭土拉坯旋纹质感，无任何罩釉
      this.material.map = this.clayTexture
      this.material.color.setHex(0xffffff)
      this.material.roughness = isFired ? 0.65 : 0.88
      this.material.metalness = 0.01
      this.material.clearcoat = 0.0
      this.material.clearcoatRoughness = 0.5
      this.material.emissive.setHex(0x000000)
      this.material.emissiveIntensity = 0
      this.material.needsUpdate = true
      return
    }

    // 核心准则：进入纹样/施釉/成品阶段，贴图始终为包含用户手绘与纹样的 this.texture，绝不破坏覆盖颜色！
    this.material.map = this.texture
    this.material.color.setHex(0xffffff)
    if (isFired) {
      // 成瓷冷却玻化出窑状态
      this.material.emissive.setHex(0x000000)
      this.material.emissiveIntensity = 0
    }

    // 调节表面物理质感、高光反射强度、粗糙度与清漆折射
    switch (glaze) {
      case 'gloss':
      case 'qing':
      default:
        // 【高光玻璃透明釉】景德镇御窑最经典的青花高光透明罩釉
        // 质感：晶莹剔透，纯澈明镜，反光强烈锐利
        this.material.roughness = isFired ? 0.03 : 0.28
        this.material.metalness = 0.01
        this.material.clearcoat = isFired ? 1.0 : 0.75
        this.material.clearcoatRoughness = isFired ? 0.02 : 0.08
        this.material.ior = 1.54
        break

      case 'jade':
        // 【温润凝脂釉】永乐甜白与羊脂白玉质感
        // 质感：柔光漫反射，高光内敛温润，抚之如凝脂
        this.material.roughness = isFired ? 0.22 : 0.44
        this.material.metalness = 0.02
        this.material.clearcoat = isFired ? 0.65 : 0.45
        this.material.clearcoatRoughness = isFired ? 0.18 : 0.26
        this.material.ior = 1.48
        break

      case 'matte':
      case 'cha':
        // 【丝绸哑光釉】类似定窑、茶叶末微晶析出的哑光丝绢质感
        // 质感：无刺眼浮光，极低反光，呈现柔润细腻的丝绸缎面光泽
        this.material.roughness = isFired ? 0.55 : 0.72
        this.material.metalness = 0.03
        this.material.clearcoat = isFired ? 0.10 : 0.04
        this.material.clearcoatRoughness = isFired ? 0.42 : 0.52
        this.material.ior = 1.42
        break

      case 'crackle':
        // 【冰裂开片釉】哥窑冰裂断纹折射
        // 质感：通透罩釉，底层彩绘完好透出，釉面高光反射带有冰裂开片折光
        this.material.roughness = isFired ? 0.08 : 0.32
        this.material.metalness = 0.03
        this.material.clearcoat = isFired ? 0.95 : 0.68
        this.material.clearcoatRoughness = isFired ? 0.06 : 0.12
        this.material.ior = 1.56
        break

      case 'ripple':
      case 'hua':
      case 'lang':
        // 【柴窑水光釉】景德镇马鞍镇窑松柴烧成特有的水波微澜、橘皮微光起伏
        // 质感：侧光下呈现波光粼粼的微波反光，古法手工韵味浓郁
        this.material.roughness = isFired ? 0.14 : 0.36
        this.material.metalness = 0.03
        this.material.clearcoat = isFired ? 0.88 : 0.58
        this.material.clearcoatRoughness = isFired ? 0.14 : 0.22
        this.material.ior = 1.52
        break
    }

    this.material.needsUpdate = true
  }

  /**
   * 动态微调施釉厚度 (0.4 ~ 1.6)
   */
  public setGlazeThickness(factor: number) {
    const clamped = Math.max(0.4, Math.min(1.6, factor))
    this.material.clearcoat = Math.min(1.0, this.material.clearcoat * clamped)
    this.material.needsUpdate = true
  }

  /**
   * 动态微调釉面反光光泽度 (0.05 ~ 1.0)
   */
  public setGlazeGloss(gloss: number) {
    const clamped = Math.max(0.05, Math.min(1.0, gloss))
    this.material.roughness = (1 - clamped) * 0.58 + 0.02
    this.material.clearcoatRoughness = (1 - clamped) * 0.3 + 0.01
    this.material.needsUpdate = true
  }

  /**
   * 烧制动态温控过渡 (0 = 常温生坯, 1 = 1280°C~1300°C 熔融成瓷)
   * 真实黑体热辐射白炽自发光 (Thermal Blackbody Incandescence)
   */
  public updateFiringProgress(progress: number, currentTemp?: number) {
    const p = Math.max(0, Math.min(1, progress))
    const temp = currentTemp ?? (25 + p * (1300 - 25))

    // 1. 物理光学表面熔融玻化
    if (this.currentGlaze === 'clay') {
      this.material.roughness = 0.85 - p * 0.2
      this.material.clearcoat = p * 0.3
    } else if (this.currentGlaze === 'matte' || this.currentGlaze === 'cha') {
      this.material.roughness = 0.68 - p * 0.13
      this.material.clearcoat = p * 0.12
    } else {
      // 釉面逐渐玻化熔融，清漆镜面高光浮现
      this.material.roughness = 0.45 - p * 0.41
      this.material.clearcoat = p * 1.0
      this.material.clearcoatRoughness = 0.22 - p * 0.20
    }

    // 2. 1300°C 柴窑热力学白炽自发光相变 (黑体辐射定律普朗克拟合)
    if (temp < 600) {
      this.material.emissive.setHex(0x000000)
      this.material.emissiveIntensity = 0
    } else if (temp < 900) {
      // 600°C ~ 900°C: 暗红微炽 -> 樱桃红热
      const ratio = (temp - 600) / 300
      this.material.emissive.setHex(0x992200)
      this.material.emissiveIntensity = ratio * 0.6
    } else if (temp < 1150) {
      // 900°C ~ 1150°C: 炽热金橙
      const ratio = (temp - 900) / 250
      this.material.emissive.setHex(0xee5500)
      this.material.emissiveIntensity = 0.6 + ratio * 0.8
    } else {
      // 1150°C ~ 1300°C+: 白炽耀眼、通体透亮、釉熔如水
      const ratio = Math.min(1, (temp - 1150) / 150)
      this.material.emissive.setHex(0xffaa33)
      this.material.emissiveIntensity = 1.4 + ratio * 1.2
    }
    this.material.needsUpdate = true
  }

  public getGlaze(): GlazeType {
    return this.currentGlaze
  }
}
