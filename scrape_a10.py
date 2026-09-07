import urllib.request
import re
from bs4 import BeautifulSoup
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
req = urllib.request.Request('https://www.a10sports.com.br/clubes', headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
    
    soup = BeautifulSoup(html, 'html.parser')
    
    clubs = []
    # Procurar todos os elementos que cont?m clubes
    for img in soup.find_all('img'):
        src = img.get('src', '')
        alt = img.get('alt', '')
        title = img.get('title', '')
        parent = img.parent
        parent_text = parent.get_text(strip=True) if parent else ''
        if 'escudo' in src.lower() or 'clube' in src.lower() or 'time' in src.lower() or 'upload' in src.lower():
            clubs.append({
                'src': src,
                'alt': alt,
                'title': title,
                'parent_text': parent_text,
                'parent_tag': parent.name if parent else ''
            })
    
    print(f'Total clubs/shields found: {len(clubs)}')
    for c in clubs[:30]:
        print(c)
        
    with open('a10_clubs.json', 'w', encoding='utf-8') as f:
        json.dump(clubs, f, indent=2, ensure_ascii=False)
        
except Exception as e:
    print('Erro:', e)
