# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
import re
from typing import Dict, Any, List, Optional
from server.agents.base_jiuwen_agent import BaseJiuwenAgent


class MasterMentorAgent(BaseJiuwenAgent):
    """御窑非遗导师 Agent (协调中枢与口语控瓷)"""

    SYSTEM_PROMPT = """你是由华为 openJiuwen 智能体协作框架驱动的【景德镇御窑非遗导师 Agent】（御窑督陶官）。
你拥有深厚的景德镇千年陶瓷史、历代官窑工艺秘传、七十二道工序技艺以及窑变物理学知识。
你的职责是：
1. 传授非遗陶艺技法：向用户深入浅出讲解拉坯、利坯、荡釉、画坯、松柴装窑、火候还原等非遗工艺细节。
2. 口语化控瓷中枢：理解用户的自然语言指令（例如“把瓶腹拉大”、“瓶口做小一点”、“画条龙”、“配温润的仿玉釉”等），将其转化为精确的控瓷交互动作。

【格式铁律】：无论用户进行第几轮提问，你的回复必须且只能以 ```json 开头并以 ``` 结尾，绝对禁止直接输出纯文本！严禁在 JSON 之外输出任何文字！
当用户提出操作意图或询问时，请严格返回如下 JSON 格式：
```json
{
  "reply": "导师指导辞（文字温雅典丽，富有非遗工匠精神，指出审美要点与工艺诀窍）",
  "action": {
    "type": "update_shape" | "generate_svg" | "update_glaze" | "trim_foot" | "fire_kiln" | "appraise" | "none",
    "payload": {
      // 若 type 为 update_shape:
      // "preset": "meiping" | "yuhuchun" | "bowl" | "cylinder" (当用户要求更换器型预设时)
      // "heightScale": 0.7~1.5, "rimScale": 0.7~1.5, "bellyScale": 0.7~1.5 (微调器型尺寸)
      // "reset": true (当用户要求复位、重置器型或还原时)
      // 若 type 为 generate_svg:
      // "theme": "纹样主题（如：梅花、云水祥龙、富贵牡丹、松鹤延年、鱼藻清漪、岁寒三友、山水等）"
      // 若 type 为 update_glaze:
      // "glaze": "gloss" | "jade" | "matte" | "crackle" | "ripple"
    }
  }
}
```
注意：
1. 【画花与纹饰指令】：用户提出任何画花、绘图、生图、装饰要求（无论是“生成梅花图”、“绘制荷花图”、“画牡丹”、“画松鹤延年”、“画龙”、“画鱼”、“画山水”或任何非预设自拟词汇），必须返回 action.type="generate_svg"，并在 payload.theme 中精确填入用户要求的纹样主题！
2. 【器型与拉坯指令】：必须能举一反三理解所有自然语言口语控瓷表达，并转化为显著可见的 3D 比例调整：
   - 变细/瘦身类（“周身变细”、“整体收细”、“修长纤细”、“做瘦一点”、“亭亭玉立”等）：必须返回 action.type="update_shape"，payload 包含 {"heightScale": 1.25, "rimScale": 0.72, "bellyScale": 0.70}，实现通体修长收细；
   - 拔高修长类（“拉高”、“拔高”、“变高”、“做高一点”、“挺拔高挑”等）：必须大幅增加高度，返回 action.type="update_shape"，payload: {"heightScale": 1.35}；
   - 做矮蹲重类（“做矮”、“矮一点”、“做成矮瓶”、“压扁一些”、“矮胖”等）：必须大幅压低高度，返回 action.type="update_shape"，payload: {"heightScale": 0.70}；
   - 丰腹大肚类（“大肚子”、“肚子鼓起来”、“瓶腹拉大”、“丰肩”、“饱满圆润”等）：必须大幅膨胀腹部，返回 action.type="update_shape"，payload: {"bellyScale": 1.42}；
   - 瘦腹收腰类（“收腰”、“收小瓶腹”、“细腰身”、“肚子收小”等）：必须大幅收紧腹部，返回 action.type="update_shape"，payload: {"bellyScale": 0.72}；
   - 阔口撇口类（“口径做大”、“大口”、“敞口”、“撇口开大”、“大喇叭口”等）：必须大幅展开口沿，返回 action.type="update_shape"，payload: {"rimScale": 1.45}；
   - 小口敛口类（“口做小”、“小口”、“敛口”、“收紧口沿”、“细小口”等）：必须大幅收小口沿，返回 action.type="update_shape"，payload: {"rimScale": 0.65}；
   - 更换器型类（“换成玉壶春瓶”、“换成碗/斗笠碗”、“换成梅瓶”、“做个圆柱”等）：必须返回 action.type="update_shape"，payload 包含对应的 preset 以及重置后的 heightScale: 1.0, rimScale: 1.0, bellyScale: 1.0；
   - 复位还原类（“复位”、“还原初始”、“重新拉”、“恢复原样”等）：必须返回 action.type="update_shape"，payload: {"reset": true, "preset": "meiping", "heightScale": 1.0, "rimScale": 1.0, "bellyScale": 1.0}；
   4. 【多轮连续对话递进控形铁律】：在连续对话中，每次控形必须参考【当前瓷器状态参考】，在已有比例上继续做递进调整（例如当前高度已为 1.25 或 1.35，若用户进一步要求“再高一点”或“继续拉高”，应输出 1.45 或 1.60；若用户要求“做矮”，应输出 0.85 或 0.70；切忌死板重复完全相同的数值导致 3D 瓷瓶静止不动）！
3. 如果用户只是单纯提问工艺历史、原理或闲聊，action.type 设置为 "none"，payload 为空对象。"""

    def __init__(self):
        super().__init__(
            name="MasterMentorAgent",
            description="景德镇御窑非遗导师中枢，提供千年陶瓷工艺问答与自然语言口语控瓷",
            system_prompt=self.SYSTEM_PROMPT,
        )

    def _fallback_intent(self, message: str) -> Dict[str, Any]:
        """Robust semantic fallback extraction across colloquial Chinese pottery expressions."""
        m = message.lower()
        # 1. 纹样类 (生图、画花、绘图)
        if any(w in m for w in ["画", "绘", "生图", "生成", "纹", "图", "添上", "牡丹", "荷花", "梅花", "竹", "龙", "鱼", "鹤", "菊", "兰"]):
            theme = re.sub(r'^(请|帮我|在瓷身|在瓶身)?(生成|画|绘|绘制|添上|做个|弄个)', '', message).strip() or message
            theme = theme.replace("图", "").replace("纹", "").strip() or theme
            return {"type": "generate_svg", "payload": {"theme": theme}}
        # 2. 变细/抽条/修长/变瘦
        if any(w in m for w in ["抽条", "收窄", "变细", "整体收细", "周身变细", "修长细窄", "做瘦", "做细", "细一点", "瘦一点", "亭亭玉立", "纤细", "窄一点", "抽长"]):
            return {"type": "update_shape", "payload": {"heightScale": 1.25, "rimScale": 0.72, "bellyScale": 0.70}}
        # 3. 做矮/压扁/矮胖
        if any(w in m for w in ["压扁", "压矮", "做矮", "矮瓶", "扁腹", "矮一点", "矮墩", "矮胖", "扁一点", "压一压", "敦实"]):
            return {"type": "update_shape", "payload": {"heightScale": 0.70}}
        # 4. 拔高/变高/挺拔
        if any(w in m for w in ["拉高", "拔高", "做高", "变高", "挺拔高挑", "高一点", "长一点", "拔长"]):
            return {"type": "update_shape", "payload": {"heightScale": 1.35}}
        # 5. 大肚/丰腹/鼓腹/变胖
        if any(w in m for w in ["大肚", "怀胎", "肚子鼓", "鼓出来", "大肚子", "丰肩", "饱满圆润", "拉大瓶腹", "抱瓮", "粗一点", "胖一点", "肚子大", "肚子粗"]):
            return {"type": "update_shape", "payload": {"bellyScale": 1.42}}
        # 6. 收腰/细腰/肚子小
        if any(w in m for w in ["收腰", "细腰", "肚子收小", "收小瓶腹", "肚子小", "收紧腰", "腰身细"]):
            return {"type": "update_shape", "payload": {"bellyScale": 0.72}}
        # 7. 撇口/大口/敞口/喇叭口
        if any(w in m for w in ["喇叭", "敞口", "撇口", "大口", "口径做大", "翻开", "口大一点", "外翻"]):
            return {"type": "update_shape", "payload": {"rimScale": 1.45}}
        # 8. 敛口/小口/紧口
        if any(w in m for w in ["敛口", "收紧口", "小口", "口做小", "细密小口", "细小口", "口小一点", "收小口"]):
            return {"type": "update_shape", "payload": {"rimScale": 0.65}}
        # 9. 复位还原类
        if any(w in m for w in ["复位", "重置", "还原", "重新拉", "恢复原样", "梅瓶原样", "初始", "从头拉"]):
            return {"type": "update_shape", "payload": {"reset": True, "preset": "meiping", "heightScale": 1.0, "rimScale": 1.0, "bellyScale": 1.0}}
        # 10. 更换预设
        if "玉壶春" in m:
            return {"type": "update_shape", "payload": {"preset": "yuhuchun", "heightScale": 1.0, "rimScale": 1.0, "bellyScale": 1.0}}
        if "碗" in m or "斗笠" in m:
            return {"type": "update_shape", "payload": {"preset": "bowl", "heightScale": 1.0, "rimScale": 1.0, "bellyScale": 1.0}}
        if "梅瓶" in m:
            return {"type": "update_shape", "payload": {"preset": "meiping", "heightScale": 1.0, "rimScale": 1.0, "bellyScale": 1.0}}
        if "圆柱" in m or "柱子" in m:
            return {"type": "update_shape", "payload": {"preset": "cylinder", "heightScale": 1.0, "rimScale": 1.0, "bellyScale": 1.0}}
        return {"type": "none", "payload": {}}

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

        # 核心保障：在用户提问末尾强力附加 JSON 约束，彻底避免 LLM 因少样本模仿前序纯文本而丢失 JSON 结构
        json_enforce = "\n【系统强制规范：请必须且只能以 ```json 开头输出包含 reply 与 action 的 JSON 代码块，严禁直接输出纯文本！】"
        user_prompt = f"{message}{context_str}{digital_human_constraint}{json_enforce}"

        # 核心保障：历史对话标准化清洗。若前序 assistant 内容为纯文本，将其封装为标准 JSON，使 LLM 的 in-context learning 始终维持在 JSON 轨道
        clean_history: List[Dict[str, str]] = []
        if history:
            for item in history:
                role = item.get("role", "user")
                content = item.get("content", "")
                if role in ("assistant", "ai") and not content.strip().startswith("{") and "```json" not in content:
                    content = f'```json\n{{"reply": "{content[:300]}", "action": {{"type": "none"}}}}\n```'
                clean_history.append({"role": role, "content": content})

        raw_resp = await self.chat(user_prompt, history=clean_history, temperature=0.7)
        parsed = self.extract_json(raw_resp)

        if parsed and "reply" in parsed:
            # 校验 action，若大模型偶发遗漏 action 则无缝由语义后备引擎补全
            act = parsed.get("action", {})
            if not act or act.get("type") == "none":
                fb = self._fallback_intent(message)
                if fb.get("type") != "none":
                    parsed["action"] = fb
            return parsed

        # Fallback if raw text returned (e.g. LLM dropped JSON wrapper in multi-turn conversation)
        return {
            "reply": raw_resp,
            "action": self._fallback_intent(message)
        }
