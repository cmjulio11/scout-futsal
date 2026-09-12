from fastapi import APIRouter, Query, HTTPException, Depends, Response
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import urllib.parse
from ..services import scraper_fpfs
from ..services.sync_manager import sync_manager
from ..services.pdf_generator import gerar_pdf_atleta
from ..auth import get_usuario_atual, exigir_admin
from ..models import Usuario

router = APIRouter(prefix="/api/campeonatos", tags=["campeonatos"])

@router.get("/temporadas")
def listar_temporadas():
    """Retorna as temporadas disponíveis para consulta."""
    return [2026, 2025, 2024]

@router.get("/categorias")
def listar_categorias():
    """Retorna as categorias de Iniciação da Série A1."""
    return [
        {"id": "Sub-7", "nome": "Sub-7", "ano_base": "Iniciação (7 anos)"},
        {"id": "Sub-8", "nome": "Sub-8", "ano_base": "Iniciação (8 anos)"},
        {"id": "Sub-9", "nome": "Sub-9", "ano_base": "Iniciação (9 anos)"},
        {"id": "Sub-10", "nome": "Sub-10", "ano_base": "Iniciação (10 anos)"},
    ]

@router.get("/tabela")
def obter_tabela_classificacao(
    temporada: int = Query(2026, description="Ano da temporada"),
    categoria: str = Query("Sub-7", description="Categoria: Sub-7, Sub-8, Sub-9, Sub-10")
):
    """Retorna a tabela de classificação de uma categoria com escudos e critérios oficiais."""
    dados = scraper_fpfs.obter_dados_completos(temporada)
    classificacao = dados.get("classificacao", {}).get(categoria, [])
    return {
        "temporada": temporada,
        "categoria": categoria,
        "atualizado_em": dados.get("atualizado_em"),
        "total_equipes": len(classificacao),
        "classificacao": classificacao,
    }

@router.get("/ranking-eficiencia")
def obter_ranking_eficiencia(
    temporada: int = Query(2026, description="Ano da temporada")
):
    """
    Retorna o Ranking de Eficiência Oficial (Torneio União de Clubes),
    agregando os pontos de todas as 4 categorias de Iniciação com Índice Técnico oficial.
    """
    dados = scraper_fpfs.obter_dados_completos(temporada)
    ranking = dados.get("ranking_eficiencia", [])
    return {
        "temporada": temporada,
        "titulo": "Campeonato Paulista - Torneio União de Clubes (Série A1)",
        "atualizado_em": dados.get("atualizado_em"),
        "total_clubes": len(ranking),
        "ranking": ranking,
    }

@router.get("/jogos")
def obter_jogos(
    temporada: int = Query(2026, description="Ano da temporada"),
    categoria: str = Query("Sub-7", description="Categoria: Sub-7, Sub-8, Sub-9, Sub-10")
):
    """Retorna os jogos, resultados e links de súmulas oficiais em PDF."""
    dados = scraper_fpfs.obter_dados_completos(temporada)
    jogos = dados.get("jogos", {}).get(categoria, [])
    return {
        "temporada": temporada,
        "categoria": categoria,
        "atualizado_em": dados.get("atualizado_em"),
        "total_jogos": len(jogos),
        "jogos": jogos,
    }

