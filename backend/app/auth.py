from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from .database import get_db
from . import models

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-change-me')
ALGORITHM = os.getenv('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '480'))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/auth/login')


def verificar_senha(senha_plain: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha_plain.encode('utf-8'), senha_hash.encode('utf-8'))


def hash_senha(senha: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(senha.encode('utf-8'), salt).decode('utf-8')


def criar_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_usuario_atual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Credenciais invalidas ou token expirado',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get('sub')
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if usuario is None or not usuario.ativo:
        raise credentials_exception
    return usuario


def exigir_admin(usuario: models.Usuario = Depends(get_usuario_atual)) -> models.Usuario:
    if usuario.perfil != models.Perfil.administrador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Acesso restrito a administradores'
        )
    return usuario
