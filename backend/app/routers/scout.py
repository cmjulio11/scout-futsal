from fastapi import APIRouter, Query, HTTPException, Response
from typing import Optional, List, Dict, Any
import urllib.parse
import unicodedata
from ..services import scraper_fpfs
from ..services.pdf_generator import gerar_pdf_confronto

router = APIRouter(prefix="/api/scout", tags=["scout"])

@router.get("/clubes")
def listar_clubes(temporada: int = Query(2026, description="Ano da temporada")):
    """Retorna a lista de todos os 24 clubes da Série A1 para seleção no scout."""
    ano = temporada if isinstance(temporada, int) else 2026
    dados = scraper_fpfs.obter_dados_completos(ano)
    ranking = dados.get("ranking_eficiencia", [])
    
    clubes = []
    for c in ranking:
        clubes.append({
            "nome": c["clube"],
            "nome_completo": c.get("clube_completo", c["clube"]),
            "escudo_url": c["escudo_url"],
            "posicao": c["posicao"],
            "chave": c["chave"],
            "pontos_total": c["pontos_total"],
            "indice_tecnico": c["indice_tecnico"],
        })
        
    return {
        "temporada": ano,
        "total": len(clubes),
        "clubes": sorted(clubes, key=lambda x: x["nome"]),
    }

@router.get("/partidas-rodada")
def listar_partidas_rodada(
    temporada: int = Query(2026, description="Ano da temporada"),
    categoria: str = Query("Sub-7", description="Categoria para buscar os confrontos")
):
    """
    Retorna os confrontos de rodada para permitir ao usuário
    selecionar uma partida oficial e carregar mandante e visitante automaticamente.
    """
    ano = temporada if isinstance(temporada, int) else 2026
    cat = categoria if isinstance(categoria, str) and not str(categoria).startswith("Query(") else "Sub-7"
    dados = scraper_fpfs.obter_dados_completos(ano)
    jogos = dados.get("jogos", {}).get(cat, [])
    
    partidas = []
    confrontos_vistos = set()
    for j in jogos:
        chave = (j["data"], j["mandante"], j["visitante"])
        if chave in confrontos_vistos:
            continue
        confrontos_vistos.add(chave)
        partidas.append({
            "data": j.get("data", ""),
            "dia": j.get("dia", ""),
            "mes": j.get("mes", ""),
            "hora": j.get("hora", ""),
            "rodada": scraper_fpfs.formatar_rodada(j.get("rodada", "")),
            "ginasio": j.get("ginasio", ""),
            "mandante": j.get("mandante", ""),
            "escudo_mandante": j.get("escudo_mandante", "/fpfs_shield.png"),
            "visitante": j.get("visitante", ""),
            "escudo_visitante": j.get("escudo_visitante", "/fpfs_shield.png"),
            "status": j.get("status", "Agendado"),
        })
        
    return {
        "temporada": temporada,
        "categoria": categoria,
        "total": len(partidas),
        "partidas": partidas,
    }

