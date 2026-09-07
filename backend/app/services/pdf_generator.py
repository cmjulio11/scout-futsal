import os
import shutil
import tempfile
import subprocess
import base64
from datetime import datetime
from typing import Dict, Any, Optional

def encontrar_executavel_navegador() -> Optional[str]:
    candidatos = [
        # Linux (Docker / Render / Ubuntu)
        shutil.which("chromium"),
        shutil.which("google-chrome"),
        shutil.which("chromium-browser"),
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome",
        # Windows
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        shutil.which("chrome"),
        shutil.which("msedge"),
    ]
    for c in candidatos:
        if c and os.path.exists(c):
            return c
    return None

def _resolver_imagem_b64(caminho_rel: Optional[str]) -> str:
    if not caminho_rel:
        return ""
    if str(caminho_rel).startswith("data:") or str(caminho_rel).startswith("http"):
        return caminho_rel
    clean = str(caminho_rel).lstrip("/").replace("/", os.sep)
    
    # Diretórios prováveis para localizar os escudos e imagens públicas
    pastas_candidatas = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "public")),
        r"c:\Temp\Scout_Futsal_Iniciacao\frontend\public",
    ]
    
    for base in pastas_candidatas:
        abs_path = os.path.join(base, clean)
        if os.path.exists(abs_path):
            try:
                with open(abs_path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("utf-8")
                    mime = "image/png" if abs_path.endswith(".png") else "image/jpeg"
                    return f"data:{mime};base64,{b64}"
            except Exception:
                pass
    return caminho_rel

def _render_html_para_pdf(html: str) -> bytes:
    browser_exe = encontrar_executavel_navegador()
    if not browser_exe:
        raise RuntimeError("Nenhum navegador compatível encontrado no servidor para renderizar o PDF.")

    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f_html:
        f_html.write(html)
        html_path = f_html.name

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f_pdf:
        pdf_path = f_pdf.name

    try:
        # Flags essenciais para execução estável em containers Linux/Render e Windows
        cmd = f'"{browser_exe}" --headless=new --no-pdf-header-footer --no-sandbox --disable-dev-shm-usage --disable-gpu --print-to-pdf="{pdf_path}" "{html_path}"'
        subprocess.run(cmd, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with open(pdf_path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(html_path):
            try:
                os.remove(html_path)
            except Exception:
                pass
        if os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except Exception:
                pass

def gerar_pdf_atleta(ficha: Dict[str, Any]) -> bytes:
    atleta = ficha.get("atleta", {})
    stats = ficha.get("estatisticas", {})
    vitimas = ficha.get("maiores_vitimas", [])
    jogos = ficha.get("historico_jogos", [])
    
    agora_str = datetime.now().strftime("%d/%m/%Y às %H:%M")
    
    vitimas_html = "".join([
        f'''<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 10px; display: flex; justify-content: space-between; align-items: center;">
            <div style="min-width: 0;">
                <p style="margin: 0; font-weight: 700; color: #0f172a; font-size: 11px;">{v.get("adversario")}</p>
                <p style="margin: 2px 0 0 0; font-size: 9px; color: #64748b;">{v.get("posicao", "")}º colocado • {v.get("chave", "")}</p>
            </div>
            <span style="background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; border-radius: 4px; padding: 2px 6px; font-weight: 900; font-size: 11px; white-space: nowrap;">
                {v.get("gols")} {("gol" if v.get("gols") == 1 else "gols")}
            </span>
        </div>'''
        for v in vitimas[:6]
    ])
    
    jogos_html = "".join([
        f'''<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <span style="font-weight: 800; color: #2563eb; font-size: 10px; text-transform: uppercase;">{j.get("rodada")} • {j.get("data")}</span>
                <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: 700; color: #0f172a;">{j.get("mandante")} x {j.get("visitante")}</p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">{j.get("mando")} • {j.get("ginasio") or "Ginásio Oficial"}</p>
            </div>
            <div style="text-align: right; display: flex; gap: 8px; align-items: center;">
                <span style="font-family: monospace; font-weight: bold; font-size: 12px; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; color: #0f172a;">
                    {j.get("placar")}
                </span>
                <span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-weight: 900; font-size: 11px; padding: 4px 8px; border-radius: 6px; white-space: nowrap;">
                    ⚽ {j.get("gols_atleta")} {("gol" if j.get("gols_atleta") == 1 else "gols")}
                </span>
            </div>
        </div>'''
        for j in jogos
    ])

    html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
  @page {{ size: A4 portrait; margin: 8mm 10mm; }}
  * {{ box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #0f172a; background: #ffffff; }}
  .header {{ border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }}
  .title {{ font-size: 18px; font-weight: 900; margin: 2px 0; color: #0f172a; }}
  .sub {{ font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }}
  .card {{ background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; }}
  .grid-4 {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }}
  .metric-card {{ background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px; text-align: center; }}
  .metric-label {{ font-size: 9px; font-weight: bold; text-transform: uppercase; }}
  .metric-value {{ font-size: 18px; font-weight: 900; color: #0f172a; margin: 2px 0; }}
  .metric-sub {{ font-size: 9px; color: #64748b; }}
  .section-title {{ font-size: 10px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 12px 0 6px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; display: flex; justify-content: space-between; }}
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="sub">FPFS • SÉRIE A1 ESTADUAL DE INICIAÇÃO • TEMPORADA {ficha.get("temporada", 2026)}</div>
      <div class="title">Ficha Técnica Individual do Atleta</div>
      <div style="font-size: 11px; color: #475569;">{atleta.get("clube")} • Categoria {atleta.get("categoria")} • Documento Oficial FPFS</div>
    </div>
    <div style="text-align: right; font-size: 9px; color: #64748b;">
      <div style="font-weight: 800; color: #1e293b; font-size: 10px;">Intelligent Futsal Scout</div>
      <div>Emissão Direta do Servidor</div>
      <div>{agora_str}</div>
    </div>
  </div>

  <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 9px; font-weight: bold; padding: 2px 8px; border-radius: 4px;">
        {atleta.get("categoria")} • FPFS SÉRIE A1
      </span>
      <h2 style="font-size: 18px; font-weight: 900; margin: 4px 0 2px 0; color: #0f172a;">{atleta.get("nome")}</h2>
      <div style="font-size: 12px; font-weight: bold; color: #334155;">
        {atleta.get("clube")} • <span style="color: #b45309;">{atleta.get("posicao_ranking")}º Artilheiro Geral</span>
      </div>
    </div>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 18px; border-radius: 12px; text-align: center;">
      <div style="font-size: 9px; font-weight: bold; color: #1e40af; text-transform: uppercase;">Total de Gols</div>
      <div style="font-size: 28px; font-weight: 900; color: #1e3a8a; line-height: 1;">{stats.get("total_gols")}</div>
      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">na temporada</div>
    </div>
  </div>

  <div class="grid-4">
    <div class="metric-card">
      <div class="metric-label" style="color: #2563eb;">Frequência</div>
      <div class="metric-value">{stats.get("frequencia_gols_pct")}%</div>
      <div class="metric-sub">{stats.get("jogos_com_gol")} de {stats.get("jogos_totais_clube")} jogos</div>
    </div>
    <div class="metric-card">
      <div class="metric-label" style="color: #d97706;">Média</div>
      <div class="metric-value">{stats.get("media_gols_jogo")}</div>
      <div class="metric-sub">gols / jogo c/ gol</div>
    </div>
    <div class="metric-card">
      <div class="metric-label" style="color: #2563eb;">Em Casa</div>
      <div class="metric-value">{stats.get("gols_casa")} <span style="font-size: 11px; font-weight: normal; color: #64748b;">({stats.get("pct_gols_casa")}%)</span></div>
      <div class="metric-sub">no próprio ginásio</div>
    </div>
    <div class="metric-card">
      <div class="metric-label" style="color: #d97706;">Fora de Casa</div>
      <div class="metric-value">{stats.get("gols_fora")} <span style="font-size: 11px; font-weight: normal; color: #64748b;">({stats.get("pct_gols_fora")}%)</span></div>
      <div class="metric-sub">como visitante</div>
    </div>
  </div>

  <!-- PERFIL DE FINALIZAÇÃO -->
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; margin-bottom: 12px;">
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
      <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #1e293b;">🔥 Perfil de Finalização & Letalidade</span>
      <span style="font-size: 9px; color: #64748b;">Distribuição dos {stats.get("total_gols")} gols</span>
    </div>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center;">
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;">
        <div style="font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase;">Dobletes (2 gols)</div>
        <div style="font-size: 13px; font-weight: 900; color: #2563eb;">{stats.get("dobletes")} jogos</div>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;">
        <div style="font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase;">Hat-tricks (3+)</div>
        <div style="font-size: 13px; font-weight: 900; color: #d97706;">{stats.get("hat_tricks")} jogos</div>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;">
        <div style="font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase;">Gols Top 8 (Ouro)</div>
        <div style="font-size: 13px; font-weight: 900; color: #0f172a;">{stats.get("gols_chave_ouro")} gols</div>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;">
        <div style="font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase;">Prata / Bronze</div>
        <div style="font-size: 13px; font-weight: 900; color: #475569;">{(stats.get("gols_chave_prata") or 0) + (stats.get("gols_chave_bronze") or 0)} gols</div>
      </div>
    </div>
  </div>

  <div class="section-title">
    <span>🎯 Maiores Vítimas ({len(vitimas)} clubes vazados)</span>
  </div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;">
    {vitimas_html}
  </div>

  <div class="section-title">
    <span>📅 Histórico de Partidas em que Marcou ({len(jogos)} jogos)</span>
    <span style="font-weight: normal; color: #64748b;">Mais recentes primeiro</span>
  </div>
  <div>
    {jogos_html}
  </div>

  <div style="margin-top: 16px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
    <span>Dados oficiais catalogados da Federação Paulista de Futsal (FPFS)</span>
    <span>Intelligent Futsal Scout • Relatório Gerado pelo Servidor</span>
  </div>
</body>
</html>'''

    return _render_html_para_pdf(html)


def gerar_pdf_confronto(confronto_dados: Dict[str, Any], jogo_info: Optional[Dict[str, Any]] = None) -> bytes:
    m_info = confronto_dados.get("mandante", {}).get("info", {})
    v_info = confronto_dados.get("visitante", {}).get("info", {})
    m_mando = confronto_dados.get("mandante", {}).get("estatisticas_mando", {}).get("casa", {})
    v_mando = confronto_dados.get("visitante", {}).get("estatisticas_mando", {}).get("fora", {})
    sub_comp = confronto_dados.get("sub_categorias", [])
    v_art = confronto_dados.get("visitante", {}).get("principais_artilheiros", [])
    m_ultimos = confronto_dados.get("mandante", {}).get("ultimos_jogos", [])
    v_ultimos = confronto_dados.get("visitante", {}).get("ultimos_jogos", [])

    temporada = confronto_dados.get("temporada", 2026)
    agora_str = datetime.now().strftime("%d/%m/%Y às %H:%M")

    fpfs_logo_b64 = _resolver_imagem_b64("/fpfs_shield.png")
    m_escudo_b64 = _resolver_imagem_b64(m_info.get("escudo_url"))
    v_escudo_b64 = _resolver_imagem_b64(v_info.get("escudo_url"))

    # Jogo info contextual
    ji = jogo_info or {}
    rodada_txt = ji.get("rodada") or "23ª Rodada"
    data_txt = ji.get("data") or "Próximo Confronto"
    hora_txt = f" • {ji.get('hora')}" if ji.get("hora") else ""
    ginasio_txt = f" • {ji.get('ginasio')}" if ji.get("ginasio") else ""
    contexto_jogo = f"{rodada_txt} • {data_txt}{hora_txt}{ginasio_txt}"

    # Raio-X Subs
    sub_html = "".join([
        f'''<div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 9px; font-weight: 800; color: #1e40af; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">
                {item.get('categoria')}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px;">
                <span style="color: #0f172a; font-weight: 700;">{item.get('mandante', {}).get('posicao', '-')}º ({item.get('mandante', {}).get('pontos', 0)}p)</span>
                <span style="color: #64748b; font-size: 8px;">x</span>
                <span style="color: #0f172a; font-weight: 700;">{item.get('visitante', {}).get('posicao', '-')}º ({item.get('visitante', {}).get('pontos', 0)}p)</span>
            </div>
            <div style="font-size: 8px; color: #475569; font-weight: bold;">
                {item.get('mandante', {}).get('chave', '-')} x {item.get('visitante', {}).get('chave', '-')}
            </div>
        </div>'''
        for item in sub_comp
    ])

    # Artilheiros adversários perigosos
    artilheiros_v_html = "".join([
        f'''<div style="flex: 1; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 5px 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 8px; font-weight: 800; color: #be123c; background: #ffe4e6; padding: 1px 4px; border-radius: 3px;">{a.get('categoria', 'Iniciação')}</span>
                <span style="font-size: 11px; font-weight: 900; color: #9f1239;">⚽ {a.get('gols', 0)} gols</span>
            </div>
            <div style="font-size: 10px; font-weight: 800; color: #0f172a; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {a.get('nome', 'Atleta')}
            </div>
            <div style="font-size: 8px; color: #be123c; font-weight: bold; margin-top: 2px;">
                {("⚠️ " + str(a.get('gols_contra_adversario')) + " gols contra nós") if a.get('marcou_contra_adversario') else "Destaque ofensivo"}
            </div>
        </div>'''
        for a in v_art[:3]
    ]) if v_art else '<div style="color: #64748b; font-size: 9px; padding: 4px;">Nenhum artilheiro em destaque catalogado.</div>'

    # Últimos 5 jogos
    def _render_ultimos(jogos_lista):
        itens = []
        for j in jogos_lista[:5]:
            res = str(j.get("resultado", "-")).upper()
            res_cor = "#16a34a" if res == "V" else ("#d97706" if res == "E" else "#dc2626")
            adv = str(j.get("adversario", ""))[:9]
            itens.append(f'''<div style="display: inline-flex; align-items: center; gap: 3px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 5px; margin-right: 3px; margin-bottom: 3px; font-size: 8px;">
                <span style="background: {res_cor}; color: #ffffff; font-weight: 900; font-size: 8px; padding: 1px 3px; border-radius: 2px;">{res}</span>
                <span style="font-weight: bold; color: #0f172a;">{j.get("placar", "-")}</span>
                <span style="color: #64748b; font-size: 7.5px;">vs {adv}</span>
            </div>''')
        return "".join(itens) if itens else '<span style="font-size: 8px; color: #94a3b8;">Sem histórico recente</span>'

    m_ultimos_html = _render_ultimos(m_ultimos)
    v_ultimos_html = _render_ultimos(v_ultimos)

    html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: A4 portrait;
    margin: 6mm 8mm;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
    color: #0f172a;
    background: #ffffff;
    font-size: 10px;
    line-height: 1.2;
  }}
  .badge {{
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
  }}
  .badge-ouro {{ background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }}
  .badge-prata {{ background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }}
  .badge-bronze {{ background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }}
  .table-box {{
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }}
  .table-box th {{
    background: #f1f5f9;
    color: #475569;
    font-weight: 800;
    text-transform: uppercase;
    font-size: 8px;
    padding: 4px 6px;
    border: 1px solid #cbd5e1;
    text-align: center;
  }}
  .table-box td {{
    padding: 4px 6px;
    border: 1px solid #cbd5e1;
    text-align: center;
    font-weight: 600;
  }}
</style>
</head>
<body>

  <!-- 1. CABEÇALHO OFICIAL DO CONFRONTO -->
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <img src="{fpfs_logo_b64}" style="width: 32px; height: 32px; object-fit: contain;" />
      <div>
        <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
          FPFS • FEDERAÇÃO PAULISTA DE FUTSAL • SÉRIE A1 INICIAÇÃO ({temporada})
        </div>
        <div style="font-size: 15px; font-weight: 900; color: #0f172a; letter-spacing: -0.3px;">
          DOSSIÊ TÁTICO PRÉ-JOGO — RELATÓRIO DE PRANCHETA
        </div>
      </div>
    </div>
    <div style="text-align: right; font-size: 8px; color: #64748b;">
      <div style="font-weight: 800; color: #0f172a; font-size: 9px;">Intelligent Futsal Scout</div>
      <div>Emissão Oficial: {agora_str}</div>
    </div>
  </div>

  <!-- BANNER DO CONFRONTO (MANDANTE X VISITANTE) -->
  <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
    <!-- Mandante -->
    <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
      <img src="{m_escudo_b64}" style="width: 34px; height: 34px; object-fit: contain;" />
      <div>
        <span style="font-size: 8px; font-weight: 800; color: #2563eb; text-transform: uppercase; background: #eff6ff; padding: 1px 4px; border-radius: 3px;">🏠 Mandante</span>
        <div style="font-size: 13px; font-weight: 900; color: #0f172a;">{m_info.get('clube', 'Mandante')}</div>
        <div style="font-size: 8.5px; color: #475569; font-weight: bold;">
          {m_info.get('posicao', '-')}º Lugar • Chave {m_info.get('chave', '-')} • {m_info.get('pontos_total', 0)} pts
        </div>
      </div>
    </div>

    <!-- Centro: VS & Contexto -->
    <div style="text-align: center; padding: 0 10px;">
      <span style="font-size: 16px; font-weight: 900; color: #dc2626; background: #fee2e2; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 6px;">VS</span>
      <div style="font-size: 8px; color: #475569; font-weight: bold; margin-top: 3px;">
        {contexto_jogo}
      </div>
    </div>

    <!-- Visitante -->
    <div style="display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; text-align: right;">
      <div>
        <span style="font-size: 8px; font-weight: 800; color: #d97706; text-transform: uppercase; background: #fef3c7; padding: 1px 4px; border-radius: 3px;">✈️ Visitante</span>
        <div style="font-size: 13px; font-weight: 900; color: #0f172a;">{v_info.get('clube', 'Visitante')}</div>
        <div style="font-size: 8.5px; color: #475569; font-weight: bold;">
          {v_info.get('posicao', '-')}º Lugar • Chave {v_info.get('chave', '-')} • {v_info.get('pontos_total', 0)} pts
        </div>
      </div>
      <img src="{v_escudo_b64}" style="width: 34px; height: 34px; object-fit: contain;" />
    </div>
  </div>

  <!-- 2. TERMÔMETRO DO TORNEIO UNIÃO (LADO A LADO) -->
  <div style="margin-bottom: 6px;">
    <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #1e293b; margin-bottom: 3px; display: flex; justify-content: space-between;">
      <span>🏆 Termômetro Geral — Torneio União (Série A1)</span>
      <span style="font-weight: normal; color: #64748b;">Agregação oficial das 4 categorias</span>
    </div>
    <table class="table-box">
      <thead>
        <tr>
          <th style="text-align: left;">Clube</th>
          <th>Pos</th>
          <th>Chave</th>
          <th>Pontos</th>
          <th>Jogos</th>
          <th>V</th>
          <th>E</th>
          <th>D</th>
          <th>SG</th>
          <th>Índice Téc.</th>
          <th>Dif. Líder</th>
          <th>Margem Degola</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background: #ffffff;">
          <td style="text-align: left; font-weight: 800; color: #0f172a;">{m_info.get('clube')} (M)</td>
          <td><strong>{m_info.get('posicao')}º</strong></td>
          <td><span class="badge badge-{str(m_info.get('chave', '')).lower()}">{m_info.get('chave')}</span></td>
          <td style="color: #2563eb; font-weight: 900;">{m_info.get('pontos_total')}</td>
          <td>{m_info.get('jogos_total')}</td>
          <td>{m_info.get('vitorias_total')}</td>
          <td>{m_info.get('empates_total')}</td>
          <td>{m_info.get('derrotas_total')}</td>
          <td>{m_info.get('saldo_gols_total')}</td>
          <td style="font-weight: 900; color: #0f172a;">{m_info.get('indice_tecnico')}</td>
          <td style="color: #d97706;">-{m_info.get('diferenca_lider')}p</td>
          <td style="color: #16a34a; font-weight: 800;">+{m_info.get('margem_rebaixamento')}p</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="text-align: left; font-weight: 800; color: #0f172a;">{v_info.get('clube')} (V)</td>
          <td><strong>{v_info.get('posicao')}º</strong></td>
          <td><span class="badge badge-{str(v_info.get('chave', '')).lower()}">{v_info.get('chave')}</span></td>
          <td style="color: #2563eb; font-weight: 900;">{v_info.get('pontos_total')}</td>
          <td>{v_info.get('jogos_total')}</td>
          <td>{v_info.get('vitorias_total')}</td>
          <td>{v_info.get('empates_total')}</td>
          <td>{v_info.get('derrotas_total')}</td>
          <td>{v_info.get('saldo_gols_total')}</td>
          <td style="font-weight: 900; color: #0f172a;">{v_info.get('indice_tecnico')}</td>
          <td style="color: #d97706;">-{v_info.get('diferenca_lider')}p</td>
          <td style="color: #16a34a; font-weight: 800;">+{v_info.get('margem_rebaixamento')}p</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 3. RAIO-X POR CATEGORIA (SUB-7 AO SUB-10) -->
  <div style="margin-bottom: 6px;">
    <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #1e293b; margin-bottom: 3px;">
      ⚡ Raio-X por Categoria (Sub-7 a Sub-10 que Jogam no Dia)
    </div>
    <div style="display: flex; gap: 5px;">
      {sub_html}
    </div>
  </div>

  <!-- 4. FATOR MANDO DE QUADRA (CASA VS FORA) -->
  <div style="margin-bottom: 6px;">
    <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #1e293b; margin-bottom: 3px;">
      🏟️ Fator Mando de Quadra & Desempenho Real (Casa vs Fora)
    </div>
    <div style="display: flex; gap: 6px;">
      <!-- Mandante em Casa -->
      <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px;">
          <span style="font-size: 9px; font-weight: 800; color: #2563eb;">{m_info.get('clube')} em Casa</span>
          <span style="font-size: 11px; font-weight: 900; color: #1e40af;">{m_mando.get('aproveitamento', 0)}% Aprov.</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: #334155;">
          <span><strong>{m_mando.get('jogos', 0)}</strong> jogos ({m_mando.get('vitorias', 0)}V - {m_mando.get('empates', 0)}E - {m_mando.get('derrotas', 0)}D)</span>
          <span>Média GP: <strong>{m_mando.get('media_gols_pro', 0)}</strong> • GC: <strong>{m_mando.get('media_gols_contra', 0)}</strong> (SG: {m_mando.get('saldo_gols', 0)})</span>
        </div>
      </div>

      <!-- Visitante Fora -->
      <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px;">
          <span style="font-size: 9px; font-weight: 800; color: #d97706;">{v_info.get('clube')} Fora de Casa</span>
          <span style="font-size: 11px; font-weight: 900; color: #b45309;">{v_mando.get('aproveitamento', 0)}% Aprov.</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: #334155;">
          <span><strong>{v_mando.get('jogos', 0)}</strong> jogos ({v_mando.get('vitorias', 0)}V - {v_mando.get('empates', 0)}E - {v_mando.get('derrotas', 0)}D)</span>
          <span>Média GP: <strong>{v_mando.get('media_gols_pro', 0)}</strong> • GC: <strong>{v_mando.get('media_gols_contra', 0)}</strong> (SG: {v_mando.get('saldo_gols', 0)})</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 5. RADAR DE AMEAÇAS OFENSIVAS DO ADVERSÁRIO -->
  <div style="margin-bottom: 6px;">
    <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #be123c; margin-bottom: 3px; display: flex; justify-content: space-between;">
      <span>🔥 Atenção na Marcação — Principais Goleadores do {v_info.get('clube')}</span>
      <span style="color: #64748b; font-size: 8px;">Monitoramento individual FPFS</span>
    </div>
    <div style="display: flex; gap: 6px;">
      {artilheiros_v_html}
    </div>
  </div>

  <!-- 6. MOMENTO RECENTE (ÚLTIMOS JOGOS) -->
  <div style="margin-bottom: 6px;">
    <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #1e293b; margin-bottom: 3px;">
      📈 Sequência Recente (Últimas Partidas na FPFS)
    </div>
    <div style="display: flex; gap: 6px;">
      <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 6px;">
        <span style="font-size: 8.5px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 2px;">{m_info.get('clube')}:</span>
        <div>{m_ultimos_html}</div>
      </div>
      <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 6px;">
        <span style="font-size: 8.5px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 2px;">{v_info.get('clube')}:</span>
        <div>{v_ultimos_html}</div>
      </div>
    </div>
  </div>

  <!-- 7. ESPAÇO PRANCHETA TÉCNICA (ANOTAÇÕES DO TREINADOR) -->
  <div style="border: 1.5px dashed #94a3b8; border-radius: 8px; background: #fafafa; padding: 6px 10px; margin-top: 4px;">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px;">
      <span style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #0f172a;">
        📋 Anotações Táticas da Preleção & Prancheta de Jogo
      </span>
      <span style="font-size: 8px; color: #64748b;">Assinatura Comissão: ____________________</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8.5px; color: #64748b;">
      <div>
        <p style="margin: 0 0 2px 0; font-weight: bold; color: #334155;">Instrução de Saída de Bola & Pressão:</p>
        <div style="border-bottom: 1px dotted #cbd5e1; height: 11px;"></div>
        <div style="border-bottom: 1px dotted #cbd5e1; height: 11px;"></div>
      </div>
      <div>
        <p style="margin: 0 0 2px 0; font-weight: bold; color: #334155;">Bolas Paradas & Foco Defensivo:</p>
        <div style="border-bottom: 1px dotted #cbd5e1; height: 11px;"></div>
        <div style="border-bottom: 1px dotted #cbd5e1; height: 11px;"></div>
      </div>
    </div>
  </div>

  <!-- RODAPÉ -->
  <div style="margin-top: 4px; display: flex; justify-content: space-between; font-size: 7.5px; color: #94a3b8;">
    <span>Dados oficiais da Federação Paulista de Futsal (FPFS) • Intelligent Futsal Scout</span>
    <span>Documento Técnico Gerado pelo Servidor • Página 1 de 1</span>
  </div>

</body>
</html>'''

    return _render_html_para_pdf(html)

