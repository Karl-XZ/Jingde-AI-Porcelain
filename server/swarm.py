# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
"""Huawei openJiuwen Multi-Agent Swarm Orchestrator for Jingdezhen Porcelain Workshop"""
from typing import Dict, Any, Optional, List

from openjiuwen.core.multi_agent import TeamCard, TeamConfig
from server.config import OPENJIUWEN_SWARM_NAME
from server.agents import (
    MasterMentorAgent,
    FormParametricAgent,
    TrimmingAgent,
    VectorMotifAgent,
    GlazeAlchemyAgent,
    KilnPhysicsAgent,
    AppraisalAgent,
)


class ImperialKilnSwarm:
    """openJiuwen 景德镇御窑多智能体协作蜂群系统"""

    def __init__(self):
        # 1. Initialize openJiuwen TeamCard
        self.team_card = TeamCard(
            name=OPENJIUWEN_SWARM_NAME,
            description="景德镇御窑非遗数字化七十二道工序智能体协同系统",
        )
        self.team_config = TeamConfig()

        # 2. Register specialized agents
        self.mentor_agent = MasterMentorAgent()
        self.form_agent = FormParametricAgent()
        self.trim_agent = TrimmingAgent()
        self.motif_agent = VectorMotifAgent()
        self.glaze_agent = GlazeAlchemyAgent()
        self.fire_agent = KilnPhysicsAgent()
        self.appraisal_agent = AppraisalAgent()

        self.agents = {
            "mentor": self.mentor_agent,
            "form": self.form_agent,
            "trim": self.trim_agent,
            "motif": self.motif_agent,
            "glaze": self.glaze_agent,
            "fire": self.fire_agent,
            "appraisal": self.appraisal_agent,
        }

    def get_swarm_info(self) -> Dict[str, Any]:
        """Return swarm metadata and all participating agents' cards."""
        return {
            "swarm_name": self.team_card.name,
            "description": self.team_card.description,
            "agents": [
                {
                    "name": agent.card.name,
                    "description": agent.card.description,
                    "id": agent.card.id,
                }
                for agent in self.agents.values()
            ],
        }

    async def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Dispatch to Mentor Agent (Coordinator)."""
        return await self.mentor_agent.interact(message, history=history, current_context=context)

    async def infer_shape(self, prompt: str, current_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatch to Form Parametric Agent."""
        return await self.form_agent.infer(prompt, current_params=current_params)

    async def diagnose_trim(self, geometry_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatch to Trimming & Bone Health Agent."""
        return await self.trim_agent.diagnose(geometry_data=geometry_data)

    async def generate_vector_motif(self, theme: str, motif_type: Optional[str] = None) -> Dict[str, Any]:
        """Dispatch to Vector Motif (SVG) Agent."""
        return await self.motif_agent.generate_motif(theme, motif_type=motif_type)

    async def synthesize_glaze(self, glaze_name: str, target_optical: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatch to Glaze Alchemy (PBR Optics) Agent."""
        return await self.glaze_agent.synthesize(glaze_name, target_optical=target_optical)

    async def simulate_firing(
        self,
        temperature: int = 1300,
        atmosphere_mode: str = "reduction",
        glaze_type: str = "jade",
    ) -> Dict[str, Any]:
        """Dispatch to Kiln Physics Agent."""
        return await self.fire_agent.simulate(
            temperature=temperature,
            atmosphere_mode=atmosphere_mode,
            glaze_type=glaze_type,
        )

    async def appraise_masterpiece(self, piece_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatch to Appraisal & Poetry Agent."""
        return await self.appraisal_agent.appraise(piece_info=piece_info)


# Global singleton instance
swarm_instance = ImperialKilnSwarm()
