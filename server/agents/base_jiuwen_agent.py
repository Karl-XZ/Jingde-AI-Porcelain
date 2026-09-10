# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
import re
import json
from typing import Optional, Dict, Any, List

from openjiuwen.core.single_agent.schema.agent_card import AgentCard
from openjiuwen.core.foundation.llm import (
    init_model,
    UserMessage,
    SystemMessage,
    AssistantMessage,
)
from server.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL


class BaseJiuwenAgent:
    """Base class for Jingdezhen Imperial Kiln agents using Huawei openJiuwen."""

    def __init__(self, name: str, description: str, system_prompt: str):
        self.card = AgentCard(
            name=name,
            description=description,
        )
        self.system_prompt = system_prompt
        self.model = init_model(
            provider="DeepSeek",
            model_name=DEEPSEEK_MODEL,
            api_key=DEEPSEEK_API_KEY,
            api_base=DEEPSEEK_BASE_URL,
            temperature=0.7,
            timeout=60.0,
        )

    def extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract and parse JSON from LLM response text."""
        # 1. Try markdown code block extraction
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        raw_json = json_match.group(1) if json_match else text

        # 2. Try finding outer braces
        brace_match = re.search(r"(\{[\s\S]*\})", raw_json)
        candidate = brace_match.group(1) if brace_match else raw_json

        try:
            return json.loads(candidate)
        except Exception:
            # Fallback with minor cleanup
            try:
                cleaned = re.sub(r",\s*([\]}])", r"\1", candidate)
                return json.loads(cleaned)
            except Exception:
                return None

    async def chat(
        self,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """Standard chat with conversation history."""
        messages = [SystemMessage(content=self.system_prompt)]
        if history:
            for item in history:
                role = item.get("role", "user")
                content = item.get("content", "")
                if role == "user":
                    messages.append(UserMessage(content=content))
                elif role == "assistant" or role == "ai":
                    messages.append(AssistantMessage(content=content))
        messages.append(UserMessage(content=user_message))

        response = await self.model.invoke(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.content or ""
