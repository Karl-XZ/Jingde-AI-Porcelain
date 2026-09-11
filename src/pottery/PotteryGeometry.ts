import * as THREE from 'three'

export interface PotteryProfile {
  height: number
  wallThickness: number
  outerRadii: number[] // N points from bottom to top
}

export type PresetType = 'cylinder' | 'meiping' | 'yuhuchun' | 'bowl'

/**
 * 评估经过一系列控制点 [t, r] 的连续光滑三次 Catmull-Rom / Hermite 样条曲线 (0 <= t <= 1)
 */
function evaluateProfileSpline(points: [number, number][], t: number): number {
  if (points.length === 0) return 3.0
  if (points.length === 1) return points[0][1]

  const clampedT = Math.max(0, Math.min(1, t))
  if (clampedT <= points[0][0]) return points[0][1]
  if (clampedT >= points[points.length - 1][0]) return points[points.length - 1][1]

  let i = 0
  while (i < points.length - 1 && points[i + 1][0] < clampedT) {
    i++
  }

  const p0 = points[Math.max(0, i - 1)]
  const p1 = points[i]
  const p2 = points[Math.min(points.length - 1, i + 1)]
  const p3 = points[Math.min(points.length - 1, i + 2)]

  const span = p2[0] - p1[0]
  if (span <= 0.0001) return p1[1]

  const u = (clampedT - p1[0]) / span
  const u2 = u * u
  const u3 = u2 * u

  const m1 = 0.5 * (p2[1] - p0[1]) * (span / Math.max(0.001, p2[0] - p0[0]))
  const m2 = 0.5 * (p3[1] - p1[1]) * (span / Math.max(0.001, p3[0] - p1[0]))

  const h00 = 2 * u3 - 3 * u2 + 1
  const h10 = u3 - 2 * u2 + u
  const h01 = -2 * u3 + 3 * u2
  const h11 = u3 - u2

  return h00 * p1[1] + h10 * m1 + h01 * p2[1] + h11 * m2
}

export class PotteryGeometryBuilder {
  public ringCount: number
  public segments: number
  public height: number
  public wallThickness: number
  public outerRadii: Float32Array
  public initialRadii: Float32Array

  constructor(ringCount = 48, segments = 48, height = 14, wallThickness = 0.45) {
    this.ringCount = ringCount
    this.segments = segments
    this.height = height
    this.wallThickness = wallThickness
    this.outerRadii = new Float32Array(ringCount)
    this.initialRadii = new Float32Array(ringCount)
    this.loadPreset('cylinder')
  }

  /**
   * 加载经典景德镇器型预设（采用严格 C1 连续样条数学模型，彻底杜绝折角断层）
   */
  public loadPreset(preset: PresetType) {
    let keypoints: [number, number][] = []

    switch (preset) {
      case 'cylinder':
        // 初始生坯圆柱泥团：底部略宽，中间直筒，微收口
        keypoints = [
          [0.0, 3.6],
          [0.2, 3.55],
          [0.6, 3.5],
          [0.85, 3.45],
          [1.0, 3.4],
        ]
        break

      case 'meiping':
        // 经典宋明宣德梅瓶：小口如豆、短颈微敛、丰肩圆融、修腹敛足
        // 关键：肩部在 t=0.76 达到最高丰肩，随后平顺圆转收至束颈 t=0.94，严禁突兀硬棱角
        keypoints = [
          [0.0, 1.85],
          [0.08, 1.9],
          [0.22, 2.15],
          [0.45, 2.85],
          [0.65, 3.65],
          [0.76, 3.88], // 丰肩饱满点
          [0.85, 3.4],  // 肩部柔和收弧
          [0.92, 2.1],  // 颈部平顺收紧
          [0.96, 1.5],  // 小口束颈
          [1.0, 1.68],  // 微翻小唇口
        ]
        break

      case 'yuhuchun':
        // 经典玉壶春瓶：撇口、细颈、垂腹、圈足
        keypoints = [
          [0.0, 2.1],
          [0.10, 2.25],
          [0.28, 4.05], // 垂腹最高峰
          [0.48, 3.2],
          [0.72, 1.7],  // 细长柔美颈
          [0.88, 1.95], // 喇叭撇口起势
          [1.0, 3.15],  // 优美喇叭撇口沿
        ]
        break

      case 'bowl':
        // 景德镇宋代葵口斗笠碗：斜壁如笠，底小口阔
        keypoints = [
          [0.0, 1.75],
          [0.08, 1.85],
          [0.32, 3.25],
          [0.65, 4.95],
          [0.88, 5.95],
          [1.0, 6.4],
        ]
        break
    }

    for (let i = 0; i < this.ringCount; i++) {
      const t = i / (this.ringCount - 1)
      const r = evaluateProfileSpline(keypoints, t)
      this.outerRadii[i] = Math.max(0.9, Math.min(6.8, r))
      this.initialRadii[i] = this.outerRadii[i]
    }
  }

