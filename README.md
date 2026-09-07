# ⚽ Intelligent Futsal Scout — Categorias de Iniciação (FPFS)

Sistema inteligente de scout e análise estatística para o **Campeonato Paulista de Futsal**, focado inicialmente nas **Categorias de Iniciação** (Sub-7, Sub-8, Sub-9 e Sub-10), com arquitetura modular preparada para expansão a outras categorias e integração com o portal oficial da Federação Paulista de Futsal (FPFS).

---

## 🚀 Como Executar em Desenvolvimento (Windows)

### Opção 1: Execução em 1 Clique (Recomendado)
Dê um duplo clique no arquivo:
```cmd
start_dev.bat
```
Ele abrirá automaticamente duas janelas:
1. **Backend FastAPI:** `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
2. **Frontend React:** `http://localhost:5173`

---

### Opção 2: Execução Manual

#### 1. Iniciar o Backend:
```bash
cd backend
py -3.12 -m uvicorn app.main:app --reload --port 8000
```

#### 2. Iniciar o Frontend:
```bash
cd frontend
npm run dev
```

Acesse no navegador: **`http://localhost:5173`**

---

## 🔐 Credenciais de Acesso Inicial

Na primeira execução, o usuário Administrador é criado automaticamente:

- **E-mail:** `julio@futsalscout.com`
- **Senha inicial:** `Admin@123`
- **Perfil:** `Administrador`

> 💡 *Você pode alterar a senha e cadastrar novos usuários da comissão técnica acessando o menu **"Gestão de Usuários"**.*

---

## 👥 Perfis de Acesso

| Perfil | Permissões |
|---|---|
| **Administrador** | Acesso total: Criar, editar, desativar e excluir usuários; acesso a todos os relatórios e scouts. |
| **Comissão Técnica** | Visualização e registro de scouts das partidas de Iniciação; consulta de tabelas e estatísticas. |

---

## 🐳 Deploy em Produção (Docker & Nuvem)

A aplicação conta com suporte nativo a Docker e Docker Compose:

```bash
# Iniciar banco PostgreSQL, Backend e Frontend em contêineres:
docker compose up -d --build
```

- Compatível com **Railway**, **Render**, **DigitalOcean**, **AWS** ou qualquer VPS Linux/Windows.

---

## 🗺️ Roadmap de Módulos

- [x] **Fase 1:** Autenticação JWT, perfis de acesso, layout base e gestão de usuários.
- [ ] **Fase 2:** Crawler/coletor automatizado para download de tabelas, jogos e súmulas do site da FPFS.
- [ ] **Fase 3:** Interface de scout em tempo real durante os jogos (finalizações, desarmes, defesas, faltas).
- [ ] **Fase 4:** Relatórios estatísticos por atleta, categoria (Sub-7 ao Sub-10) e equipe adversária.
- [ ] **Fase 5:** Expansão para categorias de Base e Principal.

---

## 📞 Contato & Suporte

**Intelligent Futsal Scout** | Desenvolvido por **JÚLIO MARTINS**
- 📱 **WhatsApp:** [(19) 99203-5026](https://wa.me/5519992035026)
- 📸 **Instagram:** [@juliocm.77](https://instagram.com/juliocm.77)
