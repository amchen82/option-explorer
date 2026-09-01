import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, ideas, import_csv, portfolios, positions, strategies

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    force=True,  # uvicorn configures the root logger before this module ever runs
)

app = FastAPI(title="Options Strategy Tool")

# Capacitor serves the packaged app from these origins inside the native webview.
NATIVE_APP_ORIGINS = ["capacitor://localhost", "ionic://localhost", "http://localhost"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + NATIVE_APP_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(portfolios.router)
app.include_router(positions.router)
app.include_router(strategies.router)
app.include_router(import_csv.router)
app.include_router(ideas.router)
