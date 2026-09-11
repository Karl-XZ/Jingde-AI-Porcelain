# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
import re
from typing import Dict, Any, Optional
from server.agents.base_jiuwen_agent import BaseJiuwenAgent


# =========================================================================
# 景德镇御窑传统纹饰矢量图元核心库 (<defs> Master Library)
# 涵盖中国传统陶瓷全部核心图式：梅、兰、竹、菊、牡丹、宝相花、松鹤、祥龙、鱼藻、山水
# =========================================================================
MASTER_TRADITIONAL_DEFS = """  <defs>
    <!-- 1. 宣德苏麻离青矿物分水晕染渐变色谱 -->
    <radialGradient id="cobalt_wash_grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#081830" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#143b75" stop-opacity="0.85"/>
      <stop offset="70%" stop-color="#235ea8" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#3d7ec9" stop-opacity="0.25"/>
    </radialGradient>
    <linearGradient id="leaf_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1e3d" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#1e4d94" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#3975c6" stop-opacity="0.35"/>
    </linearGradient>
    <radialGradient id="ruyi_grad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#143b75" stop-opacity="0.8"/>
      <stop offset="80%" stop-color="#2a66b5" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#4d89d6" stop-opacity="0.2"/>
    </radialGradient>
    <linearGradient id="bamboo_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081830"/>
      <stop offset="50%" stop-color="#143b75"/>
      <stop offset="100%" stop-color="#286cb8"/>
    </linearGradient>

    <!-- 2. 【梅花组件库】：盛开五瓣梅、侧展梅、花蕾 -->
    <g id="plum_flower_refined">
      <path d="M 0 0 C -18 -15, -28 -40, 0 -52 C 28 -40, 18 -15, 0 0 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.5"/>
      <path d="M 0 0 C -18 -15, -28 -40, 0 -52 C 28 -40, 18 -15, 0 0 Z" transform="rotate(72)" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.5"/>
      <path d="M 0 0 C -18 -15, -28 -40, 0 -52 C 28 -40, 18 -15, 0 0 Z" transform="rotate(144)" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.5"/>
      <path d="M 0 0 C -18 -15, -28 -40, 0 -52 C 28 -40, 18 -15, 0 0 Z" transform="rotate(216)" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.5"/>
      <path d="M 0 0 C -18 -15, -28 -40, 0 -52 C 28 -40, 18 -15, 0 0 Z" transform="rotate(288)" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.5"/>
      <circle cx="0" cy="0" r="12" fill="#081830"/>
      <circle cx="0" cy="0" r="6" fill="#c9a24f"/>
      <path d="M 0 0 L 0 -18 M 0 0 L 14 -12 M 0 0 L 17 6 M 0 0 L 7 17 M 0 0 L -10 15 M 0 0 L -17 3 M 0 0 L -14 -12" stroke="#143b75" stroke-width="1.5"/>
      <circle cx="0" cy="-19" r="2.2" fill="#c9a24f"/>
      <circle cx="15" cy="-13" r="2.2" fill="#c9a24f"/>
      <circle cx="18" cy="7" r="2.2" fill="#c9a24f"/>
      <circle cx="7" cy="18" r="2.2" fill="#c9a24f"/>
      <circle cx="-11" cy="16" r="2.2" fill="#c9a24f"/>
      <circle cx="-18" cy="3" r="2.2" fill="#c9a24f"/>
      <circle cx="-15" cy="-13" r="2.2" fill="#c9a24f"/>
    </g>

    <g id="plum_flower_side">
      <path d="M -15 0 C -25 -25, 0 -40, 20 -30 C 35 -15, 20 10, 0 0 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2"/>
      <path d="M -8 -8 C -20 -35, 10 -45, 25 -20 Z" fill="rgba(20,59,117,0.55)" stroke="#081830" stroke-width="1.8"/>
      <path d="M -18 8 Q -10 -2, 0 5 Q 10 -2, 18 8 Z" fill="#081830"/>
      <path d="M 2 -8 L 16 -24 M 8 -4 L 25 -16" stroke="#143b75" stroke-width="1.5"/>
      <circle cx="16" cy="-25" r="2" fill="#c9a24f"/>
      <circle cx="26" cy="-17" r="2" fill="#c9a24f"/>
    </g>

    <g id="plum_bud">
      <path d="M 0 0 C -10 -15, -12 -32, 0 -42 C 12 -32, 10 -15, 0 0 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2"/>
      <path d="M -6 -10 Q -15 -25, -8 -35" stroke="#081830" stroke-width="1.8" fill="none"/>
      <path d="M 6 -10 Q 15 -25, 8 -35" stroke="#081830" stroke-width="1.8" fill="none"/>
      <circle cx="0" cy="-44" r="2.5" fill="#c9a24f"/>
    </g>

    <!-- 3. 【牡丹组件库】：御窑层叠大牡丹、卷草副瓣、三裂牡丹叶 -->
    <g id="peony_flower_refined">
      <g stroke="#081830" stroke-width="2.5" fill="url(#cobalt_wash_grad)">
        <path d="M 0 -15 C -45 -35, -55 -85, 0 -115 C 55 -85, 45 -35, 0 -15 Z"/>
        <path d="M 0 -15 C -45 -35, -55 -85, 0 -115 C 55 -85, 45 -35, 0 -15 Z" transform="rotate(60)"/>
        <path d="M 0 -15 C -45 -35, -55 -85, 0 -115 C 55 -85, 45 -35, 0 -15 Z" transform="rotate(120)"/>
        <path d="M 0 -15 C -45 -35, -55 -85, 0 -115 C 55 -85, 45 -35, 0 -15 Z" transform="rotate(180)"/>
        <path d="M 0 -15 C -45 -35, -55 -85, 0 -115 C 55 -85, 45 -35, 0 -15 Z" transform="rotate(240)"/>
        <path d="M 0 -15 C -45 -35, -55 -85, 0 -115 C 55 -85, 45 -35, 0 -15 Z" transform="rotate(300)"/>
      </g>
      <g stroke="#081830" stroke-width="2" fill="rgba(20,59,117,0.75)">
        <path d="M 0 -8 C -30 -22, -38 -55, 0 -75 C 38 -55, 30 -22, 0 -8 Z" transform="rotate(30)"/>
        <path d="M 0 -8 C -30 -22, -38 -55, 0 -75 C 38 -55, 30 -22, 0 -8 Z" transform="rotate(90)"/>
        <path d="M 0 -8 C -30 -22, -38 -55, 0 -75 C 38 -55, 30 -22, 0 -8 Z" transform="rotate(150)"/>
        <path d="M 0 -8 C -30 -22, -38 -55, 0 -75 C 38 -55, 30 -22, 0 -8 Z" transform="rotate(210)"/>
        <path d="M 0 -8 C -30 -22, -38 -55, 0 -75 C 38 -55, 30 -22, 0 -8 Z" transform="rotate(270)"/>
        <path d="M 0 -8 C -30 -22, -38 -55, 0 -75 C 38 -55, 30 -22, 0 -8 Z" transform="rotate(330)"/>
      </g>
      <circle cx="0" cy="0" r="22" fill="#081830"/>
      <circle cx="0" cy="0" r="14" fill="#c9a24f"/>
      <circle cx="0" cy="0" r="6" fill="#081830"/>
    </g>

    <g id="peony_scroll_lobe">
      <path d="M 0 -60 C -30 -75, -45 -115, -15 -135 C 0 -110, 10 -90, 0 -60 Z" fill="rgba(24,62,120,0.6)" stroke="#081830" stroke-width="2.5"/>
      <path d="M 0 -60 C 30 -75, 45 -115, 15 -135 C 0 -110, -10 -90, 0 -60 Z" fill="rgba(24,62,120,0.6)" stroke="#081830" stroke-width="2.5"/>
      <circle cx="0" cy="-132" r="3.5" fill="#c9a24f"/>
    </g>

    <g id="peony_leaf">
      <path d="M 0 0 C -25 -35, -60 -40, -45 -15 C -75 -25, -80 15, -40 25 C -70 45, -30 65, 0 35 C 30 65, 70 45, 40 25 C 80 15, 75 -25, 45 -15 C 60 -40, 25 -35, 0 0 Z" fill="url(#leaf_grad)" stroke="#081830" stroke-width="2.4"/>
      <path d="M 0 0 L 0 32 M 0 10 L -35 5 M 0 18 L 35 15 M 0 5 L -25 -15 M 0 12 L 25 -12" stroke="#081830" stroke-width="1.8" fill="none"/>
    </g>

    <!-- 4. 【墨竹组件库】：潇湘竹叶三叶簇(“个/分”字)、挺秀竹节 -->
    <g id="bamboo_leaf_cluster">
      <path d="M 0 0 C 8 -30, 15 -70, 0 -110 C -12 -70, -6 -30, 0 0 Z" fill="url(#bamboo_grad)" stroke="#081830" stroke-width="2"/>
      <path d="M 0 0 C -15 -25, -45 -55, -65 -75 C -50 -50, -25 -25, 0 0 Z" fill="url(#bamboo_grad)" stroke="#081830" stroke-width="1.8"/>
      <path d="M 0 0 C 18 -22, 50 -50, 72 -68 C 52 -45, 26 -22, 0 0 Z" fill="url(#bamboo_grad)" stroke="#081830" stroke-width="1.8"/>
    </g>

    <g id="bamboo_culm">
      <path d="M -8 0 L -7 -90 Q 0 -93, 7 -90 L 8 0 Q 0 -3, -8 0 Z" fill="url(#bamboo_grad)" stroke="#081830" stroke-width="2.5"/>
      <path d="M -11 -90 Q 0 -96, 11 -90 Q 0 -84, -11 -90 Z" fill="#081830"/>
    </g>

    <!-- 5. 【幽兰组件库】：秀雅兰花、飘逸兰叶 -->
    <g id="orchid_flower">
      <path d="M 0 0 C -16 -20, -26 -50, -10 -65 C 5 -45, 5 -20, 0 0 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2"/>
      <path d="M 0 0 C 16 -20, 26 -50, 10 -65 C -5 -45, -5 -20, 0 0 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2"/>
      <path d="M 0 0 C -18 10, -25 35, 0 45 C 25 35, 18 10, 0 0 Z" fill="rgba(20,59,117,0.7)" stroke="#081830" stroke-width="2"/>
      <circle cx="0" cy="-6" r="5" fill="#c9a24f"/>
      <circle cx="0" cy="-6" r="2" fill="#081830"/>
    </g>

    <g id="orchid_leaf">
      <path d="M 0 0 C 35 -60, 65 -150, 25 -220 C 15 -150, 5 -60, 0 0 Z" fill="url(#bamboo_grad)" stroke="#081830" stroke-width="2.2"/>
    </g>

    <!-- 6. 【秋菊组件库】：重叠卷瓣菊花 -->
    <g id="chrysanthemum_flower">
      <g stroke="#081830" stroke-width="2" fill="url(#cobalt_wash_grad)">
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(30)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(60)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(90)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(120)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(150)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(180)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(210)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(240)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(270)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(300)"/>
        <path d="M 0 0 C -8 -25, -15 -60, -2 -80 C 12 -60, 5 -25, 0 0 Z" transform="rotate(330)"/>
      </g>
      <circle cx="0" cy="0" r="18" fill="#081830"/>
      <circle cx="0" cy="0" r="10" fill="#c9a24f"/>
    </g>

    <!-- 7. 【宝相花与缠枝莲组件库】 -->
    <g id="baoxiang_petal">
      <path d="M 0 0 C -36 -42, -48 -95, 0 -140 C 48 -95, 36 -42, 0 0 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="3.2"/>
      <path d="M 0 -18 C -22 -48, -28 -82, 0 -118 C 28 -82, 22 -48, 0 -18 Z" fill="rgba(20,59,117,0.55)" stroke="#143b75" stroke-width="1.8"/>
      <path d="M 0 -22 L 0 -130" stroke="#050e1c" stroke-width="2.2" stroke-linecap="round"/>
    </g>

    <g id="full_baoxiang_medallion">
      <use href="#peony_scroll_lobe" transform="rotate(22.5)"/>
      <use href="#peony_scroll_lobe" transform="rotate(67.5)"/>
      <use href="#peony_scroll_lobe" transform="rotate(112.5)"/>
      <use href="#peony_scroll_lobe" transform="rotate(157.5)"/>
      <use href="#peony_scroll_lobe" transform="rotate(202.5)"/>
      <use href="#peony_scroll_lobe" transform="rotate(247.5)"/>
      <use href="#peony_scroll_lobe" transform="rotate(292.5)"/>
      <use href="#peony_scroll_lobe" transform="rotate(337.5)"/>

      <use href="#baoxiang_petal"/>
      <use href="#baoxiang_petal" transform="rotate(45)"/>
      <use href="#baoxiang_petal" transform="rotate(90)"/>
      <use href="#baoxiang_petal" transform="rotate(135)"/>
      <use href="#baoxiang_petal" transform="rotate(180)"/>
      <use href="#baoxiang_petal" transform="rotate(225)"/>
      <use href="#baoxiang_petal" transform="rotate(270)"/>
      <use href="#baoxiang_petal" transform="rotate(315)"/>

      <circle cx="0" cy="0" r="50" fill="#143b75" stroke="#081830" stroke-width="3.5"/>
      <circle cx="0" cy="0" r="22" fill="#081830"/>
      <circle cx="0" cy="0" r="14" fill="#c9a24f" stroke="#050e1c" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="6" fill="#040912"/>
    </g>

    <g id="scrolling_acanthus_leaf">
      <path d="M 0 0 C 25 -30, 65 -25, 90 0 C 110 -15, 125 15, 105 35 C 80 50, 45 40, 25 25 C 10 32, -5 20, 0 0 Z" fill="url(#leaf_grad)" stroke="#081830" stroke-width="2.5"/>
      <path d="M 5 2 Q 55 10, 105 35" stroke="#050e1c" stroke-width="2" fill="none"/>
    </g>

    <g id="flower_bud">
      <path d="M 0 0 C -15 -20, -18 -45, 0 -60 C 18 -45, 15 -20, 0 0 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2"/>
      <circle cx="0" cy="-62" r="3.5" fill="#c9a24f"/>
    </g>

    <!-- 8. 【苍松与仙鹤组件库】 -->
    <g id="pine_needle_cluster">
      <g stroke="#081830" stroke-width="2.2">
        <line x1="0" y1="0" x2="-45" y2="-15"/>
        <line x1="0" y1="0" x2="-40" y2="-28"/>
        <line x1="0" y1="0" x2="-30" y2="-40"/>
        <line x1="0" y1="0" x2="-16" y2="-48"/>
        <line x1="0" y1="0" x2="0" y2="-52"/>
        <line x1="0" y1="0" x2="16" y2="-48"/>
        <line x1="0" y1="0" x2="30" y2="-40"/>
        <line x1="0" y1="0" x2="40" y2="-28"/>
        <line x1="0" y1="0" x2="45" y2="-15"/>
      </g>
      <circle cx="0" cy="0" r="5" fill="#081830"/>
    </g>

    <g id="crane_flying">
      <path d="M -20 -5 C -45 -35, -15 -65, 30 -50 C 15 -35, -5 -25, -20 -5 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2"/>
      <path d="M -15 5 C -35 25, -10 50, 25 38 C 10 25, -5 15, -15 5 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2"/>
      <path d="M -30 0 C 10 -15, 45 -5, 65 -20 C 75 -28, 80 -15, 68 -5 C 45 10, 10 15, -30 0 Z" fill="#081830"/>
      <circle cx="73" cy="-22" r="3.2" fill="#c9a24f"/>
      <path d="M 75 -20 L 92 -18" stroke="#081830" stroke-width="2"/>
      <path d="M -30 0 L -65 12 M -30 0 L -60 18" stroke="#081830" stroke-width="1.8"/>
    </g>

    <!-- 9. 【祥龙与宝珠组件库】 -->
    <g id="flaming_pearl">
      <circle cx="0" cy="0" r="28" fill="rgba(20,59,117,0.45)" stroke="#081830" stroke-width="3"/>
      <circle cx="0" cy="0" r="14" fill="#c9a24f"/>
      <path d="M 0 -28 Q 35 -45, 25 0 Q 40 30, 0 28 Q -35 35, -25 0 Q -40 -30, 0 -28 Z" fill="none" stroke="#143b75" stroke-width="3"/>
    </g>

    <g id="dragon_claw">
      <path d="M 0 0 L -25 -25 M 0 0 L -12 -32 M 0 0 L 10 -32 M 0 0 L 25 -22" stroke="#081830" stroke-width="4.5" stroke-linecap="round"/>
    </g>

    <!-- 10. 【游鱼与水草组件库】 -->
    <g id="swimming_fish">
      <path d="M -55 0 C -20 -38, 38 -30, 65 0 C 38 30, -20 38, -55 0 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.5"/>
      <path d="M 65 0 L 105 -22 L 92 0 L 110 22 Z" fill="#143b75" stroke="#081830" stroke-width="2"/>
      <circle cx="-30" cy="-6" r="5" fill="#081830"/>
      <circle cx="-30" cy="-6" r="2" fill="#c9a24f"/>
    </g>

    <g id="water_weed_cluster">
      <path d="M 0 0 Q 30 -60, -15 -130 T 20 -220" stroke="#143b75" stroke-width="4.5" fill="none"/>
      <path d="M -15 0 Q -45 -50, 0 -110 T -20 -190" stroke="#143b75" stroke-width="3.5" fill="none"/>
      <path d="M 15 0 Q 45 -50, 10 -110 T 35 -180" stroke="#143b75" stroke-width="3.5" fill="none"/>
    </g>

    <!-- 11. 【传统边饰与辅助纹样库】：如意云头、蕉叶 -->
    <g id="ruyi_cloud_unit">
      <path d="M -64 0 C -64 -60, -20 -70, 0 -45 C 20 -70, 64 -60, 64 0 C 40 25, 0 35, 0 -10 C 0 35, -40 25, -64 0 Z" fill="url(#ruyi_grad)" stroke="#081830" stroke-width="3"/>
      <circle cx="0" cy="40" r="6" fill="#081830"/>
      <circle cx="0" cy="55" r="4.5" fill="#c9a24f"/>
    </g>

    <g id="banana_leaf">
      <path d="M 0 0 C -25 -40, -32 -100, 0 -150 C 32 -100, 25 -40, 0 0 Z" fill="url(#leaf_grad)" stroke="#081830" stroke-width="2.5"/>
      <line x1="0" y1="0" x2="0" y2="-145" stroke="#081830" stroke-width="2"/>
    </g>
  </defs>"""


