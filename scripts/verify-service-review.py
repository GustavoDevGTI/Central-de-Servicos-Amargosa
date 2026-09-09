import json
import re
import subprocess
import unicodedata
from pathlib import Path
from collections import Counter
import pdfplumber
from PIL import Image, ImageOps, ImageDraw
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
pdf = root / 'output/pdf/servicos-amargosa-revisao-paginas-finais.pdf'
services = json.loads((root / 'tmp/service-review/services.json').read_text(encoding='utf-8'))
audit = json.loads((root / 'tmp/service-review/audit.json').read_text(encoding='utf-8'))
def norm(t):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD',t).encode('ascii','ignore').decode().lower())
reader = PdfReader(pdf)
page_by_uri = {}
for number, page in enumerate(reader.pages):
    for annotation in page.get('/Annots', []):
        action = annotation.get_object().get('/A', {})
        uri = action.get('/URI', '')
        if uri and str(uri).startswith('https://maisdigital.amargosa.ba.gov.br/servicos/'):
            page_by_uri.setdefault(str(uri), []).append(number)
for service in services:
    if not service.get('slug'): continue
    uri = 'https://maisdigital.amargosa.ba.gov.br/servicos/' + service['slug']
    matching = [reader.pages[i].extract_text() for i in page_by_uri.get(uri, [])]
    texts = [norm(t) for t in matching if norm(service['title']) in norm(t)]
    assert texts, ('Ficha sem página ou link', service['id'])
    values = [service.get(k, '') for k in ['summary', 'eligibility', 'cost', 'duration', 'whereWhen', 'notice', 'noticeAction']]
    values += service.get('documents', []) + service.get('steps', [])
    for value in values:
        if value:
            assert any(norm(value) in text for text in texts), ('Conteúdo ausente na ficha', service['id'], value)
with pdfplumber.open(pdf) as d:
    pages = [p.extract_text(layout=False) or '' for p in d.pages]
    total = len(audit) + sum(bool(s.get('slug')) and s['id'] not in {a['id'] for a in audit} for s in services)
    assert len(pages) == 1 + (total+1)//2, (len(pages),total)
    assert sum(t.count('Página criada na Central') for t in pages[1:]) == sum(bool(s.get('slug')) for s in services)
    full = norm(' '.join(pages))
    for s in services:
        if not s.get('slug'): continue
        assert norm(s['title']) in full, s['title']
        # Compare content independently from layout, which can interleave columns.
        for field in ['summary','eligibility','cost','duration']:
            text = s.get(field,'')
            words = text.split()
            for word in words:
                if len(norm(word)) > 3: assert norm(word) in full, (s['id'],field,word)
    min_sizes=[]
    for p in d.pages[1:]:
        chars=p.chars
        assert all(-.5 <= c['x0'] and c['x1'] <= p.width+.5 and -.5 <= c['top'] and c['bottom'] <= p.height+.5 for c in chars)
        min_sizes.append(min(c['size'] for c in chars if c['text'].strip()))
    print(json.dumps({'pages':len(pages),'services':total,'tagged':sum(bool(s.get('slug')) for s in services),'new':sum(s.get('reviewCreated',False) for s in services),'min_font':round(min(min_sizes),2)},ensure_ascii=False))
out = root/'tmp/service-review/render'
out.mkdir(parents=True,exist_ok=True)
poppler = Path('C:/Users/gustavoborges/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
subprocess.run([str(poppler),'-scale-to','1200','-png',str(pdf),str(out/'page')],check=True)
images = sorted(out.glob('page-*.png'))
for offset in range(0,len(images),12):
    board=Image.new('RGB',(1200,1700),'#d4d9d6')
    draw=ImageDraw.Draw(board)
    for i,p in enumerate(images[offset:offset+12]):
        im=Image.open(p).convert('RGB'); im.thumbnail((290,530))
        x=(i%4)*300+(300-im.width)//2; y=(i//4)*566+22
        board.paste(im,(x,y)); draw.text(((i%4)*300+10,(i//4)*566+4),str(offset+i+1),fill='black')
    board.save(out/f'contact-{offset//12+1}.png')