@router.get("/confronto")
def obter_scout_confronto(
    temporada: int = Query(2026, description="Ano da temporada"),
    mandante: str = Query(..., description="Nome do clube mandante"),
    visitante: str = Query(..., description="Nome do clube visitante"),
    categoria: Optional[str] = Query(None, description="Categoria específica ou None para todas")
):
    """
    Dossiê completo de análise técnica pré-jogo:
    - Posição geral no Torneio União, pontos, diferença para líder e rebaixamento
    - Desempenho por categoria Sub-7, 8, 9 e 10
    - Estatísticas em Casa do Mandante vs Estatísticas Fora do Visitante (% aproveitamento, médias GP/GC)
    - Últimos 5 jogos com resultado e nível de dificuldade (posição dos oponentes)
    - Histórico de confronto direto
    """
    ano = temporada if isinstance(temporada, int) else 2026
    dados = scraper_fpfs.obter_dados_completos(ano)
    ranking = dados.get("ranking_eficiencia", [])
    
    # Normaliza categoria (trata Query default, None, geral, etc.)
    cat_str = categoria if isinstance(categoria, str) and categoria.strip().lower() not in ("none", "null", "", "geral") else None

    if not ranking:
        raise HTTPException(status_code=404, detail="Dados da temporada não encontrados.")
        
    # Mapa de posições e clubes
    pos_map = {c["clube"].upper(): c for c in ranking}
    lider = ranking[0] if len(ranking) > 0 else None
    colocado_22 = ranking[21] if len(ranking) >= 22 else None
    colocado_21 = ranking[20] if len(ranking) >= 21 else None
    
    def _limpar_str(s: str) -> str:
        if not s:
            return ""
        norm = unicodedata.normalize('NFKD', s)
        return "".join(c for c in norm if not unicodedata.combining(c)).strip().upper()

    def resolver_clube_ranking(nome: str):
        if not nome:
            return None
        n_limpo = _limpar_str(nome)
        for c in ranking:
            if _limpar_str(c["clube"]) == n_limpo or _limpar_str(c.get("clube_completo", "")) == n_limpo:
                return c
        for c in ranking:
            c_limpo = _limpar_str(c["clube"])
            comp_limpo = _limpar_str(c.get("clube_completo", ""))
            if n_limpo in c_limpo or c_limpo in n_limpo:
                return c
            if comp_limpo and (n_limpo in comp_limpo or comp_limpo in n_limpo):
                return c
        return None

    clube_m = resolver_clube_ranking(mandante)
    clube_v = resolver_clube_ranking(visitante)
    
    if not clube_m:
        raise HTTPException(status_code=404, detail=f"Clube mandante '{mandante}' não encontrado.")
    if not clube_v:
        raise HTTPException(status_code=404, detail=f"Clube visitante '{visitante}' não encontrado.")
        
    m_nome_oficial = clube_m["clube"]
    v_nome_oficial = clube_v["clube"]
    
    # 1. Margens do Torneio União
    def calcular_margens(clube_info):
        pts = clube_info.get("pontos_total", 0)
        pos = clube_info.get("posicao", 24)
        
        # Diferença para o líder (1º colocado)
        dif_lider = (lider["pontos_total"] - pts) if lider else 0
        
        # Margem para o rebaixamento (22º colocado)
        if pos < 22:
            margem_reb = (pts - colocado_22["pontos_total"]) if colocado_22 else 0
            status_reb = "Livre"
        else:
            # Está na zona: pontos para alcançar o 21º colocado
            margem_reb = (colocado_21["pontos_total"] - pts) if colocado_21 else 0
            status_reb = "Na Zona"
            
        return {
            **clube_info,
            "diferenca_lider": dif_lider,
            "margem_rebaixamento": margem_reb,
            "status_rebaixamento": status_reb,
        }

    m_info = calcular_margens(clube_m)
    v_info = calcular_margens(clube_v)
    
    # 2. Desempenho por categoria Sub-7, 8, 9, 10
    sub_comparativo = []
    for cat in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]:
        tabela_cat = dados.get("classificacao", {}).get(cat, [])
        m_cat = next((x for x in tabela_cat if x["clube"].upper() == m_nome_oficial.upper()), None)
        v_cat = next((x for x in tabela_cat if x["clube"].upper() == v_nome_oficial.upper()), None)
        sub_comparativo.append({
            "categoria": cat,
            "mandante": m_cat,
            "visitante": v_cat,
        })
        
    # 3. Estatísticas de Mando (Casa vs Fora)
    def calcular_mando(clube_nome: str, cat_filtro: Optional[str] = None):
        cats = [cat_filtro] if cat_filtro else ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]
        casa = {"jogos": 0, "vitorias": 0, "empates": 0, "derrotas": 0, "gols_pro": 0, "gols_contra": 0, "pontos": 0}
        fora = {"jogos": 0, "vitorias": 0, "empates": 0, "derrotas": 0, "gols_pro": 0, "gols_contra": 0, "pontos": 0}
        
        for c in cats:
            for j in dados.get("jogos", {}).get(c, []):
                if j.get("status") != "Encerrado":
                    continue
                pm = j.get("placar_mandante", 0) or 0
                pv = j.get("placar_visitante", 0) or 0
                
                if j.get("mandante", "").upper() == clube_nome.upper():
                    casa["jogos"] += 1
                    casa["gols_pro"] += pm
                    casa["gols_contra"] += pv
                    if pm > pv:
                        casa["vitorias"] += 1
                        casa["pontos"] += 3
                    elif pm == pv:
                        casa["empates"] += 1
                        casa["pontos"] += 1
                    else:
                        casa["derrotas"] += 1
                elif j.get("visitante", "").upper() == clube_nome.upper():
                    fora["jogos"] += 1
                    fora["gols_pro"] += pv
                    fora["gols_contra"] += pm
                    if pv > pm:
                        fora["vitorias"] += 1
                        fora["pontos"] += 3
                    elif pv == pm:
                        fora["empates"] += 1
                        fora["pontos"] += 1
                    else:
                        fora["derrotas"] += 1
                        
        def finalizar(d):
            j = d["jogos"]
            aprov = round((d["pontos"] / (j * 3.0) * 100.0), 1) if j > 0 else 0.0
            mgp = round(d["gols_pro"] / float(j), 2) if j > 0 else 0.0
            mgc = round(d["gols_contra"] / float(j), 2) if j > 0 else 0.0
            saldo = d["gols_pro"] - d["gols_contra"]
            return {
                **d,
                "aproveitamento": aprov,
                "media_gols_pro": mgp,
                "media_gols_contra": mgc,
                "saldo_gols": saldo,
            }
            
        return {
            "casa": finalizar(casa),
            "fora": finalizar(fora),
        }

    m_mando = calcular_mando(m_nome_oficial, cat_str)
    v_mando = calcular_mando(v_nome_oficial, cat_str)
    
    # 4. Últimos 5 Jogos com Nível de Dificuldade dos Adversários
    def obter_ultimos_jogos(clube_nome: str, cat_filtro: Optional[str] = None, limite: int = 5):
        cats = [cat_filtro] if cat_filtro else ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]
        lista = []
        
        for c in cats:
            for j in dados.get("jogos", {}).get(c, []):
                if j.get("status") != "Encerrado":
                    continue
                pm = j.get("placar_mandante", 0) or 0
                pv = j.get("placar_visitante", 0) or 0
                jm = j.get("mandante", "")
                jv = j.get("visitante", "")
                
                if jm.upper() == clube_nome.upper():
                    res = "V" if pm > pv else ("E" if pm == pv else "D")
                    adv_info = pos_map.get(jv.upper())
                    lista.append({
                        "data": j.get("data", ""),
                        "dia": j.get("dia", ""),
                        "mes": j.get("mes", ""),
                        "categoria": c,
                        "rodada": j.get("rodada", ""),
                        "ginasio": j.get("ginasio", ""),
                        "mando": "Casa",
                        "placar": f"{pm} x {pv}",
                        "gols_pro": pm,
                        "gols_contra": pv,
                        "resultado": res,
                        "adversario": jv,
                        "adversario_escudo": j.get("escudo_visitante", "/fpfs_shield.png"),
                        "adversario_posicao": adv_info["posicao"] if adv_info else None,
                        "adversario_chave": adv_info["chave"] if adv_info else "BRONZE",
                        "sumula_url": j.get("sumula_url"),
                    })
                elif jv.upper() == clube_nome.upper():
                    res = "V" if pv > pm else ("E" if pv == pm else "D")
                    adv_info = pos_map.get(jm.upper())
                    lista.append({
                        "data": j.get("data", ""),
                        "dia": j.get("dia", ""),
                        "mes": j.get("mes", ""),
                        "categoria": c,
                        "rodada": j.get("rodada", ""),
                        "ginasio": j.get("ginasio", ""),
                        "mando": "Fora",
                        "placar": f"{pv} x {pm}",
                        "gols_pro": pv,
                        "gols_contra": pm,
                        "resultado": res,
                        "adversario": jm,
                        "adversario_escudo": j.get("escudo_mandante", "/fpfs_shield.png"),
                        "adversario_posicao": adv_info["posicao"] if adv_info else None,
                        "adversario_chave": adv_info["chave"] if adv_info else "BRONZE",
                        "sumula_url": j.get("sumula_url"),
                    })
                    
        # Inverter para obter os mais recentes primeiro
        lista.reverse()
        return lista[:limite]

    m_ultimos = obter_ultimos_jogos(m_nome_oficial, cat_str, 5)
    v_ultimos = obter_ultimos_jogos(v_nome_oficial, cat_str, 5)
    
    # 5. Confronto Direto Histórico (H2H)
    h2h_jogos = []
    cats_h2h = [cat_str] if cat_str else ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]
    for c in cats_h2h:
        for j in dados.get("jogos", {}).get(c, []):
            jm = j.get("mandante", "").upper()
            jv = j.get("visitante", "").upper()
            m_up = m_nome_oficial.upper()
            v_up = v_nome_oficial.upper()
            
            if (jm == m_up and jv == v_up) or (jm == v_up and jv == m_up):
                h2h_jogos.append({
                    "categoria": c,
                    "data": j.get("data", ""),
                    "rodada": j.get("rodada", ""),
                    "ginasio": j.get("ginasio", ""),
                    "mandante": j.get("mandante", ""),
                    "escudo_mandante": j.get("escudo_mandante", "/fpfs_shield.png"),
                    "placar_mandante": j.get("placar_mandante"),
                    "placar_visitante": j.get("placar_visitante"),
                    "visitante": j.get("visitante", ""),
                    "escudo_visitante": j.get("escudo_visitante", "/fpfs_shield.png"),
                    "status": j.get("status", "Agendado"),
                    "sumula_url": j.get("sumula_url"),
                })

    # 6. Principais Artilheiros / Ameaças dos Clubes
    def obter_artilheiros_clube(clube_nome: str, oponente_nome: str, cat_filtro: Optional[str] = None, limite: int = 3):
        cats = [cat_filtro] if cat_filtro else ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]
        candidatos = []
        for c in cats:
            for a in dados.get("artilharia", {}).get(c, []):
                if a.get("clube", "").upper() == clube_nome.upper():
                    candidatos.append({**a, "categoria": c})
                    
        candidatos.sort(key=lambda x: x.get("gols", 0), reverse=True)
        top = candidatos[:limite]
        
        resultado = []
        for a in top:
            id_jog = a.get("id_jogador")
            id_f = a.get("id_fase")
            gols_contra = 0
            if id_jog and id_f:
                try:
                    ficha = scraper_fpfs.obter_ficha_atleta(temporada=ano, categoria=a["categoria"], id_jogador=id_jog, id_fase=id_f)
                    if ficha:
                        for v in ficha.get("maiores_vitimas", []):
                            if oponente_nome.upper() in v.get("adversario", "").upper():
                                gols_contra += v.get("gols", 0)
                except Exception:
                    pass
            resultado.append({
                **a,
                "marcou_contra_adversario": gols_contra > 0,
                "gols_contra_adversario": gols_contra,
            })
        return resultado

    m_artilheiros = obter_artilheiros_clube(m_nome_oficial, v_nome_oficial, cat_str, 3)
    v_artilheiros = obter_artilheiros_clube(v_nome_oficial, m_nome_oficial, cat_str, 3)

    return {
        "temporada": temporada,
        "categoria": cat_str,
        "mandante": {
            "info": m_info,
            "estatisticas_mando": m_mando,
            "ultimos_jogos": m_ultimos,
            "principais_artilheiros": m_artilheiros,
        },
        "visitante": {
            "info": v_info,
            "estatisticas_mando": v_mando,
            "ultimos_jogos": v_ultimos,
            "principais_artilheiros": v_artilheiros,
        },
        "sub_categorias": sub_comparativo,
        "confronto_direto": h2h_jogos,
    }


