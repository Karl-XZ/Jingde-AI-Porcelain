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

    <!-- 12. 【荷花/莲花/缠枝莲组件库】：盛开大荷花、侧展荷、莲蕾、荷叶、莲瓣 -->
    <g id="lotus_flower_full">
      <path d="M 0 -96 C 26 -70, 34 -34, 22 -4 C 14 16, -8 22, -22 4 C -34 -34, -26 -70, 0 -96 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.4"/>
      <path d="M 68 -68 C 68 -34, 48 -6, 22 -2 C 30 -30, 40 -56, 68 -68 Z" fill="rgba(28,68,130,0.65)" stroke="#081830" stroke-width="2.2"/>
      <path d="M -68 -68 C -40 -56, -30 -30, -22 -2 C -48 -6, -68 -34, -68 -68 Z" fill="rgba(28,68,130,0.65)" stroke="#081830" stroke-width="2.2"/>
      <path d="M 96 -20 C 82 6, 56 16, 30 10 C 50 -4, 72 -16, 96 -20 Z" fill="rgba(45,95,158,0.45)" stroke="#081830" stroke-width="2"/>
      <path d="M -96 -20 C -72 -16, -50 -4, -30 10 C -56 16, -82 6, -96 -20 Z" fill="rgba(45,95,158,0.45)" stroke="#081830" stroke-width="2"/>
      <circle cx="0" cy="-6" r="14" fill="#081830"/>
      <circle cx="0" cy="-6" r="6" fill="#c9a24f"/>
    </g>

    <g id="lotus_flower_side">
      <path d="M -70 10 C -50 -22, -20 -36, 6 -30 C -6 -10, -30 4, -70 10 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.2"/>
      <path d="M -40 30 C -30 -6, 0 -26, 28 -24 C 14 -2, -8 18, -40 30 Z" fill="rgba(28,68,130,0.6)" stroke="#081830" stroke-width="2.2"/>
      <path d="M -10 44 C 4 10, 34 -6, 60 0 C 42 24, 16 40, -10 44 Z" fill="rgba(45,95,158,0.4)" stroke="#081830" stroke-width="2"/>
      <circle cx="8" cy="6" r="8" fill="#c9a24f"/>
    </g>

    <g id="lotus_bud">
      <path d="M 0 44 C -16 20, -16 -16, 0 -44 C 16 -16, 16 20, 0 44 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.2"/>
      <path d="M 0 40 C -6 18, -8 -12, 0 -36 C 8 -12, 6 18, 0 40 Z" fill="rgba(12,33,70,0.7)" stroke="#081830" stroke-width="1.6"/>
    </g>

    <g id="lotus_leaf">
      <path d="M 0 0 C -40 -40, -70 -30, -78 4 C -84 34, -60 62, -20 66 C 20 70, 58 52, 66 20 C 72 -6, 40 -20, 0 0 Z" fill="url(#leaf_grad)" stroke="#081830" stroke-width="2.4"/>
      <path d="M 0 0 L -52 8 M 0 0 L -12 50 M 0 0 L 42 14 M 0 0 L -46 -14" stroke="#081830" stroke-width="1.2" fill="none"/>
    </g>

    <g id="lotus_petal_band">
      <path d="M 0 0 C -16 18, -16 44, 0 60 C 16 44, 16 18, 0 0 Z" fill="rgba(28,68,130,0.55)" stroke="#081830" stroke-width="2"/>
      <path d="M 0 10 C -6 22, -6 40, 0 50 C 6 40, 6 22, 0 10 Z" fill="#081830"/>
    </g>

    <g id="petal_lotus">
      <path d="M 0 0 C -18 -15, -28 -40, 0 -52 C 28 -40, 18 -15, 0 0 Z" fill="url(#cobalt_wash_grad)" stroke="#081830" stroke-width="2.2"/>
    </g>
  </defs>"""


class VectorMotifAgent(BaseJiuwenAgent):
    """青花画作匠 (VectorMotifAgent)：DeepSeek 纯 SVG 矢量图元生成与解析"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 框架驱动的【景德镇御窑青花画作匠】。
