import os
import json
import urllib.request
from bs4 import BeautifulSoup
import re
from datetime import datetime
from typing import Dict, List, Any, Optional

BASE_URL = "https://eventos.admfutsal.com.br"
ID_TITULO_PAULISTA = 16
ID_DIVISAO_A1 = 3

# Diretório de armazenamento local (banco/cache persistente em disco)
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
os.makedirs(DATA_DIR, exist_ok=True)

def _get_cache_filepath(temporada: int) -> str:
    return os.path.join(DATA_DIR, f"fpfs_temporada_{temporada}.json")

def carregar_dados_locais(temporada: int) -> Optional[Dict[str, Any]]:
    filepath = _get_cache_filepath(temporada)
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data and "classificacao" in data and "ranking_eficiencia" in data:
                    print(f"[BANCO LOCAL] Dados da temporada {temporada} carregados do banco local com sucesso!")
                    return data
        except Exception as e:
            print(f"[BANCO LOCAL] Erro ao ler dados locais de {temporada}: {e}")
    return None

def salvar_dados_locais(temporada: int, dados: Dict[str, Any]) -> None:
    filepath = _get_cache_filepath(temporada)
    temp_filepath = f"{filepath}.tmp"
    try:
        with open(temp_filepath, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
        os.replace(temp_filepath, filepath)
        print(f"[BANCO LOCAL] Base da temporada {temporada} persistida com sucesso em {filepath}!")
    except Exception as e:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception:
                pass
        print(f"[BANCO LOCAL] Erro ao persistir dados locais de {temporada}: {e}")

_CACHE: Dict[str, Any] = {}
_LAST_SYNC: Dict[str, datetime] = {}

def _desfazer_mojibake(s: str) -> str:
    if not s: return ""
    try:
        return s.encode("latin-1").decode("utf-8")
    except Exception:
        return s

def resolver_escudo_local(nome_clube: str) -> str:
    if not nome_clube:
        return "/fpfs_shield.png"
    n = _desfazer_mojibake(nome_clube).upper()
    
    if "CORINTHIANS" in n: return "/escudos/corinthians.png"
    if "PALMEIRAS" in n: return "/escudos/palmeiras.png"
    if "SANTOS" in n: return "/escudos/santos.png"
    if "PAULO" in n: return "/escudos/s_o_paulo.png"
    if "JUVENTUS" in n: return "/escudos/juventus.png"
    if "MAGNU" in n or "ASF/" in n or "SOROCABANA" in n: return "/escudos/magnus.png"
    if "CAMISA 10" in n: return "/escudos/camisa_10.png"
    if "BOLA NO" in n: return "/escudos/bola_no_p_.png"
    if "YPIRANGA" in n: return "/escudos/ca_ypiranga.png"
    if "MESC" in n: return "/escudos/mesc.png"
    if "BATEBOLA" in n: return "/escudos/batebola.png"
    if "TAUBAT" in n: return "/escudos/taubat_.png"
    if "UNI" in n and "RD" in n: return "/escudos/uni_o_rd.png"
    if "SANCAETANENSE" in n or "LIGA SAN" in n: return "/escudos/liga_s_o_caetano.png"
    if "RSFC" in n or "CAETANO" in n: return "/escudos/rsfc.png"
    if "SANTO ANDR" in n: return "/escudos/ad_santo_andr_.png"
    if "PORTUGUESA" in n: return "/escudos/portuguesa.png"
    if "PULO" in n or "CAMPINAS" in n: return "/escudos/pulo_futsal.png"
    if "WIMPRO" in n: return "/escudos/wimpro.png"
    if "GREMETAL" in n: return "/escudos/gremetal.png"
    if "LAUSANNE" in n: return "/escudos/lausanne_paulista.png"
    if "OCIAN" in n: return "/escudos/ocian.png"
    if "AUDAX" in n or "OSASCO" in n: return "/escudos/audax.png"
    if "BATALHA" in n: return "/escudos/batalha.png"
    if "GUARULHENSE" in n: return "/escudos/guarulhense.png"
    if "INDAIATUBA" in n: return "/escudos/indaiatuba.png"
    if "ITAPEVI" in n: return "/escudos/itapevi.png"
    if "MOGI" in n: return "/escudos/mogi_das_cruzes.png"
    if "HORTOL" in n: return "/escudos/hortol_ndia.png"
    if "TABUCA" in n: return "/escudos/tabuca_juniors.png"
    if "OLIMPIK" in n: return "/escudos/olimpik.png"
    if "OLE BRASIL" in n or "OLÉ BRASIL" in n or "PUMAS" in n: return "/escudos/pumas.png"
    
    return "/fpfs_shield.png"

def formatar_nome_clube(nome: str) -> str:
    if not nome: return ""
    n = _desfazer_mojibake(nome).upper()
    if "CORINTHIANS" in n: return "CORINTHIANS"
    if "PALMEIRAS" in n: return "PALMEIRAS"
    if "SANTOS" in n: return "SANTOS FC"
    if "PAULO" in n: return "SÃO PAULO FC"
    if "JUVENTUS" in n: return "C.A. JUVENTUS"
    if "MAGNU" in n or "ASF/" in n or "SOROCABANA" in n: return "MAGNUS FUTSAL"
    if "CAMISA 10" in n: return "CAMISA 10"
    if "BOLA NO" in n: return "CT BOLA NO PÉ"
    if "YPIRANGA" in n: return "C.A. YPIRANGA"
    if "MESC" in n: return "MESC SÃO BERNARDO"
    if "BATEBOLA" in n: return "A.D. BATEBOLA"
    if "TAUBAT" in n: return "TAUBATÉ FUTSAL"
    if "UNI" in n and "RD" in n: return "UNIÃO RD"
    if "SANCAETANENSE" in n or "LIGA SAN" in n: return "LIGA SÃO CAETANO"
    if "RSFC" in n or "CAETANO" in n: return "SÃO CAETANO / RSFC"
    if "SANTO ANDR" in n: return "AD SANTO ANDRÉ"
    if "PORTUGUESA" in n: return "PORTUGUESA"
    if "PULO" in n or "CAMPINAS" in n: return "PULO CAMPINAS"
    if "WIMPRO" in n: return "WIMPRO GUARULHOS"
    if "GREMETAL" in n: return "GREMETAL SANTOS"
    if "LAUSANNE" in n: return "LAUSANNE PAULISTA"
    if "OCIAN" in n: return "OCIAN PRAIA CLUBE"
    if "AUDAX" in n or "OSASCO" in n: return "FAE / OSASCO / AUDAX"
    if "BATALHA" in n: return "BATALHA FUTSAL"
    if "GUARULHENSE" in n: return "GUARULHENSE"
    if "INDAIATUBA" in n: return "A.D. INDAIATUBA"
    if "ITAPEVI" in n: return "ITAPEVI FUTSAL"
    if "MOGI" in n: return "MOGI DAS CRUZES"
    if "HORTOL" in n: return "HORTOLÂNDIA"
    if "TABUCA" in n: return "C.A. TABUCA JRS"
    if "OLIMPIK" in n: return "AD OLIMPIK"
    if "OLE BRASIL" in n or "OLÉ BRASIL" in n: return "OLÉ BRASIL SOCIETY"
    return _desfazer_mojibake(nome).strip()

def formatar_rodada(val: Any) -> str:
    if not val:
        return ""
    s = str(val).strip()
    if any(k in s.lower() for k in ["quarta", "semi", "final", "oitava", "bronze", "prata", "ouro", "mata"]):
        return s
    nums = re.findall(r'\d+', s)
    if nums:
        return f"{int(''.join(nums))}ª Rodada"
    return s

def _fetch_url(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="ignore")

def _fetch_json(url: str) -> Any:
    import json
    content = _fetch_url(url)
    return json.loads(content)

def obter_eventos_iniciacao(temporada: int = 2026) -> Dict[str, int]:
    cache_key = f"eventos_{temporada}"
    if cache_key in _CACHE:
        return _CACHE[cache_key]
    
    fallback_map = {
        2026: {"Sub-7": 908, "Sub-8": 909, "Sub-9": 910, "Sub-10": 911},
        2025: {"Sub-7": 866, "Sub-8": 865, "Sub-9": 864, "Sub-10": 863},
        2024: {"Sub-7": 841, "Sub-8": 840, "Sub-9": 839, "Sub-10": 838},
    }
    
    try:
        url = f"{BASE_URL}/api/get_categorias/{temporada}/{ID_TITULO_PAULISTA}/{ID_DIVISAO_A1}"
        dados = _fetch_json(url)
        eventos = {}
        for item in dados:
            cat_nome = item.get("categoria", {}).get("nome", "")
            ev_id = item.get("id_evento")
            if cat_nome in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"] and ev_id:
                eventos[cat_nome] = ev_id
        
        if len(eventos) >= 4:
            _CACHE[cache_key] = eventos
            return eventos
    except Exception as e:
        print(f"[SCRAPER] Erro ao buscar categorias da API ({temporada}): {e}")
    
    res = fallback_map.get(temporada, fallback_map[2026])
    _CACHE[cache_key] = res
    return res

def parse_classificacao(evento_id: int) -> List[Dict[str, Any]]:
    html = _fetch_url(f"{BASE_URL}/evento/{evento_id}")
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if not table:
        return []
    
    classificacao = []
    rows = table.find_all("tr")[1:]
    
    for r in rows:
        tds = r.find_all("td")
        if len(tds) < 11:
            continue
        
        pos_raw = tds[1].get_text(strip=True).replace("?", "").replace("?", "")
        try:
            posicao = int(pos_raw)
        except ValueError:
            posicao = len(classificacao) + 1
            
        clube_raw = tds[2].get_text(strip=True)
        clube_formatado = formatar_nome_clube(clube_raw)
        escudo_resolvido = resolver_escudo_local(clube_raw)
        
        def to_int(idx, default=0):
            try:
                return int(tds[idx].get_text(strip=True))
            except (ValueError, IndexError):
                return default
                
        def to_float(idx, default=0.0):
            try:
                return float(tds[idx].get_text(strip=True).replace(",", "."))
            except (ValueError, IndexError):
                return default

        pontos = to_int(3)
        jogos = to_int(4)
        vitorias = to_int(5)
        empates = to_int(6)
        derrotas = to_int(7)
        gols_pro = to_int(8)
        gols_contra = to_int(9)
        saldo_gols = to_int(10)
        average = to_float(11) if len(tds) > 11 else (round(gols_pro / max(gols_contra, 1), 2))
        
        if posicao <= 8:
            chave = "OURO"
        elif posicao <= 16:
            chave = "PRATA"
        else:
            chave = "BRONZE"

        classificacao.append({
            "posicao": posicao,
            "chave": chave,
            "clube": clube_formatado,
            "clube_completo": clube_raw,
            "escudo_url": escudo_resolvido,
            "pontos": pontos,
            "jogos": jogos,
            "vitorias": vitorias,
            "empates": empates,
            "derrotas": derrotas,
            "gols_pro": gols_pro,
            "gols_contra": gols_contra,
            "saldo_gols": saldo_gols,
            "average": average,
        })
        
    return classificacao

def parse_jogos(evento_id: int) -> List[Dict[str, Any]]:
    html = _fetch_url(f"{BASE_URL}/evento/{evento_id}/jogos")
    soup = BeautifulSoup(html, "html.parser")

    tab_panes = soup.find_all("div", class_="tab-pane")

    # Se não houver tab-panes (fallback simples), usa todas as tabelas
    panes_data = []
    if tab_panes:
        for pane in tab_panes:
            pane_id = pane.get("id")
            pill = soup.find("a", href=f"#{pane_id}") if pane_id else None
            pill_text = pill.get_text(strip=True) if pill else ""
            table = pane.find("table")
            if table:
                panes_data.append((pill_text, table))
    else:
        for t in soup.find_all("table"):
            panes_data.append(("", t))

    if not panes_data:
        return []

    jogos = []
    chaves_vistas = set()
    classificatoria_count = 0

    for pill_text, table in panes_data:
        pill_upper = pill_text.upper()

        # Determina fase, chave e rodada da aba
        if "CLASSIFICATORIA" in pill_upper or not pill_text:
            fase = "Fase Classificatória"
            is_classificatoria = True
            chave_fase = None
            rodada_base = None
        else:
            is_classificatoria = False
            # Determina Chave
            if "BRONZE" in pill_upper:
                chave_fase = "BRONZE"
            elif "PRATA" in pill_upper:
                chave_fase = "PRATA"
            elif "OURO" in pill_upper:
                chave_fase = "OURO"
            else:
                chave_fase = None

            # Determina Tipo de Fase
            if "QUART" in pill_upper:
                fase = "Quartas de Final"
                rodada_base = f"Quartas de Final ({chave_fase.title()})" if chave_fase else "Quartas de Final"
                rodada_num_fase = 24
            elif "SEMI" in pill_upper:
                fase = "Semifinal"
                rodada_base = f"Semifinal ({chave_fase.title()})" if chave_fase else "Semifinal"
                rodada_num_fase = 25
            elif "FINAL" in pill_upper:
                fase = "Final"
                rodada_base = f"Final ({chave_fase.title()})" if chave_fase else "Final"
                rodada_num_fase = 26
            else:
                fase = pill_text.title()
                rodada_base = pill_text.title()
                rodada_num_fase = 24

        rows = table.find_all("tr")[1:]
        for r in rows:
            tds = r.find_all("td")
            if len(tds) < 4:
                continue

            data = tds[0].get_text(strip=True)
            hora = tds[1].get_text(strip=True).replace('?', '').strip()
            ginasio = tds[2].get_text(strip=True)
            res_td = tds[3]

            sumula_a = res_td.find("a", href=lambda h: h and "sumula" in h)
            sumula_url = sumula_a["href"] if sumula_a else None

            # Extração limpa dos nomes dos clubes
            nomes = [span.get_text(strip=True) for span in res_td.find_all("span", class_="nome_clube")]
            if len(nomes) >= 2:
                mandante = nomes[0].strip()
                visitante = nomes[1].strip()
            else:
                raw_text = res_td.get_text(" ", strip=True)
                clean_text = re.sub(r'Ver\s+S[?u]mula', '', raw_text, flags=re.I).strip()
                match = re.search(r'^(.*?)\s*(\d+)\s*[xX]\s*(\d+)\s*(.*?)$', clean_text)
                if match:
                    mandante = match.group(1).strip()
                    visitante = match.group(4).strip()
                else:
                    parts = re.split(r'\s+[xX]\s+', clean_text)
                    mandante = parts[0].strip() if len(parts) > 0 else clean_text
                    visitante = parts[1].strip() if len(parts) > 1 else ""

            # Extração de resultado / placar
            result_span = res_td.find("span", class_="result")
            result_text = result_span.get_text(strip=True) if result_span else ""
            score_match = re.search(r'(\d+)\s*[xX]\s*(\d+)', result_text)
            if score_match:
                placar_m = int(score_match.group(1))
                placar_v = int(score_match.group(2))
                status = "Encerrado"
            else:
                # Fallback caso não esteja no span.result
                match_text = re.search(r'(\d+)\s*[xX]\s*(\d+)', res_td.get_text(strip=True))
                if match_text and "Ver Súmula" in res_td.get_text():
                    placar_m = int(match_text.group(1))
                    placar_v = int(match_text.group(2))
                    status = "Encerrado"
                else:
                    placar_m = None
                    placar_v = None
                    status = "Agendado"

            # Prevenção de duplicatas
            chave_duelo = (data, hora, mandante.lower(), visitante.lower())
            if chave_duelo in chaves_vistas:
                continue
            chaves_vistas.add(chave_duelo)

            # Extração limpa de dia e mês
            dia = ""
            mes = ""
            ano = "2026"
            data_match = re.search(r'(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?', data)
            if data_match:
                dia = data_match.group(1).zfill(2)
                mes_num = int(data_match.group(2))
                meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
                if 1 <= mes_num <= 12:
                    mes = meses[mes_num - 1]
                if data_match.group(3):
                    ano_val = data_match.group(3)
                    ano = f"20{ano_val}" if len(ano_val) == 2 else ano_val

            mandante_formatado = formatar_nome_clube(mandante)
            visitante_formatado = formatar_nome_clube(visitante)
            escudo_mandante = resolver_escudo_local(mandante)
            escudo_visitante = resolver_escudo_local(visitante)

            if is_classificatoria:
                rodada_num = (classificatoria_count // 12) + 1
                rodada = f"{rodada_num}ª Rodada"
                classificatoria_count += 1
            else:
                rodada = rodada_base
                rodada_num = rodada_num_fase

            jogos.append({
                "data": data,
                "dia": dia,
                "mes": mes,
                "ano": ano,
                "hora": hora,
                "ginasio": ginasio,
                "mandante": mandante_formatado,
                "mandante_completo": mandante,
                "escudo_mandante": escudo_mandante,
                "placar_mandante": placar_m,
                "placar_visitante": placar_v,
                "visitante": visitante_formatado,
                "visitante_completo": visitante,
                "escudo_visitante": escudo_visitante,
                "status": status,
                "rodada": rodada,
                "rodada_num": rodada_num,
                "sumula_url": sumula_url,
                "fase": fase,
                "chave": chave_fase,
            })

    return jogos

def parse_artilharia(evento_id: int) -> List[Dict[str, Any]]:
    html = _fetch_url(f"{BASE_URL}/evento/{evento_id}/artilharia")
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if not table:
        return []
    
    artilheiros = []
    rows = table.find_all("tr")[1:]
    
    for idx, r in enumerate(rows):
        tds = r.find_all("td")
        if len(tds) < 4:
            continue
            
        img_tag = tds[0].find("img")
        foto_url = img_tag["src"] if img_tag and img_tag.get("src") else None
        
        nome = tds[1].get_text(strip=True)
        clube_raw = tds[2].get_text(strip=True)
        clube_fmt = formatar_nome_clube(clube_raw)
        escudo_url = resolver_escudo_local(clube_raw)
        
        a_tag = tds[3].find("a")
        id_jog = None
        id_fase = None
        if a_tag:
            try:
                id_jog = int(a_tag.get("data-idjogador")) if a_tag.get("data-idjogador") else None
            except (ValueError, TypeError):
                id_jog = None
            try:
                id_fase = int(a_tag.get("data-idfase")) if a_tag.get("data-idfase") else None
            except (ValueError, TypeError):
                id_fase = None

        try:
            gols = int(tds[3].get_text(strip=True))
        except ValueError:
            gols = 0
            
        artilheiros.append({
            "posicao": idx + 1,
            "nome": nome,
            "foto_url": foto_url,
            "clube": clube_fmt,
            "clube_completo": clube_raw,
            "escudo_url": escudo_url,
            "gols": gols,
            "id_jogador": id_jog,
            "id_fase": id_fase,
        })
        
    return artilheiros

def calcular_ranking_eficiencia(temporada: int = 2026) -> List[Dict[str, Any]]:
    eventos = obter_eventos_iniciacao(temporada)
    dados_categorias = {}
    
    for cat in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]:
        ev_id = eventos.get(cat)
        if ev_id:
            dados_categorias[cat] = parse_classificacao(ev_id)
        else:
            dados_categorias[cat] = []
            
    clubes_map: Dict[str, Dict[str, Any]] = {}
    
    for cat, lista in dados_categorias.items():
        for item in lista:
            nome = item["clube"]
            nome_completo = item.get("clube_completo", nome)
            if nome not in clubes_map:
                clubes_map[nome] = {
                    "clube": nome,
                    "clube_completo": nome_completo,
                    "escudo_url": resolver_escudo_local(nome_completo),
                    "pontos_total": 0,
                    "jogos_total": 0,
                    "vitorias_total": 0,
                    "empates_total": 0,
                    "derrotas_total": 0,
                    "gols_pro_total": 0,
                    "gols_contra_total": 0,
                    "saldo_gols_total": 0,
                    "pontos_por_categoria": {},
                }
                
            c = clubes_map[nome]
            pts = item.get("pontos", 0)
            jgs = item.get("jogos", 0)
            c["pontos_total"] += pts
            c["jogos_total"] += jgs
            c["vitorias_total"] += item.get("vitorias", 0)
            c["empates_total"] += item.get("empates", 0)
            c["derrotas_total"] += item.get("derrotas", 0)
            c["gols_pro_total"] += item.get("gols_pro", 0)
            c["gols_contra_total"] += item.get("gols_contra", 0)
            c["saldo_gols_total"] += item.get("saldo_gols", 0)
            c["pontos_por_categoria"][cat] = pts

    lista_final = []
    for c in clubes_map.values():
        pontos = c["pontos_total"]
        jogos = c["jogos_total"]
        it = (pontos / jogos * 1000.0) if jogos > 0 else 0.0
        c["indice_tecnico"] = round(it, 1)
        gp = c["gols_pro_total"]
        gc = c["gols_contra_total"]
        c["average"] = round(gp / max(gc, 1), 2)
        lista_final.append(c)
        
    lista_final.sort(
        key=lambda x: (
            x["indice_tecnico"],
            x["vitorias_total"],
            x["saldo_gols_total"],
            x["gols_pro_total"],
            x["average"]
        ),
        reverse=True
    )
    
    total = len(lista_final)
    for idx, c in enumerate(lista_final, start=1):
        c["posicao"] = idx
        if idx <= 8:
            c["chave"] = "OURO"
        elif idx <= 16:
            c["chave"] = "PRATA"
        else:
            c["chave"] = "BRONZE"
        c["zona_rebaixamento"] = idx > (total - 3) if total >= 3 else False
        
    return lista_final

def get_classificacao_categoria(temporada: int, categoria: str) -> List[Dict[str, Any]]:
    cache_key = f"class_{temporada}_{categoria}"
    if cache_key in _CACHE:
        return _CACHE[cache_key]
    # 1. Carrega instantaneamente do banco de dados local se disponível
    dados_completos = obter_dados_completos(temporada)
    if dados_completos and categoria in dados_completos.get("classificacao", {}):
        dados = dados_completos["classificacao"][categoria]
        _CACHE[cache_key] = dados
        return dados
    eventos = obter_eventos_iniciacao(temporada)
    ev_id = eventos.get(categoria)
    if not ev_id:
        return []
    dados = parse_classificacao(ev_id)
    _CACHE[cache_key] = dados
    return dados

def get_jogos_categoria(temporada: int, categoria: str) -> List[Dict[str, Any]]:
    cache_key = f"jogos_{temporada}_{categoria}"
    if cache_key in _CACHE:
        return _CACHE[cache_key]
    # 1. Carrega instantaneamente do banco de dados local se disponível
    dados_completos = obter_dados_completos(temporada)
    if dados_completos and categoria in dados_completos.get("jogos", {}):
        dados = dados_completos["jogos"][categoria]
        _CACHE[cache_key] = dados
        return dados
    eventos = obter_eventos_iniciacao(temporada)
    ev_id = eventos.get(categoria)
    if not ev_id:
        return []
    dados = parse_jogos(ev_id)
    _CACHE[cache_key] = dados
    return dados

def get_artilharia_categoria(temporada: int, categoria: str) -> List[Dict[str, Any]]:
    cache_key = f"artilharia_{temporada}_{categoria}"
    if cache_key in _CACHE:
        return _CACHE[cache_key]
    # 1. Carrega instantaneamente do banco de dados local se disponível
    dados_completos = obter_dados_completos(temporada)
    if dados_completos and categoria in dados_completos.get("artilharia", {}):
        dados = dados_completos["artilharia"][categoria]
        _CACHE[cache_key] = dados
        return dados
    eventos = obter_eventos_iniciacao(temporada)
    ev_id = eventos.get(categoria)
    if not ev_id:
        return []
    dados = parse_artilharia(ev_id)
    _CACHE[cache_key] = dados
    return dados

def get_ranking_uniao(temporada: int) -> List[Dict[str, Any]]:
    cache_key = f"ranking_{temporada}"
    if cache_key in _CACHE:
        return _CACHE[cache_key]
    # 1. Carrega instantaneamente do banco de dados local se disponível
    dados_completos = obter_dados_completos(temporada)
    if dados_completos and "ranking_eficiencia" in dados_completos:
        dados = dados_completos["ranking_eficiencia"]
        _CACHE[cache_key] = dados
        return dados
    dados = calcular_ranking_eficiencia(temporada)
    _CACHE[cache_key] = dados
    return dados

def sincronizar_tudo(temporada: int = 2026):
    _CACHE.clear()
    eventos = obter_eventos_iniciacao(temporada)
    for cat in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]:
        ev_id = eventos.get(cat)
        if ev_id:
            parse_classificacao(ev_id)
            parse_jogos(ev_id)
            parse_artilharia(ev_id)
    calcular_ranking_eficiencia(temporada)
    _LAST_SYNC[str(temporada)] = datetime.utcnow()
    return {"status": "ok", "temporada": temporada, "sincronizado_em": _LAST_SYNC[str(temporada)].isoformat()}

