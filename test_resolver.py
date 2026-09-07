import json
import re

with open('frontend/public/escudos/club_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

def resolver_escudo(nome_clube):
    if not nome_clube:
        return "/fpfs_shield.png"
        
    # Check exact match
    for k, v in mapping.items():
        if k.lower() == nome_clube.lower() or nome_clube.lower() in k.lower() or k.lower() in nome_clube.lower():
            return v
            
    # Keywords
    nome = re.sub(r'[^a-zA-Z0-9]', ' ', nome_clube).upper()
    keywords = [
        ('PALMEIRAS', '/escudos/palmeiras.png'),
        ('CORINTHIANS', '/escudos/corinthians.png'),
        ('SAO PAULO', '/escudos/s_o_paulo.png'),
        ('SANTOS', '/escudos/santos.png'),
        ('JUVENTUS', '/escudos/juventus.png'),
        ('MAGNUS', '/escudos/magnus.png'),
        ('SOROCABA', '/escudos/magnus.png'),
        ('ASF', '/escudos/magnus.png'),
        ('CAMISA 10', '/escudos/camisa_10.png'),
        ('BOLA NO PE', '/escudos/bola_no_p_.png'),
        ('YPIRANGA', '/escudos/ca_ypiranga.png'),
        ('MESC', '/escudos/mesc.png'),
        ('BATEBOLA', '/escudos/batebola.png'),
        ('TAUBATE', '/escudos/taubat_.png'),
        ('UNIAO RD', '/escudos/uni_o_rd.png'),
        ('SANCAETAN', '/escudos/liga_s_o_caetano.png'),
        ('SAO CAETANO', '/escudos/rsfc.png'),
        ('SANTO ANDRE', '/escudos/ad_santo_andr_.png'),
        ('PORTUGUESA', '/escudos/portuguesa.png'),
        ('PULO', '/escudos/pulo_futsal.png'),
        ('CAMPINAS', '/escudos/pulo_futsal.png'),
        ('WIMPRO', '/escudos/wimpro.png'),
        ('GREMETAL', '/escudos/gremetal.png'),
        ('LAUSANNE', '/escudos/lausanne_paulista.png'),
        ('OCIAN', '/escudos/ocian.png'),
        ('AUDAX', '/escudos/audax.png'),
        ('OSASCO', '/escudos/audax.png'),
        ('BATALHA', '/escudos/batalha.png'),
        ('GUARULHENSE', '/escudos/guarulhense.png'),
        ('INDAIATUBA', '/escudos/indaiatuba.png'),
        ('ITAPEVI', '/escudos/itapevi.png'),
        ('MOGI', '/escudos/mogi_das_cruzes.png'),
        ('HORTOLANDIA', '/escudos/hortol_ndia.png'),
        ('TABUCA', '/escudos/tabuca_juniors.png'),
        ('OLIMPIK', '/escudos/olimpik.png'),
        ('OLE', '/escudos/pumas.png'),
        ('PUMAS', '/escudos/pumas.png'),
    ]
    for kw, path in keywords:
        if kw in nome:
            return path
            
    return "/fpfs_shield.png"

# Teste com os 24 clubes
for k in mapping.keys():
    resolved = resolver_escudo(k)
    print(f"{k[:40]:40} -> {resolved}")
