# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
from typing import Dict, Any, Optional
from server.agents.base_jiuwen_agent import BaseJiuwenAgent


class AppraisalAgent(BaseJiuwenAgent):
    """题跋鉴古匠 (AppraisalAgent)：古风赋诗题跋、御窑评级与数字证书著录"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 框架驱动的【景德镇御窑题跋鉴古匠】（翰林院御考官）。
你学贯古今，精通历代咏瓷诗词典籍、官窑款识书体及古董鉴赏评级体系。
你的任务是：根据最终成器的器型名称、青花纹样、罩釉光泽、窑火纯度，为作品创作一首韵律优美的七言格律题画诗，并拟定官窑艺术品级、底款题跋与数字证书考语。

请严格返回以下 JSON 格式：
```json
{
  "appraisal_rank": "神品 · 官窑特等",  // 艺术品级：神品 · 官窑特等 / 逸品 · 官窑一等 / 妙品 · 官窑上选
  "poem": "七言绝句或律诗（四句或八句，讲求平仄押韵，典雅优美）",
  "poem_annotation": "诗意注解与典故出处",
  "seal_mark": "款识题字（如：大明宣德年制 / 乾隆御赏）",
  "critique": "官窑考据鉴赏评语（对器型、青花发色、釉面凝脂质感的权威论断）",
  "market_valuation": "收藏级估价建议（如：官窑特等珍赏 · 价值连城）"
}
```"""

    def __init__(self):
        super().__init__(
            name="AppraisalAgent",
            description="根据成品瓷器综合质感进行古风作诗题跋、评定官窑艺术等级并撰写数字著录",
            system_prompt=self.SYSTEM_PROMPT,
        )

    async def appraise(self, piece_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        user_msg = "请为本件御窑成品进行赋诗题跋与官窑品级评定。"
        if piece_info:
            user_msg += f"\n成瓷数据档案：{piece_info}"

        raw_resp = await self.chat(user_msg, temperature=0.7)
        parsed = self.extract_json(raw_resp)

        if parsed and "poem" in parsed:
            return parsed

        return {
            "appraisal_rank": "神品 · 官窑特等",
            "poem": "白釉青花一火成，花从釉里透分明。可怜垄上泥土贱，入手翻随富贵生。",
            "poem_annotation": "化用清代龚轼《陶歌》，叹柴窑造化之神秀，青花与玉釉熔于一炉，脱胎换骨。",
            "seal_mark": "大明宣德御窑 · 数字非遗监制",
            "critique": "胎质极紧密而如糯米玉，青花深浅浓淡层次分明，釉表微起橘皮波浪纹，宝光内敛，堪称当代官窑数字典范之器。",
            "market_valuation": "官窑国宝级数字孤品"
        }
