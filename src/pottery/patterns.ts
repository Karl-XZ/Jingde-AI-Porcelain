/**
 * 景德镇传统纹样生成器与真实名釉材质纹理库
 * 涵盖：青花缠枝莲、云水龙纹、哥窑冰裂梅花、蕉叶如意纹、纯白素胎
 * 以及国宝级名釉：郎窑红（脱口出筋、牛毛细片）、窑变花釉（紫蓝流淌）、茶叶末结晶釉（黄金微晶斑）
 */

export type MotifType = 'lotus' | 'dragon' | 'ice' | 'banana' | 'blank' | 'fish'

// 7 款景德镇经典矿物颜料
export const PALETTE_COLORS = [
  { name: '钴蓝', hex: '#183e78', desc: '苏麻离青' },
  { name: '头浓', hex: '#0c2146', desc: '浓钴蓝' },
  { name: '釉里红', hex: '#8b1e1e', desc: '铜红料' },
  { name: '赭石', hex: '#5c3a21', desc: '铁褐古彩' },
  { name: '娇黄', hex: '#c49c28', desc: '黄地彩' },
  { name: '泥金', hex: '#c9a24f', desc: '描金' },
  { name: '墨黑', hex: '#1a1a1a', desc: '松烟墨' },
]

/**
 * 绘制经典青花与传统彩绘预设
 */
