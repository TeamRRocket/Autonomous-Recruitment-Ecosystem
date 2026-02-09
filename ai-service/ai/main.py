from fastapi import FastAPI

from .api.resume_routes import router as resume_router


def create_app() -> FastAPI:
    app = FastAPI(title="HireFlow AI - Resume Intelligence Module")
    app.include_router(resume_router, prefix="/ai/resume", tags=["resume"])
    return app
