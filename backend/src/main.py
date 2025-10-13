import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from src.database import engine
from src.models import ModeloBase

from src.encuestas.router import router as encuestas_router
from src.pregunta.router import router as pregunta_router
from src.seccion.router import router as seccion_router

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

ENV = os.getenv("ENV")
ROOT_PATH = os.getenv(f"ROOT_PATH_{ENV.upper()}")

@asynccontextmanager
async def db_creation_lifespan(app: FastAPI):
    ModeloBase.metadata.create_all(bind=engine)
    yield


#app = FastAPI(root_path=ROOT_PATH, lifespan=db_creation_lifespan)
app = FastAPI(lifespan=db_creation_lifespan)  # Sin root_path
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas

app.include_router(encuestas_router)
app.include_router(pregunta_router)
app.include_router(seccion_router)