@router.get("/confrontos")
def obter_confrontos_unificados(
    temporada: int = Query(2026, description="Ano da temporada")
):
    """
    Retorna os confrontos consolidados agrupando as 4 categorias (Sub-7, Sub-8, Sub-9 e Sub-10)
    num único bloco por festival entre os mesmos dois clubes.
    """
    dados = scraper_fpfs.obter_dados_completos(temporada)
    jogos_todos = dados.get("jogos", {})
    
    confrontos_dict = {}
    
    for cat in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]:
        for j in jogos_todos.get(cat, []):
            m = j.get("mandante", "").strip().upper()
            v = j.get("visitante", "").strip().upper()
            data = j.get("data", "").strip()
            key = f"{m}___{v}___{data}"
            
            if key not in confrontos_dict:
                confrontos_dict[key] = {
                    "id": key,
                    "data": data,
                    "dia": j.get("dia"),
                    "mes": j.get("mes"),
                    "mandante": j.get("mandante"),
                    "mandante_completo": j.get("mandante_completo"),
                    "escudo_mandante": j.get("escudo_mandante"),
                    "visitante": j.get("visitante"),
                    "visitante_completo": j.get("visitante_completo"),
                    "escudo_visitante": j.get("escudo_visitante"),
                    "ginasio": j.get("ginasio"),
                    "rodada": j.get("rodada"),
                    "rodada_num": j.get("rodada_num", 1),
                    "status_geral": "agendado",
                    "categorias": {}
                }
                
            confrontos_dict[key]["categorias"][cat] = {
                "categoria": cat,
                "hora": j.get("hora"),
                "placar_mandante": j.get("placar_mandante"),
                "placar_visitante": j.get("placar_visitante"),
                "status": j.get("status"),
                "sumula_url": j.get("sumula_url")
            }
            
    lista_confrontos = list(confrontos_dict.values())
    now = datetime.now()
    hoje_str = f"{now.day:02d}/{now.month:02d}"
    
    for c in lista_confrontos:
        tem_aovivo = any(cat.get("status") in ["Em Andamento", "Ao Vivo", "Andamento"] for cat in c["categorias"].values())
        todos_encerrados = len(c["categorias"]) > 0 and all(
            cat.get("status") == "Encerrado" or (cat.get("placar_mandante") is not None and cat.get("placar_visitante") is not None)
            for cat in c["categorias"].values()
        )
        is_hoje = (
            c["data"].startswith(hoje_str)
            or c["data"].startswith("12/09")
            or (c.get("dia") == "12" and c.get("mes") == "SET")
            or (c.get("dia") == f"{now.day:02d}")
        )
        
        if tem_aovivo:
            c["status_geral"] = "aovivo"
        elif todos_encerrados:
            c["status_geral"] = "encerrado"
        else:
            c["status_geral"] = "agendado"
            
    lista_confrontos.sort(key=lambda x: (0 if x["status_geral"] == "aovivo" else 1, x.get("rodada_num", 999)))
    
    return {
        "temporada": temporada,
        "atualizado_em": dados.get("atualizado_em"),
        "total_confrontos": len(lista_confrontos),
        "confrontos": lista_confrontos
    }

class AtualizarPlacarRequest(BaseModel):
    temporada: int = 2026
    categoria: str = "Sub-7"
    mandante: str
    visitante: str
    data: Optional[str] = None
    hora: Optional[str] = None
    placar_mandante: Optional[int] = None
    placar_visitante: Optional[int] = None
    status: str = "Em Andamento"  # "Em Andamento", "Encerrado", "Agendado"

@router.post("/jogos/atualizar-placar")
def atualizar_placar_jogo(req: AtualizarPlacarRequest):
    """Permite atualizar o placar ao vivo e status de uma partida."""
    dados = scraper_fpfs.obter_dados_completos(req.temporada)
    jogos = dados.get("jogos", {}).get(req.categoria, [])
    
    jogo_encontrado = None
    for j in jogos:
        m_match = req.mandante.lower() in j.get("mandante", "").lower() or j.get("mandante", "").lower() in req.mandante.lower()
        v_match = req.visitante.lower() in j.get("visitante", "").lower() or j.get("visitante", "").lower() in req.visitante.lower()
        if m_match and v_match:
            if req.data and j.get("data") and req.data not in j.get("data"):
                continue
            jogo_encontrado = j
            break
            
    if not jogo_encontrado:
        raise HTTPException(status_code=404, detail="Partida não encontrada.")
        
    jogo_encontrado["placar_mandante"] = req.placar_mandante
    jogo_encontrado["placar_visitante"] = req.placar_visitante
    jogo_encontrado["status"] = req.status
    dados["atualizado_em"] = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    
    scraper_fpfs.salvar_dados_locais(req.temporada, dados)
    return {
        "status": "ok",
        "mensagem": "Placar ao vivo atualizado com sucesso!",
        "jogo": jogo_encontrado
    }

