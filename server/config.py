# coding: utf-8
# Copyright (c) 2026 Jingdezhen AI Imperial Kiln Project
import os
from pathlib import Path

# Load .env file if present
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    with open(_env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# Huawei openJiuwen agent settings
OPENJIUWEN_SWARM_NAME = "JingdezhenImperialKilnSwarm"
SERVER_PORT = int(os.getenv("PORT", "8000"))
SERVER_HOST = "127.0.0.1"

# XMOV (魔珐星云) Digital Human settings
XMOV_APP_ID = os.getenv("XMOV_APP_ID", "9e366289805f4fd7ad9a6879bf64c698")
XMOV_APP_SECRET = os.getenv("XMOV_APP_SECRET", "fca83e091ace40d59acb2c812e469499")
XMOV_GATEWAY = os.getenv("XMOV_GATEWAY", "https://nebula-agent.xingyun3d.com/user/v1/ttsa/session")
XMOV_AVATAR_LOOK = os.getenv("XMOV_AVATAR_LOOK", "N_Wuliping_14333_new")
