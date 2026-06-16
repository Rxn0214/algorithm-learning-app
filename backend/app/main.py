import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from .database import init_db
from .config import CORS_ORIGINS
from .routes import auth, chat, forum, progress

# 计算前端 dist 目录的绝对路径
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
FRONTEND_DIST = os.path.join(PROJECT_DIR, "frontend", "dist")

app = FastAPI(title="算法与程序实现学习助手 API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# API 路由（在 static 文件之前注册，优先级更高）
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(forum.router)
app.include_router(progress.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


# 静态文件中间件（API 路由优先，非 API 请求返回前端页面）
if os.path.exists(FRONTEND_DIST):
    INDEX_HTML = os.path.join(FRONTEND_DIST, "index.html")

    @app.middleware("http")
    async def serve_frontend(request: Request, call_next):
        path = request.url.path

        # 尝试 API 路由
        if path.startswith("/api/"):
            return await call_next(request)

        # 尝试返回静态文件
        file_path = path.lstrip("/")
        if file_path:
            full_path = os.path.join(FRONTEND_DIST, file_path)
            if os.path.isfile(full_path):
                return FileResponse(full_path)

        # SPA 回退：所有非 API 非文件请求返回 index.html
        # 本地开发时使用 Vite 代理，不会走到这里
        return FileResponse(INDEX_HTML)


@app.on_event("startup")
async def startup():
    init_db()
