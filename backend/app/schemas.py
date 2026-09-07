from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class Perfil(str, Enum):
    administrador = 'administrador'
    comissao_tecnica = 'comissao_tecnica'


class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    perfil: Perfil = Perfil.comissao_tecnica
    clube: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=6)


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    perfil: Optional[Perfil] = None
    clube: Optional[str] = None
    ativo: Optional[bool] = None
    senha: Optional[str] = Field(None, min_length=6)


class UsuarioResponse(UsuarioBase):
    id: str
    ativo: bool
    criado_em: datetime
    clube_escudo_url: Optional[str] = None

    model_config = {'from_attributes': True}


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    usuario: UsuarioResponse
