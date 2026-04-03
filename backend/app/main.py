from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, import_csv, portfolios, positions, strategies

app = FastAPI(title="Options Strategy Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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
