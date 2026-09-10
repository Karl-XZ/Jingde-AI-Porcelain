import { useState } from 'react'

interface CraftGuidePageProps {
  onBack: () => void
  onEnterWorkshop: (step?: 'forming' | 'trim' | 'pattern' | 'glaze' | 'fire' | 'finish') => void
}

export function CraftGuidePage({ onBack, onEnterWorkshop }: CraftGuidePageProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'science'>('steps')

  const CRAFT_STEPS = [
    {
      num: '01',
      title: '采石练泥',
      subtitle: '高岭瓷石 · 二元配方',
      poem: '水碓春泥淘练精，高岭瓷石共成型。',
      workshopStep: 'forming' as const,
      color: '#b07f4f',
      desc: '景德镇独步天下的奥秘首先在于“高岭土+瓷石”的二元配方。高岭土富含氧化铝，作为骨架耐受千度高温不变形；瓷石富含石英与长石，作为肌肉赋予瓷器温润透光与致密玻化。',
      details: [
        { label: '水碓春捣', val: '以山间溪流带动木碓，将瓷石反复舂碎成细粉' },
        { label: '澄池淘洗', val: '细粉入池沉淀，去粗取精，沥滤成如脂膏泥块' },
        { label: '人工揉泥', val: '陶工以脚踩、手揉排除泥料微小气泡，顺应泥性' },
      ],
    },
    {
      num: '02',
      title: '轮盘拉坯',
      subtitle: '陶轮飞旋 · 成器之始',
      poem: '轮盘旋转以心御，虚实圆润器形初。',
      workshopStep: 'forming' as const,
      color: '#c9a24f',
      desc: '在飞速旋转的陶轮上，陶工以双手掌心与指尖内外相合，将泥团定中心、开孔、拔壁。毫厘手势的微调决定了梅瓶的丰肩、玉壶春的垂腹、或是斗笠碗的斜敞。',
      details: [
        { label: '定心', val: '双手将泥料推升压平，使其在高速自转中绝对同心' },
        { label: '提壁', val: '食指拇指由内向外迎托，泥胎如竹节破土般拔高' },
        { label: '定形', val: '以竹刮刀轻抵外壁，收小口、鼓大腹，定出基本尺寸' },
      ],
    },
    {
      num: '03',
      title: '利坯修足',
      subtitle: '削泥如纸 · 校准厚度',
      poem: '薄如蝉翼规如月，利刀削出风流骨。',
      workshopStep: 'trim' as const,
      color: '#8b6914',
      desc: '生坯阴干至半干软硬适中时，倒扣于陶轮的泥座上。利坯师傅手握自磨利刀，运刀如飞，将器壁均匀修削至 4~6mm，并旋削出规整如圆的圈足。厚薄均匀是入窑不裂的根本保证。',
      details: [
        { label: '削皮修身', val: '利刀顺转削去凹凸不平，器壁薄如卵壳而浑然一体' },
        { label: '挖足旋底', val: '倒扣挖足，形成正圆形圈足，足脊圆润如泥鳅背' },
        { label: '灯光校准', val: '透过烛光或灯影检视胎壁透光度，确保四壁厚度均等' },
      ],
    },
    {
      num: '04',
      title: '青花画坯',
      subtitle: '苏料点染 · 勾线分水',
      poem: '白釉青花一火分，苏泥浓淡写乾坤。',
      workshopStep: 'pattern' as const,
      color: '#2f6aa9',
      desc: '在干燥透彻的素胎表面直接作画。采用天然钴矿颜料“苏麻离青”，先用长锋鸡狼毫勾勒铁线轮廓，再用分水笔饱蘸料水，依靠素胎瞬间吸水的特性，在坯体上晕染出头浓、正浓、二浓、正淡、影淡五等色阶。',
      details: [
        { label: '铁线勾勒', val: '以细笔中锋勾勒缠枝、云龙、莲瓣轮廓，顿挫有力' },
        { label: '青花分水', val: '分水笔笔不触坯，料水随笔走，靠生胎吸纳晕散出层次' },
        { label: '落笔无悔', val: '干坯吸水迅疾如涸土吸雨，不可涂改覆笔，全凭匠心' },
      ],
    },
    {
      num: '05',
      title: '施釉浸润',
      subtitle: '琉璃素衣 · 决定釉色',
      poem: '蘸荡吹淋随器异，素胎覆上琉璃衣。',
      workshopStep: 'glaze' as const,
      color: '#e8743b',
      desc: '由长石、石英、草木灰水磨调匀成釉浆。根据器型大小采用荡釉、浸釉或吹釉。青花需罩一层纯净透明釉；郎窑红以铜着色，出窑脱口出筋；窑变花釉依靠多层复合流淌；茶叶末则蕴育微细铁结晶。',
      details: [
        { label: '荡釉', val: '向瓶口注入釉浆迅速摇荡转动，使内壁均匀挂釉后倾出' },
        { label: '蘸釉 / 吹釉', val: '双手持夹入池蘸釉，大件器则口含细竹管蒙绢布喷吹' },
        { label: '刮足除釉', val: '将圈足底部的釉料刮净，防止高温熔融与匣钵粘连' },
      ],
    },
    {
      num: '06',
      title: '柴窑烧造',
      subtitle: '松柴烈火 · 浴火成瓷',
      poem: '满窑松柴烈火腾，开窑方见鬼神工。',
      workshopStep: 'fire' as const,
      color: '#c4521f',
      desc: '将施釉瓷坯装入耐火泥制成的匣钵中，送入景德镇传统马鞍形“镇窑”。以含松脂的马尾松木为柴，历经低温排湿、氧化烧结、强还原焰攻顶保温（1280°C~1300°C）与自然缓冷，历经 72 小时后开窑检视。',
      details: [
        { label: '匣钵装套', val: '一钵一器，严密遮蔽柴火落灰与直火冲击' },
        { label: '还原定色', val: '窑内浓烟弥漫、缺氧燃烧，一氧化碳夺氧使铜成宝石红' },
        { label: '自然缓冷', val: '闭窑降温24小时以上，釉层晶化退火，扣之如磬' },
      ],
    },
  ]

  const SCIENCE_TOPICS = [
    {
      title: '还原焰 vs 氧化焰：铜红与铜绿的乾坤颠倒',
      badge: '窑温物理学',
      tag: '1280°C 还原气氛',
      desc: '为什么同一种铜元素（Copper），有时烧成翠绿的孔雀绿釉，有时却能烧成名贵的“郎窑红”？',
      points: [
        '在氧化焰（氧气过量）中，铜元素以二价铜离子（Cu²⁺）存在，吸收红光，显现碧绿与孔雀蓝色；',
        '在强还原焰（减少进风、加重松柴产生大量一氧化碳 CO）中，高温下一氧化碳夺取铜中氧原子，使铜还原为氧化亚铜（Cu₂O）乃至胶体铜微粒（Cu⁰），微粒直径恰好在纳米级，共振散射出极其深沉温润的宝石红，成就了“千窑难出一宝”的郎窑红。',
      ],
    },
    {
      title: '苏麻离青的“铁锈斑”与“锡光”之谜',
      badge: '矿物化学',
      tag: '元明早期御窑特质',
      desc: '永宣青花之所以为后世所尊崇，关键在于天然进口钴料“苏麻离青”的微观析出。',
      points: [
        '苏麻离青产自古波斯（今伊朗卡珊一带），化学成分具有“高铁、低锰、微砷”的鲜明特质；',
        '在 1280°C 景德镇柴窑还原气氛下，高浓度的铁元素局部聚集并达到过饱和状态，冷却时在釉层表层析出晶体状四氧化三铁（Fe₃O₄），肉眼观之呈现凹入胎骨的黑褐色“铁锈斑”，在光线侧照下泛出水银般的金属银锡光泽。',
      ],
    },
    {
      title: '茶叶末结晶釉：哑光微晶的丝绸之美',
      badge: '结晶相变',
      tag: '清雍乾御窑奇珍',
      desc: '茶叶末釉看似朴素无华，实为硅酸盐体系中极为严苛的高温微晶析出奇迹。',
      points: [
        '茶叶末釉属于铁-镁-钙质分相与析晶釉。釉料中含有适量的氧化铁（Fe₂O₃）、氧化镁（MgO）与微量钛、锰；',
        '在达到 1260°C 完全熔融后，窑炉进入特殊的保温缓冷阶段，析晶区停留时，辉石类（Pyroxene）与尖晶石微晶在墨绿色的玻璃基底上大量萌发，肉眼呈现深沉橄榄绿地子中密布黄金般闪烁的微晶点，抚之如细致丝绢。',
      ],
    },
  ]

  return (
    <div className="craft-page-root">
      <div className="craft-bg" />

      {/* 顶部固定导航 */}
      <header className="craft-nav">
        <div className="craft-nav-left">
          <button className="craft-back-btn" onClick={onBack}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>返回首页</span>
          </button>
          <div className="craft-nav-title">
            <span className="gold-dot" />
            <span className="main-title">景德镇传统制瓷工艺 · 七十二道工序探秘</span>
          </div>
        </div>

        <div className="craft-nav-actions">
          <div className="craft-view-tabs">
            <button
              className={`view-tab ${activeTab === 'steps' ? 'active' : ''}`}
              onClick={() => setActiveTab('steps')}
            >
              六大核心工序
            </button>
            <button
              className={`view-tab ${activeTab === 'science' ? 'active' : ''}`}
              onClick={() => setActiveTab('science')}
            >
              窑火物理科学
            </button>
          </div>
          <button className="craft-workshop-btn" onClick={() => onEnterWorkshop('forming')}>
            <span>进入工坊亲手制作</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* 主体卷轴容器 */}
      <main className="craft-main-container">
        {/* 卷首引言 */}
        <section className="craft-hero-banner">
          <div className="hero-kicker">千载瓷都 · 薪火相传</div>
          <h1 className="hero-headline craft-single-line-quote">
            “共计一坯之力，过手七十二，方克成器。”
          </h1>
          <p className="hero-sub">
            明代宋应星《天工开物·陶埏》载景德镇陶艺之繁复精微。一抔微尘之土，经春淘练泥、飞轮拉坯、利刀削肉、苏料点画、琉璃施釉、柴窑涅槃，终成千古绝世名瓷。
          </p>
        </section>

        {activeTab === 'steps' ? (
          /* 六大工序画卷 */
          <div className="craft-steps-grid">
            {CRAFT_STEPS.map((step) => (
              <div className="craft-step-card" key={step.num}>
                <div className="craft-card-topbar">
                  <div className="craft-title-badge" style={{ borderColor: step.color }}>
                    <span className="craft-step-idx" style={{ background: step.color }}>
                      STEP {step.num}
                    </span>
                    <h2 className="craft-step-name">{step.title}</h2>
                  </div>
                  <button
                    className="step-jump-btn"
                    onClick={() => onEnterWorkshop(step.workshopStep)}
                    title="在数字工坊中体验此步骤"
                  >
                    在工坊体验 →
                  </button>
                </div>
                <div className="craft-card-subline">{step.subtitle}</div>

                <div className="step-poem">“{step.poem}”</div>
                <p className="step-desc">{step.desc}</p>

                <div className="step-details-list">
                  {step.details.map((d) => (
                    <div className="step-detail-row" key={d.label}>
                      <span className="detail-tag">{d.label}</span>
                      <span className="detail-val">{d.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 陶瓷科学与物理密码 */
          <div className="craft-science-stack">
            {SCIENCE_TOPICS.map((topic, i) => (
              <div className="craft-science-card" key={i}>
                <div className="science-header">
                  <div className="science-badges">
                    <span className="sc-badge">{topic.badge}</span>
                    <span className="sc-tag">{topic.tag}</span>
                  </div>
                  <h2 className="science-title">{topic.title}</h2>
                  <p className="science-lead">{topic.desc}</p>
                </div>
                <div className="science-points">
                  {topic.points.map((p, pIdx) => (
                    <div className="science-point-item" key={pIdx}>
                      <span className="sc-dot" />
                      <p className="sc-p">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底栏号召 */}
        <section className="craft-bottom-cta">
          <div className="cta-left">
            <div className="cta-t">以心御土，在数字孪生中续写千峰翠色</div>
            <div className="cta-d">现在就前往数字陶艺工坊，亲手捏制专属梅瓶，绘制青花纹饰，点火烧成属于您的传世数字瓷器。</div>
          </div>
          <button className="btn-primary" onClick={() => onEnterWorkshop('forming')}>
            <span>开启您的数字陶艺体验</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </section>
      </main>
    </div>
  )
}
