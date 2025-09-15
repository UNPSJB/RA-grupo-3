import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

engine = create_engine(os.getenv("DB_URL"), connect_args={"check_same_thread": False})
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