export function renderQinghuaMotif(
  ctx: CanvasRenderingContext2D,
  width = 1024,
  height = 1024,
  motif: MotifType = 'lotus'
) {
  // 背景：景德镇瓷胎白釉底色 (鸭蛋青/羊脂白)
  ctx.fillStyle = '#f8f6f0'
  ctx.fillRect(0, 0, width, height)

  if (motif === 'blank') {
    // 纯白素胎留白供用户 100% 自由上手创作
    return
  }

  const cobaltBlue = '#183e78'
  const deepCobalt = '#0c2146'
  const lightCobalt = 'rgba(28, 68, 130, 0.42)'

  // 1. 口沿饰带：回纹 / 弦纹 (Neck Borders)
  ctx.strokeStyle = cobaltBlue
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(0, height * 0.08)
  ctx.lineTo(width, height * 0.08)
  ctx.moveTo(0, height * 0.12)
  ctx.lineTo(width, height * 0.12)
  ctx.stroke()

  const neckStep = width / 32
  for (let x = 0; x < width; x += neckStep) {
    ctx.fillStyle = cobaltBlue
    ctx.fillRect(x + 4, height * 0.088, neckStep - 8, height * 0.024)
  }

  // 2. 肩部饰带：如意云头纹 / 蕉叶纹
  const shoulderY = height * 0.22
  const shoulderStep = width / 16
  for (let x = 0; x < width; x += shoulderStep) {
    ctx.beginPath()
    ctx.strokeStyle = deepCobalt
    ctx.lineWidth = 3
    ctx.arc(x + shoulderStep * 0.5, shoulderY, shoulderStep * 0.45, Math.PI, 0, true)
    ctx.stroke()

    ctx.fillStyle = lightCobalt
    ctx.beginPath()
    ctx.arc(x + shoulderStep * 0.5, shoulderY, shoulderStep * 0.38, Math.PI, 0, true)
    ctx.fill()
  }

  // 3. 腹部主题纹饰 (Main Body Motif)
  if (motif === 'lotus') {
    // 经典缠枝宝相莲纹 (Intertwining Lotus Scroll)
    const petals = 8
    const stepX = width / petals
    const centerY = height * 0.52

    // 缠枝波状蔓草藤茎
    ctx.beginPath()
    ctx.strokeStyle = deepCobalt
    ctx.lineWidth = 5
    for (let x = 0; x <= width; x += 10) {
      const angle = (x / width) * Math.PI * 4
      const y = centerY + Math.sin(angle) * (height * 0.1)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    for (let i = 0; i < petals; i++) {
      const cx = i * stepX + stepX * 0.5
      const angle = (cx / width) * Math.PI * 4
      const cy = centerY + Math.sin(angle) * (height * 0.1)

      drawLotusFlower(ctx, cx, cy, 48, deepCobalt, cobaltBlue, lightCobalt)

      const leafX = cx + (i % 2 === 0 ? 34 : -34)
      const leafY = cy + (i % 2 === 0 ? -50 : 50)
      drawAcanthusLeaf(ctx, leafX, leafY, i % 2 === 0 ? 0.6 : -0.6, cobaltBlue, lightCobalt)
    }
  } else if (motif === 'dragon') {
    // 御窑苍龙教子 / 云水游龙纹 (Dragon & Sea Clouds)
    const dragonCount = 4
    const stepX = width / dragonCount
    for (let i = 0; i < dragonCount; i++) {
      const cx = i * stepX + stepX * 0.5
      const cy = height * 0.52
      drawDragonMotif(ctx, cx, cy, deepCobalt, cobaltBlue, lightCobalt)
    }
    // 祥云飘带点缀
    for (let i = 0; i < 8; i++) {
      const cx = (i * width) / 8 + 30
      const cy = height * 0.35 + (i % 2) * 40
      drawCloud(ctx, cx, cy, 42, deepCobalt, lightCobalt)
    }
  } else if (motif === 'ice') {
    // 哥窑冰裂梅花纹 (Ice Crackle & Plum Blossoms)
    drawIceCrackle(ctx, width, height, deepCobalt, lightCobalt)
    // 散落五瓣折枝梅花
    const plumCount = 14
    for (let i = 0; i < plumCount; i++) {
      const px = ((i * 137.5) % width)
      const py = height * 0.28 + ((i * 73.2) % (height * 0.52))
      drawPlumBlossom(ctx, px, py, 26, '#8b1e1e', '#c43a3a')
    }
  } else if (motif === 'banana') {
    // 蕉叶如意雷纹 (Upright Banana Leaves & Thunder Frets)
    const leafCount = 18
    const leafW = width / leafCount
    for (let i = 0; i < leafCount; i++) {
      const bx = i * leafW
      drawBananaLeaf(ctx, bx, height * 0.68, leafW, height * 0.38, deepCobalt, cobaltBlue, lightCobalt)
    }
  } else if (motif === 'fish') {
    // 明宣德/嘉靖青花鱼藻清漪图 (Fish & Aquatic Plants / Pond Scroll)
    const fishCount = 5
    const stepX = width / fishCount
    for (let i = 0; i < fishCount; i++) {
      const cx = i * stepX + stepX * 0.5
      const cy = height * 0.52 + (i % 2 === 0 ? -28 : 28)
      drawFishMotif(ctx, cx, cy, i % 2 === 0 ? 0.15 : -0.15, deepCobalt, cobaltBlue, lightCobalt)
    }
    // 水草荇藻与浮萍
    for (let i = 0; i < 10; i++) {
      const wx = (i * width) / 10 + 35
      drawWaterWeed(ctx, wx, height * 0.68, deepCobalt, lightCobalt)
    }
  }

  // 4. 圈足饰带：仰莲瓣纹 (Lotus Petal Base)
  const footY = height * 0.86
  const footStep = width / 20
  ctx.lineWidth = 3
  for (let x = 0; x < width; x += footStep) {
    ctx.strokeStyle = deepCobalt
    ctx.fillStyle = lightCobalt
    ctx.beginPath()
    ctx.moveTo(x, height * 0.96)
    ctx.lineTo(x + footStep * 0.5, footY)
    ctx.lineTo(x + footStep, height * 0.96)
    ctx.closePath()
    ctx.stroke()
    ctx.fill()
  }

  // 圈足底双弦线
  ctx.strokeStyle = deepCobalt
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(0, height * 0.96)
  ctx.lineTo(width, height * 0.96)
  ctx.moveTo(0, height * 0.98)
  ctx.lineTo(width, height * 0.98)
  ctx.stroke()
}

/**
 * 绘制单朵青花宝相莲花
 */
function drawLotusFlower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  strokeColor: string,
  fillCobalt: string,
  lightFill: string
) {
  ctx.save()
  ctx.translate(cx, cy)

  // 花心莲蓬
  ctx.fillStyle = fillCobalt
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2)
  ctx.fill()

  // 8 个重瓣莲花瓣
  const petalCount = 8
  for (let p = 0; p < petalCount; p++) {
    const rot = (p / petalCount) * Math.PI * 2
    ctx.save()
    ctx.rotate(rot)

    ctx.beginPath()
    ctx.moveTo(0, -size * 0.28)
    ctx.quadraticCurveTo(size * 0.35, -size * 0.65, 0, -size * 1.05)
    ctx.quadraticCurveTo(-size * 0.35, -size * 0.65, 0, -size * 0.28)
    ctx.fillStyle = lightFill
    ctx.fill()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 2.5
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -size * 0.8)
    ctx.lineTo(0, -size * 1.05)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.restore()
  }

  ctx.restore()
}

