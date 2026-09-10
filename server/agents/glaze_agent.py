# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
from typing import Dict, Any, Optional
from server.agents.base_jiuwen_agent import BaseJiuwenAgent


class GlazeAlchemyAgent(BaseJiuwenAgent):
    """名釉天工匠 (GlazeAlchemyAgent)：景德镇名贵罩釉光学逆推与 PBR 配方调制"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 框架驱动的【景德镇御窑名釉天工匠】。
你深谙景德镇传统釉料的矿物配伍（草木灰、长石、石英、高岭土、紫金土、氧化铜、氧化铁、氧化钴）及光学物理特征（折射率 IOR、漫反射、镜面反射、透光度、清漆层与分相析晶）。
你的任务是：根据用户指定的名釉风格，逆推符合 WebGL Three.js MeshPhysicalMaterial 的真实 PBR 物理光学渲染参数，并给出非遗配方解析。

请严格返回以下 JSON 格式：
```json
{
  "glaze_name": "名贵釉料品名（如：影青温润仿玉釉 / 霁红牛血红釉 / 纯澈亮光透明釉 / 茶叶末晶斑釉）",
  "pbr": {
    "roughness": 0.12,          // 0.05 ~ 0.6，釉面微观粗糙度
    "metalness": 0.02,          // 0.0 ~ 0.1，金属度（绝缘体陶瓷极低）
    "clearcoat": 0.85,          // 0.4 ~ 1.0，表层清漆罩光层强度
    "clearcoatRoughness": 0.06, // 0.01 ~ 0.25，清漆层平整度
    "transmission": 0.22,       // 0.0 ~ 0.45，玻璃相半透光率
    "ior": 1.48,                // 1.40 ~ 1.65，光学折射率
    "colorTint": "#dff2f2",     // 釉面微透光滤色（十六进制颜色）
    "sheen": 0.45               // 0.0 ~ 0.8，丝绢缎面散射光
  },
  "mineral_formula": "非遗矿物原料配方及呈色原理阐述",
  "optical_rationale": "PBR 物理光学渲染逻辑（如清漆折射率与次表面散射表现）"
}
```"""

    def __init__(self):
        super().__init__(
            name="GlazeAlchemyAgent",
            description="根据景德镇名釉矿物成分逆推 WebGL PBR 物理渲染参数（IOR、清漆、透光率）",
            system_prompt=self.SYSTEM_PROMPT,
        )

    async def synthesize(self, glaze_name: str, target_optical: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        user_msg = f"请调制并逆推名贵釉料 PBR 参数：{glaze_name}"
        if target_optical:
            user_msg += f"\n目标光学倾向：{target_optical}"

        raw_resp = await self.chat(user_msg, temperature=0.6)
        parsed = self.extract_json(raw_resp)

        if parsed and "pbr" in parsed:
            return parsed

        # Robust fallbacks for classic types
        if "影青" in glaze_name or "玉" in glaze_name:
            return {
                "glaze_name": "影青温润仿玉釉",
                "pbr": {
                    "roughness": 0.14,
                    "metalness": 0.02,
                    "clearcoat": 0.75,
                    "clearcoatRoughness": 0.08,
                    "transmission": 0.28,
                    "ior": 1.48,
                    "colorTint": "#e6f5f5",
                    "sheen": 0.5
                },
                "mineral_formula": "高岭土与石英微粒悬浮，长石质玻璃熔体在 1280℃ 还原焰中生成极微晶相，致青白交融、温润如玉。",
                "optical_rationale": "折射率设为 1.48，清漆适度柔化以消除生硬数码高光，强化微漫反射仿羊脂白玉触感。"
            }
        else:
            return {
                "glaze_name": "纯澈玻璃亮光透明釉",
                "pbr": {
                    "roughness": 0.05,
                    "metalness": 0.01,
                    "clearcoat": 1.0,
                    "clearcoatRoughness": 0.02,
                    "transmission": 0.05,
                    "ior": 1.54,
                    "colorTint": "#ffffff",
                    "sheen": 0.1
                },
                "mineral_formula": "以精制石灰石与纯石英粉配比，高温彻底玻化，全透明无杂质，最大化还原底胎青花之翠意。",
                "optical_rationale": "高 IOR (1.54) 与满额 Clearcoat (1.0) 形成镜面反射，纤毫毕现。"
            }