@router.get("/confronto/pdf")
def baixar_dossie_confronto_pdf(
    mandante: str = Query(..., description="Nome do clube mandante"),
    visitante: str = Query(..., description="Nome do clube visitante"),
    temporada: int = Query(2026, description="Ano da temporada"),
    categoria: Optional[str] = Query(None, description="Categoria específica ou Geral"),
    data_jogo: Optional[str] = Query(None, description="Data da partida"),
    hora_jogo: Optional[str] = Query(None, description="Hora da partida"),
    ginasio_jogo: Optional[str] = Query(None, description="Ginásio da partida"),
    rodada_jogo: Optional[str] = Query(None, description="Rodada da partida"),
):
    """
    Gera e retorna o Dossiê Tático Pré-Jogo Oficial em PDF (1 página de prancheta)
    contendo o raio-x completo do confronto entre Mandante e Visitante.
    """
    ano = temporada if isinstance(temporada, int) else 2026
    confronto_dados = obter_scout_confronto(
        temporada=ano,
        mandante=mandante,
        visitante=visitante,
        categoria=categoria
    )
    
    # Contexto do jogo
    jogo_info = {
        "data": data_jogo,
        "hora": hora_jogo,
        "ginasio": ginasio_jogo,
        "rodada": rodada_jogo,
    }
    
    # Se não foi fornecido contexto explícito, tentar localizar nos jogos agendados da temporada
    if not data_jogo:
        dados = scraper_fpfs.obter_dados_completos(ano)
        jogos_map = dados.get("jogos", {})
        for cat_nome, j_list in jogos_map.items():
            for j in j_list:
                jm = str(j.get("mandante", "")).upper()
                jv = str(j.get("visitante", "")).upper()
                m_up = mandante.upper()
                v_up = visitante.upper()
                if (m_up in jm or jm in m_up) and (v_up in jv or jv in v_up):
                    jogo_info["data"] = j.get("data")
                    jogo_info["hora"] = j.get("hora")
                    jogo_info["ginasio"] = j.get("ginasio")
                    jogo_info["rodada"] = scraper_fpfs.formatar_rodada(j.get("rodada", ""))
                    break
            if jogo_info.get("data"):
                break

    try:
        pdf_bytes = gerar_pdf_confronto(confronto_dados, jogo_info)
        m_clean = mandante.strip().replace(" ", "_")
        v_clean = visitante.strip().replace(" ", "_")
        filename_raw = f"Dossie_PreJogo_{m_clean}_x_{v_clean}_FPFS_{ano}.pdf"
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
        print(f"[PDF_ERROR] Falha ao gerar Dossiê Pré-Jogo do confronto: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar documento PDF: {str(e)}")