  /**
   * 获取某高度处的半径
   */
  public getRadiusAt(y: number): number {
    const clampedY = Math.max(0, Math.min(this.height, y))
    const t = clampedY / this.height
    const idxFloat = t * (this.ringCount - 1)
    const i0 = Math.floor(idxFloat)
    const i1 = Math.min(this.ringCount - 1, i0 + 1)
    const frac = idxFloat - i0
    return this.outerRadii[i0] * (1 - frac) + this.outerRadii[i1] * frac
  }

  /**
   * 实时拉坯形变（鼠标在陶轮拖拽时的物理形变算法）
   * @param targetY 击中高度 (0 ~ height)
   * @param deltaR 径向变化量 (正值膨胀/负值收缩)
   * @param brushRadius 影响范围高度半宽
   * @param mode 'expand' | 'pinch' | 'smooth'
   */
  public deformAt(
    targetY: number,
    deltaR: number,
    brushRadius = 2.6,
    mode: 'expand' | 'pinch' | 'smooth' = 'expand'
  ): void {
    const minR = 0.9
    const maxR = 6.8

    for (let i = 0; i < this.ringCount; i++) {
      const ringY = (i / (this.ringCount - 1)) * this.height
      const dist = Math.abs(ringY - targetY)

      if (dist < brushRadius) {
        // 余弦平滑衰减核
        const normDist = dist / brushRadius
        const weight = Math.cos(normDist * Math.PI * 0.5) ** 2

        if (mode === 'smooth') {
          // 修型平滑模式：向相邻层均值平滑
          const prev = this.outerRadii[Math.max(0, i - 1)]
          const next = this.outerRadii[Math.min(this.ringCount - 1, i + 1)]
          const avg = (prev + next) * 0.5
          this.outerRadii[i] += (avg - this.outerRadii[i]) * 0.25 * weight
        } else {
          // 拉坯/挤压模式
          this.outerRadii[i] += deltaR * weight
        }

        // 边界约束
        this.outerRadii[i] = Math.max(minR, Math.min(maxR, this.outerRadii[i]))
      }
    }
  }

  /**
   * 将当前塑型完成的半径保存为基础参考线（防止切换步骤或微调滑块时丢失手动塑形）
   */
  public syncBaseline(): void {
    this.initialRadii.set(this.outerRadii)
  }

  /**
   * 利坯匀壁：全器壁高频抖动消除与表面平滑
   */
  public smoothAll(iterations: number = 3): void {
    for (let it = 0; it < iterations; it++) {
      for (let i = 1; i < this.ringCount - 1; i++) {
        const prev = this.outerRadii[i - 1]
        const next = this.outerRadii[i + 1]
        const avg = (prev + next) * 0.5
        this.outerRadii[i] += (avg - this.outerRadii[i]) * 0.4
      }
    }
    this.syncBaseline()
  }

  /**
   * 修整圈足：倒扣陶轮修底足，规范圈足立墙
   */
  public trimFoot(footDelta: number = -0.15): void {
    for (let i = 0; i < Math.min(5, this.ringCount); i++) {
      this.outerRadii[i] = Math.max(1.0, this.outerRadii[i] + footDelta)
    }
    this.syncBaseline()
  }

