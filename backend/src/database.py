import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
# Importamos QueuePool para asegurar que se use el pool correcto compatible con estos parámetros
from sqlalchemy.pool import QueuePool 

load_dotenv()

# --- CAMBIO AQUÍ: Aumentar límites del Pool ---
engine = create_engine(
    os.getenv("DB_URL"), 
    connect_args={"check_same_thread": False},
    # Configuración para soportar alta concurrencia en tests de carga
    poolclass=QueuePool, # Forzamos el uso de QueuePool para que acepte pool_size
    pool_size=50,        # Número de conexiones permanentes (Antes 5)
    max_overflow=100,    # Conexiones extra temporales permitidas (Antes 10)
    pool_timeout=60      # Segundos a esperar por una conexión antes de dar error (Antes 30)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    # Para usar restricciones de FK en SQLite, debemos habilitar la siguiente opción:
    db.execute(text("PRAGMA foreign_keys = ON"))
    try:
        yield db
    finally:
        db.close()