/**
 * 绘制卷草叶片
 */
function drawAcanthusLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rot: number,
  strokeColor: string,
  fillColor: string
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)

  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(25, -20, 35, -45, 10, -60)
  ctx.bezierCurveTo(-15, -40, -5, -15, 0, 0)
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.restore()
}

/**
 * 绘制青花吉祥云纹
 */
function drawCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  strokeColor: string,
  fillColor: string
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = fillColor
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2.5

  ctx.beginPath()
  ctx.arc(-size * 0.3, 0, size * 0.25, 0, Math.PI * 2)
  ctx.arc(0, -size * 0.18, size * 0.35, 0, Math.PI * 2)
  ctx.arc(size * 0.3, 0, size * 0.25, 0, Math.PI * 2)
  ctx.arc(size * 0.15, size * 0.2, size * 0.22, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(-size * 0.3, size * 0.1)
  ctx.quadraticCurveTo(-size * 0.7, size * 0.4, -size * 0.8, size * 0.2)
  ctx.stroke()

  ctx.restore()
}

/**
 * 绘制青花云水游龙纹
 */
function drawDragonMotif(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  strokeColor: string,
  fillColor: string,
  lightFill: string
) {
  ctx.save()
  ctx.translate(cx, cy)

  // 盘旋龙身 S 形曲折骨线
  ctx.beginPath()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.moveTo(-80, 50)
  ctx.bezierCurveTo(-100, -30, -30, -70, 0, -30)
  ctx.bezierCurveTo(30, 10, 80, -20, 70, 60)
  ctx.stroke()

  // 龙身填彩与龙鳞纹
  ctx.strokeStyle = lightFill
  ctx.lineWidth = 6
  ctx.stroke()

  // 龙首
  ctx.fillStyle = fillColor
  ctx.beginPath()
  ctx.arc(70, 60, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 3
  ctx.stroke()

  // 龙角与龙须
  ctx.beginPath()
  ctx.moveTo(85, 55)
  ctx.lineTo(110, 45)
  ctx.moveTo(85, 68)
  ctx.lineTo(115, 78)
  ctx.stroke()

  // 五爪龙爪 (两处)
  drawClaw(ctx, -50, -35, strokeColor)
  drawClaw(ctx, 35, -5, strokeColor)

  // 龙珠 (火珠)
  ctx.fillStyle = '#b83b3b'
  ctx.beginPath()
  ctx.arc(105, 10, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.restore()
}

function drawClaw(ctx: CanvasRenderingContext2D, x: number, y: number, strokeColor: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(15, -12)
  ctx.moveTo(0, 0)
  ctx.lineTo(18, 0)
  ctx.moveTo(0, 0)
  ctx.lineTo(14, 12)
  ctx.stroke()
  ctx.restore()
}

/**
 * 绘制哥窑冰裂开片网格
 */
function drawIceCrackle(ctx: CanvasRenderingContext2D, width: number, height: number, strokeColor: string, lightColor: string) {
  ctx.save()
  ctx.strokeStyle = strokeColor
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1.5

  const cols = 12
  const rows = 12
  const cellW = width / cols
  const cellH = height / rows

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW
      const y = r * cellH

      ctx.beginPath()
      ctx.moveTo(x + Math.sin(r * 3 + c) * 15, y)
      ctx.lineTo(x + cellW + Math.cos(r + c * 2) * 18, y + cellH * 0.45)
      ctx.lineTo(x + cellW * 0.4, y + cellH)
      ctx.stroke()

      // 次级细碎开片
      if ((r + c) % 2 === 0) {
        ctx.save()
        ctx.strokeStyle = lightColor
        ctx.lineWidth = 1.0
        ctx.beginPath()
        ctx.moveTo(x + cellW * 0.2, y + cellH * 0.2)
        ctx.lineTo(x + cellW * 0.7, y + cellH * 0.8)
        ctx.stroke()
        ctx.restore()
      }
    }
  }
  ctx.restore()
}

