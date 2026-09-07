import json

with open('a10_clubs.json', 'r', encoding='utf-8') as f:
    clubs = json.load(f)

print(f'Total clubs found: {len(clubs)}')
clube_list = []
for c in clubs:
    src = c['src']
    if not src.startswith('http'):
        src = 'https://www.a10sports.com.br' + src
    alt = c['alt'] or c['parent_text'] or ''
    if 'escudo/' in src:
        clube_list.append({'name': alt, 'url': src})

print(f'Clube list with escudo/: {len(clube_list)}')
for item in clube_list:
    print(f"{item['name']:30} -> {item['url']}")

with open('escudos_mapeados.json', 'w', encoding='utf-8') as f:
    json.dump(clube_list, f, indent=2, ensure_ascii=False)
