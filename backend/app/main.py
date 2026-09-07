from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from .database import engine, get_db, Base
from . import models, schemas
from .auth import hash_senha, verificar_senha, criar_token, get_usuario_atual
from .routers import users, campeonatos, scout

load_dotenv()

# Cria tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title='Intelligent Futsal Scout API',
    description='API para o sistema de scout do Campeonato Paulista de Futsal - Iniciacao',
    version='1.0.0',
)

# CORS - permite frontend React local e em produção
allowed_origins_env = os.getenv('ALLOWED_ORIGINS', '')
if allowed_origins_env:
    origins = [o.strip() for o in allowed_origins_env.split(',') if o.strip()]
else:
    origins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r'https?://.*',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Registra routers
app.include_router(users.router)
app.include_router(campeonatos.router)
app.include_router(scout.router)


@app.on_event('startup')
def criar_admin_inicial():
    from .database import SessionLocal, engine
    # Garantir coluna clube no SQLite caso nao exista
    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN clube VARCHAR(120)"))
            conn.commit()
    except Exception:
        pass

    db = SessionLocal()
    try:
        admin_email = os.getenv('ADMIN_EMAIL', 'cm.julio@gmail.com')
        admin_password = os.getenv('ADMIN_PASSWORD', 'Pickup@98')
        admin_nome = os.getenv('ADMIN_NOME', 'Administrador')

        existe = db.query(models.Usuario).filter(models.Usuario.email == admin_email).first()
        if not existe:
            admin = models.Usuario(
                nome=admin_nome,
                email=admin_email,
                senha_hash=hash_senha(admin_password),
                perfil=models.Perfil.administrador,
                ativo=True,
            )
            db.add(admin)
            db.commit()
            print(f'[INIT] Administrador criado: {admin_email}')
        else:
            existe.senha_hash = hash_senha(admin_password)
            existe.perfil = models.Perfil.administrador
            existe.ativo = True
            db.commit()
            print(f'[INIT] Administrador atualizado e ativo: {admin_email}')
    finally:
        db.close()


@app.on_event('startup')
async def iniciar_cron_background():
    import asyncio
    from .services.sync_manager import sync_manager
    asyncio.create_task(sync_manager.iniciar_loop_cron(2026))


@app.post('/api/auth/login', response_model=schemas.TokenResponse)
def login(dados: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == dados.email).first()
    if not usuario or not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Email ou senha incorretos'
        )
    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Acesso temporariamente bloqueado. Entre em contato com a administração para regularizar a assinatura/mensalidade.'
        )
    token = criar_token({'sub': usuario.id})
    from .services import scraper_fpfs
    escudo = scraper_fpfs.resolver_escudo_local(usuario.clube) if usuario.clube else None
    
    usuario_resp = schemas.UsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        perfil=usuario.perfil,
        clube=usuario.clube,
        ativo=usuario.ativo,
        criado_em=usuario.criado_em,
        clube_escudo_url=escudo,
    )
    return schemas.TokenResponse(
        access_token=token,
        usuario=usuario_resp
    )


@app.get('/api/health')
def health_check():
    return {'status': 'ok', 'servico': 'Intelligent Futsal Scout API'}


# Servir Frontend SPA Compilado (quando disponível em produção)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve escudos
    public_escudos = os.path.join(frontend_dist, "escudos")
    if not os.path.exists(public_escudos):
        public_escudos = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "escudos"))
    if os.path.exists(public_escudos):
        app.mount("/escudos", StaticFiles(directory=public_escudos), name="escudos")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api" or full_path == "docs" or full_path == "openapi.json":
            raise HTTPException(status_code=404, detail="Endpoint não encontrado")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"mensagem": "Intelligent Futsal Scout API - v1.0.0"}
else:
    @app.get('/')
    def root():
        return {'mensagem': 'Intelligent Futsal Scout API - v1.0.0'}