  /**
   * 全体缩放/修坯参数联动 (采用全器身光滑高斯/smoothstep连续权重，永无截断褶皱)
   */
  public adjustParameters(heightScale: number, rimScale: number, bellyScale: number) {
    this.height = 14 * Math.max(0.55, Math.min(1.7, heightScale))

    // 寻找当前器型最丰满处 t_max (通常梅瓶在 t=0.76，玉壶春在 t=0.28，斗笠碗在 t=1.0)
    let maxIdx = 0
    let maxR = -1
    for (let i = 0; i < this.ringCount; i++) {
      if (this.initialRadii[i] > maxR) {
        maxR = this.initialRadii[i]
        maxIdx = i
      }
    }
    const tBellyPeak = Math.max(0.20, Math.min(0.80, maxIdx / (this.ringCount - 1)))

    // 全体周身缩放基底因子：若腹部与口径同向收缩或扩张（如口语“周身变细”），全器壁均按连贯权重整体形变
    let overallWidthRatio = 1.0
    if (bellyScale < 1.0 && rimScale < 1.0) {
      overallWidthRatio = Math.min(bellyScale, rimScale)
    } else if (bellyScale > 1.2 && rimScale > 1.2) {
      overallWidthRatio = (bellyScale + rimScale) * 0.5
    }

    for (let i = 0; i < this.ringCount; i++) {
      const t = i / (this.ringCount - 1)
      let baseR = this.initialRadii[i]

      // 0. 全身基础宽幅微调（如周身收细）
      if (overallWidthRatio !== 1.0) {
        baseR *= 1.0 + (overallWidthRatio - 1.0) * 0.75
      }

      // 1. 腹部/肩部专用膨胀衰减核：确保在口沿 (t > 0.88) 和底座 (t < 0.08) 处彻底衰减至 0，绝不破坏口沿与圈足
      let bellyWeight = 0
      if (t >= 0.08 && t <= 0.88) {
        const span = t < tBellyPeak ? (tBellyPeak - 0.08) : (0.88 - tBellyPeak)
        if (span > 0.001) {
          const normDist = Math.abs(t - tBellyPeak) / span
          if (normDist <= 1.0) {
            bellyWeight = Math.cos(normDist * Math.PI * 0.5) ** 2
          }
        }
      }
      baseR *= 1.0 + (bellyScale - 1.0) * bellyWeight

      // 2. 口沿独立缩放核：仅在顶部口沿束颈与外翻唇口 (t > 0.86) 起作用，平滑过渡至 t=1.0，绝不干扰肩部
      if (t > 0.86) {
        const normT = (t - 0.86) / 0.14
        const rimWeight = normT * normT * (3 - 2 * normT) // smoothstep
        baseR *= 1.0 + (rimScale - 1.0) * rimWeight
      }

      this.outerRadii[i] = Math.max(0.85, Math.min(6.8, baseR))
    }
  }

