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
