from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, portfolios, positions

app = FastAPI(title="Options Strategy Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