@router.get("/artilharia")
def obter_artilharia(
    temporada: int = Query(2026, description="Ano da temporada"),
    categoria: str = Query("Sub-7", description="Categoria: Sub-7, Sub-8, Sub-9, Sub-10")
):
    """Retorna o ranking oficial de artilharia da categoria com foto dos atletas e escudos."""
    dados_completos = scraper_fpfs.obter_dados_completos(temporada)
    dados = dados_completos.get("artilharia", {}).get(categoria, [])
    if not dados:
        dados = scraper_fpfs.get_artilharia_categoria(temporada, categoria)
    return {
        "temporada": temporada,
        "categoria": categoria,
        "total_atletas": len(dados),
        "artilharia": dados,
    }

@router.get("/atleta")
def obter_ficha_atleta_endpoint(
    temporada: int = Query(2026, description="Ano da temporada"),
    categoria: str = Query("Sub-7", description="Categoria do atleta"),
    id_jogador: Optional[int] = Query(None, description="ID oficial do atleta na FPFS"),
    id_fase: Optional[int] = Query(None, description="ID da fase na FPFS"),
    nome: Optional[str] = Query(None, description="Nome do atleta para busca")
):
    """
    Retorna a Ficha Técnica Completa do Atleta com métricas avançadas,
    fator casa x fora, maiores vítimas e histórico detalhado jogo a jogo.
    """
    ano = temporada if isinstance(temporada, int) else 2026
    cat = categoria if isinstance(categoria, str) and not str(categoria).startswith("Query(") else "Sub-7"
    id_jog = id_jogador if isinstance(id_jogador, int) else None
    id_f = id_fase if isinstance(id_fase, int) else None
    nome_str = nome if isinstance(nome, str) and not str(nome).startswith("Query(") else None
    
    ficha = scraper_fpfs.obter_ficha_atleta(
        temporada=ano,
        categoria=cat,
        id_jogador=id_jog,
        id_fase=id_f,
        nome_atleta=nome_str
    )
    
    if not ficha:
        raise HTTPException(
            status_code=404,
            detail="Ficha técnica do atleta não encontrada para os parâmetros informados."
        )
        
    return ficha

@router.get("/atleta/pdf")
def baixar_ficha_atleta_pdf(
    temporada: int = Query(2026, description="Ano da temporada"),
    categoria: str = Query("Sub-7", description="Categoria do atleta"),
    id_jogador: Optional[int] = Query(None, description="ID oficial do atleta na FPFS"),
    id_fase: Optional[int] = Query(None, description="ID da fase na FPFS"),
    nome: Optional[str] = Query(None, description="Nome do atleta para busca")
):
    """
    Gera e retorna o documento oficial em PDF da Ficha Técnica Individual do Atleta diretamente pelo servidor.
    """
    ano = temporada if isinstance(temporada, int) else 2026
    cat = categoria if isinstance(categoria, str) and not str(categoria).startswith("Query(") else "Sub-7"
    id_jog = id_jogador if isinstance(id_jogador, int) else None
    id_f = id_fase if isinstance(id_fase, int) else None
    nome_str = nome if isinstance(nome, str) and not str(nome).startswith("Query(") else None
    
    ficha = scraper_fpfs.obter_ficha_atleta(
        temporada=ano,
        categoria=cat,
        id_jogador=id_jog,
        id_fase=id_f,
        nome_atleta=nome_str
    )
    
    if not ficha:
        raise HTTPException(
            status_code=404,
            detail="Ficha técnica do atleta não encontrada para os parâmetros informados."
        )
        
    try:
        pdf_bytes = gerar_pdf_atleta(ficha)
        import unicodedata
        nome_atleta = ficha.get("atleta", {}).get("nome", "Atleta").replace(" ", "_")
        clube = ficha.get("atleta", {}).get("clube", "Clube").replace(" ", "_")
        filename_raw = f"Ficha_Tecnica_{nome_atleta}_{clube}_{cat}_{ano}.pdf"
        safe_ascii_filename = unicodedata.normalize('NFKD', filename_raw).encode('ASCII', 'ignore').decode('ASCII')
        encoded_filename = urllib.parse.quote(filename_raw)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=\"{safe_ascii_filename}\"; filename*=UTF-8''{encoded_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition",
            }
        )
    except Exception as e:
        print(f"[PDF_ERROR] Falha ao gerar PDF do atleta: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar documento PDF: {str(e)}")

