from pathlib import Path
from html.parser import HTMLParser
import urllib.request, urllib.error, urllib.parse, xml.etree.ElementTree as ET, json, re, concurrent.futures, time, sys, hashlib
if len(sys.argv) != 3:
 raise SystemExit('Usage: python3 scripts/audit-release-pages.py ORIGIN OUTPUT_DIRECTORY')
expected=json.loads(Path('package.json').read_text())['version']
origin=sys.argv[1].rstrip('/')
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
class Page(HTMLParser):
 def __init__(self):super().__init__();self.skip=0;self.text=[];self.links=[];self.title=False;self.titles=[];self.canonical=None
 def handle_starttag(self,t,a):
  a=dict(a)
  if t in ('script','style'):self.skip+=1
  if t=='title':self.title=True
  if t=='a' and a.get('href'):self.links.append(a['href'])
  if t=='link' and a.get('rel')=='canonical':self.canonical=a.get('href')
 def handle_endtag(self,t):
  if t in ('script','style'):self.skip=max(0,self.skip-1)
  if t=='title':self.title=False
 def handle_data(self,s):
  if not self.skip and s.strip():self.text.append(s.strip())
  if self.title:self.titles.append(s)
def fetch(path):
 for attempt in range(3):
  try:
   req=urllib.request.Request(origin+path,headers={'User-Agent':'PolicyWatcher consistency audit (read-only)'})
   with urllib.request.urlopen(req,timeout=30) as r:body=r.read().decode();status=r.status;final=r.url
   p=Page();p.feed(body);text='\n'.join(p.text)
   key=hashlib.sha256(path.encode()).hexdigest()[:16];(out/(key+'.txt')).write_text(text)
   return {'path':path,'status':status,'finalUrl':final,'title':' '.join(p.titles),'canonical':p.canonical,'releaseFooters':re.findall(r'(?:Release|Versione|Build)\s+v([\w.\-]+)',text),'versionMentions':sorted(set(re.findall(r'(?<!\d)[345]\.\d+\.\d+(?:[- ](?:beta|Beta)[. ]\d+)?',text))),'staleCurrent':re.findall(r'(?i)(?:Current|Corrente)(?:\s+beta|\s*·)?\s*(?:v)?4\.\S+|Current [Bb]eta',text),'links':p.links,'textFile':key+'.txt','applicationError':'Application error:' in text}
  except urllib.error.HTTPError as e:
   if e.code==429 and attempt<2:time.sleep(15);continue
   return {'path':path,'status':e.code}
  except Exception as e:return {'path':path,'error':str(e)}
xml=urllib.request.urlopen(origin+'/sitemap.xml',timeout=30).read();(out/'sitemap.xml').write_bytes(xml)
urls=[e.text for e in ET.fromstring(xml).iter() if e.tag.endswith('}loc')]
paths=set(urllib.parse.urlsplit(u).path+('?' + urllib.parse.urlsplit(u).query if urllib.parse.urlsplit(u).query else '') for u in urls)
# Supplement sitemap with every concrete public app route; dynamic records are covered by sitemap.
for f in Path('src/app').rglob('page.tsx'):
 p='/'+str(f.parent.relative_to('src/app'));p='/' if p=='/.' else p
 if not any(x in p for x in ['[','(','/admin']):paths.add(p)
rows=list(concurrent.futures.ThreadPoolExecutor(max_workers=2).map(fetch,sorted(paths)))
(out/'routes.json').write_text(json.dumps(rows,indent=2))
summary={'origin':origin,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'sitemapUrls':len(urls),'total':len(rows),'http200':sum(r.get('status')==200 for r in rows),'errors':[r for r in rows if r.get('status')!=200 or r.get('applicationError')],'staleCurrent':[{'path':r['path'],'text':r.get('staleCurrent')} for r in rows if r.get('staleCurrent')],'oldBuilds':[{'path':r['path'],'versions':r.get('releaseFooters')} for r in rows if any(v!=expected for v in r.get('releaseFooters',[]))]}
(out/'summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