class VectorMotifAgent(BaseJiuwenAgent):
    """青花画作匠 (VectorMotifAgent)：DeepSeek 纯 SVG 矢量图元生成与解析"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 框架驱动的【景德镇御窑青花画作匠】。
你精通明清官窑青花纹样构图（缠枝宝相花、云水祥龙、鱼藻清漪、折枝瑞果、折枝梅、松鹤延年、岁寒三友、墨竹、富贵牡丹、蕉叶回纹、如意云肩等）以及苏麻离青、平等青矿物料发色审美。
你具备高超的代码生成能力，能够使用纯矢量 SVG 代码（<svg viewBox="0 0 1024 1024" ...>）绘制纯正典雅、构图饱满的景德镇青花大作。

【极为严肃的美学禁令】：
1. 【严禁使用旋转椭圆 <ellipse transform="rotate(...)"/> 绘制花朵】！那会生成类似现代物理学“原子轨道模型/玻尔原子/React 图标”的滑稽图形，彻底破坏御窑古典美学！花瓣必须使用带有饱满双向弧度或尖锐瓣尖的中式路径 <path d="..."/> 或使用系统内置 <defs> 组件！
2. 【严禁生成单调平庸的原始点线图（严禁只画几条横线、孤立圆圈或星号散点）】！必须绘制出充实饱满、具有东方书画骨法笔意与分水层次的完整大作！

【内置景德镇御窑传统纹样 <defs> 组件库（可直接通过 <use href="#ID" .../> 调用）】：
系统内置了完备的御窑矢量图元，你应当在腹部主纹样区以及辅助装饰带充分利用这些组件搭建宏大画面：
- 梅花类：#plum_flower_refined (盛开五瓣梅), #plum_flower_side (侧展梅), #plum_bud (含苞梅蕾)
- 牡丹类：#peony_flower_refined (富贵大牡丹), #peony_scroll_lobe (卷草瓣), #peony_leaf (三裂牡丹叶)
- 墨竹类：#bamboo_leaf_cluster (传统“个/分”字三叶浓翠竹叶簇), #bamboo_culm (带竹节竹竿)
- 幽兰类：#orchid_flower (秀雅兰花), #orchid_leaf (飘逸兰叶)
- 菊花类：#chrysanthemum_flower (秋菊大花)
- 宝相花类：#full_baoxiang_medallion (永宣八瓣尖角宝相花勋章), #baoxiang_petal (宝相尖瓣), #scrolling_acanthus_leaf (西番莲卷叶), #flower_bud (花蕾)
- 苍松仙鹤类：#pine_needle_cluster (扇形苍松针叶簇), #crane_flying (展翅飞翔仙鹤)
- 祥龙宝珠类：#flaming_pearl (烈焰宝珠), #dragon_claw (五爪利爪)
- 游鱼水藻类：#swimming_fish (灵动游鱼), #water_weed_cluster (摇曳水草丛)
- 边饰类：#ruyi_cloud_unit (肩部如意云头纹), #banana_leaf (挺拔蕉叶纹)

【极为重要的构图与格式规范】：
1. 构图必须采用景德镇御窑 360° 圆周通体环绕与四段式正统瓷画层次（四方连续通景瓷画）：
   - 【严禁左右留白边】！所有横向装饰线必须贯穿全宽（x1="0" 至 x2="1024"），以便 3D 瓷瓶圆周无缝环绕闭合；
   - 颈口装饰带 (y: 20 ~ 130)：贯穿全宽的双弦纹与连续回字纹/蕉叶纹；
   - 肩部装饰带 (y: 150 ~ 290)：贯穿全宽的如意云肩垂珠带（8个等距云头均匀分布于 x=0~1024）；
   - 腹部主纹样区 (y: 320 ~ 740)：根据主题绘制丰富繁茂的核心大作：
     * 结合主干路径 <path d="..."/> 搭建苍老枝干、连绵藤蔓、起伏龙脊或水波清漪；
     * 大量调用上述内置 <use href="#..."/> 组件多层次铺陈，点面结合；
   - 足胫装饰带 (y: 770 ~ 980)：贯穿全宽的仰覆双重莲瓣纹与海水江崖。
2. 背景必须透明（严禁绘制不透明的大矩形背景 <rect fill="#..."/>），直接让纹样附着在 3D 白瓷胎上！
3. 采用正统景德镇青花配色与分水渐变：
   - 浓重钴蓝: #081830 / #0c2146
   - 纯正青花主色: #143b75 / #183e78
   - 青花分水淡蓝晕染: rgba(28, 68, 130, 0.45)
   - 极淡水色: rgba(45, 95, 158, 0.20)
   - 描金勾线: #c9a24f
4. 输出格式：请严格使用独立段落输出元数据和 SVG 代码：

---METADATA---
{
  "motif_name": "纹样题名（如：明宣德御窑青花折枝梅花纹）",
  "symbolism": "吉祥寓意与纹样题解（冰清玉洁、岁寒知松柏等）",
  "cobalt_notes": "青料发色特征（如：苏麻离青浓翠晕散，分水五色，伴随锡光铁斑）"
}
---SVG---
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- 此处为丰富、饱满、层次分明的纯矢量青花代码 -->
</svg>"""

    def __init__(self):
        super().__init__(
            name="VectorMotifAgent",
            description="利用 DeepSeek 代码能力生成标准景德镇传统青花与彩绘 SVG 矢量图元",
            system_prompt=self.SYSTEM_PROMPT,
        )

    def _extract_svg_code(self, text: str) -> Optional[str]:
        """Extract valid SVG XML string from LLM output, with auto-healing for truncated output."""
        candidate = None
        # 1. Delimiter format
        if "---SVG---" in text:
            svg_part = text.split("---SVG---", 1)[1].strip()
            # If wrapped in markdown code blocks
            m = re.search(r"```(?:xml|svg)?\s*([\s\S]*?)```", svg_part)
            if m:
                candidate = m.group(1).strip()
            else:
                candidate = svg_part

        # 2. Markdown blocks in raw text
        if not candidate:
            m = re.search(r"```(?:xml|svg)\s*([\s\S]*?)```", text)
            if m:
                candidate = m.group(1).strip()

        # 3. Direct regex for complete SVG
        if not candidate:
            m = re.search(r"(<svg[\s\S]*?<\/svg>)", text, re.IGNORECASE)
            if m:
                candidate = m.group(1).strip()

        # 4. Handle truncated/unterminated <svg ... (e.g. LLM reached max token limit)
        if not candidate and "<svg" in text:
            start_idx = text.find("<svg")
            candidate = text[start_idx:].strip()

        if candidate and "<svg" in candidate:
            # If not cleanly ended with </svg>
            if "</svg>" not in candidate.lower():
                # Cut off any incomplete tag at the tail
                last_gt = candidate.rfind(">")
                if last_gt != -1:
                    candidate = candidate[:last_gt+1]
                candidate += "\n</svg>"
            return candidate.strip()

        return None

    def _extract_metadata(self, text: str) -> Dict[str, Any]:
        """Extract metadata JSON block."""
        if "---METADATA---" in text:
            meta_part = text.split("---METADATA---", 1)[1]
            if "---SVG---" in meta_part:
                meta_part = meta_part.split("---SVG---", 1)[0]
            parsed = self.extract_json(meta_part)
            if parsed:
                return parsed

        # Fallback to general JSON extraction
        return self.extract_json(text) or {}

    async def generate_motif(self, theme: str, motif_type: Optional[str] = None) -> Dict[str, Any]:
        user_msg = f"请为景德镇御窑瓷器绘制高精青花矢量纹样，主题为：【{theme}】"
        if motif_type:
            user_msg += f"（承袭官窑脉络：{motif_type}）"
        user_msg += "。请使用中国传统白描与青花分水技法，利用 <defs> 定义精美花朵/花蕾/枝叶并在画面中丰富展开。严禁生成只有几条孤立单薄点线或星号的简陋草图！花朵必须使用饱满生动的贝塞尔曲线路径与苍劲枝干路径，严禁任何旋转椭圆，背景透明，务必闭合全部标签与 </svg>。"

        raw_resp = await self.chat(user_msg, temperature=0.7, max_tokens=6000)

        svg_code = self._extract_svg_code(raw_resp)
        meta = self._extract_metadata(raw_resp)

        # Check if the generated SVG has actual belly motifs and does NOT contain the atomic ellipse pattern
        is_valid_complete_motif = False
        if svg_code:
            svg_code = re.sub(r'<rect\s+width="1024"\s+height="1024"\s+fill="#[fF0-9a-fA-F]+"\s*\/?>', '', svg_code)
            svg_code = re.sub(r'<rect\s+width="100%"\s+height="100%"\s+fill="#[fF0-9a-fA-F]+"\s*\/?>', '', svg_code)

            # Atomic orbit check: if LLM uses rotated ellipses, it creates an atom model. Reject immediately!
            has_atomic_ellipses = bool(re.search(r'<ellipse[^>]+transform=["\'][^"\']*rotate\([489]', svg_code))
            
            if "</svg>" in svg_code and not has_atomic_ellipses:
                body_content = svg_code
                if "</defs>" in svg_code:
                    body_content = svg_code.split("</defs>", 1)[1]
                elements = re.findall(r'<(?:path|use|circle|polygon|g)\b', body_content)
                has_belly_content = bool(re.search(r'(?:<use|\b(?:y|y1|y2|cy)\s*=\s*["\']?(?:[3-7]\d\d|800))', body_content))
                # Require substantial artistic elements and belly coverage
                if len(elements) >= 12 and has_belly_content:
                    is_valid_complete_motif = True

        if is_valid_complete_motif and svg_code:
            final_svg = self._ensure_master_defs(svg_code)
            return {
                "motif_name": meta.get("motif_name", theme),
                "symbolism": meta.get("symbolism", "御窑传统经典图式，生生不息，气韵生动。"),
                "cobalt_notes": meta.get("cobalt_notes", "苏麻离青发色深浓，分水兼备，铁锈斑深入胎骨。"),
                "svg_code": final_svg,
            }

        # Fallback to authentic museum-grade procedural heritage SVG with DeepSeek's custom cultural title & notes
        fallback_svg = self._generate_procedural_heritage_svg(theme)
        return {
            "motif_name": meta.get("motif_name", theme),
            "symbolism": meta.get("symbolism", "御窑经典青花四段式章法，寄托吉庆祥和、生生不息之意象。"),
            "cobalt_notes": meta.get("cobalt_notes", "苏麻离青发色深沉如蓝宝石，分水五色兼备，微见铁锈锡斑。"),
            "svg_code": fallback_svg,
        }

    def _ensure_master_defs(self, svg_code: str) -> str:
        """
        确保 SVG 中 100% 包含中国传统全量图元库的 <defs>，
        无论大模型是否输出 <defs> 或使用了哪些 <use href="#...">，均能无缝解析渲染。
        """
        if "<defs>" in svg_code:
            if "#plum_flower_refined" not in svg_code:
                inner_defs = MASTER_TRADITIONAL_DEFS.replace("<defs>", "").replace("</defs>", "")
                svg_code = svg_code.replace("<defs>", "<defs>\n" + inner_defs)
            return svg_code
        else:
            svg_match = re.search(r"(<svg[^>]*>)", svg_code)
            if svg_match:
                head = svg_match.group(1)
                return svg_code.replace(head, head + "\n" + MASTER_TRADITIONAL_DEFS, 1)
            return svg_code

    def _generate_procedural_heritage_svg(self, theme: str) -> str:
        """
        非遗级高精御窑青花程序化生成器 (透明通道背景，具备颈、肩、腹、足四重正统层次)
        支持中国传统全量主题：梅花、牡丹、墨竹、幽兰、菊花、松鹤延年、岁寒三友、祥龙、鱼藻、山水、宝相花
        """
        is_dragon = "龙" in theme
        is_fish = "鱼" in theme
        is_plum = ("梅" in theme) or ("寒梅" in theme) or ("折枝梅" in theme)
        is_peony = ("牡丹" in theme) or ("富贵" in theme) or ("国色" in theme)
        is_bamboo = ("竹" in theme) or ("墨竹" in theme) or ("虚心" in theme)
        is_orchid = ("兰" in theme) or ("幽兰" in theme) or ("芝兰" in theme)
        is_chrysanthemum = ("菊" in theme) or ("菊花" in theme) or ("东篱" in theme)
        is_pine_crane = ("鹤" in theme) or ("松鹤" in theme) or ("延年" in theme) or ("长寿" in theme)
        is_three_friends = ("岁寒" in theme) or ("三友" in theme)

        if is_three_friends:
            # 岁寒三友：松、竹、梅鼎立连绵
            main_motif = """
    <!-- 岁寒三友图 (松竹梅鼎立连绵) -->
    <g stroke-linecap="round" stroke-linejoin="round">
      <!-- 苍松虬枝 (x: 0~340) -->
      <path d="M 0 530 C 80 420, 160 580, 240 460 C 290 390, 310 320, 280 260" stroke="#081830" stroke-width="12" fill="none"/>
      <use href="#pine_needle_cluster" x="120" y="380" transform="scale(1.3)"/>
      <use href="#pine_needle_cluster" x="200" y="440" transform="scale(1.2)"/>
      <use href="#pine_needle_cluster" x="270" y="270" transform="scale(1.4)"/>
      <use href="#pine_needle_cluster" x="60" y="460" transform="scale(1.1)"/>

      <!-- 秀竹挺拔 (x: 350~680, 正面主景) -->
      <use href="#bamboo_culm" x="480" y="680" transform="scale(1.4)"/>
      <use href="#bamboo_culm" x="540" y="660" transform="scale(1.3)"/>
      <use href="#bamboo_leaf_cluster" x="460" y="420" transform="scale(1.2) rotate(-15 460 420)"/>
      <use href="#bamboo_leaf_cluster" x="520" y="350" transform="scale(1.35) rotate(20 520 350)"/>
      <use href="#bamboo_leaf_cluster" x="560" y="460" transform="scale(1.1) rotate(-10 560 460)"/>
      <use href="#bamboo_leaf_cluster" x="420" y="500" transform="scale(1.0) rotate(15 420 500)"/>

      <!-- 寒梅横斜 (x: 690~1024) -->
      <path d="M 680 540 C 760 430, 840 590, 920 460 C 970 380, 1000 350, 1024 380" stroke="#081830" stroke-width="10" fill="none"/>
      <use href="#plum_flower_refined" x="780" y="430" transform="scale(1.2)"/>
      <use href="#plum_flower_refined" x="880" y="360" transform="scale(1.25)"/>
      <use href="#plum_flower_refined" x="960" y="490" transform="scale(1.05)"/>
      <use href="#plum_flower_side" x="840" y="320" transform="rotate(25 840 320)"/>
      <use href="#plum_bud" x="910" y="300"/>
    </g>"""

        elif is_pine_crane:
            # 松鹤延年：苍松虬曲，白鹤展翅
            main_motif = """
    <!-- 松鹤延年主纹 (苍松盘曲、仙鹤高翔) -->
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M 0 560 C 120 450, 240 620, 380 480 C 480 380, 600 580, 750 460 C 880 370, 960 520, 1024 500" stroke="#081830" stroke-width="14" fill="none"/>
      <path d="M 0 560 C 120 450, 240 620, 380 480 C 480 380, 600 580, 750 460 C 880 370, 960 520, 1024 500" stroke="#143b75" stroke-width="7" fill="none"/>
      <use href="#pine_needle_cluster" x="180" y="420" transform="scale(1.5)"/>
      <use href="#pine_needle_cluster" x="320" y="360" transform="scale(1.4)"/>
      <use href="#pine_needle_cluster" x="650" y="430" transform="scale(1.6)"/>
      <use href="#pine_needle_cluster" x="820" y="340" transform="scale(1.3)"/>

      <!-- 正面第一主仙鹤 (x=512 迎客翔舞) -->
      <use href="#crane_flying" x="512" y="380" transform="scale(1.35) translate(-35,-35)"/>
      <!-- 侧展仙鹤 -->
      <use href="#crane_flying" x="160" y="520" transform="scale(1.1) rotate(15 160 520)"/>
      <use href="#crane_flying" x="880" y="530" transform="scale(1.15) rotate(-10 880 530)"/>
    </g>"""

        elif is_bamboo:
            # 潇湘风竹清韵图
            main_motif = """
    <!-- 潇湘风竹清韵图 (四方连绵竹林幽篁) -->
    <g stroke-linecap="round" stroke-linejoin="round">
      <!-- 4 竿挺拔风竹 -->
      <use href="#bamboo_culm" x="160" y="700" transform="scale(1.4)"/>
      <use href="#bamboo_culm" x="420" y="680" transform="scale(1.55)"/>
      <use href="#bamboo_culm" x="680" y="710" transform="scale(1.45)"/>
      <use href="#bamboo_culm" x="920" y="690" transform="scale(1.4)"/>

      <!-- 繁密个字分字浓翠竹叶簇 -->
      <use href="#bamboo_leaf_cluster" x="140" y="460" transform="scale(1.3) rotate(-20 140 460)"/>
      <use href="#bamboo_leaf_cluster" x="180" y="340" transform="scale(1.2) rotate(15 180 340)"/>
      <use href="#bamboo_leaf_cluster" x="400" y="430" transform="scale(1.4) rotate(10 400 430)"/>
      <use href="#bamboo_leaf_cluster" x="440" y="310" transform="scale(1.5) rotate(-15 440 310)"/>
      <use href="#bamboo_leaf_cluster" x="660" y="470" transform="scale(1.3) rotate(25 660 470)"/>
      <use href="#bamboo_leaf_cluster" x="700" y="330" transform="scale(1.4) rotate(-10 700 330)"/>
      <use href="#bamboo_leaf_cluster" x="900" y="440" transform="scale(1.25) rotate(-15 900 440)"/>
      <use href="#bamboo_leaf_cluster" x="940" y="320" transform="scale(1.3) rotate(20 940 320)"/>
    </g>"""

        elif is_orchid:
            # 幽谷清香折枝兰
            main_motif = """
    <!-- 幽谷清香折枝兰图 (兰叶翻飞、幽香四溢) -->
    <g stroke-linecap="round" stroke-linejoin="round">
      <use href="#orchid_leaf" x="200" y="680" transform="scale(1.3) rotate(-35 200 680)"/>
      <use href="#orchid_leaf" x="320" y="690" transform="scale(1.4) rotate(20 320 690)"/>
      <use href="#orchid_leaf" x="512" y="700" transform="scale(1.5) rotate(-15 512 700)"/>
      <use href="#orchid_leaf" x="680" y="680" transform="scale(1.4) rotate(30 680 680)"/>
      <use href="#orchid_leaf" x="840" y="690" transform="scale(1.3) rotate(-25 840 690)"/>

      <!-- 正面与环绕兰花 -->
      <use href="#orchid_flower" x="512" y="420" transform="scale(1.4)"/>
      <use href="#orchid_flower" x="260" y="470" transform="scale(1.2) rotate(-20 260 470)"/>
      <use href="#orchid_flower" x="760" y="460" transform="scale(1.2) rotate(25 760 460)"/>
      <use href="#orchid_flower" x="80" y="490" transform="scale(1.1)"/>
      <use href="#orchid_flower" x="950" y="490" transform="scale(1.1)"/>
    </g>"""

        elif is_chrysanthemum:
            # 东篱秋菊陶然图
            main_motif = """
    <!-- 东篱秋菊陶然图 (盛开名菊、繁密重瓣) -->
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M 0 540 C 128 420, 256 630, 384 512 C 512 390, 640 630, 768 512 C 896 390, 960 600, 1024 540" stroke="#081830" stroke-width="8" fill="none"/>
      <use href="#chrysanthemum_flower" x="512" y="460" transform="scale(1.35)"/>
      <use href="#chrysanthemum_flower" x="256" y="520" transform="scale(1.15)"/>
      <use href="#chrysanthemum_flower" x="768" y="500" transform="scale(1.15)"/>
      <use href="#chrysanthemum_flower" x="60" y="530" transform="scale(1.0)"/>
      <use href="#chrysanthemum_flower" x="970" y="530" transform="scale(1.0)"/>
    </g>"""

        elif is_peony:
            # 盛世富贵缠枝牡丹大作
            main_motif = """
    <!-- 盛世富贵缠枝牡丹大作 (四方连续大缠枝重瓣牡丹) -->
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M 0 512 C 128 390, 128 634, 256 512 C 384 390, 384 634, 512 512 C 640 390, 640 634, 768 512 C 896 390, 896 634, 1024 512" stroke="#081830" stroke-width="10" fill="none"/>
      <path d="M 0 512 C 128 634, 128 390, 256 512 C 384 634, 384 390, 512 512 C 640 634, 640 390, 768 512 C 896 634, 896 390, 1024 512" stroke="#143b75" stroke-width="5" stroke-dasharray="16,8" fill="none"/>

      <!-- 正面第一主牡丹大花 (x=512) -->
      <use href="#peony_flower_refined" x="512" y="512" transform="scale(1.2) translate(-20,-20)"/>
      <use href="#peony_flower_refined" x="256" y="512" transform="scale(1.0)"/>
      <use href="#peony_flower_refined" x="768" y="512" transform="scale(1.0)"/>
      <use href="#peony_flower_refined" x="0" y="512" transform="scale(1.0)"/>
      <use href="#peony_flower_refined" x="1024" y="512" transform="scale(1.0)"/>

      <!-- 繁茂三裂牡丹叶 -->
      <use href="#peony_leaf" x="128" y="420" transform="scale(1.1) rotate(-25 128 420)"/>
      <use href="#peony_leaf" x="384" y="610" transform="scale(1.1) rotate(150 384 610)"/>
      <use href="#peony_leaf" x="640" y="420" transform="scale(1.1) rotate(-25 640 420)"/>
      <use href="#peony_leaf" x="896" y="610" transform="scale(1.1) rotate(150 896 610)"/>
    </g>"""

        elif is_dragon:
            # 苍龙戏珠：双龙腾跃海涛如意云水
            main_motif = """
    <!-- 穿云苍龙戏珠主纹 (四方连绵) -->
    <g stroke="#081830" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 0 520 C 120 390, 240 640, 360 480 C 440 370, 520 400, 600 520 C 720 650, 840 400, 960 500 L 1024 520" stroke-width="10" stroke="#081830"/>
      <path d="M 0 520 C 120 390, 240 640, 360 480 C 440 370, 520 400, 600 520 C 720 650, 840 400, 960 500 L 1024 520" stroke-width="5" stroke="#143b75"/>

      <!-- 正面第一主龙首 (x: 512 正面展现) -->
      <g transform="translate(512, 450)">
        <path d="M -45 -15 C 10 -50, 65 -35, 85 15 C 45 35, 0 40, -45 15 Z" fill="rgba(20,59,117,0.65)" stroke="#081830" stroke-width="3.5"/>
        <path d="M 35 -35 Q 65 -90, 110 -80" stroke="#081830" stroke-width="4"/>
        <path d="M 20 -30 Q 45 -75, 90 -75" stroke="#081830" stroke-width="3.5"/>
        <circle cx="38" cy="0" r="8" fill="#c9a24f" stroke="#081830" stroke-width="2.5"/>
        <circle cx="40" cy="0" r="3" fill="#040912"/>
        <path d="M 65 18 Q 120 35, 140 0" stroke="#143b75" stroke-width="3.5"/>
      </g>
      <!-- 火焰宝珠与龙爪 -->
      <use href="#flaming_pearl" x="690" y="410"/>
      <use href="#dragon_claw" x="280" y="460"/>
      <use href="#dragon_claw" x="800" y="500" transform="scale(-1, 1) translate(-1600, 0)"/>
    </g>"""

        elif is_fish:
            # 鱼藻纹：四方游鱼清漪图
            main_motif = """
    <!-- 四方游鱼清漪图 -->
    <g stroke-linecap="round" stroke-linejoin="round">
      <use href="#swimming_fish" x="180" y="510" transform="scale(1.1)"/>
      <use href="#swimming_fish" x="440" y="460" transform="scale(1.2) rotate(-15 440 460)"/>
      <use href="#swimming_fish" x="700" y="530" transform="scale(1.15) rotate(12 700 530)"/>
      <use href="#swimming_fish" x="930" y="480" transform="scale(1.05) rotate(-10 930 480)"/>

      <!-- 水草浮萍摇曳 -->
      <use href="#water_weed_cluster" x="80" y="700"/>
      <use href="#water_weed_cluster" x="320" y="720"/>
      <use href="#water_weed_cluster" x="580" y="690"/>
      <use href="#water_weed_cluster" x="830" y="710"/>
    </g>"""

        elif is_plum:
            # 岁寒青花折枝梅花图 (老干盘曲、幽香疏影)
            main_motif = """
    <!-- 岁寒青花折枝梅花图主纹 (四方连绵疏影横斜) -->
    <g stroke-linecap="round" stroke-linejoin="round">
      <!-- 苍老盘曲主干 (x=0 到 1024 连绵横斜) -->
      <path d="M 0 540 C 120 420, 220 620, 360 480 C 460 380, 560 560, 680 460 C 800 360, 920 580, 1024 540" stroke="#081830" stroke-width="15" fill="none"/>
      <path d="M 0 540 C 120 420, 220 620, 360 480 C 460 380, 560 560, 680 460 C 800 360, 920 580, 1024 540" stroke="#143b75" stroke-width="8" fill="none"/>

      <!-- 向上挺秀探出的侧干与新枝 -->
      <path d="M 180 500 Q 150 400, 130 330" stroke="#081830" stroke-width="6" fill="none"/>
      <path d="M 280 540 Q 310 630, 330 710" stroke="#081830" stroke-width="5.5" fill="none"/>
      <path d="M 420 440 Q 480 340, 512 280" stroke="#081830" stroke-width="7" fill="none"/>
      <path d="M 580 510 Q 560 620, 580 700" stroke="#081830" stroke-width="5" fill="none"/>
      <path d="M 720 440 Q 710 330, 740 270" stroke="#081830" stroke-width="6.5" fill="none"/>
      <path d="M 860 420 Q 910 330, 930 260" stroke="#081830" stroke-width="6" fill="none"/>

      <!-- 错落盛开的御窑五瓣青花名梅 (x=512 为正中央迎面盛开大花) -->
      <use href="#plum_flower_refined" x="512" y="300" transform="scale(1.25) translate(-102, -60)"/>
      <use href="#plum_flower_refined" x="430" y="420" transform="scale(1.05) translate(-20, -20)"/>
      <use href="#plum_flower_refined" x="570" y="650" transform="scale(0.95)"/>
      <use href="#plum_flower_refined" x="140" y="340" transform="scale(1.1)"/>
      <use href="#plum_flower_refined" x="220" y="580" transform="scale(0.9)"/>
      <use href="#plum_flower_refined" x="330" y="690" transform="scale(1.0)"/>
      <use href="#plum_flower_refined" x="350" y="470" transform="scale(1.15) translate(-45, -60)"/>
      <use href="#plum_flower_refined" x="720" y="320" transform="scale(1.2) translate(-120, -50)"/>
      <use href="#plum_flower_refined" x="790" y="460" transform="scale(0.95)"/>
      <use href="#plum_flower_refined" x="920" y="310" transform="scale(1.08)"/>
      <use href="#plum_flower_refined" x="40" y="380" transform="scale(1.0)"/>
      <use href="#plum_flower_refined" x="990" y="380" transform="scale(1.0)"/>

      <!-- 侧展半开梅花与含苞花蕾 -->
      <use href="#plum_flower_side" x="110" y="310" transform="rotate(-20 110 310) scale(1.1)"/>
      <use href="#plum_flower_side" x="480" y="270" transform="rotate(25 480 270) scale(1.15)"/>
      <use href="#plum_flower_side" x="750" y="260" transform="rotate(-15 750 260) scale(1.1)"/>
      <use href="#plum_flower_side" x="940" y="240" transform="rotate(30 940 240) scale(1.05)"/>
      <use href="#plum_bud" x="320" y="730"/>
    </g>"""
        else:
            # 经典永宣生生不息四方连续缠枝宝相花纹
            main_motif = """
    <!-- 四方连续缠枝宝相花主纹 (首尾高度 512 严格平齐相接) -->
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 0 512 C 128 390, 128 634, 256 512 C 384 390, 384 634, 512 512 C 640 390, 640 634, 768 512 C 896 390, 896 634, 1024 512" stroke="#081830" stroke-width="7"/>
      <path d="M 0 512 C 128 634, 128 390, 256 512 C 384 634, 384 390, 512 512 C 640 634, 640 390, 768 512 C 896 634, 896 390, 1024 512" stroke="#143b75" stroke-width="3.5" stroke-dasharray="16,8"/>

      <use href="#full_baoxiang_medallion" x="512" y="512"/>
      <use href="#full_baoxiang_medallion" x="256" y="512" transform="scale(0.88) translate(40, 70)"/>
      <use href="#full_baoxiang_medallion" x="768" y="512" transform="scale(0.88) translate(-40, 70)"/>
      <use href="#full_baoxiang_medallion" x="0" y="512"/>
      <use href="#full_baoxiang_medallion" x="1024" y="512"/>

      <use href="#scrolling_acanthus_leaf" x="128" y="420" transform="rotate(-30 128 420) scale(1.15)"/>
      <use href="#scrolling_acanthus_leaf" x="128" y="604" transform="rotate(150 128 604) scale(1.15)"/>
      <use href="#scrolling_acanthus_leaf" x="384" y="420" transform="rotate(-30 384 420) scale(1.15)"/>
      <use href="#scrolling_acanthus_leaf" x="384" y="604" transform="rotate(150 384 604) scale(1.15)"/>
      <use href="#scrolling_acanthus_leaf" x="640" y="420" transform="rotate(-30 640 420) scale(1.15)"/>
      <use href="#scrolling_acanthus_leaf" x="640" y="604" transform="rotate(150 640 604) scale(1.15)"/>
      <use href="#scrolling_acanthus_leaf" x="896" y="420" transform="rotate(-30 896 420) scale(1.15)"/>
      <use href="#scrolling_acanthus_leaf" x="896" y="604" transform="rotate(150 896 604) scale(1.15)"/>

      <use href="#flower_bud" x="128" y="360" transform="rotate(-15 128 360)"/>
      <use href="#flower_bud" x="384" y="660" transform="rotate(165 384 660)"/>
      <use href="#flower_bud" x="640" y="360" transform="rotate(-15 640 360)"/>
      <use href="#flower_bud" x="896" y="660" transform="rotate(165 896 660)"/>
    </g>"""

        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
{MASTER_TRADITIONAL_DEFS}

  <!-- 1. 颈部口沿弦纹与连续回纹带 (y: 20 ~ 130) -->
  <g stroke="#081830" fill="none">
    <line x1="0" y1="30" x2="1024" y2="30" stroke-width="5"/>
    <line x1="0" y1="48" x2="1024" y2="48" stroke-width="2"/>
    <path d="M 0 78 H 64 V 108 H 32 V 93 H 48 M 64 78 H 128 V 108 H 96 V 93 H 112 M 128 78 H 192 V 108 H 160 V 93 H 176 M 192 78 H 256 V 108 H 224 V 93 H 240 M 256 78 H 320 V 108 H 288 V 93 H 304 M 320 78 H 384 V 108 H 352 V 93 H 368 M 384 78 H 448 V 108 H 416 V 93 H 432 M 448 78 H 512 V 108 H 480 V 93 H 496 M 512 78 H 576 V 108 H 544 V 93 H 560 M 576 78 H 640 V 108 H 608 V 93 H 624 M 640 78 H 704 V 110 H 672 V 95 H 688 M 704 78 H 768 V 108 H 736 V 93 H 752 M 768 78 H 832 V 108 H 800 V 93 H 816 M 832 78 H 896 V 108 H 864 V 93 H 880 M 896 78 H 960 V 108 H 928 V 93 H 944 M 960 78 H 1024 V 108 H 992 V 93 H 1008" stroke="#143b75" stroke-width="2.5"/>
    <line x1="0" y1="128" x2="1024" y2="128" stroke-width="3"/>
  </g>

  <!-- 2. 肩部如意云肩垂珠带 (y: 150 ~ 290) (8 云头等分平铺) -->
  <g>
    <use href="#ruyi_cloud_unit" x="64" y="210"/>
    <use href="#ruyi_cloud_unit" x="192" y="210"/>
    <use href="#ruyi_cloud_unit" x="320" y="210"/>
    <use href="#ruyi_cloud_unit" x="448" y="210"/>
    <use href="#ruyi_cloud_unit" x="576" y="210"/>
    <use href="#ruyi_cloud_unit" x="704" y="210"/>
    <use href="#ruyi_cloud_unit" x="832" y="210"/>
    <use href="#ruyi_cloud_unit" x="960" y="210"/>
    <line x1="0" y1="285" x2="1024" y2="285" stroke="#081830" stroke-width="3"/>
    <line x1="0" y1="295" x2="1024" y2="295" stroke="#143b75" stroke-width="1.8"/>
  </g>

  <!-- 3. 腹部核心主题纹饰 (y: 320 ~ 740) -->
  {main_motif}

  <!-- 4. 足胫部装饰带：仰覆双重莲瓣与海水江崖 (y: 770 ~ 980) -->
  <g stroke="#081830" stroke-width="3.5" fill="rgba(20,59,117,0.42)">
    <line x1="0" y1="765" x2="1024" y2="765" stroke-width="4"/>
    <line x1="0" y1="775" x2="1024" y2="775" stroke-width="2"/>
    <path d="M 0 920 C 32 800, 96 800, 128 920 Z M 128 920 C 160 800, 224 800, 256 920 Z M 256 920 C 288 800, 352 800, 384 920 Z M 384 920 C 416 800, 480 800, 512 920 Z M 512 920 C 544 800, 608 800, 640 920 Z M 640 920 C 672 800, 736 800, 768 920 Z M 768 920 C 800 800, 864 800, 896 920 Z M 896 920 C 928 800, 992 800, 1024 920 Z"/>
    <path d="M 32 920 C 48 850, 80 850, 96 920 M 160 920 C 176 850, 208 850, 224 920 M 288 920 C 304 850, 336 850, 352 920 M 416 920 C 432 850, 464 850, 480 920 M 544 920 C 560 850, 592 850, 608 920 M 672 920 C 688 850, 720 850, 736 920 M 800 920 C 816 850, 848 850, 864 920 M 928 920 C 944 850, 976 850, 992 920" stroke="#143b75" stroke-width="2" fill="none"/>
    <line x1="0" y1="945" x2="1024" y2="945" stroke-width="5"/>

    <path d="M 0 970 Q 32 945, 64 970 Q 96 995, 128 970 Q 160 945, 192 970 Q 224 995, 256 970 Q 288 945, 320 970 Q 352 995, 384 970 Q 416 945, 448 970 Q 480 995, 512 970 Q 544 945, 576 970 Q 608 995, 640 970 Q 672 945, 704 970 Q 736 995, 768 970 Q 800 945, 832 970 Q 864 995, 896 970 Q 928 945, 960 970 Q 992 995, 1024 970" fill="none" stroke="#143b75" stroke-width="3"/>
    <line x1="0" y1="995" x2="1024" y2="995" stroke="#081830" stroke-width="6"/>
  </g>
</svg>"""
