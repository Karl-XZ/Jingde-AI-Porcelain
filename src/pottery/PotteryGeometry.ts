import * as THREE from 'three'

export interface PotteryProfile {
  height: number
  wallThickness: number
  outerRadii: number[] // N points from bottom to top
}

export type PresetType = 'cylinder' | 'meiping' | 'yuhuchun' | 'bowl'

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
   * 加载经典景德镇器型预设
   */
  public loadPreset(preset: PresetType) {
    for (let i = 0; i < this.ringCount; i++) {
      const t = i / (this.ringCount - 1) // 0 (bottom) to 1 (top)
      let r = 3.5

      switch (preset) {
        case 'cylinder':
          // 初始生坯圆柱泥团：底部略宽，中间直筒，口沿微收
          r = 3.6 - t * 0.4 + Math.sin(t * Math.PI) * 0.2
          break

        case 'meiping':
          // 梅瓶：小口、短颈、丰肩、修腹、窄底
          if (t < 0.15) {
            // 圈足至下腹
            r = 2.2 + (t / 0.15) * 0.8
          } else if (t < 0.72) {
            // 丰肩
            const st = (t - 0.15) / 0.57
            r = 3.0 + Math.sin(st * Math.PI * 0.85) * 2.2
          } else if (t < 0.92) {
            // 束颈
            const st = (t - 0.72) / 0.2
            r = 4.8 - st * 3.3
          } else {
            // 小唇口
            const st = (t - 0.92) / 0.08
            r = 1.5 + Math.sin(st * Math.PI) * 0.35
          }
          break

        case 'yuhuchun':
          // 玉壶春瓶：撇口、细颈、垂腹、圈足
          if (t < 0.45) {
            // 垂腹
            r = 2.4 + Math.sin((t / 0.45) * Math.PI * 0.9) * 2.6
          } else if (t < 0.8) {
            // 细长颈
            const st = (t - 0.45) / 0.35
            r = 3.8 - st * 2.3
          } else {
            // 喇叭撇口
            const st = (t - 0.8) / 0.2
            r = 1.5 + Math.pow(st, 1.8) * 1.6
          }
          break

        case 'bowl':
          // 景德镇葵口斗笠碗
          if (t < 0.1) {
            r = 2.0
          } else {
            const st = (t - 0.1) / 0.9
            r = 2.0 + Math.pow(st, 0.7) * 4.2
          }
          break
      }

      this.outerRadii[i] = r
      this.initialRadii[i] = r
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
   * 全体缩放/修坯参数联动 (用于制坯滑块控制)
   */
  public adjustParameters(heightScale: number, rimScale: number, bellyScale: number) {
    this.height = 14 * heightScale
    for (let i = 0; i < this.ringCount; i++) {
      const t = i / (this.ringCount - 1)
      let baseR = this.initialRadii[i]

      // 瓶口缩放
      if (t > 0.75) {
        const factor = (t - 0.75) / 0.25
        baseR *= 1 + (rimScale - 1) * factor
      }
      // 瓶腹缩放
      if (t > 0.2 && t < 0.8) {
        const factor = Math.sin(((t - 0.2) / 0.6) * Math.PI)
        baseR *= 1 + (bellyScale - 1) * factor
      }

      this.outerRadii[i] = Math.max(0.9, Math.min(6.8, baseR))
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
        const x = Math.cos(theta) * r
        const z = Math.sin(theta) * r

        vertices.push(x, y, z)
        // 初始法线暂填水平法线，后续由 computeVertexNormals 精算
        normals.push(Math.cos(theta), 0, Math.sin(theta))
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

      vertices.push(Math.cos(theta) * inR, y, Math.sin(theta) * inR)
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
        vertices.push(Math.cos(theta) * inR, y, Math.sin(theta) * inR)
        normals.push(-Math.cos(theta), 0, -Math.sin(theta))
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
        posArray[ptr++] = Math.cos(theta) * r
        posArray[ptr++] = y
        posArray[ptr++] = Math.sin(theta) * r
      }
    }

    // 2. 更新口沿内圈
    for (let j = 0; j <= M; j++) {
      const u = j / M
      const theta = u * Math.PI * 2
      const outR = this.outerRadii[N - 1]
      const inR = Math.max(0.3, outR - this.wallThickness)
      posArray[ptr++] = Math.cos(theta) * inR
      posArray[ptr++] = this.height
      posArray[ptr++] = Math.sin(theta) * inR
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
        posArray[ptr++] = Math.cos(theta) * inR
        posArray[ptr++] = y
        posArray[ptr++] = Math.sin(theta) * inR
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
