# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from server.config import (
    SERVER_HOST,
    SERVER_PORT,
    XMOV_APP_ID,
    XMOV_APP_SECRET,
    XMOV_GATEWAY,
    XMOV_AVATAR_LOOK,
)
from server.swarm import swarm_instance

app = FastAPI(
    title="景德镇御窑 AI 多智能体协作系统 (Huawei openJiuwen & DeepSeek)",
    version="1.0.0",
    description="基于华为 openJiuwen 智能体协作框架与 DeepSeek V4 Flash 大模型打造的非遗陶艺全链路赋能中枢",
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================================
# Request / Response Schemas
# =========================================================================

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    context: Optional[Dict[str, Any]] = None


class FormInferRequest(BaseModel):
    prompt: str
    current_params: Optional[Dict[str, Any]] = None


class TrimDiagnoseRequest(BaseModel):
    geometry_data: Optional[Dict[str, Any]] = None


class PatternSvgRequest(BaseModel):
    theme: str
    motif_type: Optional[str] = None


class GlazeSynthesizeRequest(BaseModel):
    glaze_name: str
    target_optical: Optional[Dict[str, Any]] = None


class FireSimulateRequest(BaseModel):
    temperature: int = 1300
    atmosphere_mode: str = "reduction"
    glaze_type: str = "jade"


class AppraiseRequest(BaseModel):
    piece_info: Optional[Dict[str, Any]] = None


# =========================================================================
# API Endpoints
# =========================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint and Swarm agent registry info."""
    return {
        "status": "ok",
        "framework": "Huawei openJiuwen",
        "model": "DeepSeek V4 Flash (Intl)",
        "swarm": swarm_instance.get_swarm_info(),
    }


@app.get("/api/avatar/config")
@app.post("/api/avatar/config")
async def get_avatar_config():
    """获取 XMOV 数字人配置参数"""
    return {
        "code": 0,
        "data": {
            "appId": XMOV_APP_ID,
            "appSecret": XMOV_APP_SECRET,
            "gatewayServer": XMOV_GATEWAY,
            "avatarLook": XMOV_AVATAR_LOOK,
        }
    }


@app.post("/api/chat")
async def chat_with_mentor(req: ChatRequest):
    """御窑非遗导师对话与口语控瓷"""
    try:
        res = await swarm_instance.chat(
            message=req.message,
            history=req.history,
            context=req.context,
        )
        return {"code": 0, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/forming/infer")
async def infer_forming_shape(req: FormInferRequest):
    """AI 器型参数推演 (DeepSeek 拟合)"""
    try:
        res = await swarm_instance.infer_shape(
            prompt=req.prompt,
            current_params=req.current_params,
        )
        return {"code": 0, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/trim/diagnose")
async def diagnose_trimming(req: TrimDiagnoseRequest):
    """AI 胎骨诊断与刀法规划 (DeepSeek 算法)"""
    try:
        res = await swarm_instance.diagnose_trim(
            geometry_data=req.geometry_data,
        )
        return {"code": 0, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pattern/svg")
async def generate_pattern_svg(req: PatternSvgRequest):
    """AI SVG 矢量青花生成 (DeepSeek Code)"""
    try:
        res = await swarm_instance.generate_vector_motif(
            theme=req.theme,
            motif_type=req.motif_type,
        )
        return {"code": 0, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/glaze/synthesize")
async def synthesize_glaze_pbr(req: GlazeSynthesizeRequest):
    """AI 名贵罩釉 PBR 配方调制 (光学逆推)"""
    try:
        res = await swarm_instance.synthesize_glaze(
            glaze_name=req.glaze_name,
            target_optical=req.target_optical,
        )
        return {"code": 0, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/fire/simulate")
async def simulate_firing_atmosphere(req: FireSimulateRequest):
    """AI 松柴窑炉气氛演化推演"""
    try:
        res = await swarm_instance.simulate_firing(
            temperature=req.temperature,
            atmosphere_mode=req.atmosphere_mode,
            glaze_type=req.glaze_type,
        )
        return {"code": 0, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/finish/appraise")
async def appraise_porcelain(req: AppraiseRequest):
    """AI 古风赋诗题跋与艺术评级"""
    try:
        res = await swarm_instance.appraise_masterpiece(
            piece_info=req.piece_info,
        )
        return {"code": 0, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("server.main:app", host=SERVER_HOST, port=SERVER_PORT, reload=False)
