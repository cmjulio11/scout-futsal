import json
import urllib.request
import os
import re

# Carregar escudos mapeados do a10
with open('escudos_mapeados.json', 'r', encoding='utf-8') as f:
    a10_list = json.load(f)

# Criar pasta no frontend/public/escudos
os.makedirs('frontend/public/escudos', exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

saved = {}
for item in a10_list:
    name = item['name'].strip()
    url = item['url']
    if not name or not url.endswith(('.png', '.jpg', '.jpeg', '.webp')):
        continue
    
    # Criar filename limpo
    clean_name = re.sub(r'[^a-zA-Z0-9]', '_', name).lower()
    filename = f"{clean_name}.png"
    filepath = os.path.join('frontend/public/escudos', filename)
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp, open(filepath, 'wb') as out:
            out.write(resp.read())
        saved[name.upper()] = f"/escudos/{filename}"
    except Exception as e:
        print(f"Erro ao baixar {name} ({url}): {e}")

print(f"Total de escudos baixados com sucesso: {len(saved)}")

with open('frontend/public/escudos/escudos_index.json', 'w', encoding='utf-8') as f:
    json.dump(saved, f, indent=2, ensure_ascii=False)

print("Exemplo de escudos salvos:")
for k in list(saved.keys())[:15]:
    print(f"  {k} -> {saved[k]}")
