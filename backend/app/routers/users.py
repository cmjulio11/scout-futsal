from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import hash_senha, get_usuario_atual, exigir_admin

from ..services import scraper_fpfs

router = APIRouter(prefix='/api/usuarios', tags=['usuarios'])


def formatar_usuario(u: models.Usuario) -> schemas.UsuarioResponse:
    escudo = scraper_fpfs.resolver_escudo_local(u.clube) if u.clube else None
    return schemas.UsuarioResponse(
        id=u.id,
        nome=u.nome,
        email=u.email,
        perfil=u.perfil,
        clube=u.clube,
        ativo=u.ativo,
        criado_em=u.criado_em,
        clube_escudo_url=escudo,
    )


@router.get('/', response_model=List[schemas.UsuarioResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(exigir_admin)
):
    usuarios = db.query(models.Usuario).order_by(models.Usuario.nome).all()
    return [formatar_usuario(u) for u in usuarios]


@router.post('/', response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
def criar_usuario(
    dados: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(exigir_admin)
):
    if db.query(models.Usuario).filter(models.Usuario.email == dados.email).first():
        raise HTTPException(status_code=400, detail='Email ja cadastrado')

    clube_limpo = dados.clube.strip() if dados.clube and dados.clube.strip() else None

    usuario = models.Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        perfil=dados.perfil,
        clube=clube_limpo,
        ativo=True,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return formatar_usuario(usuario)


@router.get('/me', response_model=schemas.UsuarioResponse)
def meu_perfil(usuario_atual: models.Usuario = Depends(get_usuario_atual)):
    return formatar_usuario(usuario_atual)


@router.put('/{usuario_id}', response_model=schemas.UsuarioResponse)
def atualizar_usuario(
    usuario_id: str,
    dados: schemas.UsuarioUpdate,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(exigir_admin)
):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail='Usuario nao encontrado')

    if dados.nome is not None:
        usuario.nome = dados.nome
    if dados.email is not None and dados.email != usuario.email:
        existente = db.query(models.Usuario).filter(models.Usuario.email == dados.email).first()
        if existente and existente.id != usuario_id:
            raise HTTPException(status_code=400, detail='Email ja cadastrado para outro usuario')
        usuario.email = dados.email
    if dados.perfil is not None:
        usuario.perfil = dados.perfil
    if dados.clube is not None:
        usuario.clube = dados.clube.strip() if dados.clube.strip() else None
    if dados.ativo is not None:
        usuario.ativo = dados.ativo
    if dados.senha is not None and dados.senha.strip():
        usuario.senha_hash = hash_senha(dados.senha.strip())

    db.commit()
    db.refresh(usuario)
    return formatar_usuario(usuario)


@router.delete('/{usuario_id}', status_code=status.HTTP_204_NO_CONTENT)
def deletar_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(exigir_admin)
):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail='Usuario nao encontrado')
    if usuario.id == admin.id:
        raise HTTPException(status_code=400, detail='Nao e possivel excluir seu proprio usuario')
    db.delete(usuario)
    db.commit()
