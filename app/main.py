from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, invites, profile

app = FastAPI(title="MSEF")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(invites.router)
app.include_router(profile.router)

@app.get("/ping")
def ping():
    return {"message": "pong"}
