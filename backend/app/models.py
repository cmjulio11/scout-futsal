import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.dialects.sqlite import TEXT
from .database import Base
import enum


class Perfil(str, enum.Enum):
    administrador = 'administrador'
    comissao_tecnica = 'comissao_tecnica'


class Usuario(Base):
    __tablename__ = 'usuarios'

    id = Column(TEXT, primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(120), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    senha_hash = Column(String(200), nullable=False)
    perfil = Column(SAEnum(Perfil), nullable=False, default=Perfil.comissao_tecnica)
    clube = Column(String(120), nullable=True)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
