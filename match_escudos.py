import json
import urllib.request
import re

# Buscar tabela da FPFS
with urllib.request.urlopen('http://localhost:8000/api/campeonatos/tabela?temporada=2026&categoria=Sub-7') as res:
    data = json.loads(res.read().decode())

fpfs_clubs = [c['clube'] for c in data['classificacao']]
print(f"Total FPFS clubs: {len(fpfs_clubs)}")

with open('frontend/public/escudos/escudos_index.json', 'r', encoding='utf-8') as f:
    escudos = json.load(f)

print(f"Total escudos index: {len(escudos)}")

# Normalizador
def norm(text):
    text = text.upper()
    text = re.sub(r'[????]', 'A', text)
    text = re.sub(r'[???]', 'E', text)
    text = re.sub(r'[???]', 'I', text)
    text = re.sub(r'[????]', 'O', text)
    text = re.sub(r'[???]', 'U', text)
    text = re.sub(r'[?]', 'C', text)
    text = re.sub(r'[^A-Z0-9\s]', ' ', text)
    return ' '.join(text.split())

mapping = {}
unmatched = []

for fpfs_name in fpfs_clubs:
    fpfs_norm = norm(fpfs_name)
    best_match = None
    
    # 1. Match exato ou contido
    for esc_name, path in escudos.items():
        esc_norm = norm(esc_name)
        if esc_norm and (esc_norm == fpfs_norm or esc_norm in fpfs_norm or fpfs_norm in esc_norm):
            best_match = path
            break
            
    # 2. Palavras-chave espec?ficas
    if not best_match:
        keywords = {
            'CORINTHIANS': 'corinthians',
            'PALMEIRAS': 'palmeiras',
            'SANTOS': 'santos',
            'SAO PAULO': 'saopaulo',
            'JUVENTUS': 'juventus',
            'MAGNUS': 'amagn2',
            'CAMISA 10': 'camisa10',
            'BOLA NO PE': 'bolanope',
            'YPIRANGA': 'caypiranga',
            'MESC': 'mesc',
            'BATEBOLA': 'batebola',
            'TAUBATE': 'taubate',
            'UNIAO RD': 'uniaord',
            'SANCAETANENSE': 'ESCUDO_DOS_TIMES_2026',
            'SANTO ANDRE': 'safc',
            'PORTUGUESA': 'portuguesa',
            'PULO': 'pulofutsal',
            'WIMPRO': 'wimpro',
            'GREMETAL': 'gremetal',
            'LAUSANNE': 'lausanne',
            'OCIAN': 'ocian',
            'AUDAX': 'audax',
            'BATALHA': 'batalha',
            'GUARULHENSE': 'guarulhense',
            'INDAIATUBA': 'indaiatuba',
            'ITAPEVI': 'itapevi',
            'MOGI': 'mogidascruzes',
            'CAMPINAS': 'pumas',
            'OSASCO': 'audax',
        }
        for kw, filename in keywords.items():
            if kw in fpfs_norm:
                for k, p in escudos.items():
                    if filename.lower() in p.lower():
                        best_match = p
                        break
                if best_match:
                    break
    
    if best_match:
        mapping[fpfs_name] = best_match
        print(f"  [OK] {fpfs_name:40} -> {best_match}")
    else:
        unmatched.append(fpfs_name)
        print(f"  [??] {fpfs_name:40} -> NAO ENCONTRADO")

print(f"\nMapeados: {len(mapping)} / {len(fpfs_clubs)}")
if unmatched:
    print("Nao mapeados:", unmatched)

with open('frontend/public/escudos/club_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(mapping, f, indent=2, ensure_ascii=False)
