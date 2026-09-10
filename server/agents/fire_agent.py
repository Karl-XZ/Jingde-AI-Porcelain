# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
from typing import Dict, Any, Optional
from server.agents.base_jiuwen_agent import BaseJiuwenAgent


class KilnPhysicsAgent(BaseJiuwenAgent):
    """窑火推演匠 (KilnPhysicsAgent)：松柴窑炉气氛演化推演与热力学拟合"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 框架驱动的【景德镇御窑窑火推演匠】（把桩师傅）。
景德镇传统柴窑烧造遵循“一色、二工、三窑火”，窑内气氛分为氧化焰、中性焰、强弱还原焰。松柴富含松脂，在高温不完全燃烧下产生一氧化碳（CO），使釉料中金属氧化物完成晶体转化。
你的任务是：根据输入的烧成温度、还原程度与保温时长，推演窑炉气氛的热力学参数与釉料呈色化学演化。

请严格返回以下 JSON 格式：
```json
{
  "atmosphere": "强还原焰 (CO 4.2% ~ 5.0%)",
  "co_concentration": 4.5,            // 一氧化碳浓度 %
  "o2_concentration": 0.6,            // 残氧浓度 %
  "firing_temperature": 1300,         // 烧成温度 ℃
  "thermodynamic_reaction": "Fe2O3 + CO → 2FeO + CO2↑ （三价铁还原为亚铁离子，发深邃幽靓之翠青）",
  "quality_score": 99.1,              // 成瓷品质指数
  "glaze_transformation": "釉面微观演化现象（如：苏麻离青下沉入骨，玻璃质熔体平滑展平，气泡细密匀净）",
  "risk_assessment": "缺陷风险诊断（如：过火变形风险低、生烧针孔几率为 0.1%）",
  "master_formula": "把桩非遗口诀（如：重柴压火、缓步登高、平稳下火、闭窑闷青）"
}
```"""

    def __init__(self):
        super().__init__(
            name="KilnPhysicsAgent",
            description="模拟松柴窑炉热力学演化、还原焰 CO/O2 浓度与非遗烧窑曲线",
            system_prompt=self.SYSTEM_PROMPT,
        )

    async def simulate(
        self,
        temperature: int = 1300,
        atmosphere_mode: str = "reduction",
        glaze_type: str = "jade"
    ) -> Dict[str, Any]:
        user_msg = f"请推演窑炉热力学：温度={temperature}℃，气氛倾向={atmosphere_mode}，当前施釉={glaze_type}"
        raw_resp = await self.chat(user_msg, temperature=0.6)
        parsed = self.extract_json(raw_resp)

        if parsed and "atmosphere" in parsed:
            return parsed

        return {
            "atmosphere": "松柴强还原焰 (CO 4.2%)",
            "co_concentration": 4.2,
            "o2_concentration": 0.8,
            "firing_temperature": temperature,
            "thermodynamic_reaction": "Fe2O3 + CO → 2FeO + CO2↑ （高温下钴料与胎釉完美熔融）",
            "quality_score": 98.8,
            "glaze_transformation": "松柴松脂在 1300℃ 挥发润色，釉层深处形成微观乳浊云雾相，纯青发色沉着内敛。",
            "risk_assessment": "升温斜率平缓，排湿彻底，无针孔缩釉及惊裂隐患。",
            "master_formula": "一烧升温排潮汽，二烧还原吐青翠，三烧熟透保高温，四烧闷火凝玉脂。"
        }