/**
 * 绘制折枝五瓣梅花
 */
function drawPlumBlossom(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, strokeColor: string, fillColor: string) {
  ctx.save()
  ctx.translate(cx, cy)

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    ctx.save()
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.arc(0, -r * 0.6, r * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = fillColor
    ctx.fill()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1.8
    ctx.stroke()
    ctx.restore()
  }

  // 花蕊点
  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * 绘制蕉叶纹 (立蕉叶)
 */
function drawBananaLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  strokeColor: string,
  fillColor: string,
  lightColor: string
) {
  ctx.save()
  ctx.translate(x + w * 0.5, y)

  ctx.beginPath()
  ctx.moveTo(0, -h)
  ctx.quadraticCurveTo(w * 0.7, -h * 0.4, w * 0.45, 0)
  ctx.lineTo(-w * 0.45, 0)
  ctx.quadraticCurveTo(-w * 0.7, -h * 0.4, 0, -h)
  ctx.fillStyle = lightColor
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2.5
  ctx.stroke()

  // 叶脉中脊
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -h * 0.92)
  ctx.strokeStyle = fillColor
  ctx.lineWidth = 3
  ctx.stroke()

  // 侧叶脉
  for (let step = 0.2; step <= 0.8; step += 0.2) {
    const py = -h * step
    ctx.beginPath()
    ctx.moveTo(0, py)
    ctx.lineTo(w * 0.35, py - 14)
    ctx.moveTo(0, py)
    ctx.lineTo(-w * 0.35, py - 14)
    ctx.lineWidth = 1.6
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * 绘制明代青花鱼藻纹 (鳜鱼/鲤鱼游弋)
 */
function drawFishMotif(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  strokeColor: string,
  fillColor: string,
  lightColor: string
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  // 鱼身流线型
  ctx.beginPath()
  ctx.moveTo(-50, 0)
  ctx.bezierCurveTo(-25, -28, 25, -25, 45, 0)
  ctx.bezierCurveTo(25, 25, -25, 28, -50, 0)
  ctx.fillStyle = lightColor
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 3
  ctx.stroke()

  // 鱼鳞网状点缀
  ctx.strokeStyle = fillColor
  ctx.lineWidth = 1.5
  for (let x = -20; x <= 20; x += 10) {
    ctx.beginPath()
    ctx.arc(x, 0, 8, -Math.PI * 0.4, Math.PI * 0.4)
    ctx.stroke()
  }

  // 鱼尾 (分叉摆动尾鳍)
  ctx.beginPath()
  ctx.moveTo(-45, 0)
  ctx.bezierCurveTo(-65, -22, -80, -25, -85, -15)
  ctx.bezierCurveTo(-75, -5, -60, 0, -75, 5)
  ctx.bezierCurveTo(-80, 15, -65, 22, -45, 0)
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2
  ctx.stroke()

  // 背鳍与腹鳍
  ctx.beginPath()
  ctx.moveTo(-5, -22)
  ctx.quadraticCurveTo(10, -38, 25, -18)
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2.5
  ctx.stroke()

  // 鱼眼
  ctx.fillStyle = strokeColor
  ctx.beginPath()
  ctx.arc(32, -4, 3.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * 绘制水草荇藻
 */
function drawWaterWeed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  strokeColor: string,
  fillColor: string
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2.5

  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-15, -30, 20, -60, -5, -90)
  ctx.bezierCurveTo(-20, -110, 10, -130, 0, -150)
  ctx.stroke()

  // 藻叶
  ctx.fillStyle = fillColor
  ctx.beginPath()
  ctx.ellipse(12, -60, 14, 6, Math.PI / 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(-14, -100, 12, 5, -Math.PI / 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}

/* =========================================================================
 * 真实名贵陶瓷釉面生成器 (景德镇四大经典名釉)
 * ========================================================================= */

/**
 * 1. 郎窑红（牛血红 / 宝石红）：
 * 特征：口沿“脱口出筋”微露胎白，腹部如凝血红宝石深邃流淌，下腹深沉浓聚“郎不流”，全身伴有牛毛细碎开片。
 */
export function generateLangyaoCanvas(width = 1024, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // 自上而下的熔融重力流淌渐变
  const grad = ctx.createLinearGradient(0, 0, 0, height)
  // 口沿脱口出筋 (牙白/青白瓷胎)
  grad.addColorStop(0.0, '#f2ece0')
  grad.addColorStop(0.04, '#dfcbbe')
  grad.addColorStop(0.07, '#ab2828')
  // 肩部至腹部高纯度牛血红 / 红宝石色
  grad.addColorStop(0.2, '#9a1616')
  grad.addColorStop(0.48, '#aa1919')
  grad.addColorStop(0.72, '#7e1010')
  // 底部流釉积聚浓红褐色 (郎不流)
  grad.addColorStop(0.94, '#4a0808')
  grad.addColorStop(1.0, '#2e0404')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  // 纵向流釉微丝纹理 (Vertical Glaze Flow Veins)
  ctx.save()
  ctx.globalAlpha = 0.12
  for (let x = 0; x < width; x += 12) {
    const shift = Math.sin(x * 0.05) * 20
    ctx.strokeStyle = x % 24 === 0 ? '#ff8080' : '#300202'
    ctx.lineWidth = 2 + Math.random() * 3
    ctx.beginPath()
    ctx.moveTo(x, height * 0.08)
    ctx.bezierCurveTo(x + shift, height * 0.4, x - shift, height * 0.7, x, height * 0.96)
    ctx.stroke()
  }
  ctx.restore()

  // 细密牛毛开片冰裂纹 (Fine Crazing / Crazing lines)
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.strokeStyle = '#f8b4b4'
  ctx.lineWidth = 1
  for (let i = 0; i < 350; i++) {
    const rx = Math.random() * width
    const ry = height * 0.08 + Math.random() * (height * 0.88)
    ctx.beginPath()
    ctx.moveTo(rx, ry)
    ctx.lineTo(rx + (Math.random() - 0.5) * 45, ry + Math.random() * 35)
    ctx.stroke()
  }
  ctx.restore()

  return canvas
}

/**
 * 2. 窑变花釉（炉钧 / 钧窑窑变）：
 * 特征：“入窑一色，出窑万彩”，纵向熔融流淌丝状条纹，由钴蓝、茄紫、胭脂红、月白与深褐自然交织交融。
 */
export function generateHuayouCanvas(width = 1024, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // 底色：深沉紫褐
  ctx.fillStyle = '#3c1822'
  ctx.fillRect(0, 0, width, height)

  // 纵向窑变彩流 (Flowing Ribbons of Blue, Purple, Crimson, Celadon)
  const colors = [
    '#24529c', // 景德镇宝石蓝
    '#682075', // 茄皮紫
    '#9b1836', // 胭脂红
    '#4c7cb8', // 霁蓝
    '#cfc4ba', // 月白流痕
    '#723f18', // 铁褐流晕
  ]

  ctx.save()
  for (let i = 0; i < 90; i++) {
    const startX = Math.random() * width
    const col = colors[Math.floor(Math.random() * colors.length)]
    const ribbonWidth = 14 + Math.random() * 38

    ctx.strokeStyle = col
    ctx.lineWidth = ribbonWidth
    ctx.globalAlpha = 0.35 + Math.random() * 0.35

    const c1x = startX + (Math.random() - 0.5) * 60
    const c2x = startX + (Math.random() - 0.5) * 80

    ctx.beginPath()
    ctx.moveTo(startX, 0)
    ctx.bezierCurveTo(c1x, height * 0.33, c2x, height * 0.66, startX + (Math.random() - 0.5) * 40, height)
    ctx.stroke()
  }

  // 窑变析晶与兔毫细丝
  ctx.globalAlpha = 0.18
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 60; i++) {
    const sx = Math.random() * width
    ctx.beginPath()
    ctx.moveTo(sx, height * 0.15)
    ctx.lineTo(sx + (Math.random() - 0.5) * 20, height * 0.85)
    ctx.stroke()
  }

  ctx.restore()

  return canvas
}

/**
 * 3. 茶叶末结晶釉（鳝鱼黄 / 蟹甲青）：
 * 特征：深沉典雅的深橄榄绿/暗芥黄底色上，密布数以万计的金黄与青绿微晶星芒斑点，温润如古玉。
 */
export function generateChayemoCanvas(width = 1024, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // 深绿底色带有自上而下微妙深浅
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
  bgGrad.addColorStop(0, '#424523')
  bgGrad.addColorStop(0.5, '#35381a')
  bgGrad.addColorStop(1, '#2c2e14')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 密集结晶微斑 (Dense Crystalline Star Dust)
  const speckCount = 14000
  const crystalColors = ['#d4bc54', '#8c8032', '#baa440', '#efda76', '#585a2b']

  for (let i = 0; i < speckCount; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const rad = 0.7 + Math.random() * 2.2
    const color = crystalColors[Math.floor(Math.random() * crystalColors.length)]

    ctx.fillStyle = color
    ctx.globalAlpha = 0.35 + Math.random() * 0.5
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1.0
  return canvas
}

/**
 * AI 智能对称青花构图：生成御窑如意云头纹、缠枝宝相花主纹、仰覆莲瓣底足饰带
 */
export function renderAICompositeMotif(
  ctx: CanvasRenderingContext2D,
  width = 1024,
  height = 1024
) {
  renderQinghuaMotif(ctx, width, height, 'lotus')
  ctx.save()
  const cobalt = '#183e78'
  const deepCobalt = '#0c2146'
  ctx.strokeStyle = deepCobalt
  ctx.lineWidth = 2.5
  for (let i = 0; i < 8; i++) {
    const cx = (i + 0.5) * (width / 8)
    const cy = height * 0.38
    ctx.beginPath()
    ctx.arc(cx - 14, cy, 12, 0, Math.PI * 2)
    ctx.arc(cx + 14, cy, 12, 0, Math.PI * 2)
    ctx.arc(cx, cy - 10, 16, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(24, 62, 120, 0.28)'
    ctx.beginPath()
    ctx.arc(cx, cy - 6, 8, 0, Math.PI * 2)
    ctx.fill()
  }
  // 底足如意连珠纹
  ctx.strokeStyle = cobalt
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(width * 0.5, height * 0.82, 120, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}
