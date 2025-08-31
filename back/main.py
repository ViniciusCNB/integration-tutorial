from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Vendas(BaseModel):
    produto: str
    vendas: int


def get_db_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    return conn


@app.get("/vendas", response_model=list[Vendas])
def get_vendas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            "SELECT produto, vendas FROM vendas_produto ORDER BY vendas DESC"
        )

        vendas = cursor.fetchall()

        cursor.close()
        conn.close()

        return vendas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
