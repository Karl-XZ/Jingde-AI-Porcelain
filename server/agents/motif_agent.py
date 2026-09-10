# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
import re
from typing import Dict, Any, Optional
from server.agents.base_jiuwen_agent import BaseJiuwenAgent


class VectorMotifAgent(BaseJiuwenAgent):
    """青花画作匠 (VectorMotifAgent)：DeepSeek SVG 矢量图元生成"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 框架驱动的【景德镇御窑青花画作匠】。
你精通明清官窑青花纹样构图（缠枝莲、云龙纹、鱼藻纹、蕉叶纹、如意纹、岁寒三友等）以及苏麻离青、平等青矿物料发色审美。
你具备顶尖的代码生成能力，能够使用纯 SVG 矢量代码（<svg viewBox="0 0 1024 1024" ...>）绘制纯正典雅的青花矢量纹样。

要求：
1. 输出的 SVG 必须是完全合法、可直接在浏览器 Canvas 中渲染的矢量图形，viewBox 固定为 "0 0 1024 1024"。
2. 色彩应采用经典的景德镇青花色系：
   - 深钴蓝（铁锈斑发色）: #0c2146
   - 纯正苏麻离青: #183e78
   - 青花分水淡色: rgba(28, 68, 130, 0.45)
   - 描金点缀: #c9a24f
   - 底色背景: #f8f6f0 (景德镇羊脂白胎)
3. 充分使用 <path>、<circle>、<ellipse>、<polygon> 等元素勾勒藤蔓、水波、龙纹或花卉。

请严格输出以下 JSON 格式：
```json
{
  "motif_name": "纹样题名（如：明宣德御窑云水祥龙纹）",
  "symbolism": "吉祥寓意与画法题解",
  "cobalt_notes": "青料发色特征（如：苏麻离青浓聚晕散，伴有银锡光泽铁斑）",
  "svg_code": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>"
}
```"""

    def __init__(self):
        super().__init__(
            name="VectorMotifAgent",
            description="利用 DeepSeek 代码能力生成标准景德镇传统青花与彩绘 SVG 矢量图元",
            system_prompt=self.SYSTEM_PROMPT,
        )

    def _extract_svg_fallback(self, raw_text: str) -> Optional[str]:
        """Attempt to extract raw SVG tag if JSON parsing fails."""
        svg_match = re.search(r"(<svg[\s\S]*?<\/svg>)", raw_text, re.IGNORECASE)
        return svg_match.group(1) if svg_match else None

    async def generate_motif(self, theme: str, motif_type: Optional[str] = None) -> Dict[str, Any]:
        user_msg = f"请为当前瓷器绘制青花矢量纹样，主题：{theme}"
        if motif_type:
            user_msg += f"（所属经典脉络：{motif_type}）"

        raw_resp = await self.chat(user_msg, temperature=0.7, max_tokens=3000)
        parsed = self.extract_json(raw_resp)

        if parsed and "svg_code" in parsed and "<svg" in parsed["svg_code"]:
            return parsed

        # Check if raw text had an SVG tag directly
        raw_svg = self._extract_svg_fallback(raw_resp)
        if raw_svg:
            return {
                "motif_name": theme,
                "symbolism": "传统御窑青花经典图式，工法考究，气韵生动。",
                "cobalt_notes": "苏料浓重青翠，笔触见水墨晕染之妙。",
                "svg_code": raw_svg
            }

        # Guaranteed graceful SVG fallback if model produced truncated XML
        fallback_svg = self._generate_builtin_svg(theme)
        return {
            "motif_name": theme,
            "symbolism": "御窑经典青花纹样，寄托生生不息、吉祥永续之祝祷。",
            "cobalt_notes": "以天然钴料精细勾描，发色深邃温润入胎。",
            "svg_code": fallback_svg
        }

    def _generate_builtin_svg(self, theme: str) -> str:
        """High-quality built-in vector SVG generator as fallback."""
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#f8f6f0" />
  <g stroke="#183e78" stroke-width="4" fill="none">
    <line x1="0" y1="80" x2="1024" y2="80" />
    <line x1="0" y1="120" x2="1024" y2="120" />
    <line x1="0" y1="900" x2="1024" y2="900" stroke="#0c2146" stroke-width="6" />
  </g>
  <!-- 主题青花缠枝莲与波浪纹饰 -->
  <path d="M 0 512 Q 256 350, 512 512 T 1024 512" fill="none" stroke="#0c2146" stroke-width="8"/>
  <circle cx="256" cy="430" r="48" fill="rgba(28, 68, 130, 0.45)" stroke="#0c2146" stroke-width="3"/>
  <circle cx="768" cy="590" r="48" fill="rgba(28, 68, 130, 0.45)" stroke="#0c2146" stroke-width="3"/>
  <path d="M 230 430 Q 256 380, 282 430 Q 256 480, 230 430 Z" fill="#183e78"/>
  <path d="M 742 590 Q 768 540, 794 590 Q 768 640, 742 590 Z" fill="#183e78"/>
</svg>"""