  /**
   * 应用 AI 逆推的历代官窑母线控制点并样条插值
   */
  public applyProfilePoints(points: Array<{ x?: number; r?: number; y: number }>) {
    if (!points || points.length < 2) return
    let minY = Infinity
    let maxY = -Infinity
    for (const p of points) {
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
    const spanY = Math.max(0.001, maxY - minY)

    const keypoints: [number, number][] = points.map((p) => {
      const t = (p.y - minY) / spanY
      const r = p.r !== undefined ? p.r : (p.x !== undefined ? p.x * 3.5 : 3.0)
      return [t, r]
    })
    keypoints.sort((a, b) => a[0] - b[0])

    for (let i = 0; i < this.ringCount; i++) {
      const t = i / (this.ringCount - 1)
      const r = evaluateProfileSpline(keypoints, t)
      this.outerRadii[i] = Math.max(0.9, Math.min(6.8, r))
      this.initialRadii[i] = this.outerRadii[i]
    }
  }

  /**
   * 构建完整的包含外壁、内壁、口沿与底座的 3D 双壁 BufferGeometry
   */
  public buildGeometry(): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    const N = this.ringCount
    const M = this.segments

    // 1. 构建外壁 (Outer Wall)
    // 顶点排列：ring 0 (底) -> ring N-1 (顶)，每层 M+1 个顶点 (闭合)
    for (let i = 0; i < N; i++) {
      const y = (i / (N - 1)) * this.height
      const r = this.outerRadii[i]
      const v = i / (N - 1)

      for (let j = 0; j <= M; j++) {
        const u = j / M
        const theta = u * Math.PI * 2
        const x = Math.sin(theta) * r
        const z = -Math.cos(theta) * r

        vertices.push(x, y, z)
        // 初始法线暂填水平法线，后续由 computeVertexNormals 精算
        normals.push(Math.sin(theta), 0, -Math.cos(theta))
        uvs.push(u, v)
      }
    }

    // 外壁三角形索引
    for (let i = 0; i < N - 1; i++) {
      for (let j = 0; j < M; j++) {
        const a = i * (M + 1) + j
        const b = (i + 1) * (M + 1) + j
        const c = (i + 1) * (M + 1) + (j + 1)
        const d = i * (M + 1) + (j + 1)
        indices.push(a, b, d)
        indices.push(b, c, d)
      }
    }

    // 2. 构建口沿 (Lip / Rim) 连接外壁顶部与内壁顶部
    const outerTopRingStart = (N - 1) * (M + 1)
    const innerTopRingStart = vertices.length / 3

    for (let j = 0; j <= M; j++) {
      const u = j / M
      const theta = u * Math.PI * 2
      const outR = this.outerRadii[N - 1]
      const inR = Math.max(0.3, outR - this.wallThickness)
      const y = this.height

      vertices.push(Math.sin(theta) * inR, y, -Math.cos(theta) * inR)
      normals.push(0, 1, 0)
      uvs.push(u, 1.0)
    }

    for (let j = 0; j < M; j++) {
      const a = outerTopRingStart + j
      const b = innerTopRingStart + j
      const c = innerTopRingStart + j + 1
      const d = outerTopRingStart + j + 1
      indices.push(a, b, d)
      indices.push(b, c, d)
    }

    // 3. 构建内壁 (Inner Wall) 从顶部向下到底部
    const innerWallStart = vertices.length / 3
    for (let i = 0; i < N; i++) {
      // 内部从上到下
      const origI = N - 1 - i
      const y = (origI / (N - 1)) * (this.height - this.wallThickness) + this.wallThickness
      const outR = this.outerRadii[origI]
      const inR = Math.max(0.25, outR - this.wallThickness)
      const v = 1 - i / (N - 1)

      for (let j = 0; j <= M; j++) {
        const u = j / M
        const theta = u * Math.PI * 2
        vertices.push(Math.sin(theta) * inR, y, -Math.cos(theta) * inR)
        normals.push(-Math.sin(theta), 0, Math.cos(theta))
        uvs.push(u, v)
      }
    }

    for (let i = 0; i < N - 1; i++) {
      for (let j = 0; j < M; j++) {
        const a = innerWallStart + i * (M + 1) + j
        const b = innerWallStart + (i + 1) * (M + 1) + j
        const c = innerWallStart + (i + 1) * (M + 1) + (j + 1)
        const d = innerWallStart + i * (M + 1) + (j + 1)
        indices.push(a, d, b)
        indices.push(b, d, c)
      }
    }

    // 4. 构建外底座封底 (Outer Bottom)
    const bottomCenterIdx = vertices.length / 3
    vertices.push(0, 0, 0)
    normals.push(0, -1, 0)
    uvs.push(0.5, 0)

    for (let j = 0; j < M; j++) {
      const a = bottomCenterIdx
      const b = j + 1
      const c = j
      indices.push(a, b, c)
    }

    // 5. 构建内底座封底 (Inner Bottom)
    const innerBottomCenterIdx = vertices.length / 3
    vertices.push(0, this.wallThickness, 0)
    normals.push(0, 1, 0)
    uvs.push(0.5, 0)

    const innerBottomRingStart = innerWallStart + (N - 1) * (M + 1)
    for (let j = 0; j < M; j++) {
      const a = innerBottomCenterIdx
      const b = innerBottomRingStart + j
      const c = innerBottomRingStart + j + 1
      indices.push(a, b, c)
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geom.setIndex(indices)
    geom.computeVertexNormals()

    return geom
  }

  /**
   * 极速原地更新已有几何体的顶点坐标（无需重新建索引，60fps拉坯手感）
   */
  public updateGeometryPositions(geom: THREE.BufferGeometry) {
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array

    const N = this.ringCount
    const M = this.segments
    let ptr = 0

    // 1. 更新外壁
    for (let i = 0; i < N; i++) {
      const y = (i / (N - 1)) * this.height
      const r = this.outerRadii[i]
      for (let j = 0; j <= M; j++) {
        const u = j / M
        const theta = u * Math.PI * 2
        posArray[ptr++] = Math.sin(theta) * r
        posArray[ptr++] = y
        posArray[ptr++] = -Math.cos(theta) * r
      }
    }

    // 2. 更新口沿内圈
    for (let j = 0; j <= M; j++) {
      const u = j / M
      const theta = u * Math.PI * 2
      const outR = this.outerRadii[N - 1]
      const inR = Math.max(0.3, outR - this.wallThickness)
      posArray[ptr++] = Math.sin(theta) * inR
      posArray[ptr++] = this.height
      posArray[ptr++] = -Math.cos(theta) * inR
    }

    // 3. 更新内壁
    for (let i = 0; i < N; i++) {
      const origI = N - 1 - i
      const y = (origI / (N - 1)) * (this.height - this.wallThickness) + this.wallThickness
      const outR = this.outerRadii[origI]
      const inR = Math.max(0.25, outR - this.wallThickness)
      for (let j = 0; j <= M; j++) {
        const u = j / M
        const theta = u * Math.PI * 2
        posArray[ptr++] = Math.sin(theta) * inR
        posArray[ptr++] = y
        posArray[ptr++] = -Math.cos(theta) * inR
      }
    }

    // 4. 外底座中心点
    posArray[ptr++] = 0
    posArray[ptr++] = 0
    posArray[ptr++] = 0

    // 5. 内底座中心点
    posArray[ptr++] = 0
    posArray[ptr++] = this.wallThickness
    posArray[ptr++] = 0

    posAttr.needsUpdate = true
    geom.computeVertexNormals()
  }
}
