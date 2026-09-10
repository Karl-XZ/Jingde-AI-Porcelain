import { useState } from 'react'
import { type PresetType } from '../pottery/PotteryGeometry'
import { type MotifType } from '../pottery/patterns'
import { type GlazeType } from '../pottery/PotteryMaterials'
import { Masterpiece3DPreview } from '../components/Masterpiece3DPreview'

export interface RemakeConfig {
  preset: PresetType
  motif: MotifType
  glaze: GlazeType
  step: 'forming' | 'trim' | 'pattern' | 'glaze' | 'fire' | 'finish'
  name: string
}

interface GalleryPageProps {
  onBack: () => void
  onRemake: (cfg: RemakeConfig) => void
  onEnterWorkshop: () => void
}

type CategoryKey = 'all' | 'qinghua' | 'monochrome' | 'flambe' | 'song'

interface CeramicMasterpiece {
  id: string
  title: string
  dynasty: string
  kiln: string
  category: 'qinghua' | 'monochrome' | 'flambe' | 'song'
  categoryLabel: string
  dimensions: string
  glazeInfo: string
  materialInfo: string
  summary: string
  story: string
  craftHighlights: string[]
  remakeConfig: RemakeConfig
  colorTheme: string
  accentBadge: string
}

export function GalleryPage({ onBack, onRemake, onEnterWorkshop }: GalleryPageProps) {
  const [selectedCat, setSelectedCat] = useState<CategoryKey>('all')
  const [activeItem, setActiveItem] = useState<CeramicMasterpiece | null>(null)

  const MASTERPIECES: CeramicMasterpiece[] = [
    {
      id: 'meiping-lotus',
      title: '明宣德 · 青花缠枝莲纹梅瓶',
      dynasty: '明 宣德 (1426–1435)',
      kiln: '景德镇御窑厂',
      category: 'qinghua',
      categoryLabel: '青花幽雅',
      dimensions: '高 30.8cm · 口径 9.6cm · 底径 11.2cm',
      glazeInfo: '青花釉下彩 · 1280°C 还原焰',
      materialInfo: '进口苏麻离青矿料 · 高岭瓷石二元配方',
      summary: '修腹丰肩，小口微翻。苏麻离青发色苍翠沉着，浓重处自然析出如铁锈银锡之斑，为大明宣德官窑青花绝代魁首。',
      story: '宣德时期为明代青花之极盛期，御窑厂在此期创烧无数重器。此件梅瓶造型严谨而端庄，线条流畅饱满。釉下以进口苏麻离青分层绘制缠枝西番莲纹，钴料渗入胎骨深处，釉层白中微泛青色，温润如羊脂玉凝。',
      craftHighlights: [
        '小口丰肩敛腹，拉坯拔壁线条极其考究',
        '苏麻离青高铁低锰，高温下析出天然“铁锈黑斑”与锡光',
        '五层环状纹饰分层分水，浓淡五色自然晕散',
      ],
      colorTheme: '#2f6aa9',
      accentBadge: '御窑典藏 · 官窑之首',
      remakeConfig: {
        preset: 'meiping',
        motif: 'lotus',
        glaze: 'qing',
        step: 'pattern',
        name: '明宣德 · 青花缠枝莲梅瓶',
      },
    },
    {
      id: 'langyao-red',
      title: '清康熙 · 郎窑红釉观音尊',
      dynasty: '清 康熙 (1662–1722)',
      kiln: '景德镇御窑 · 督陶官郎廷极督造',
      category: 'monochrome',
      categoryLabel: '高温单色',
      dimensions: '高 32.5cm · 口径 10.2cm · 底径 12.0cm',
      glazeInfo: '郎窑铜红高温单色釉 · 1300°C 强还原焰',
      materialInfo: '铜矿还原着色剂 · 石灰石英高钙釉',
      summary: '红若初凝牛血，纯正浓艳。口沿脱口出筋微微露白，底部流不过足，釉面密布牛毛细片，光照之下宝石华彩流转。',
      story: '俗语云：“若要穷，烧郎红”。清代康熙年间江西巡抚兼督造官郎廷极在御窑厂督造，恢复了自明代宣德后中断二百余年的高温铜红釉烧造技术。郎窑红烧制条件极为苛刻，千窑难出一二，成就了清代单色釉传奇。',
      craftHighlights: [
        '1300°C 极强还原焰，一氧化碳夺氧使铜还原为胶体纳米铜',
        '口沿流釉显出白胎，称“脱口出筋”',
        '足际旋削整齐，流釉不过底足，世称“郎不流”',
      ],
      colorTheme: '#a63d40',
      accentBadge: '千窑一宝 · 单色之王',
      remakeConfig: {
        preset: 'meiping',
        motif: 'blank',
        glaze: 'lang',
        step: 'glaze',
        name: '清康熙 · 郎窑红观音尊',
      },
    },
    {
      id: 'huayou-flambe',
      title: '清雍正 · 窑变花釉弦纹双耳瓶',
      dynasty: '清 雍正 (1723–1735)',
      kiln: '景德镇御窑 · 唐英督理',
      category: 'flambe',
      categoryLabel: '窑变名品',
      dimensions: '高 28.2cm · 口径 8.8cm · 底径 10.5cm',
      glazeInfo: '窑变高温乳浊花釉 · 1260°C 高温熔融流淌',
      materialInfo: '铜红与钴蓝复合着色 · 多层乳浊硅酸盐釉',
      summary: '红紫蓝交融流淌，如云霓晚霞、海浪极光。窑火天然流淌熔融，入窑一色而出窑万彩，无一雷同。',
      story: '清雍正六年，协理官唐英派御窑厂艺人赴河南禹州探寻钧窑配方，结合景德镇优质瓷胎，创烧出独具御窑特质的高温窑变花釉。红色与天青色在高温下乳浊分相自然垂流，变化万千，浑然天成。',
      craftHighlights: [
        '铜红与钴蓝元素在 1260°C 高温下共融流淌',
        '天然形成垂流泪痕与交织斑驳效果，非人工绘饰所能及',
        '乳浊釉光泽沉稳，富于多层空间纵深感',
      ],
      colorTheme: '#6c3f85',
      accentBadge: '入窑一色 · 出窑万彩',
      remakeConfig: {
        preset: 'yuhuchun',
        motif: 'blank',
        glaze: 'hua',
        step: 'glaze',
        name: '清雍正 · 窑变花釉双耳瓶',
      },
    },
    {
      id: 'chayemo-vase',
      title: '清乾隆 · 茶叶末釉六角贯耳瓶',
      dynasty: '清 乾隆 (1736–1795)',
      kiln: '景德镇御窑厂',
      category: 'monochrome',
      categoryLabel: '高温单色',
      dimensions: '高 26.5cm · 口径 8.0cm · 底径 9.8cm',
      glazeInfo: '铁质结晶高温釉 · 1250°C 缓冷结晶',
      materialInfo: '富铁辉石系结晶料 · 高白细腻御窑胎骨',
      summary: '深穆墨绿地子上，密布细碎金黄色微晶金芒，如细研上等明前茶末。质感沉穆如丝绢缎面，古雅庄重。',
      story: '茶叶末釉古称“厂官釉”，在乾隆朝御窑发展至巅峰。釉面亚光，深沉古朴，色泽沉着温润，极具商周青铜彝器之端庄典雅，是乾隆皇帝案头最为钟爱的陈设雅器之一。',
      craftHighlights: [
        '铁镁质硅酸盐体系，在 1250°C 缓冷阶段析出细碎辉石微晶',
        '墨绿基底与金黄闪烁微晶点完美结合，无炫目浮光',
        '缎面触感细腻柔滑，宛若温润抚玉',
      ],
      colorTheme: '#787332',
      accentBadge: '御窑奇珍 · 金芒微晶',
      remakeConfig: {
        preset: 'meiping',
        motif: 'blank',
        glaze: 'cha',
        step: 'glaze',
        name: '清乾隆 · 茶叶末贯耳瓶',
      },
    },
    {
      id: 'dragon-tianqiu',
      title: '明永乐 · 青花云水游龙天球瓶',
      dynasty: '明 永乐 (1403–1424)',
      kiln: '景德镇御窑厂',
      category: 'qinghua',
      categoryLabel: '青花幽雅',
      dimensions: '高 34.0cm · 口径 9.0cm · 腹径 24.5cm',
      glazeInfo: '青花釉下彩 · 1280°C 还原焰',
      materialInfo: '早期进口苏料 · 麻仓高岭瓷土',
      summary: '直颈圆腹，硕大雄浑。五爪苍龙回首顾盼，须发戟张，穿行于翻涌的海水江崖与祥云之间，气势恢宏万丈。',
      story: '天球瓶创烧于明代永乐景德镇御窑，因腹部圆硕宛如从天而降之球体而得名。瓶身通景绘制皇家龙纹，龙爪遒劲有力，龙身鳞片以浓淡分水精细点染，表现出大明帝国威加海内的非凡气魄。',
      craftHighlights: [
        '器身庞大，大口大腹拉坯难度极高',
        '五爪穿云行龙构图气势雄浑，龙鳞层叠分明',
        '青花发色浓烈苍润，铁锈斑点缀龙睛龙脊，宛若神龙出海',
      ],
      colorTheme: '#1c4570',
      accentBadge: '皇家重器 · 苍龙教子',
      remakeConfig: {
        preset: 'meiping',
        motif: 'dragon',
        glaze: 'qing',
        step: 'pattern',
        name: '明永乐 · 青花云水游龙天球瓶',
      },
    },
    {
      id: 'song-yingqing-bowl',
      title: '北宋 · 景德镇窑影青暗刻斗笠碗',
      dynasty: '北宋 (960–1127)',
      kiln: '景德镇湖田窑',
      category: 'song',
      categoryLabel: '宋元古意',
      dimensions: '高 6.8cm · 口径 17.2cm · 底径 3.8cm',
      glazeInfo: '影青青白透明釉 · 1220°C 柴烧还原焰',
      materialInfo: '湖田窑纯净水洗瓷石 · 高钙透明石灰釉',
      summary: '青如天，明如镜，薄如纸，声如磬。碗身斜敞如斗笠，刀刻暗花水波若隐若现，积釉处如一泓清澈湖水。',
      story: '宋代景德镇以湖田窑为代表的青白瓷（又称影青）惊艳天下。其胎体薄如卵壳，釉色介于青白之间，青中显白、白中泛青。北宋文人以其“击之如磬，温润如玉”将其赞为“假玉器”，奠定了景德镇名扬天下的千年基业。',
      craftHighlights: [
        '斗笠造型大敞口、小窄底，极考验拉坯薄胎功力',
        '内壁刻花刀法飞动犀利，凹处聚釉显现湖碧之色',
        '高白瓷胎透光如玉，敲击铿锵作金石之响',
      ],
      colorTheme: '#437c85',
      accentBadge: '宋瓷巅峰 · 假玉温润',
      remakeConfig: {
        preset: 'bowl',
        motif: 'blank',
        glaze: 'qing',
        step: 'forming',
        name: '北宋 · 景德镇影青斗笠碗',
      },
    },
  ]

  const filteredItems =
    selectedCat === 'all'
      ? MASTERPIECES
      : MASTERPIECES.filter((m) => m.category === selectedCat)

  const CATEGORIES: { key: CategoryKey; label: string; count: number }[] = [
    { key: 'all', label: '全部典藏', count: 6 },
    { key: 'qinghua', label: '青花幽雅', count: 2 },
    { key: 'monochrome', label: '高温单色', count: 2 },
    { key: 'flambe', label: '窑变名品', count: 1 },
    { key: 'song', label: '宋元古意', count: 1 },
  ]

  return (
    <div className="gallery-page-root">
      <div className="gallery-bg" />

      {/* 顶部固定导航栏 */}
      <header className="gallery-nav">
        <div className="gallery-nav-left">
          <button className="gallery-back-btn" onClick={onBack}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>返回首页</span>
          </button>
          <div className="gallery-nav-title">
            <span className="gold-dot" />
            <span className="main-title">御窑传世名瓷典藏 · 数字孪生展厅</span>
          </div>
        </div>

        <div className="gallery-nav-actions">
          <button className="gallery-workshop-btn" onClick={onEnterWorkshop}>
            <span>直接进入工坊制作</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* 展厅主体 */}
      <main className="gallery-main-container">
        {/* 展厅头图引言 */}
        <section className="gallery-hero-banner">
          <div className="gallery-kicker">国宝典藏 · 数字永续</div>
          <h1 className="gallery-headline">名瓷鉴赏与一键工坊复刻</h1>
          <p className="gallery-sub">
            收录故宫博物院、国家博物馆与景德镇御窑博物馆珍藏的传世名瓷。每一件藏品均经过三维尺度、胎骨成分与釉色谱系的数字化重构。点击任意作品的“在工坊复刻”，即可将器型预设、纹样与名釉带入工坊亲手制作。
          </p>

          {/* 分类筛选标签 */}
          <div className="gallery-filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={`cat-pill ${selectedCat === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedCat(cat.key)}
              >
                <span>{cat.label}</span>
                <span className="cat-count">{cat.count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 藏品卡片网格 */}
        <div className="gallery-cards-grid">
          {filteredItems.map((item) => (
            <div
              className="masterpiece-card"
              key={item.id}
              onClick={() => setActiveItem(item)}
              style={{ '--accent-color': item.colorTheme } as React.CSSProperties}
            >
              <div className="card-top-accent">
                <span className="card-dynasty">{item.dynasty}</span>
                <span className="card-badge">{item.accentBadge}</span>
              </div>

              {/* 真实 3D 瓷器模型展视窗 */}
              <div className="card-visual-frame">
                <Masterpiece3DPreview
                  preset={item.remakeConfig.preset}
                  glaze={item.remakeConfig.glaze}
                  motif={item.remakeConfig.motif}
                  colorTheme={item.colorTheme}
                  name={item.title}
                />
                <div className="visual-kiln-tag">{item.kiln}</div>
              </div>

              <div className="card-body">
                <h3 className="card-title">{item.title}</h3>
                <p className="card-summary">{item.summary}</p>

                <div className="card-meta-list">
                  <div className="meta-item">
                    <span className="meta-label">尺寸</span>
                    <span className="meta-val">{item.dimensions}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">釉色</span>
                    <span className="meta-val">{item.glazeInfo}</span>
                  </div>
                </div>

                <div className="card-actions-row">
                  <button
                    className="card-detail-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveItem(item)
                    }}
                  >
                    著录详记
                  </button>
                  <button
                    className="card-remake-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemake(item.remakeConfig)
                    }}
                    title="将该真实 3D 模型导入陶轮，可直接在此基础上拉坯、手绘修改"
                  >
                    <span>导入并在基础上修改</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 详尽著录弹窗 / 藏品故事抽屉 */}
      {activeItem && (
        <div className="gallery-modal-overlay" onClick={() => setActiveItem(null)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setActiveItem(null)}>
              ✕
            </button>

            <div className="modal-header">
              <span className="modal-badge">{activeItem.accentBadge}</span>
              <h2 className="modal-title">{activeItem.title}</h2>
              <div className="modal-subline">
                <span>{activeItem.dynasty}</span>
                <span className="dot-sep">·</span>
                <span>{activeItem.kiln}</span>
                <span className="dot-sep">·</span>
                <span>{activeItem.glazeInfo}</span>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h4 className="modal-sec-t">国宝故事与历史著录</h4>
                <p className="modal-story-p">{activeItem.story}</p>
              </div>

              <div className="modal-section">
                <h4 className="modal-sec-t">关键工艺解密</h4>
                <div className="modal-highlights">
                  {activeItem.craftHighlights.map((hl, i) => (
                    <div className="hl-item" key={i}>
                      <span className="hl-num">{i + 1}</span>
                      <span className="hl-text">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-sec-t">器物材质与尺寸著录</h4>
                <div className="modal-specs-table">
                  <div className="spec-row">
                    <span className="sk">器型规格</span>
                    <span className="sv">{activeItem.dimensions}</span>
                  </div>
                  <div className="spec-row">
                    <span className="sk">胎质配方</span>
                    <span className="sv">{activeItem.materialInfo}</span>
                  </div>
                  <div className="spec-row">
                    <span className="sk">烧制温度</span>
                    <span className="sv">{activeItem.glazeInfo}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setActiveItem(null)}>
                返回展厅
              </button>
              <button
                className="modal-remake-btn primary"
                onClick={() => {
                  const cfg = activeItem.remakeConfig
                  setActiveItem(null)
                  onRemake(cfg)
                }}
              >
                <span>导入工坊并在其基础上修改</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