def obter_dados_completos(temporada: int = 2026, forcar_atualizacao: bool = False) -> Dict[str, Any]:
    cache_key = f"dados_completos_{temporada}"
    
    # 1. Retorno instantâneo da memória (RAM) se já estiver carregado
    if not forcar_atualizacao and cache_key in _CACHE:
        return _CACHE[cache_key]
        
    # 2. Retorno instantâneo do banco/armazenamento local em disco se disponível
    if not forcar_atualizacao:
        dados_locais = carregar_dados_locais(temporada)
        if dados_locais:
            for cat, jogos in dados_locais.get("jogos", {}).items():
                for j in jogos:
                    if j.get("rodada"):
                        j["rodada"] = formatar_rodada(j["rodada"])
            _CACHE[cache_key] = dados_locais
            return dados_locais

    # 3. Caso não exista no banco local ou tenha sido solicitado sincronismo com a FPFS:
    print(f"[SCRAPER] Sincronizando temporada {temporada} diretamente com os servidores da FPFS...")
    eventos = obter_eventos_iniciacao(temporada)
    classificacao_cat = {}
    jogos_cat = {}
    artilharia_cat = {}
    for cat in ["Sub-7", "Sub-8", "Sub-9", "Sub-10"]:
        ev_id = eventos.get(cat)
        if ev_id:
            classificacao_cat[cat] = parse_classificacao(ev_id)
            jogos_cat[cat] = parse_jogos(ev_id)
            artilharia_cat[cat] = parse_artilharia(ev_id)
        else:
            classificacao_cat[cat] = []
            jogos_cat[cat] = []
            artilharia_cat[cat] = []
            
    ranking = calcular_ranking_eficiencia(temporada)
    
    agora = datetime.utcnow().isoformat()
    if str(temporada) not in _LAST_SYNC:
        _LAST_SYNC[str(temporada)] = agora
        
    res = {
        "temporada": temporada,
        "atualizado_em": _LAST_SYNC.get(str(temporada), agora),
        "classificacao": classificacao_cat,
        "ranking_eficiencia": ranking,
        "jogos": jogos_cat,
        "artilharia": artilharia_cat,
    }
    
    # Persiste na base local para que todas as próximas consultas sejam instantâneas
    salvar_dados_locais(temporada, res)
    _CACHE[cache_key] = res
    return res