你精通明清官窑青花纹样构图（缠枝宝相花、云水祥龙、鱼藻清漪、折枝瑞果、折枝梅、松鹤延年、岁寒三友、墨竹、富贵牡丹、弦纹、旋线、蕉叶回纹、如意云肩等）以及苏麻离青、平等青矿物料发色审美。
你具备高超的代码生成能力，能够使用纯矢量 SVG 代码（<svg viewBox="0 0 1024 1024" ...>）绘制纯正典雅的景德镇青花大作。

【极为严肃的美学与意图准则】：
1. 【严格听从用户主题意图，因题制宜】：
   - 【纯线条 / 弦纹 / 旋纹 / 几何 / 极简类】：当用户要求“纯线条”、“不要具体图案”、“无物象”、“弦纹”、“几何网格”时，**绝对严禁添加任何具体花朵、枝叶或动物图元**！必须纯以景德镇官窑贯穿全宽（x1="0" 至 x2="1024"）的匀净弦纹（同心圆周平行线）、腹部平缓微澜的水波旋线或几何细密线描构图，展现拉坯勾线“线如春蚕吐丝、骨力内含”的至高极简美学！
   - 【具象传统花鸟/瑞兽大作】：（如牡丹、荷花、梅花、竹兰、松鹤、祥龙、游鱼等），在腹部核心区绘制饱满大作，充分运用系统内置图元与自主绘制枝干；
   - 【自拟现代/创意主题】：紧密围绕用户真实描述自由构图，切忌无视指令生搬硬套预置花朵！
2. 【严禁使用旋转椭圆 <ellipse transform="rotate(...)"/> 绘制花朵】！那会生成类似现代物理学“原子轨道模型/玻尔原子/React 图标”的滑稽图形，彻底破坏御窑古典美学！花瓣必须使用带有饱满双向弧度或尖锐瓣尖的中式路径 <path d="..."/> 或使用系统内置组件！

【内置景德镇御窑传统纹样 <defs> 组件库（可直接通过 <use href="#ID" .../> 调用）】：
系统内置了完备的御窑矢量图元，在需要具象花卉、瑞兽的大作中可充分调用：
- 荷花/莲花类：#lotus_flower_full (盛开大荷花), #lotus_flower_side (侧展荷花), #lotus_bud (荷蕾), #lotus_leaf (翻卷荷叶), #lotus_petal_band (莲瓣纹)
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
1. 构图必须采用景德镇御窑 360° 圆周通体环绕与正统瓷画层次：
   - 【严禁左右留白边】！所有横向装饰线必须贯穿全宽（x1="0" 至 x2="1024"），以便 3D 瓷瓶圆周无缝环绕闭合；
   - 背景必须透明（严禁绘制不透明的大矩形背景 <rect fill="#..."/>），直接让纹样附着在 3D 白瓷胎上！
2. 严格控制代码紧凑度（请将 SVG 控制在 2000 tokens 内），务必完整闭合全部标签与 </svg>！
3. 输出格式：请严格使用独立段落输出元数据和 SVG 代码：