@router.get("/dashboard-resumo")
def obter_dashboard_resumo(
    temporada: int = Query(2026, description="Ano da temporada"),
    clube: Optional[str] = Query(None, description="Nome do clube para personalizar o dashboard")
):
    """
    Retorna o payload consolidado para o Dashboard inicial:
    KPIs globais, líderes das categorias, destaques de artilharia,
    resumo do Torneio União (G-4) e próximos confrontos da rodada,
    além de personalização 'Veste a Camisa' para o clube do usuário.
    """
    ano = temporada if isinstance(temporada, int) else 2026
    dados = scraper_fpfs.obter_dados_completos(ano)
    
    ranking = dados.get("ranking_eficiencia", [])
    classificacao = dados.get("classificacao", {})
    artilharia = dados.get("artilharia", {})
    jogos = dados.get("jogos", {})
    
    # 1. KPIs Globais
    total_clubes = len(ranking)
    total_atletas = sum(len(atletas) for atletas in artilharia.values())
    total_partidas = sum(len(jogs) for jogs in jogos.values())
    total_sumulas = sum(1 for jogs in jogos.values() for j in jogs if j.get("sumula_url"))
    
    # 2. Torneio União (Líder, G-4 e Zona de Rebaixamento)
    g4 = ranking[:4] if len(ranking) >= 4 else ranking
    zona_rebaixamento = ranking[21:] if len(ranking) >= 22 else []
    lider_geral = ranking[0] if ranking else None
    
    # 3. Categorias Resumo (Sub-7 a Sub-10)
    categorias_resumo = []
    for cat in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]:
        cat_classif = classificacao.get(cat, [])
        lider_cat = cat_classif[0] if cat_classif else None
        
        cat_artilharia = artilharia.get(cat, [])
        artilheiro_cat = cat_artilharia[0] if cat_artilharia else None
        
        cat_jogos = jogos.get(cat, [])
        
        categorias_resumo.append({
            "categoria": cat,
            "total_clubes": len(cat_classif),
            "total_jogos": len(cat_jogos),
            "lider": {
                "clube": lider_cat.get("clube") if lider_cat else "A Definir",
                "escudo_url": lider_cat.get("escudo_url", "/fpfs_shield.png") if lider_cat else "/fpfs_shield.png",
                "pontos": lider_cat.get("pontos", 0) if lider_cat else 0,
                "jogos": lider_cat.get("jogos", 0) if lider_cat else 0,
                "vitorias": lider_cat.get("vitorias", 0) if lider_cat else 0,
                "saldo_gols": lider_cat.get("saldo_gols", 0) if lider_cat else 0,
            } if lider_cat else None,
            "artilheiro": {
                "nome": artilheiro_cat.get("nome") if artilheiro_cat else "A Definir",
                "foto_url": artilheiro_cat.get("foto_url") if artilheiro_cat else None,
                "clube": artilheiro_cat.get("clube") if artilheiro_cat else "",
                "escudo_url": artilheiro_cat.get("escudo_url") if artilheiro_cat else "/fpfs_shield.png",
                "gols": artilheiro_cat.get("gols", 0) if artilheiro_cat else 0,
                "id_jogador": artilheiro_cat.get("id_jogador") if artilheiro_cat else None,
                "id_fase": artilheiro_cat.get("id_fase") if artilheiro_cat else None,
            } if artilheiro_cat else None,
        })
        
    # 4. Top Artilheiros Gerais da Iniciação (unificados)
    todos_artilheiros = []
    for cat, lista in artilharia.items():
        for art in lista:
            item_art = dict(art)
            item_art["categoria"] = cat
            todos_artilheiros.append(item_art)
    
    top_artilheiros_geral = sorted(todos_artilheiros, key=lambda x: x.get("gols", 0), reverse=True)[:4]
    
    # 5. Próximos Jogos / Rodada em Destaque
    jogos_sub7 = jogos.get("Sub-7", [])
    confrontos_unicos = []
    vistos = set()
    for j in jogos_sub7:
        chave = (j.get("data"), j.get("mandante"), j.get("visitante"))
        if chave in vistos:
            continue
        vistos.add(chave)
        confrontos_unicos.append({
            "data": j.get("data", ""),
            "dia": j.get("dia", ""),
            "mes": j.get("mes", ""),
            "hora": j.get("hora", ""),
            "rodada": scraper_fpfs.formatar_rodada(j.get("rodada", "")),
            "ginasio": j.get("ginasio", ""),
            "mandante": j.get("mandante", ""),
            "escudo_mandante": j.get("escudo_mandante", "/fpfs_shield.png"),
            "placar_mandante": j.get("placar_mandante"),
            "visitante": j.get("visitante", ""),
            "escudo_visitante": j.get("escudo_visitante", "/fpfs_shield.png"),
            "placar_visitante": j.get("placar_visitante"),
            "status": j.get("status", "Agendado"),
            "sumula_url": j.get("sumula_url"),
        })
    
    jogos_destaque = confrontos_unicos[-6:] if len(confrontos_unicos) >= 6 else confrontos_unicos
    
    # 6. Personalização "Veste a Camisa" (Meu Clube)
    meu_clube_dados = None
    if clube and str(clube).strip():
        clube_alvo = str(clube).strip().lower()
        clube_item = next(
            (c for c in ranking if c["clube"].lower() == clube_alvo or clube_alvo in c["clube"].lower()),
            None
        )
        if clube_item:
            lider = ranking[0] if ranking else None
            rebaixamento = ranking[21] if len(ranking) >= 22 else None
            diferenca_lider = max(0, lider["pontos_total"] - clube_item["pontos_total"]) if lider else 0
            margem_rebaixamento = (clube_item["pontos_total"] - rebaixamento["pontos_total"]) if rebaixamento else 0
            
            # Próximo jogo agendado do meu clube
            nome_oficial = clube_item["clube"]
            proximo_jogo = None
            for cat in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]:
                cat_jogos = jogos.get(cat, [])
                for j in cat_jogos:
                    m = j.get("mandante", "")
                    v = j.get("visitante", "")
                    if nome_oficial.lower() in m.lower() or nome_oficial.lower() in v.lower():
                        if j.get("status") != "Encerrado":
                            is_mandante = nome_oficial.lower() in m.lower()
                            adv_raw = v if is_mandante else m
                            adv_nome = scraper_fpfs._desfazer_mojibake(adv_raw)
                            adv_escudo = j.get("escudo_visitante") if is_mandante else j.get("escudo_mandante")
                            adv_item = next(
                                (c for c in ranking if c["clube"].lower() in adv_nome.lower() or adv_nome.lower() in c["clube"].lower()),
                                None
                            )
                            proximo_jogo = {
                                "data": j.get("data", ""),
                                "dia": j.get("dia", ""),
                                "mes": j.get("mes", ""),
                                "hora": j.get("hora", ""),
                                "rodada": scraper_fpfs.formatar_rodada(j.get("rodada", "")),
                                "ginasio": scraper_fpfs._desfazer_mojibake(j.get("ginasio", "")),
                                "mando": "Casa" if is_mandante else "Fora",
                                "adversario": adv_nome,
                                "adversario_escudo": adv_escudo or "/fpfs_shield.png",
                                "adversario_posicao": adv_item.get("posicao") if adv_item else None,
                                "adversario_chave": adv_item.get("chave") if adv_item else "BRONZE",
                                "mandante": scraper_fpfs._desfazer_mojibake(m),
                                "visitante": scraper_fpfs._desfazer_mojibake(v),
                            }
                            break
                if proximo_jogo:
                    break

            # Se todos já foram encerrados, resgatar o mais recente
            if not proximo_jogo:
                for cat in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]:
                    cat_jogos = jogos.get(cat, [])
                    for j in reversed(cat_jogos):
                        m = j.get("mandante", "")
                        v = j.get("visitante", "")
                        if nome_oficial.lower() in m.lower() or nome_oficial.lower() in v.lower():
                            is_mandante = nome_oficial.lower() in m.lower()
                            adv_nome = v if is_mandante else m
                            adv_escudo = j.get("escudo_visitante") if is_mandante else j.get("escudo_mandante")
                            adv_item = next(
                                (c for c in ranking if c["clube"].lower() in adv_nome.lower() or adv_nome.lower() in c["clube"].lower()),
                                None
                            )
                            proximo_jogo = {
                                "data": j.get("data", ""),
                                "dia": j.get("dia", ""),
                                "mes": j.get("mes", ""),
                                "hora": j.get("hora", ""),
                                "rodada": scraper_fpfs.formatar_rodada(j.get("rodada", "")),
                                "ginasio": j.get("ginasio", ""),
                                "mando": "Casa" if is_mandante else "Fora",
                                "adversario": adv_nome,
                                "adversario_escudo": adv_escudo or "/fpfs_shield.png",
                                "adversario_posicao": adv_item.get("posicao") if adv_item else None,
                                "adversario_chave": adv_item.get("chave") if adv_item else "BRONZE",
                                "mandante": m,
                                "visitante": v,
                            }
                            break
                    if proximo_jogo:
                        break

            # Principais ameaças do adversário
            principais_ameacas = []
            if proximo_jogo:
                adv_nome_clean = proximo_jogo["adversario"].lower()
                for cat, art_list in artilharia.items():
                    for a in art_list:
                        if a.get("clube", "").lower() in adv_nome_clean or adv_nome_clean in a.get("clube", "").lower():
                            principais_ameacas.append({
                                "nome": a.get("nome"),
                                "foto_url": a.get("foto_url"),
                                "gols": a.get("gols", 0),
                                "categoria": cat,
                                "id_jogador": a.get("id_jogador"),
                                "id_fase": a.get("id_fase"),
                            })
                principais_ameacas = sorted(principais_ameacas, key=lambda x: x["gols"], reverse=True)[:3]

            meu_clube_dados = {
                "clube": clube_item["clube"],
                "escudo_url": clube_item["escudo_url"],
                "posicao": clube_item["posicao"],
                "chave": clube_item["chave"],
                "indice_tecnico": clube_item["indice_tecnico"],
                "pontos_total": clube_item["pontos_total"],
                "jogos_total": clube_item["jogos_total"],
                "vitorias_total": clube_item["vitorias_total"],
                "empates_total": clube_item["empates_total"],
                "derrotas_total": clube_item["derrotas_total"],
                "saldo_gols_total": clube_item["saldo_gols_total"],
                "diferenca_lider": diferenca_lider,
                "margem_rebaixamento": margem_rebaixamento,
                "pontos_por_categoria": clube_item.get("pontos_por_categoria", {}),
                "proximo_jogo": proximo_jogo,
                "principais_ameacas": principais_ameacas,
            }

    return {
        "temporada": ano,
        "atualizado_em": dados.get("atualizado_em"),
        "kpis": {
            "total_clubes": total_clubes,
            "total_categorias": 4,
            "total_atletas": total_atletas,
            "total_partidas": total_partidas,
            "total_sumulas": total_sumulas,
        },
        "lider_geral": lider_geral,
        "g4_torneio_uniao": g4,
        "zona_rebaixamento": zona_rebaixamento,
        "categorias": categorias_resumo,
        "top_artilheiros_geral": top_artilheiros_geral,
        "jogos_destaque": jogos_destaque,
        "meu_clube": meu_clube_dados,
    }

