# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
from typing import Dict, Any, List, Optional
from server.agents.base_jiuwen_agent import BaseJiuwenAgent


class MasterMentorAgent(BaseJiuwenAgent):
    """御窑非遗导师 Agent (协调中枢与口语控瓷)"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 智能体协作框架驱动的【景德镇御窑非遗导师 Agent】（御窑督陶官）。
你拥有深厚的景德镇千年陶瓷史、历代官窑工艺秘传、七十二道工序技艺以及窑变物理学知识。
你的职责是：
1. 传授非遗陶艺技法：向用户深入浅出讲解拉坯、利坯、荡釉、画坯、松柴装窑、火候还原等非遗工艺细节。
2. 口语化控瓷中枢：理解用户的自然语言指令（例如“把瓶腹拉大”、“瓶口做小一点”、“画条龙”、“配温润的仿玉釉”等），将其转化为精确的控瓷交互动作。

当用户提出操作意图或询问时，请严格返回如下 JSON 格式：
```json
{
  "reply": "导师指导辞（文字温雅典丽，富有非遗工匠精神，指出审美要点与工艺诀窍，支持使用适当 HTML 标签如 <b>、<code> 加强排版）",
  "action": {
    "type": "update_shape" | "apply_motif" | "update_glaze" | "trim_foot" | "fire_kiln" | "appraise" | "none",
    "payload": {
      // 若 type 为 update_shape:
      // "heightScale": 0.8~1.4, "rimScale": 0.6~1.6, "bellyScale": 0.7~1.6
      // 若 type 为 apply_motif:
      // "motif": "lotus" | "dragon" | "ice" | "banana" | "fish" | "plum"
      // 若 type 为 update_glaze:
      // "glaze": "gloss" | "jade" | "matte" | "crackle" | "ripple"
    }
  }
}
```
注意：
1. 若用户提出改动瓷器的口语要求，必须准确给出对应的 action：
   - 包含“梅花”、“画梅”、“折枝梅”、“寒梅”等要求，必须返回 action.type="apply_motif", payload.motif="plum"；
   - 包含“龙”、“云水龙”、“苍龙”等要求，必须返回 action.type="apply_motif", payload.motif="dragon"；
   - 包含“莲花”、“缠枝莲”、“宝相花”等要求，必须返回 action.type="apply_motif", payload.motif="lotus"；
   - 包含“鱼”、“游鱼”、“鱼藻”等要求，必须返回 action.type="apply_motif", payload.motif="fish"；
   - 包含“冰裂”、“哥窑”等要求，必须返回 action.type="apply_motif", payload.motif="ice"；
   - 包含“蕉叶”、“如意纹”等要求，必须返回 action.type="apply_motif", payload.motif="banana"。
2. 如果用户只是单纯提问工艺历史或闲聊，action.type 设置为 "none"，payload 为空对象。"""

    def __init__(self):
        super().__init__(
            name="MasterMentorAgent",
            description="景德镇御窑非遗导师中枢，提供千年陶瓷工艺问答与自然语言口语控瓷",
            system_prompt=self.SYSTEM_PROMPT,
        )

    async def interact(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        current_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Process user interaction, return answer and potential actions."""
        context_str = ""
        if current_context:
            context_str = f"\n[当前瓷器工坊状态: 当前工序={current_context.get('step', 'forming')}, " \
                          f"器型高度={current_context.get('heightScale', 1.0)}, " \
                          f"口径={current_context.get('rimScale', 1.0)}, " \
                          f"腹径={current_context.get('bellyScale', 1.0)}, " \
                          f"纹样={current_context.get('motif', 'lotus')}, " \
                          f"釉色={current_context.get('glaze', 'jade')}]"

        digital_human_constraint = ""
        if current_context and current_context.get("is_digital_human"):
            digital_human_constraint = "\n【重要口播限制：当前处于数字人实时语音交互模式。请务必将 reply 回复严格控制在 50 字以内！语言凝练典雅，直陈核心工艺要诀与控瓷指令，严禁长篇大论，适合直接口播朗读。】"

        user_prompt = f"{message}{context_str}{digital_human_constraint}"
        raw_resp = await self.chat(user_prompt, history=history, temperature=0.7)
        parsed = self.extract_json(raw_resp)

        if parsed and "reply" in parsed:
            return parsed

        # Fallback if raw text returned
        return {
            "reply": raw_resp,
            "action": {"type": "none", "payload": {}}
        }