def sincronizar_temporada(temporada: int = 2026) -> Dict[str, Any]:
    _CACHE.clear()
    _LAST_SYNC[str(temporada)] = datetime.utcnow().isoformat()
    dados = obter_dados_completos(temporada, forcar_atualizacao=True)
    return {
        "status": "ok",
        "temporada": temporada,
        "mensagem": f"Temporada {temporada} sincronizada com sucesso com a FPFS e salva no banco local!",
        "sincronizado_em": dados["atualizado_em"]
    }

ATLETAS_DIR = os.path.join(DATA_DIR, "atletas")
os.makedirs(ATLETAS_DIR, exist_ok=True)

def obter_ficha_atleta(
    temporada: int = 2026,
    categoria: str = "Sub-7",
    id_jogador: Optional[int] = None,
    id_fase: Optional[int] = None,
    nome_atleta: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    dados = obter_dados_completos(temporada)
    artilheiros = dados.get("artilharia", {}).get(categoria, [])
    ranking = dados.get("ranking_eficiencia", [])
    jogos_cat = dados.get("jogos", {}).get(categoria, [])
    
    pos_map = {c["clube"].upper(): c for c in ranking}
    
    atleta_info = None
    for a in artilheiros:
        if id_jogador and a.get("id_jogador") == id_jogador:
            atleta_info = a
            break
        if nome_atleta and a.get("nome", "").strip().upper() == nome_atleta.strip().upper():
            atleta_info = a
            break
            
    if not atleta_info and nome_atleta:
        n_busca = nome_atleta.strip().upper()
        for a in artilheiros:
            if n_busca in a.get("nome", "").upper() or a.get("nome", "").upper() in n_busca:
                atleta_info = a
                break

    if not atleta_info:
        return None

    atleta_id_jog = atleta_info.get("id_jogador") or id_jogador
    atleta_id_fase = atleta_info.get("id_fase") or id_fase

    if not atleta_id_jog or not atleta_id_fase:
        return None

    cache_file = os.path.join(ATLETAS_DIR, f"atleta_{temporada}_{atleta_id_jog}_{atleta_id_fase}.json")
    jogos_raw = None

    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                jogos_raw = json.load(f)
        except Exception:
            jogos_raw = None

    if jogos_raw is None:
        try:
            url = f"{BASE_URL}/api/artilharia/fase/{atleta_id_jog}/{atleta_id_fase}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                jogos_raw = json.loads(resp.read().decode("utf-8"))
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(jogos_raw, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[SCRAPER] Erro ao consultar API de artilharia do atleta {atleta_id_jog}: {e}")
            jogos_raw = []

    clube_atleta_nome = atleta_info["clube"]
    total_gols = 0
    gols_casa = 0
    gols_fora = 0
    dobletes = 0
    hat_tricks = 0
    gols_isolados = 0
    gols_ouro = 0
    gols_prata = 0
    gols_bronze = 0
    
    vitimas_map: Dict[str, Dict[str, Any]] = {}
    historico_jogos = []

    for item in jogos_raw:
        gols_partida = item.get("gols", 0)
        total_gols += gols_partida
        dt = item.get("dt_jogo", "")
        rodada_num = item.get("rodada", 0)
        gols1 = item.get("gols1", 0)
        gols2 = item.get("gols2", 0)
        
        partida_oficial = None
        for j in jogos_cat:
            if j.get("placar_mandante") == gols1 and j.get("placar_visitante") == gols2:
                jm = j.get("mandante", "").upper()
                jv = j.get("visitante", "").upper()
                if clube_atleta_nome.upper() in jm or clube_atleta_nome.upper() in jv:
                    partida_oficial = j
                    break

        if partida_oficial:
            mandante_nome = partida_oficial["mandante"]
            visitante_nome = partida_oficial["visitante"]
            escudo_m = partida_oficial["escudo_mandante"]
            escudo_v = partida_oficial["escudo_visitante"]
            ginasio = partida_oficial.get("ginasio", "")
            data_formatada = partida_oficial.get("data", dt)
            rodada_label = formatar_rodada(partida_oficial.get("rodada", f"{rodada_num}ª Rodada"))
            
            if mandante_nome.upper() == clube_atleta_nome.upper():
                mando = "Casa"
                adversario_nome = visitante_nome
                adversario_escudo = escudo_v
            else:
                mando = "Fora"
                adversario_nome = mandante_nome
                adversario_escudo = escudo_m
        else:
            mandante_nome = f"Mandante ({gols1})"
            visitante_nome = f"Visitante ({gols2})"
            escudo_m = "/fpfs_shield.png"
            escudo_v = "/fpfs_shield.png"
            ginasio = ""
            data_formatada = dt
            rodada_label = formatar_rodada(f"{rodada_num}ª Rodada")
            mando = "Casa"
            adversario_nome = "Adversário"
            adversario_escudo = "/fpfs_shield.png"

        if mando == "Casa":
            gols_casa += gols_partida
        else:
            gols_fora += gols_partida
            
        if gols_partida == 1:
            gols_isolados += 1
        elif gols_partida == 2:
            dobletes += 1
        elif gols_partida >= 3:
            hat_tricks += 1

        adv_info = pos_map.get(adversario_nome.upper())
        adv_pos = adv_info["posicao"] if adv_info else None
        adv_chave = adv_info["chave"] if adv_info else "BRONZE"
        
        if adv_chave == "OURO":
            gols_ouro += gols_partida
        elif adv_chave == "PRATA":
            gols_prata += gols_partida
        else:
            gols_bronze += gols_partida

        if adversario_nome not in vitimas_map:
            vitimas_map[adversario_nome] = {
                "adversario": adversario_nome,
                "escudo_url": adversario_escudo,
                "posicao": adv_pos,
                "chave": adv_chave,
                "gols": 0,
                "jogos": 0,
            }
        vitimas_map[adversario_nome]["gols"] += gols_partida
        vitimas_map[adversario_nome]["jogos"] += 1

        historico_jogos.append({
            "rodada": rodada_label,
            "data": data_formatada,
            "hora": item.get("hora_jogo", ""),
            "mando": mando,
            "mandante": mandante_nome,
            "escudo_mandante": escudo_m,
            "visitante": visitante_nome,
            "escudo_visitante": escudo_v,
            "placar": f"{gols1} x {gols2}",
            "gols_atleta": gols_partida,
            "adversario": adversario_nome,
            "adversario_escudo": adversario_escudo,
            "adversario_posicao": adv_pos,
            "adversario_chave": adv_chave,
            "ginasio": ginasio,
        })

    historico_jogos.reverse()
    maiores_vitimas = sorted(vitimas_map.values(), key=lambda x: (x["gols"], x["jogos"]), reverse=True)
    
    tabela_cat = dados.get("classificacao", {}).get(categoria, [])
    clube_tabela = next((c for c in tabela_cat if c["clube"].upper() == clube_atleta_nome.upper()), None)
    jogos_totais_clube = clube_tabela["jogos"] if clube_tabela else max(len(jogos_raw), 1)

    jogos_com_gol = len(jogos_raw)
    freq_pct = round((jogos_com_gol / float(jogos_totais_clube) * 100.0), 1) if jogos_totais_clube > 0 else 0.0
    media_gols = round(total_gols / float(jogos_com_gol), 2) if jogos_com_gol > 0 else 0.0

    pct_casa = round((gols_casa / float(total_gols) * 100.0), 1) if total_gols > 0 else 0.0
    pct_fora = round((gols_fora / float(total_gols) * 100.0), 1) if total_gols > 0 else 0.0

    return {
        "atleta": {
            "id_jogador": atleta_id_jog,
            "id_fase": atleta_id_fase,
            "nome": atleta_info["nome"],
            "foto_url": atleta_info["foto_url"],
            "clube": atleta_info["clube"],
            "clube_completo": atleta_info.get("clube_completo", atleta_info["clube"]),
            "escudo_url": atleta_info["escudo_url"],
            "posicao_ranking": atleta_info["posicao"],
            "categoria": categoria,
            "temporada": temporada,
        },
        "estatisticas": {
            "total_gols": total_gols,
            "jogos_com_gol": jogos_com_gol,
            "jogos_totais_clube": jogos_totais_clube,
            "frequencia_gols_pct": freq_pct,
            "media_gols_jogo": media_gols,
            "gols_casa": gols_casa,
            "gols_fora": gols_fora,
            "pct_gols_casa": pct_casa,
            "pct_gols_fora": pct_fora,
            "dobletes": dobletes,
            "hat_tricks": hat_tricks,
            "gols_isolados": gols_isolados,
            "gols_chave_ouro": gols_ouro,
            "gols_chave_prata": gols_prata,
            "gols_chave_bronze": gols_bronze,
        },
        "maiores_vitimas": maiores_vitimas,
        "historico_jogos": historico_jogos,
    }
