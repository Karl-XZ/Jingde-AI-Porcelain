# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
from typing import Dict, Any, Optional
from server.agents.base_jiuwen_agent import BaseJiuwenAgent


class FormParametricAgent(BaseJiuwenAgent):
    """器型推演匠 (FormParametricAgent)：历代官窑 3D 比例参数与母线拟合"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 框架驱动的【景德镇御窑器型推演匠】。
你精通中国古代官窑瓷器的几何造型法则、宋元明清历代器型流变（梅瓶、玉壶春瓶、天球瓶、冬瓜坛、橄榄瓶、蒜头瓶、斗笠碗等）。
当接收到用户的器型风格描述（如“宋代修长梅瓶”、“明代广腹玉壶春瓶”、“清代天球瓶”或用户自拟器型）时，推演并输出精确的 3D 参数与母线控制点。

请严格输出以下 JSON 格式：
```json
{
  "dynasty": "朝代（如：宋代 / 明代 / 清代）",
  "shape_name": "器型名称",
  "heightScale": 1.18, // 0.8 ~ 1.4，整体器高比例
  "rimScale": 0.78,    // 0.6 ~ 1.6，口沿口径比例
  "bellyScale": 1.22,  // 0.7 ~ 1.6，腹径比例
  "points": [          // 6 个关键剖面母线点，y 从 3.8 递减到 0.0
    {"x": 0.55, "y": 3.8}, // 口沿
    {"x": 0.42, "y": 3.1}, // 颈部
    {"x": 1.15, "y": 2.5}, // 肩部
    {"x": 1.22, "y": 1.8}, // 腹部
    {"x": 0.85, "y": 0.9}, // 下腹
    {"x": 0.68, "y": 0.0}  // 圈足
  ],
  "aesthetic_analysis": "美学与非遗工艺解析（阐释器型曲线特征、重心分布及历代审美流变）"
}
```"""

    def __init__(self):
        super().__init__(
            name="FormParametricAgent",
            description="推演历代官窑瓷器 3D 几何比例、母线控制点与历史美学参数",
            system_prompt=self.SYSTEM_PROMPT,
        )

    async def infer(self, prompt: str, current_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        user_msg = f"请推演器型：{prompt}"
        if current_params:
            user_msg += f"\n当前参数参考：{current_params}"

        raw_resp = await self.chat(user_msg, temperature=0.6)
        parsed = self.extract_json(raw_resp)
        if parsed and "heightScale" in parsed:
            return parsed

        # Robust default fallback
        return {
            "dynasty": "宋代",
            "shape_name": "宋韵修长梅瓶",
            "heightScale": 1.18,
            "rimScale": 0.78,
            "bellyScale": 1.22,
            "points": [
                {"x": 0.55, "y": 3.8},
                {"x": 0.42, "y": 3.1},
                {"x": 1.15, "y": 2.5},
                {"x": 1.22, "y": 1.8},
                {"x": 0.85, "y": 0.9},
                {"x": 0.68, "y": 0.0}
            ],
            "aesthetic_analysis": "小口微翻，短颈丰肩，胫部内敛，线条流转挺拔，兼具宋代典雅理性之美与盛水储酒之工学巧思。"
        }
