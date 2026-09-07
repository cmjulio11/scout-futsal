import urllib.request
from bs4 import BeautifulSoup
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
url = 'https://www.a10sports.com.br/campeonato/paulista-iniciacao-a1'
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Pegar todos os escudos e nomes nessa p?gina do campeonato
    clubs = {}
    for img in soup.find_all('img'):
        src = img.get('src', '')
        alt = img.get('alt', '').strip()
        title = img.get('title', '').strip()
        name = alt or title
        if 'escudo' in src.lower() and name:
            full_src = src if src.startswith('http') else 'https://www.a10sports.com.br' + src
            clubs[name.upper()] = full_src
    
    print(f'Total clubs with escudos on championship page: {len(clubs)}')
    for name, src in sorted(clubs.items()):
        print(f'{name} -> {src}')
        
    with open('paulista_a1_escudos.json', 'w', encoding='utf-8') as f:
        json.dump(clubs, f, indent=2, ensure_ascii=False)
except Exception as e:
    print('Erro:', e)