---METADATA---
{
  "motif_name": "纹样题名（如：明永乐御窑青花匀净多重弦纹白描大作，或明宣德御窑青花折枝梅花纹）",
  "symbolism": "吉祥寓意与纹样题解",
  "cobalt_notes": "青料发色特征（如：苏麻离青浓翠晕散，线条匀挺见骨力）"
}
---SVG---
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- 此处为纯矢量青花代码 -->
</svg>"""

    def __init__(self):
        super().__init__(
            name="VectorMotifAgent",
            description="利用 DeepSeek 代码能力生成标准景德镇传统青花与彩绘 SVG 矢量图元",
            system_prompt=self.SYSTEM_PROMPT,
        )

    def _heal_svg_xml(self, svg: str) -> str:
        """
        全量 XML 语法自愈引擎：
        修复因大模型截断（length limit）、未闭合标签、非法字符导致的 XML 解析错误，
        确保返回给浏览器的 SVG 100% 能够被 Image/DOMParser 成功渲染。
        """
        import xml.etree.ElementTree as ET
        if not svg or "<svg" not in svg:
            return ""

        # 1. 裁剪起止
        start = svg.find("<svg")
        svg = svg[start:]

        # 裁剪末尾任何被截断在半空的非法未闭合标签（如 <use href="... x="944）
        last_gt = svg.rfind(">")
        if last_gt != -1 and last_gt < len(svg) - 1:
            svg = svg[:last_gt + 1]

        # 移除末端可能孤立的 </svg>，以便统一重平衡栈
        svg = re.sub(r'<\/svg>\s*$', '', svg, flags=re.IGNORECASE).strip()

        # 2. 栈平衡闭合容器标签
        containers = ['svg', 'defs', 'g', 'linearGradient', 'radialGradient', 'pattern', 'mask', 'clipPath', 'symbol']
        tag_stack = []

        tokens = re.finditer(r'<(\/)?([a-zA-Z][a-zA-Z0-9_-]*)([^>]*?)(\/)?>', svg)
        for t in tokens:
            is_close = bool(t.group(1))
            tag_name = t.group(2)
            is_self_close = bool(t.group(4))

            if tag_name not in containers:
                continue

            if is_close:
                if tag_stack and tag_stack[-1] == tag_name:
                    tag_stack.pop()
                elif tag_name in tag_stack:
                    while tag_stack and tag_stack[-1] != tag_name:
                        tag_stack.pop()
                    if tag_stack:
                        tag_stack.pop()
            elif not is_self_close:
                tag_stack.append(tag_name)

        # 逆序压入未闭合标签
        for tag in reversed(tag_stack):
            svg += f"\n</{tag}>"

        # 3. 使用 ElementTree 终极核验，确保 100% 有效
        try:
            ET.fromstring(svg)
            return svg
        except Exception as err:
            print(f"[VectorMotifAgent] Healer ET validation notice: {err}")
            clean_svg = re.sub(r'([a-zA-Z-]+)="([^"]*?)(?:"|$)', r'\1="\2"', svg)
            try:
                ET.fromstring(clean_svg)
                return clean_svg
            except Exception:
                return svg

    def _extract_svg_code(self, text: str) -> Optional[str]:
        """Extract valid SVG XML string from LLM output, with auto-healing for truncated output."""
        candidate = None
        # 1. Delimiter format
        if "---SVG---" in text:
            svg_part = text.split("---SVG---", 1)[1].strip()
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

        # 4. Handle truncated/unterminated <svg ...
        if not candidate and "<svg" in text:
            start_idx = text.find("<svg")
            candidate = text[start_idx:].strip()

        if candidate and "<svg" in candidate:
            return self._heal_svg_xml(candidate)

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

        return self.extract_json(text) or {}

    async def generate_motif(self, theme: str, motif_type: Optional[str] = None) -> Dict[str, Any]:
        pure_line_keywords = [
            "纯线", "线条", "线图", "线描", "弦纹", "旋纹", "环线", "横线",
            "无图案", "不要图案", "不要具体图案", "不希望有具体图案", "不要花", "无花",
            "几何", "网格", "席纹", "编织", "暗纹", "开片", "冰裂", "极简线条", "纯线条图",
            "不要画花", "不画花", "无具体物象", "不要物象", "抽象线条"
        ]
        is_pure_lines = any(kw in theme for kw in pure_line_keywords)

        if is_pure_lines:
            user_msg = (
                f"请为景德镇御窑瓷器绘制高精青花矢量纹样，主题为：【{theme}】。\n"
                "【极为重要：用户的核心诉求是“纯线条”、“无具体物象”，必须是纯净、优雅、疏密有致的线描艺术！】\n"
                "【系统重要规范】：\n"
                "1. 【严格禁止任何具象花朵、叶片、动物、人物图元】！严禁使用 #peony_flower_refined, #lotus_flower_full, #full_baoxiang_medallion 等任何内置花卉/鸟兽组件！\n"
                "2. 请直接在 <svg viewBox=\"0 0 1024 1024\"> 根节点下，使用景德镇御窑经典的【弦纹】与【纯线条】构图：\n"
                "   - 从口沿、颈、肩、腹到足胫，贯穿全宽（x1=\"0\" 至 x2=\"1024\"）绘制一组组匀净、疏密有致的青花弦纹（粗细 1.5px~6px 的水平圆周线条）；\n"
                "   - 在腹部主视区（y: 320~740）绘制规整平行的同心圆周弦纹、或微澜起伏的极简水波波浪线，展现大匠拉坯勾线如春蚕吐丝的纯线条骨法笔意！\n"
                "3. 保持背景透明，严禁不透明矩形；严禁任何旋转椭圆；请控制在 1500 tokens 内并务必完整闭合全部标签与 </svg>。\n"
                "4. 元数据 motif_name 必须严格反映纯线条主题（如：【明永乐御窑青花匀净多重弦纹白描大作】），题名与寓意中绝对不要出现任何花卉、牡丹、宝相词汇！"
            )
        else:
            user_msg = f"请为景德镇御窑瓷器绘制高精青花矢量纹样，主题为：【{theme}】"
            if motif_type:
                user_msg += f"（承袭官窑脉络：{motif_type}）"
            user_msg += (
                "。\n【系统重要规范】：\n"
                "1. 系统底座已全量内置景德镇传统图元库（包括盛开大花 #peony_flower_refined、#lotus_flower_full、"
                "#plum_flower_refined、#chrysanthemum_flower、#orchid_flower、祥龙、苍松仙鹤、游鱼水藻、三裂叶、如意云肩等），"
                "**绝对严禁在代码中重复编写庞大的 <defs> 定义**！\n"
                "2. 请直接在 <svg viewBox=\"0 0 1024 1024\"> 根节点下，根据主题自主使用 <path> 绘制苍劲枝干/水波/形貌，"
                "若主题涉及花卉瑞兽，可结合内置图元在腹部主视区充实画面；若为其他主题，请根据主题自由创作，严禁生搬硬套不相干的预设！\n"
                "3. 保持背景透明，严禁不透明矩形；严禁任何旋转椭圆；请控制在 1500 tokens 内并务必完整闭合全部标签与 </svg>。"
            )

        raw_resp = await self.chat(user_msg, temperature=0.7, max_tokens=4000)

        svg_code = self._extract_svg_code(raw_resp)
        meta = self._extract_metadata(raw_resp)

        # 严格腹部主图元核验，防止因 LLM 截断输出导致只有边框而腹部白胎
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
                elements = re.findall(r'<(?:path|use|circle|polygon|line|polyline|g)\b', body_content)
                
                # 腹部实质性图元校验
                belly_uses = re.findall(r'<use\b[^>]*href=["\']#([^"\']+)["\']', body_content)
                belly_coords = re.findall(r'\b(?:y|y1|y2|cy|translate\(\s*\d+\s*,\s*)\s*=?\s*["\']?(?:[3-6]\d\d|7[0-4]\d)\b', body_content)
                belly_path_nums = re.findall(r'\b(?:3[2-9]\d|[4-6]\d\d|7[0-4]\d)\b', body_content)
                has_substantive_belly = len(belly_uses) >= 2 or len(belly_coords) >= 3 or len(belly_path_nums) >= 4

                if is_pure_lines:
                    flower_animal_tags = ["#peony", "#lotus", "#baoxiang", "#plum", "#chrysanthemum", "#orchid", "#crane", "#dragon", "#fish"]
                    has_forbidden_flowers = any(ft in body_content for ft in flower_animal_tags)
                    if len(elements) >= 4 and has_substantive_belly and not has_forbidden_flowers:
                        is_valid_complete_motif = True
                else:
                    if len(elements) >= 8 and has_substantive_belly:
                        is_valid_complete_motif = True

        if is_valid_complete_motif and svg_code:
            final_svg = self._ensure_master_defs(svg_code)
            final_svg = self._heal_svg_xml(final_svg)
            default_name = "明永乐御窑青花匀净多重弦纹大作" if is_pure_lines else theme
            default_symbolism = "大巧若拙，素以为绚。以纯净弦纹环走器身，如月轮流光，生生不息。" if is_pure_lines else "御窑传统经典图式，生生不息，气韵生动。"
            default_cobalt = "苏麻离青发色深沉，线条匀挺见骨力，浓淡相宜。" if is_pure_lines else "苏麻离青发色深浓，分水兼备，铁锈斑深入胎骨。"
            return {
                "motif_name": meta.get("motif_name", default_name),
                "symbolism": meta.get("symbolism", default_symbolism),
                "cobalt_notes": meta.get("cobalt_notes", default_cobalt),
                "svg_code": final_svg,
            }

        # Fallback to authentic museum-grade procedural heritage SVG with DeepSeek's custom cultural title & notes
        fallback_svg = self._generate_procedural_heritage_svg(theme)
        default_name = "明永乐御窑青花匀净多重弦纹大作" if is_pure_lines else theme
        default_symbolism = "大巧若拙，素以为绚。以纯净弦纹环走器身，如月轮流光，生生不息。" if is_pure_lines else "御窑经典青花四段式章法，寄托吉庆祥和、生生不息之意象。"
        default_cobalt = "苏麻离青发色深沉，线条匀挺见骨力，浓淡相宜。" if is_pure_lines else "苏麻离青发色深沉如蓝宝石，分水五色兼备，微见铁锈锡斑。"
        return {
            "motif_name": meta.get("motif_name", default_name),
            "symbolism": meta.get("symbolism", default_symbolism),
            "cobalt_notes": meta.get("cobalt_notes", default_cobalt),
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
        支持中国传统全量主题：纯线条弦纹、梅花、牡丹、墨竹、幽兰、菊花、松鹤延年、岁寒三友、祥龙、鱼藻、山水、宝相花
        """
        pure_line_keywords = [
            "纯线", "线条", "线图", "线描", "弦纹", "旋纹", "环线", "横线",
            "无图案", "不要图案", "不要具体图案", "不希望有具体图案", "不要花", "无花",
            "几何", "网格", "席纹", "编织", "暗纹", "开片", "冰裂", "极简线条"
        ]
        is_pure_lines = any(kw in theme for kw in pure_line_keywords)

        if is_pure_lines:
            # 景德镇御窑青花匀净弦纹与极简旋线大作 (大巧若拙、素以为绚、零具象图案)
            return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
{MASTER_TRADITIONAL_DEFS}
  <!-- 景德镇御窑纯线条弦纹通景图 (x1=0 到 x2=1024 贯穿圆周无缝闭合) -->
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <!-- 1. 口沿至颈部弦纹组 (y: 30 ~ 130) -->
    <line x1="0" y1="35" x2="1024" y2="35" stroke="#081830" stroke-width="5"/>
    <line x1="0" y1="48" x2="1024" y2="48" stroke="#143b75" stroke-width="2"/>
    <line x1="0" y1="62" x2="1024" y2="62" stroke="#143b75" stroke-width="1.5" stroke-dasharray="12,6"/>
    <line x1="0" y1="78" x2="1024" y2="78" stroke="#081830" stroke-width="3"/>
    <line x1="0" y1="95" x2="1024" y2="95" stroke="#143b75" stroke-width="2"/>
    <line x1="0" y1="112" x2="1024" y2="112" stroke="#143b75" stroke-width="1.5"/>
    <line x1="0" y1="130" x2="1024" y2="130" stroke="#081830" stroke-width="4"/>

    <!-- 2. 颈部至溜肩过渡带 (y: 160 ~ 290) 疏密有致的琴弦线 -->
    <line x1="0" y1="165" x2="1024" y2="165" stroke="#143b75" stroke-width="2"/>
    <line x1="0" y1="185" x2="1024" y2="185" stroke="#143b75" stroke-width="1.8"/>
    <line x1="0" y1="210" x2="1024" y2="210" stroke="#081830" stroke-width="3.5"/>
    <line x1="0" y1="238" x2="1024" y2="238" stroke="#143b75" stroke-width="2"/>
    <line x1="0" y1="268" x2="1024" y2="268" stroke="#143b75" stroke-width="1.5" stroke-dasharray="16,8"/>
    <line x1="0" y1="295" x2="1024" y2="295" stroke="#081830" stroke-width="5"/>

    <!-- 3. 腹部核心主视区：匀净旋纹与水波涟漪线条 (y: 320 ~ 740) -->
    <line x1="0" y1="330" x2="1024" y2="330" stroke="#143b75" stroke-width="2.5"/>
    <line x1="0" y1="355" x2="1024" y2="355" stroke="#143b75" stroke-width="1.8"/>
    <line x1="0" y1="385" x2="1024" y2="385" stroke="#081830" stroke-width="4"/>

    <!-- 腹中微澜同心波浪弦纹 (模拟陶轮拉坯与轻拂水波) -->
    <path d="M 0 420 Q 128 405, 256 420 T 512 420 T 768 420 T 1024 420" stroke="#143b75" stroke-width="2.5"/>
    <path d="M 0 445 Q 128 430, 256 445 T 512 445 T 768 445 T 1024 445" stroke="#235ea8" stroke-width="1.8"/>
    <path d="M 0 470 Q 128 455, 256 470 T 512 470 T 768 470 T 1024 470" stroke="#143b75" stroke-width="3"/>
    <line x1="0" y1="500" x2="1024" y2="500" stroke="#081830" stroke-width="6"/>
    <line x1="0" y1="518" x2="1024" y2="518" stroke="#143b75" stroke-width="2"/>
    <line x1="0" y1="535" x2="1024" y2="535" stroke="#143b75" stroke-width="1.5" stroke-dasharray="10,6"/>
    <path d="M 0 560 Q 128 575, 256 560 T 512 560 T 768 560 T 1024 560" stroke="#143b75" stroke-width="3"/>
    <path d="M 0 585 Q 128 600, 256 585 T 512 585 T 768 585 T 1024 585" stroke="#235ea8" stroke-width="1.8"/>
    <path d="M 0 610 Q 128 625, 256 610 T 512 610 T 768 610 T 1024 610" stroke="#143b75" stroke-width="2.5"/>

    <!-- 腹下匀称收束弦纹 -->
    <line x1="0" y1="645" x2="1024" y2="645" stroke="#081830" stroke-width="4"/>
    <line x1="0" y1="675" x2="1024" y2="675" stroke="#143b75" stroke-width="2"/>
    <line x1="0" y1="708" x2="1024" y2="708" stroke="#143b75" stroke-width="2.5"/>
    <line x1="0" y1="740" x2="1024" y2="740" stroke="#081830" stroke-width="5"/>

    <!-- 4. 胫部与圈足底弦组 (y: 770 ~ 1000) -->
    <line x1="0" y1="775" x2="1024" y2="775" stroke="#143b75" stroke-width="2.5"/>
    <line x1="0" y1="805" x2="1024" y2="805" stroke="#143b75" stroke-width="1.8" stroke-dasharray="14,7"/>
    <line x1="0" y1="840" x2="1024" y2="840" stroke="#081830" stroke-width="4"/>
    <line x1="0" y1="880" x2="1024" y2="880" stroke="#143b75" stroke-width="2.2"/>
    <line x1="0" y1="920" x2="1024" y2="920" stroke="#143b75" stroke-width="3"/>
    <line x1="0" y1="955" x2="1024" y2="955" stroke="#081830" stroke-width="5"/>
    <line x1="0" y1="980" x2="1024" y2="980" stroke="#143b75" stroke-width="2"/>
    <line x1="0" y1="1000" x2="1024" y2="1000" stroke="#081830" stroke-width="6"/>
  </g>
