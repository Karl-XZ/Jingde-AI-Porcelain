# 数字景德镇陶艺工坊 (Jingde-AI-Porcelain)

> 千年窑火 · 数字永续 —— 基于 WebGL 3D 物理高仿真渲染与 AI 辅助创作的数字景德镇陶艺工坊。

---

## 🌟 项目简介

**数字景德镇陶艺工坊**（Jingde-AI-Porcelain）致力于以现代三维图形学与 AI 算法数字化复原景德镇国家级非物质文化遗产制瓷工艺。系统完整实现从生泥到精瓷的六大核心制瓷工序：

1. **制坯（拉坯塑形）**：6 款经典官窑器型模版（梅瓶、玉壶春瓶、葵口洗、天球瓶、尊、大罐），支持鼠标交互式定点塑形与三向形制比例实时微调；
2. **修型（利坯修整）**：实时几何尺寸与壁厚监控，具备“利坯匀壁”、“整足旋底”与“一键规整胎骨”等真实修坯算法；
3. **纹样（画坯施彩）**：内置缠枝莲、云龙赶珠等 6 大传统青花图样，支持 AI 智能生成对称云肩与卷草莲瓣纹饰，配备 7 种景德镇天然矿物彩料手绘盘，可在 3D 坯体表面自由创作；
4. **上釉（浸釉吹釉）**：精细还原甜白、影青、仿宋开片、哑光素胎、窑变花釉、郎窑红等名贵罩釉，100% 完整保留底层彩绘，仅动态改变折射率、粗糙度、镜面高光与开片质感；
5. **烧制（镇窑柴烧）**：模拟景德镇松柴窑升温曲线（排湿、强还原、保温、冷却），动态呈现柴火照明、窑温飙升至 1300℃ 与高温玻化过程；
6. **成器（鉴赏典藏）**：生成景德镇国家陶瓷数字身份档案，支持导出工业级 3D 资产（`.glb`）、高清古风典藏证书（无乱码、带“景德御窑”朱砂印章的 A4 300DPI PDF）及成果海报（`.png`）。

此外，系统首页打造了**“上纳天青，下承窑火”**的暖橙/红褐色窑火光晕底色，并配备了与前台展台 1:1 绝对同步旋转的背景巨型半透明 3D 陶瓷，呈现虚实相映的沉浸式东方美学。

---

## 🛠️ 技术栈

- **前端核心**：React 18 + TypeScript + Vite 6
- **三维渲染**：Three.js（WebGL、PBR MeshPhysicalMaterial、ACESFilmic 电影级色调映射）
- **导出套件**：Three.js GLTFExporter、jsPDF、html2canvas
- **工程化**：ESLint (Flat Config) + TypeScript Strict Type Checking

---

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone git@github.com:Karl-XZ/Jingde-AI-Porcelain.git
cd Jingde-AI-Porcelain
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器打开控制台输出的本地地址（默认 `http://localhost:5173/`）即可使用。

### 4. 生产环境构建

```bash
npm run build
```

构建产物将输出至 `dist/` 目录。

---

## 📂 项目结构

```text
jingdezhen-workshop/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 3D 展台与背景组件
│   │   ├── LandingPorcelain3D.tsx    # 首页前景可交互 3D 陶瓷展台
│   │   └── LandingBgPorcelain3D.tsx  # 首页背景同步旋转半透明巨型陶瓷
│   ├── pages/              # 页面模块
│   │   ├── CraftGuidePage.tsx        # 了解工艺科普图文指南
│   │   └── GalleryPage.tsx           # 历代传世名瓷鉴赏与一键重塑
│   ├── pottery/            # 3D 陶艺核心物理引擎与材质
│   │   ├── PotteryCanvas.tsx         # 工坊 3D 画布与工序控制器
│   │   ├── PotteryGeometry.ts        # 旋转体网格生成器、拉坯塑形、利坯平滑
│   │   ├── PotteryMaterials.ts       # 矿物彩绘 Canvas 贴图与 PBR 釉面管理器
│   │   ├── patterns.ts               # 青花经典纹样与名釉程序化光栅贴图
│   │   └── exporters.ts              # GLB 3D 资产与全中文御窑印章 PDF 导出
│   ├── App.tsx             # 应用主状态编排与统一左侧控制台
│   ├── App.css             # 界面主题与窑火光晕样式体系
│   └── index.css           # 字体与全局色彩变量
├── package.json
└── vite.config.ts
```

---

## 📜 开源许可

本项目遵循 MIT 协议开源。
