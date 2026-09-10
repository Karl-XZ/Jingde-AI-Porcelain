# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
import re
from typing import Dict, Any, Optional
from server.agents.base_jiuwen_agent import BaseJiuwenAgent


class VectorMotifAgent(BaseJiuwenAgent):
    """青花画作匠 (VectorMotifAgent)：DeepSeek 纯 SVG 矢量图元生成与解析"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 框架驱动的【景德镇御窑青花画作匠】。
你精通明清官窑青花纹样构图（缠枝宝相花、云水祥龙、鱼藻清漪、折枝瑞果、蕉叶回纹、如意云肩等）以及苏麻离青、平等青矿物料发色审美。
你具备高超的代码生成能力，能够使用纯矢量 SVG 代码（<svg viewBox="0 0 1024 1024" ...>）绘制纯正典雅、构图饱满的景德镇青花大作。

【极为重要的构图与格式规范】：
1. 构图必须采用景德镇御窑 360° 圆周通体环绕与四段式正统瓷画层次（四方连续通景瓷画）：
   - 【严禁左右留白边】！所有横向装饰线必须贯穿全宽（x1="0" 至 x2="1024"），以便 3D 瓷瓶圆周无缝环绕闭合；
   - 颈口装饰带 (y: 40 ~ 120)：贯穿全宽的弦纹与蕉叶纹/回纹；
   - 肩部装饰带 (y: 150 ~ 280)：贯穿全宽的如意云肩垂珠带（6~8个等距云头均匀分布于 x=0~1024）；
   - 腹部主纹样区 (y: 300 ~ 740)：四方连续生生不息缠枝宝相花或穿云巨龙，藤蔓必须从 x=0 延绵起伏至 x=1024 首尾相接，在 x=0(及1024)、x=256、x=512、x=768 各自盛放繁茂大花与卷叶，确保瓷瓶 360 度旋转任意视角皆繁花似锦、绝无空白背面；
   - 足胫装饰带 (y: 780 ~ 980)：贯穿全宽的仰莲瓣纹与海水江崖。
2. 背景必须透明（严禁绘制不透明的大矩形背景 <rect fill="#..."/>），直接让纹样附着在 3D 白瓷胎上！
3. 采用正统景德镇青花配色：
   - 浓重钴蓝（苏麻离青铁锈斑沉降）: #0c2146
   - 纯正青花主色: #183e78
   - 青花分水淡蓝晕染: rgba(28, 68, 130, 0.45)
   - 极淡水色: rgba(45, 95, 158, 0.20)
   - 描金勾线（极少量点缀）: #c9a24f
4. 代码效率要求：保持 SVG 精炼紧凑，严禁用数千点冗余绘制微小回纹！重点放在腹部四方连续花纹，确保必须闭合全部标签与 </svg>。
5. 输出格式：请严格使用独立段落输出元数据和 SVG 代码，便于无损解析：

---METADATA---
{
  "motif_name": "纹样题名（如：明宣德御窑青花缠枝宝相花纹）",
  "symbolism": "吉祥寓意与纹样题解（生生不息、四方来仪等）",
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
        user_msg += "。请确保构图充实典雅，包含口沿带、如意云肩、腹部连绵生动主纹与底足仰莲纹，背景透明。注意保持代码精炼完整，重点绘制腹部大朵盛开宝相花与卷叶，务必闭合全部标签与 </svg>。"

        raw_resp = await self.chat(user_msg, temperature=0.7, max_tokens=6000)

        svg_code = self._extract_svg_code(raw_resp)
        meta = self._extract_metadata(raw_resp)

        # Check if the generated SVG has actual belly motifs (not truncated before belly):
        is_valid_complete_motif = False
        if svg_code:
            # Strip out opaque full-screen background if model generated one
            svg_code = re.sub(r'<rect\s+width="1024"\s+height="1024"\s+fill="#[fF0-9a-fA-F]+"\s*\/?>', '', svg_code)
            svg_code = re.sub(r'<rect\s+width="100%"\s+height="100%"\s+fill="#[fF0-9a-fA-F]+"\s*\/?>', '', svg_code)

            if "</svg>" in svg_code:
                # Check if there is actual visual content outside defs
                body_content = svg_code
                if "</defs>" in svg_code:
                    body_content = svg_code.split("</defs>", 1)[1]
                elements = re.findall(r'<(?:path|use|circle|ellipse|polygon|g)\b', body_content)
                has_belly_content = bool(re.search(r'(?:<use|\b(?:y|y1|y2|cy)\s*=\s*["\']?(?:[3-7]\d\d|800))', body_content))
                if len(elements) >= 8 and has_belly_content:
                    is_valid_complete_motif = True

        if is_valid_complete_motif:
            return {
                "motif_name": meta.get("motif_name", theme),
                "symbolism": meta.get("symbolism", "御窑传统经典图式，生生不息，气韵生动。"),
                "cobalt_notes": meta.get("cobalt_notes", "苏麻离青发色深浓，分水兼备，铁锈斑深入胎骨。"),
                "svg_code": svg_code,
            }

        # If LLM response failed to generate valid SVG with belly motif, fallback to authentic procedural heritage SVG
        fallback_svg = self._generate_procedural_heritage_svg(theme)
        return {
            "motif_name": theme,
            "symbolism": "御窑经典青花四段式章法，寄托吉庆祥和、福寿绵长之意象。",
            "cobalt_notes": "天然钴料浓重深邃，分水层次分明，笔法苍劲有度。",
            "svg_code": fallback_svg,
        }

    def _generate_procedural_heritage_svg(self, theme: str) -> str:
        """
        非遗级高精御窑青花程序化生成器 (透明通道背景，具备颈、肩、腹、足四重层次)
        采用四方连续圆周无缝章法，确保瓷瓶旋转 360° 任意角度均呈现饱满多瓣宝相花与连绵缠枝。
        """
        is_dragon = "龙" in theme
        is_fish = "鱼" in theme

        if is_dragon:
            # 苍龙戏珠：双龙腾跃海涛如意云水
            main_motif = """
    <!-- 穿云苍龙戏珠主纹 (四方连绵) -->
    <g stroke="#0c2146" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- 龙身大 S 飞腾龙脊 -->
      <path d="M 0 520 C 120 400, 240 620, 360 480 C 440 380, 520 400, 600 520 C 720 640, 840 420, 960 500 L 1024 520" stroke-width="9" stroke="#0c2146"/>
      <path d="M 0 520 C 120 400, 240 620, 360 480 C 440 380, 520 400, 600 520 C 720 640, 840 420, 960 500 L 1024 520" stroke-width="4" stroke="#183e78"/>

      <!-- 正面第一主龙首与龙角 (x: 480~560) -->
      <g transform="translate(512, 460)">
        <path d="M -40 -10 C 10 -40, 60 -30, 80 10 C 40 30, 0 35, -40 10 Z" fill="rgba(28,68,130,0.6)" stroke="#0c2146" stroke-width="3.5"/>
        <path d="M 30 -30 Q 60 -80, 100 -70" stroke="#0c2146" stroke-width="3.5"/>
        <path d="M 15 -25 Q 40 -65, 80 -65" stroke="#0c2146" stroke-width="3.5"/>
        <circle cx="35" cy="0" r="7" fill="#c9a24f" stroke="#0c2146" stroke-width="2"/>
        <!-- 龙须 -->
        <path d="M 60 15 Q 110 30, 130 0" stroke="#183e78" stroke-width="3"/>
        <path d="M 60 22 Q 100 45, 120 25" stroke="#183e78" stroke-width="2.5"/>
      </g>
      <!-- 火焰宝珠 -->
      <circle cx="680" cy="420" r="30" fill="rgba(28,68,130,0.4)" stroke="#0c2146" stroke-width="3.5"/>
      <circle cx="680" cy="420" r="14" fill="#c9a24f"/>
      <path d="M 680 390 Q 720 370, 710 420 Q 730 450, 680 450" fill="none" stroke="#183e78" stroke-width="3"/>

      <!-- 龙爪五指舒张 -->
      <path d="M 280 460 L 250 400 M 280 460 L 265 390 M 280 460 L 295 390 M 280 460 L 310 405" stroke-width="4.5"/>
      <path d="M 800 500 L 770 560 M 800 500 L 785 570 M 800 500 L 815 570 M 800 500 L 830 555" stroke-width="4.5"/>
    </g>
    <!-- 云水波涛翻滚 -->
    <g fill="rgba(28,68,130,0.3)" stroke="#183e78" stroke-width="2.8">
      <path d="M 0 640 Q 64 590, 128 640 Q 192 690, 256 640 Q 320 590, 384 640 Q 448 690, 512 640 Q 576 590, 640 640 Q 704 690, 768 640 Q 832 590, 896 640 Q 960 690, 1024 640" fill="none"/>
      <path d="M 0 670 Q 64 620, 128 670 Q 192 720, 256 670 Q 320 620, 384 670 Q 448 720, 512 670 Q 576 620, 640 670 Q 704 720, 768 670 Q 832 620, 896 670 Q 960 720, 1024 670" fill="none"/>
    </g>
            """
        elif is_fish:
            # 鱼藻纹：四方游鱼清漪图
            main_motif = """
    <!-- 四方游鱼清漪图 -->
    <g stroke="#0c2146" stroke-width="3.5" fill="none">
      <!-- 4 尾灵动游鱼环绕 (x: 128, 384, 640, 896) -->
      <g transform="translate(128, 512)">
        <path d="M -60 0 C -20 -40, 40 -30, 70 0 C 40 30, -20 40, -60 0 Z" fill="rgba(28,68,130,0.55)"/>
        <path d="M 70 0 L 110 -25 L 95 0 L 115 25 Z" fill="#183e78"/>
        <circle cx="-30" cy="-6" r="5" fill="#0c2146"/>
        <circle cx="-30" cy="-6" r="2" fill="#c9a24f"/>
      </g>
      <g transform="translate(384, 470) scale(0.9) rotate(-15)">
        <path d="M -60 0 C -20 -40, 40 -30, 70 0 C 40 30, -20 40, -60 0 Z" fill="rgba(28,68,130,0.55)"/>
        <path d="M 70 0 L 110 -25 L 95 0 L 115 25 Z" fill="#183e78"/>
        <circle cx="-30" cy="-6" r="5" fill="#0c2146"/>
        <circle cx="-30" cy="-6" r="2" fill="#c9a24f"/>
      </g>
      <g transform="translate(640, 530) scale(1.05) rotate(10)">
        <path d="M -60 0 C -20 -40, 40 -30, 70 0 C 40 30, -20 40, -60 0 Z" fill="rgba(28,68,130,0.55)"/>
        <path d="M 70 0 L 110 -25 L 95 0 L 115 25 Z" fill="#183e78"/>
        <circle cx="-30" cy="-6" r="5" fill="#0c2146"/>
        <circle cx="-30" cy="-6" r="2" fill="#c9a24f"/>
      </g>
      <g transform="translate(896, 480) scale(0.85) rotate(-8)">
        <path d="M -60 0 C -20 -40, 40 -30, 70 0 C 40 30, -20 40, -60 0 Z" fill="rgba(28,68,130,0.55)"/>
        <path d="M 70 0 L 110 -25 L 95 0 L 115 25 Z" fill="#183e78"/>
        <circle cx="-30" cy="-6" r="5" fill="#0c2146"/>
        <circle cx="-30" cy="-6" r="2" fill="#c9a24f"/>
      </g>
      <!-- 水草摇曳蔓延 -->
      <path d="M 0 700 Q 80 500, 30 360 T 90 220" stroke="#183e78" stroke-width="5"/>
      <path d="M 256 720 Q 320 540, 280 380 T 340 230" stroke="#183e78" stroke-width="5"/>
      <path d="M 512 700 Q 580 520, 530 370 T 600 220" stroke="#183e78" stroke-width="5"/>
      <path d="M 768 720 Q 820 540, 780 390 T 850 240" stroke="#183e78" stroke-width="5"/>
      <path d="M 1024 700 Q 1104 500, 1054 360 T 1114 220" stroke="#183e78" stroke-width="5"/>
    </g>
            """
        else:
            # 经典生生不息四方连续缠枝宝相花纹 (绝无空白或单调圆圈，四方位均绽放大朵盛开宝相花)
            main_motif = """
    <!-- 四方连续缠枝宝相花纹 -->
    <defs>
      <!-- 盛开八瓣宝相花头组件 -->
      <g id="full_baoxiang_flower">
        <!-- 外层八大瓣 (深浓青花铁线勾勒与分水层次) -->
        <g stroke="#0c2146" stroke-width="3" fill="rgba(28,68,130,0.62)">
          <path d="M 0 -130 C 35 -90, 35 -50, 0 0 C -35 -50, -35 -90, 0 -130 Z"/>
          <path d="M 0 130 C 35 90, 35 50, 0 0 C -35 50, -35 90, 0 130 Z"/>
          <path d="M -130 0 C -90 35, -50 35, 0 0 C -50 -35, -90 -35, -130 0 Z"/>
          <path d="M 130 0 C 90 35, 50 35, 0 0 C 50 -35, 90 -35, 130 0 Z"/>
        </g>
        <!-- 内层斜向四副瓣 (淡浅青花晕染分水) -->
        <g stroke="#183e78" stroke-width="2.5" fill="rgba(45,95,158,0.48)">
          <path d="M -90 -90 C -60 -25, -25 -60, 0 0 C -60 -25, -25 -60, -90 -90 Z"/>
          <path d="M 90 -90 C 60 -25, 25 -60, 0 0 C 60 -25, 25 -60, 90 -90 Z"/>
          <path d="M -90 90 C -60 25, -25 60, 0 0 C -60 25, -25 60, -90 90 Z"/>
          <path d="M 90 90 C 60 25, 25 60, 0 0 C 60 25, 25 60, 90 90 Z"/>
        </g>
        <!-- 花萼环形勾边 -->
        <circle cx="0" cy="0" r="140" fill="none" stroke="#0c2146" stroke-width="2.5" stroke-dasharray="8,5"/>
        <!-- 繁复花蕊：苏麻离青深浓铁锈斑与泥金花心 -->
        <circle cx="0" cy="0" r="42" fill="#183e78" stroke="#0c2146" stroke-width="3.5"/>
        <circle cx="0" cy="0" r="24" fill="rgba(28,68,130,0.7)"/>
        <circle cx="0" cy="0" r="12" fill="#c9a24f"/>
        <!-- 铁锈斑自然微瑕 -->
        <circle cx="-14" cy="-12" r="3" fill="#08152c"/>
        <circle cx="16" cy="10" r="3" fill="#08152c"/>
        <circle cx="10" cy="-15" r="2.5" fill="#08152c"/>
        <circle cx="-12" cy="14" r="2.5" fill="#08152c"/>
      </g>
      <!-- 卷草舒卷侧叶 -->
      <g id="scrolling_leaf">
        <path d="M 0 0 C 35 -35, 75 -25, 95 5 C 65 25, 30 25, 0 0 Z" fill="rgba(28,68,130,0.55)" stroke="#0c2146" stroke-width="2.5"/>
        <path d="M 0 0 Q 45 -10, 80 0" stroke="#183e78" stroke-width="2" fill="none"/>
      </g>
    </defs>

    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- 缠枝双线大藤蔓连绵无缝贯穿 (波长 512，两周期平铺 1024，两端高度与切线严格连续) -->
      <path d="M 0 512 C 128 410, 128 614, 256 512 C 384 410, 384 614, 512 512 C 640 410, 640 614, 768 512 C 896 410, 896 614, 1024 512" stroke="#0c2146" stroke-width="7"/>
      <path d="M 0 512 C 128 614, 128 410, 256 512 C 384 614, 384 410, 512 512 C 640 614, 640 410, 768 512 C 896 614, 896 410, 1024 512" stroke="#183e78" stroke-width="3.5" stroke-dasharray="14,7"/>

      <!-- 四大盛开宝相花 (四方连续：x=512 正面大花，x=256 与 768 侧翼大花，x=0 与 1024 背面闭合大花) -->
      <use href="#full_baoxiang_flower" x="512" y="512"/>
      <use href="#full_baoxiang_flower" x="256" y="512" transform="scale(0.85) translate(45, 90)"/>
      <use href="#full_baoxiang_flower" x="768" y="512" transform="scale(0.85) translate(-45, 90)"/>
      <use href="#full_baoxiang_flower" x="0" y="512"/>
      <use href="#full_baoxiang_flower" x="1024" y="512"/>

      <!-- 繁茂卷叶点缀于藤蔓波峰波谷 -->
      <use href="#scrolling_leaf" x="128" y="440" transform="rotate(-30 128 440) scale(1.1)"/>
      <use href="#scrolling_leaf" x="128" y="584" transform="rotate(150 128 584) scale(1.1)"/>
      <use href="#scrolling_leaf" x="384" y="440" transform="rotate(-30 384 440) scale(1.1)"/>
      <use href="#scrolling_leaf" x="384" y="584" transform="rotate(150 384 584) scale(1.1)"/>
      <use href="#scrolling_leaf" x="640" y="440" transform="rotate(-30 640 440) scale(1.1)"/>
      <use href="#scrolling_leaf" x="640" y="584" transform="rotate(150 640 584) scale(1.1)"/>
      <use href="#scrolling_leaf" x="896" y="440" transform="rotate(-30 896 440) scale(1.1)"/>
      <use href="#scrolling_leaf" x="896" y="584" transform="rotate(150 896 584) scale(1.1)"/>
    </g>
            """

        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- 1. 颈部口沿带：弦纹与回纹 (y: 20 ~ 130) -->
  <g stroke="#0c2146" stroke-width="4" fill="none">
    <line x1="0" y1="30" x2="1024" y2="30" stroke-width="5"/>
    <line x1="0" y1="50" x2="1024" y2="50" stroke-width="2"/>
    <!-- 连续回纹带 (16 单位等分平铺) -->
    <path d="M 0 80 H 64 V 110 H 32 V 95 H 48 M 64 80 H 128 V 110 H 96 V 95 H 112 M 128 80 H 192 V 110 H 160 V 95 H 176 M 192 80 H 256 V 110 H 224 V 95 H 240 M 256 80 H 320 V 110 H 288 V 95 H 304 M 320 80 H 384 V 110 H 352 V 95 H 368 M 384 80 H 448 V 110 H 416 V 95 H 432 M 448 80 H 512 V 110 H 480 V 95 H 496 M 512 80 H 576 V 110 H 544 V 95 H 560 M 576 80 H 640 V 110 H 608 V 95 H 624 M 640 80 H 704 V 110 H 672 V 95 H 688 M 704 80 H 768 V 110 H 736 V 95 H 752 M 768 80 H 832 V 110 H 800 V 95 H 816 M 832 80 H 896 V 110 H 864 V 95 H 880 M 896 80 H 960 V 110 H 928 V 95 H 944 M 960 80 H 1024 V 110 H 992 V 95 H 1008" stroke="#183e78" stroke-width="2.5"/>
    <line x1="0" y1="130" x2="1024" y2="130" stroke-width="3"/>
  </g>

  <!-- 2. 肩部如意云头纹饰带 (y: 150 ~ 280) -->
  <g fill="rgba(28,68,130,0.38)" stroke="#0c2146" stroke-width="3.5">
    <path d="M 0 160 Q 64 260, 128 200 Q 192 260, 256 160 Q 320 260, 384 200 Q 448 260, 512 160 Q 576 260, 640 200 Q 704 260, 768 160 Q 832 260, 896 200 Q 960 260, 1024 160 L 1024 140 L 0 140 Z"/>
    <!-- 云肩垂珠点缀 -->
    <circle cx="128" cy="230" r="7" fill="#0c2146"/>
    <circle cx="384" cy="230" r="7" fill="#0c2146"/>
    <circle cx="640" cy="230" r="7" fill="#0c2146"/>
    <circle cx="896" cy="230" r="7" fill="#0c2146"/>
  </g>

  <!-- 3. 腹部核心主题纹饰 (y: 300 ~ 740) -->
  {main_motif}

  <!-- 4. 足胫部装饰带：仰莲瓣纹 (y: 780 ~ 980) -->
  <g stroke="#0c2146" stroke-width="3.5" fill="rgba(28,68,130,0.35)">
    <line x1="0" y1="780" x2="1024" y2="780" stroke-width="4"/>
    <!-- 仰覆莲瓣阵列 -->
    <path d="M 0 940 C 32 820, 96 820, 128 940 Z M 128 940 C 160 820, 224 820, 256 940 Z M 256 940 C 288 820, 352 820, 384 940 Z M 384 940 C 416 820, 480 820, 512 940 Z M 512 940 C 544 820, 608 820, 640 940 Z M 640 940 C 672 820, 736 820, 768 940 Z M 768 940 C 800 820, 864 820, 896 940 Z M 896 940 C 928 820, 992 820, 1024 940 Z"/>
    <!-- 莲瓣内圈花纹 -->
    <path d="M 32 940 C 48 870, 80 870, 96 940 M 160 940 C 176 870, 208 870, 224 940 M 288 940 C 304 870, 336 870, 352 940 M 416 940 C 432 870, 464 870, 480 940 M 544 940 C 560 870, 592 870, 608 940 M 672 940 C 688 870, 720 870, 736 940 M 800 940 C 816 870, 848 870, 864 940 M 928 940 C 944 870, 976 870, 992 940" stroke="#183e78" stroke-width="2" fill="none"/>
    <line x1="0" y1="960" x2="1024" y2="960" stroke-width="6"/>
  </g>
</svg>"""