</svg>"""

        is_dragon = "龙" in theme
        is_fish = "鱼" in theme
        is_plum = ("梅" in theme) or ("寒梅" in theme) or ("折枝梅" in theme)
        is_peony = ("牡丹" in theme) or ("富贵" in theme) or ("国色" in theme)
        is_lotus = ("莲" in theme) or ("荷" in theme) or ("荷花" in theme) or ("莲花" in theme) or ("水华" in theme) or ("清漪" in theme)
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

      <!-- 正面第一主牡丹大花 (x=512 迎客主花) -->
      <g transform="translate(512, 512) scale(1.3)">
        <use href="#peony_flower_refined"/>
      </g>
      <g transform="translate(256, 512) scale(1.05)">
        <use href="#peony_flower_refined"/>
      </g>
      <g transform="translate(768, 512) scale(1.05)">
        <use href="#peony_flower_refined"/>
      </g>
      <g transform="translate(0, 512) scale(0.95)">
        <use href="#peony_flower_refined"/>
      </g>
      <g transform="translate(1024, 512) scale(0.95)">
        <use href="#peony_flower_refined"/>
      </g>

      <!-- 繁茂三裂牡丹叶与卷草 -->
      <g transform="translate(128, 420) scale(1.1) rotate(-25)">
        <use href="#peony_leaf"/>
      </g>
      <g transform="translate(384, 610) scale(1.1) rotate(150)">
        <use href="#peony_leaf"/>
      </g>
      <g transform="translate(640, 420) scale(1.1) rotate(-25)">
        <use href="#peony_leaf"/>
      </g>
      <g transform="translate(896, 610) scale(1.1) rotate(150)">
        <use href="#peony_leaf"/>
      </g>
    </g>"""

        elif is_lotus:
            # 清涟出尘连年有余荷花图 (盛开大荷花、翻卷荷叶、莲蓬莲蕾)
            main_motif = """
    <!-- 清涟出尘连年有余荷花主纹 (四方连绵接天莲叶荷花) -->
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M 0 520 C 128 440, 256 600, 384 520 C 512 440, 640 600, 768 520 C 896 440, 960 580, 1024 520" stroke="#081830" stroke-width="8" fill="none"/>
      <path d="M 0 560 C 128 620, 256 480, 384 560 C 512 620, 640 480, 768 560 C 896 620, 960 500, 1024 560" stroke="#143b75" stroke-width="4" stroke-dasharray="16,10" fill="none"/>

      <!-- 正面第一主盛开大荷花 (x=512 迎面盛放大景) -->
      <g transform="translate(512, 480) scale(1.35)">
        <use href="#lotus_flower_full"/>
      </g>
      <g transform="translate(256, 490) scale(1.1)">
        <use href="#lotus_flower_full"/>
      </g>
      <g transform="translate(768, 490) scale(1.1)">
        <use href="#lotus_flower_full"/>
      </g>
      <g transform="translate(0, 480) scale(1.0)">
        <use href="#lotus_flower_full"/>
      </g>
      <g transform="translate(1024, 480) scale(1.0)">
        <use href="#lotus_flower_full"/>
      </g>

      <!-- 侧展半开荷花与含苞莲蕾 -->
      <g transform="translate(390, 380) scale(1.15)">
        <use href="#lotus_flower_side"/>
      </g>
      <g transform="translate(634, 380) scale(-1.15, 1.15)">
        <use href="#lotus_flower_side"/>
      </g>
      <g transform="translate(160, 410) scale(1.1)">
        <use href="#lotus_bud"/>
      </g>
      <g transform="translate(864, 410) scale(1.1)">
        <use href="#lotus_bud"/>
      </g>

      <!-- 舒展翻卷大荷叶 -->
      <g transform="translate(512, 660) scale(1.3)">
        <use href="#lotus_leaf"/>
      </g>
      <g transform="translate(220, 650) scale(1.15) rotate(-15)">
        <use href="#lotus_leaf"/>
      </g>
      <g transform="translate(800, 650) scale(1.15) rotate(15)">
        <use href="#lotus_leaf"/>
      </g>
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