@router.get("/sync-status")
def obter_status_sincronizacao(usuario: Usuario = Depends(get_usuario_atual)):
    """
    Retorna o status atual do robô de sincronização,
    horário do último sync e próxima execução agendada.
    """
    return sync_manager.obter_status()

@router.post("/sincronizar")
def sincronizar_com_federacao(
    temporada: int = Query(2026, description="Ano da temporada"),
    admin: Usuario = Depends(exigir_admin)
):
    """
    Dispara varredura controlada em tempo real com Trava Mutex anti-concorrência.
    Exclusivo para o Administrador (Júlio).
    """
    resultado = sync_manager.sincronizar_com_trava(
        temporada=temporada,
        disparado_por=f"admin_{admin.nome}"
    )
    if not resultado.get("sucesso") and not resultado.get("em_andamento"):
        raise HTTPException(
            status_code=500,
            detail=resultado.get("mensagem", "Falha ao sincronizar com a FPFS.")
        )
    return resultado


def _montar_estrutura_playoffs(ranking_lista: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Constrói as Chaves Ouro, Prata e Bronze a partir de uma lista ranqueada oficial (24 clubes).
    Cada chave possui 8 equipes e 4 confrontos de Quartas de Final:
      QF1: 1º x 8º  (ou 9º x 16º / 17º x 24º)
      QF2: 2º x 7º  (ou 10º x 15º / 18º x 23º)
      QF3: 3º x 6º  (ou 11º x 14º / 19º x 22º)
      QF4: 4º x 5º  (ou 12º x 13º / 20º x 21º)
    Cruzamentos das Semifinais:
      SF1: Vencedor QF1 x Vencedor QF4
      SF2: Vencedor QF2 x Vencedor QF3
    """
    def _montar_chave(times: List[Dict[str, Any]], nome: str, cor: str, offset: int = 0):
        if len(times) < 8:
            return {"nome": nome, "cor": cor, "quartas": [], "times": times}

        quartas = [
            {
                "id": f"{nome.lower()}_qf1",
                "titulo": "Quartas 1",
                "semifinal_id": "sf1",
                "time_mandante": times[0],
                "time_visitante": times[7],
                "vantagem": times[0].get("clube"),
            },
            {
                "id": f"{nome.lower()}_qf2",
                "titulo": "Quartas 2",
                "semifinal_id": "sf2",
                "time_mandante": times[1],
                "time_visitante": times[6],
                "vantagem": times[1].get("clube"),
            },
            {
                "id": f"{nome.lower()}_qf3",
                "titulo": "Quartas 3",
                "semifinal_id": "sf2",
                "time_mandante": times[2],
                "time_visitante": times[5],
                "vantagem": times[2].get("clube"),
            },
            {
                "id": f"{nome.lower()}_qf4",
                "titulo": "Quartas 4",
                "semifinal_id": "sf1",
                "time_mandante": times[3],
                "time_visitante": times[4],
                "vantagem": times[3].get("clube"),
            },
        ]
        return {
            "nome": nome,
            "cor": cor,
            "times": times,
            "quartas": quartas,
        }

    ouro = ranking_lista[:8] if len(ranking_lista) >= 8 else ranking_lista
    prata = ranking_lista[8:16] if len(ranking_lista) >= 16 else []
    bronze = ranking_lista[16:24] if len(ranking_lista) >= 24 else []

    return {
        "ouro": _montar_chave(ouro, "Ouro", "amber", 0),
        "prata": _montar_chave(prata, "Prata", "slate", 8),
        "bronze": _montar_chave(bronze, "Bronze", "orange", 16),
    }


@router.get("/playoffs")
def obter_playoffs_chaveamento(
    temporada: int = Query(2026, description="Ano da temporada")
):
    """
    Retorna o chaveamento completo das Chaves Ouro, Prata e Bronze
    para o Torneio União (Geral) e para as 4 categorias (Sub-7 a Sub-10),
    além dos confrontos da 23ª rodada (última da 1ª fase) para alimentação do simulador.
    """
    ano = temporada if isinstance(temporada, int) else 2026
    dados = scraper_fpfs.obter_dados_completos(ano)
    
    ranking_geral = dados.get("ranking_eficiencia", [])
    classificacao = dados.get("classificacao", {})
    jogos = dados.get("jogos", {})

    # Chaveamento Torneio União
    playoffs_uniao = _montar_estrutura_playoffs(ranking_geral)

    # Chaveamento por Categoria
    playoffs_categorias = {}
    for cat in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]:
        cat_lista = classificacao.get(cat, [])
        playoffs_categorias[cat] = {
            "ranking": cat_lista,
            "chaves": _montar_estrutura_playoffs(cat_lista),
        }

    # Confrontos da 23ª Rodada (Agregados para o Torneio União + detalhes por categoria)
    confrontos_map = {}
    
    for cat, lista in jogos.items():
        for j in lista:
            if "23" in str(j.get("rodada", "")) or j.get("rodada_num") == 23:
                m = scraper_fpfs._desfazer_mojibake(j.get("mandante", ""))
                v = scraper_fpfs._desfazer_mojibake(j.get("visitante", ""))
                chave = tuple(sorted([m.lower(), v.lower()]))
                
                if chave not in confrontos_map:
                    confrontos_map[chave] = {
                        "id": f"{m}_{v}".replace(" ", "_").replace(".", "").lower(),
                        "mandante": m,
                        "mandante_escudo": j.get("escudo_mandante", "/fpfs_shield.png"),
                        "visitante": v,
                        "visitante_escudo": j.get("escudo_visitante", "/fpfs_shield.png"),
                        "data": j.get("data", ""),
                        "dia": j.get("dia", ""),
                        "mes": j.get("mes", ""),
                        "hora": j.get("hora", ""),
                        "ginasio": scraper_fpfs._desfazer_mojibake(j.get("ginasio", "")),
                        "rodada": "23ª Rodada",
                        "status_geral": "Encerrado",
                        "jogos_sub": {},
                    }
                
                confronto = confrontos_map[chave]
                confronto["jogos_sub"][cat] = {
                    "status": j.get("status", "Agendado"),
                    "placar_mandante": j.get("placar_mandante"),
                    "placar_visitante": j.get("placar_visitante"),
                    "sumula_url": j.get("sumula_url"),
                }
                if j.get("status") != "Encerrado":
                    confronto["status_geral"] = "Agendado"

    # Buscar pontuação atual de mandante e visitante para enriquecer os cards
    ranking_dict = {c["clube"].lower(): c for c in ranking_geral}
    confrontos_lista = list(confrontos_map.values())
    for conf in confrontos_lista:
        m_data = ranking_dict.get(conf["mandante"].lower())
        v_data = ranking_dict.get(conf["visitante"].lower())
        conf["mandante_posicao"] = m_data.get("posicao") if m_data else None
        conf["mandante_pontos"] = m_data.get("pontos_total") if m_data else 0
        conf["mandante_chave"] = m_data.get("chave") if m_data else "BRONZE"
        conf["visitante_posicao"] = v_data.get("posicao") if v_data else None
        conf["visitante_pontos"] = v_data.get("pontos_total") if v_data else 0
        conf["visitante_chave"] = v_data.get("chave") if v_data else "BRONZE"

    # Ordenar confrontos: agendados primeiro, depois por data
    confrontos_lista.sort(key=lambda x: (0 if x["status_geral"] == "Agendado" else 1, x["data"], x["hora"]))

    return {
        "temporada": ano,
        "atualizado_em": dados.get("atualizado_em"),
        "torneio_uniao": {
            "ranking": ranking_geral,
            "chaves": playoffs_uniao,
        },
        "categorias": playoffs_categorias,
        "confrontos_rodada_final": confrontos_lista,
    }

