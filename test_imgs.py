import urllib.request
from bs4 import BeautifulSoup

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
url = 'https://www.a10sports.com.br/campeonato/paulista-iniciacao-a1'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

soup = BeautifulSoup(html, 'html.parser')
imgs = soup.find_all('img')
print(f'Total imgs: {len(imgs)}')
for img in imgs[:25]:
    print(img)
