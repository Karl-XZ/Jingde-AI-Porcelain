import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { jsPDF } from 'jspdf'

export interface CeramicMetadata {
  id: string
  name: string
  heightCm: number
  rimCm: number
  glazeName: string
  kiln: string
  temperature: string
  date: string
}

/**
 * 导出 3D 瓷器为通用的二进制 .glb 文件
 */
export async function exportToGLB(mesh: THREE.Mesh, filename = 'jingdezhen-pottery.glb'): Promise<void> {
  const exporter = new GLTFExporter()

  return new Promise((resolve, reject) => {
    exporter.parse(
      mesh,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          const blob = new Blob([gltf], { type: 'model/gltf-binary' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = filename
          link.click()
          URL.revokeObjectURL(link.href)
          resolve()
        } else {
          const output = JSON.stringify(gltf, null, 2)
          const blob = new Blob([output], { type: 'application/json' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = filename.replace('.glb', '.gltf')
          link.click()
          URL.revokeObjectURL(link.href)
          resolve()
        }
      },
      (error) => {
        console.error('GLTF export error:', error)
        reject(error)
      },
      { binary: true }
    )
  })
}

/**
 * 辅助函数：绘制传统中式回纹角饰
 */
function drawCornerFretwork(ctx: CanvasRenderingContext2D, cx: number, cy: number, flipX: number, flipY: number, size = 32) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(flipX, flipY)
  ctx.strokeStyle = '#c9a24f'
  ctx.lineWidth = 2.5

  ctx.beginPath()
  ctx.moveTo(0, size)
  ctx.lineTo(0, 0)
  ctx.lineTo(size, 0)

  ctx.moveTo(7, size - 5)
  ctx.lineTo(7, 7)
  ctx.lineTo(size - 5, 7)

  ctx.moveTo(14, size - 12)
  ctx.lineTo(14, 14)
  ctx.lineTo(size - 12, 14)
  ctx.stroke()

  ctx.restore()
}

/**
 * 辅助函数：绘制景德镇御窑传统朱砂印章 (大红金石篆刻阳文)
 */
function drawImperialSeal(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, textTopLeft = '御', textTopRight = '景', textBottomLeft = '窑', textBottomRight = '德') {
  ctx.save()
  ctx.strokeStyle = '#b82e2e'
  ctx.lineWidth = 5
  ctx.strokeRect(x, y, size, size)

  ctx.strokeStyle = 'rgba(184, 46, 46, 0.45)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x + 5, y + 5, size - 10, size - 10)

  ctx.fillStyle = 'rgba(184, 46, 46, 0.08)'
  ctx.fillRect(x, y, size, size)

  ctx.fillStyle = '#b82e2e'
  ctx.font = `bold ${Math.round(size * 0.28)}px "KaiTi", "STKaiti", "SimSun", "Songti SC", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillText(textTopRight, x + size * 0.74, y + size * 0.32)
  ctx.fillText(textBottomRight, x + size * 0.74, y + size * 0.72)
  ctx.fillText(textTopLeft, x + size * 0.28, y + size * 0.32)
  ctx.fillText(textBottomLeft, x + size * 0.28, y + size * 0.72)

  ctx.restore()
}

/**
 * 导出数字瓷器身份证 PDF (纯中文排版，通过高清 Canvas 离线矢量化渲染，彻底根绝乱码)
 */
export async function exportCertificatePDF(meta: CeramicMetadata, snapshotDataUrl: string): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width = 1240
  canvas.height = 1754
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Cannot get 2D context')

  // 1. 典雅深黛色古朴宣纸渐变背景
  const bgGrad = ctx.createRadialGradient(620, 877, 80, 620, 877, 960)
  bgGrad.addColorStop(0, '#1d1914')
  bgGrad.addColorStop(0.65, '#15120f')
  bgGrad.addColorStop(1, '#0e0c0a')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 2. 皇家典藏双重金边
  ctx.strokeStyle = '#c9a24f'
  ctx.lineWidth = 3
  ctx.strokeRect(44, 44, 1152, 1666)

  ctx.strokeStyle = 'rgba(201, 162, 79, 0.45)'
  ctx.lineWidth = 1
  ctx.strokeRect(56, 56, 1128, 1642)

  // 3. 四角传统中式回纹
  drawCornerFretwork(ctx, 60, 60, 1, 1)
  drawCornerFretwork(ctx, 1180, 60, -1, 1)
  drawCornerFretwork(ctx, 60, 1694, 1, -1)
  drawCornerFretwork(ctx, 1180, 1694, -1, -1)

  // 4. 头部大标与中英文权威著录头
  ctx.textAlign = 'center'
  ctx.fillStyle = '#c9a24f'
  ctx.font = 'bold 18px "SimSun", "STSong", "Songti SC", "Microsoft YaHei", serif'
  ctx.fillText('景 德 镇 御 窑 遗 产 · 数 字 孪 生 典 藏', 620, 112)

  ctx.fillStyle = '#f8f3e8'
  ctx.font = 'bold 44px "SimSun", "Songti SC", "STSong", "Microsoft YaHei", serif'
  ctx.fillText('数 字 瓷 器 身 份 证', 620, 172)

  ctx.fillStyle = 'rgba(201, 162, 79, 0.75)'
  ctx.font = '13px "Arial", sans-serif'
  ctx.fillText('OFFICIAL JINGDEZHEN DIGITAL CERAMIC ARCHIVE CERTIFICATE', 620, 204)

  // 华丽中轴金线与菱形纹饰
  ctx.strokeStyle = 'rgba(201, 162, 79, 0.35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(140, 224)
  ctx.lineTo(600, 224)
  ctx.moveTo(640, 224)
  ctx.lineTo(1100, 224)
  ctx.stroke()

  ctx.fillStyle = '#c9a24f'
  ctx.beginPath()
  ctx.moveTo(620, 218)
  ctx.lineTo(626, 224)
  ctx.lineTo(620, 230)
  ctx.lineTo(614, 224)
  ctx.closePath()
  ctx.fill()

  // 5. 3D 瓷器高清快照展示框
  if (snapshotDataUrl) {
    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = snapshotDataUrl
      })

      const frameX = 220
      const frameY = 246
      const frameW = 800
      const frameH = 590

      const frameGrad = ctx.createRadialGradient(
        frameX + frameW / 2,
        frameY + frameH / 2,
        30,
        frameX + frameW / 2,
        frameY + frameH / 2,
        frameW / 2
      )
      frameGrad.addColorStop(0, 'rgba(47, 106, 169, 0.14)')
      frameGrad.addColorStop(1, 'rgba(14, 12, 10, 0.72)')
      ctx.fillStyle = frameGrad
      ctx.fillRect(frameX, frameY, frameW, frameH)

      ctx.strokeStyle = 'rgba(201, 162, 79, 0.4)'
      ctx.lineWidth = 1.2
      ctx.strokeRect(frameX, frameY, frameW, frameH)

      const imgRatio = img.width / img.height
      const targetH = frameH - 36
      const targetW = targetH * imgRatio
      const imgX = frameX + (frameW - targetW) / 2
      const imgY = frameY + 18
      ctx.drawImage(img, imgX, imgY, targetW, targetH)
    } catch (e) {
      console.warn('Failed to embed 3D snapshot image', e)
    }
  }

  // 6. 著录规范参数表 (纯正中文无乱码排版)
  const tableStartY = 885
  ctx.textAlign = 'left'
  ctx.fillStyle = '#c9a24f'
  ctx.font = 'bold 22px "SimSun", "Songti SC", "STSong", "Microsoft YaHei", serif'
  ctx.fillText('【 藏 品 著 录 规 范 档 案 】', 190, tableStartY)

  ctx.strokeStyle = 'rgba(201, 162, 79, 0.35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(190, tableStartY + 14)
  ctx.lineTo(1050, tableStartY + 14)
  ctx.stroke()

  const rows: [string, string][] = [
    ['著 录 编 号', meta.id],
    ['瓷 器 品 名', meta.name],
    ['器 型 规 制', `通高 ${meta.heightCm} cm  ·  口径 ${meta.rimCm} cm  ·  手工陶轮定坯拉制`],
    ['釉 质 特 征', meta.glazeName],
    ['窑 口 溯 源', meta.kiln],
    ['烧 造 气 氛', meta.temperature],
    ['著 录 日 期', meta.date],
    ['数 字 防 伪', '国家文化遗产区块链存证 #JDZ-HERITAGE-2026'],
  ]

  let curY = tableStartY + 64
  rows.forEach(([label, val]) => {
    ctx.fillStyle = '#bfa576'
    ctx.font = 'bold 20px "SimSun", "Songti SC", "STSong", "Microsoft YaHei", serif'
    ctx.textAlign = 'left'
    ctx.fillText(label, 190, curY)

    ctx.fillStyle = 'rgba(201, 162, 79, 0.5)'
    ctx.fillText('：', 320, curY)

    ctx.fillStyle = '#f8f4ec'
    ctx.font = '19px "Microsoft YaHei", "SimSun", "PingFang SC", sans-serif'
    ctx.fillText(val, 350, curY)

    ctx.strokeStyle = 'rgba(201, 162, 79, 0.16)'
    ctx.setLineDash([4, 6])
    ctx.beginPath()
    ctx.moveTo(190, curY + 16)
    ctx.lineTo(1050, curY + 16)
    ctx.stroke()
    ctx.setLineDash([])

    curY += 56
  })

  // 7. 御窑朱砂大红官印
  drawImperialSeal(ctx, 900, 1360, 130, '御', '景', '窑', '德')

  // 8. 卷末落款与《天工开物》名训
  ctx.textAlign = 'center'
  ctx.fillStyle = '#c9a24f'
  ctx.font = 'italic 18px "SimSun", "Songti SC", "STKaiti", serif'
  ctx.fillText('“共计一坯之力，过手七十二，方克成器。”', 620, 1595)

  ctx.fillStyle = 'rgba(243, 236, 220, 0.55)'
  ctx.font = '14px "SimSun", "Microsoft YaHei", sans-serif'
  ctx.fillText('明·宋应星《天工开物·陶埏》 · 景德镇国家陶瓷文化传承创新试验区 · 数字工坊监制', 620, 1630)

  // 9. 生成并保存无乱码的高清中文 PDF
  const imgData = canvas.toDataURL('image/jpeg', 0.96)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  doc.addImage(imgData, 'JPEG', 0, 0, 210, 297)
  doc.save(`${meta.id}-数字瓷器身份证.pdf`)
}

/**
 * 导出展陈海报 PDF (大画幅国风展陈排版，全中文，无乱码)
 */
export async function exportPosterPDF(meta: CeramicMetadata, snapshotDataUrl: string): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width = 1240
  canvas.height = 1754
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Cannot get 2D context')

  // 深邃展览馆冷光背景
  const bgGrad = ctx.createRadialGradient(620, 600, 100, 620, 877, 980)
  bgGrad.addColorStop(0, '#191512')
  bgGrad.addColorStop(0.5, '#120f0c')
  bgGrad.addColorStop(1, '#090807')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 外围金边
  ctx.strokeStyle = '#c9a24f'
  ctx.lineWidth = 3
  ctx.strokeRect(36, 36, 1168, 1682)

  ctx.strokeStyle = 'rgba(201, 162, 79, 0.3)'
  ctx.lineWidth = 1
  ctx.strokeRect(46, 46, 1148, 1662)

  drawCornerFretwork(ctx, 50, 50, 1, 1)
  drawCornerFretwork(ctx, 1190, 50, -1, 1)
  drawCornerFretwork(ctx, 50, 1704, 1, -1)
  drawCornerFretwork(ctx, 1190, 1704, -1, -1)

  // 展陈主标题
  ctx.textAlign = 'center'
  ctx.fillStyle = '#c9a24f'
  ctx.font = 'bold 20px "SimSun", "Songti SC", "STSong", "Microsoft YaHei", serif'
  ctx.fillText('景 德 镇 传 世 名 瓷 · 当 代 数 字 展 陈', 620, 106)

  ctx.fillStyle = '#f8f4ec'
  ctx.font = 'bold 48px "SimSun", "Songti SC", "STSong", "Microsoft YaHei", serif'
  ctx.fillText('千 载 窑 火  ·  绝 代 名 瓷', 620, 170)

  ctx.fillStyle = 'rgba(201, 162, 79, 0.7)'
  ctx.font = '13px "Arial", sans-serif'
  ctx.fillText('CONTEMPORARY EXHIBITION OF JINGDEZHEN PORCELAIN HERITAGE', 620, 204)

  // 展品 3D 快照高清居中
  if (snapshotDataUrl) {
    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = snapshotDataUrl
      })

      const frameX = 140
      const frameY = 240
      const frameW = 960
      const frameH = 800

      const spotGrad = ctx.createRadialGradient(
        frameX + frameW / 2,
        frameY + frameH * 0.45,
        50,
        frameX + frameW / 2,
        frameY + frameH * 0.5,
        frameW * 0.52
      )
      spotGrad.addColorStop(0, 'rgba(201, 162, 79, 0.16)')
      spotGrad.addColorStop(0.7, 'rgba(47, 106, 169, 0.08)')
      spotGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = spotGrad
      ctx.fillRect(frameX, frameY, frameW, frameH)

      const imgRatio = img.width / img.height
      const targetH = frameH - 40
      const targetW = targetH * imgRatio
      const imgX = frameX + (frameW - targetW) / 2
      const imgY = frameY + 20
      ctx.drawImage(img, imgX, imgY, targetW, targetH)
    } catch (e) {
      console.warn('Failed to embed poster image', e)
    }
  }

  // 下半部铭牌展陈区
  ctx.strokeStyle = 'rgba(201, 162, 79, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(180, 1100)
  ctx.lineTo(1060, 1100)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#f8f4ec'
  ctx.font = 'bold 40px "SimSun", "Songti SC", "STSong", "Microsoft YaHei", serif'
  ctx.fillText(`【 ${meta.name} 】`, 620, 1170)

  ctx.fillStyle = '#c9a24f'
  ctx.font = 'bold 22px "SimSun", "Songti SC", "Microsoft YaHei", serif'
  ctx.fillText(`${meta.glazeName}  ·  ${meta.temperature}  ·  ${meta.kiln}`, 620, 1230)

  ctx.fillStyle = 'rgba(243, 236, 220, 0.8)'
  ctx.font = '18px "Microsoft YaHei", "SimSun", sans-serif'
  ctx.fillText(`著录编号：${meta.id}    |    器物规格：高 ${meta.heightCm} cm · 口径 ${meta.rimCm} cm`, 620, 1285)

  ctx.fillStyle = 'rgba(243, 236, 220, 0.65)'
  ctx.font = '16px "SimSun", "Songti SC", serif'
  ctx.fillText('以景德镇二元配方高岭土与瓷石为胎，经飞轮拉坯、利刃旋削、苏料彩绘、琉璃施釉、松柴窑火煅烧成器。', 620, 1340)
  ctx.fillText('釉面光泽莹润，胎骨细白如玉，扣之其声如磬，尽显千年瓷都工匠之神韵。', 620, 1375)

  // 朱砂印章
  drawImperialSeal(ctx, 555, 1430, 130, '御', '景', '窑', '德')

  // 底部署名
  ctx.fillStyle = '#c9a24f'
  ctx.font = 'italic 16px "SimSun", "Songti SC", serif'
  ctx.fillText('“过手七十二，方克成器。” —— 《天工开物》', 620, 1615)

  ctx.fillStyle = 'rgba(201, 162, 79, 0.5)'
  ctx.font = '13px "Arial", sans-serif'
  ctx.fillText('JINGDEZHEN DIGITAL HERITAGE MUSEUM · CURATORIAL ARCHIVE', 620, 1645)

  const imgData = canvas.toDataURL('image/jpeg', 0.96)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  doc.addImage(imgData, 'JPEG', 0, 0, 210, 297)
  doc.save(`${meta.id}-数字展陈海报.pdf`)
}
