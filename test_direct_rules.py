import json
import os

with open('frontend/public/escudos/escudos_index.json', 'r', encoding='utf-8') as f:
    escudos = json.load(f)

# Procurar arquivos reais na pasta
files = os.listdir('frontend/public/escudos')

def find_file(prefix):
    for f in files:
        if prefix.lower() in f.lower() and f.endswith('.png'):
            return f"/escudos/{f}"
    return None

direct_rules = {
    "SE PALMEIRAS": find_file("palmeiras"),
    "S?O PAULO FC - A": find_file("s_o_paulo") or find_file("saopaulo"),
    "S.C. CORINTHIANS PAULISTA PTA.": find_file("corinthians"),
    "SANTOS FC": find_file("santos"),
    "C.A. JUVENTUS": find_file("juventus"),
    "A.D. BATEBOLA": find_file("batebola"),
    "S?O CAETANO FC - RSFC": find_file("rsfc"),
    "PULO FUTSAL CAMPINAS": find_file("pulo_futsal"),
    "CAMISA 10 F.C. A": find_file("camisa_10"),
    "ASSOCIA??O DESPORTIVA DO ABCD - MESC S?O BERNARDO": find_file("mesc"),
    "LIGA SANCAETANENSE DE F.S.": find_file("liga_s") or find_file("s_o_caetano"),
    "LAUSANNE PAULISTA FC - A": find_file("lausanne"),
    "OLE BRASIL SOCIETY QUADRA ESPORTIVA LTDA ME - OLE BRASIL SOCIETY": find_file("bonsdebola") or find_file("c13") or "/fpfs_shield.png",
    "UNI?O RD": find_file("uni_o_rd"),
    "ASSOCIA??O ESPORTIVA CENTRO DE TREINAMENTO BOLA NO P?": find_file("bola_no_p_") or find_file("bolanope"),
    "ASSOCIA??O PORTUGUESA DE DESPORTOS": find_file("portuguesa"),
    "ASSOCIA??O DESPORTIVA OLIMPIK | ATIVO": find_file("olimpik"),
    "CLUBE ATL?TICO YPIRANGA | C.A. YPIRANGA": find_file("ypiranga"),
    "FAE/OSASCO/AUDAX": find_file("audax"),
    "TAUBAT?  FUTSAL": find_file("taubat_"),
    "PROSPERE / HORTOLANDIA": find_file("hortol_ndia"),
    "C.A. TABUCA JRS": find_file("tabuca"),
    "A.D. INDAIATUBA": find_file("indaiatuba"),
    "ASSOCIA??O SOROCABANA DE FUTSAL - ASF/MAGNU": find_file("magnus"),
}

print("Mapeamento Oficial de 24 Clubes:")
for club, path in direct_rules.items():
    print(f"  {club:55} -> {path}")

with open('frontend/public/escudos/club_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(direct_rules, f, indent=2, ensure_ascii=False)
