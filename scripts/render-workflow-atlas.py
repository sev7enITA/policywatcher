#!/usr/bin/env python3
"""Render the checked-in workflow model locally. Requires Graphviz; no network."""
from pathlib import Path
import base64, html, json, re, subprocess, textwrap, xml.etree.ElementTree as ET
from urllib.parse import quote
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/architecture/engine-workflow-atlas'
MODEL = json.loads((OUT / 'model.json').read_text())
EXPECTED_DIAGRAM_IDS = {'end_to_end','task_status','review_status','outbox_status','sequence','declared_foreign_keys','application_references'}
if not re.fullmatch(r'[a-f0-9]{40}', MODEL.get('checkpoint','')): raise ValueError('Invalid immutable source checkpoint')
ids = [item.get('id') for item in MODEL.get('diagrams',[])]
if len(ids) != 7 or set(ids) != EXPECTED_DIAGRAM_IDS: raise ValueError('Unexpected or duplicate diagram identifiers')
q = lambda value: json.dumps(str(value), ensure_ascii=False)
esc = html.escape
SUMMARIES = {row['id']: row for row in MODEL['atlasSummariesIt']}
COLORS = {'private':'#e6f8f5','hold':'#fff3dd','publish':'#ecebff','storage':'#eaf2ff'}

def dot_render(name, nodes, edges, direction='TB'):
    lines = ['digraph G {', f'graph [rankdir={direction}, bgcolor="transparent", pad="0.18", nodesep="0.28", ranksep="0.52", splines=polyline];',
             'node [shape=box, style="rounded,filled", fillcolor="#ffffff", color="#cbd5e1", fontname="Arial", fontsize=12, margin="0.17,0.12"];',
             'edge [color="#8593ab", arrowsize="0.7", fontname="Arial", fontsize=10];']
    for key, node in nodes.items():
        label = '\n'.join(textwrap.wrap(node['label'], 32))
        fill = COLORS.get(node.get('type'), '#ffffff')
        shape = 'diamond' if node.get('diamond') else 'box'
        lines.append(f'{key} [id={q(name+"--"+key)}, label={q(label)}, fillcolor={q(fill)}, shape={q(shape)}];')
    for left, right, label, dashed in edges:
        lines.append(f'{left} -> {right} [label={q(chr(10).join(textwrap.wrap(label,30)))}, style={q("dashed" if dashed else "solid")}];')
    lines.append('}'); source = '\n'.join(lines)
    (OUT / (name + '.dot')).write_text(source + '\n')
    svg = subprocess.run(['dot','-Tsvg'], input=source, capture_output=True, text=True, check=True).stdout
    svg = svg[svg.index('<svg'):]
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
    tree = ET.fromstring(svg)
    for element in tree.iter():
        identifier = element.attrib.get('id')
        if identifier and not identifier.startswith(name + '--'): element.set('id', name + '--' + identifier)
    svg = ET.tostring(tree, encoding='unicode')
    (OUT / (name + '.svg')).write_text(svg)
    if name == 'overview':
        result = subprocess.run(['dot','-Tpng','-Gdpi=130'], input=source.encode(), capture_output=True, check=True)
        (OUT / 'overview.png').write_bytes(result.stdout)
    return svg

def flow_graph(source):
    nodes, edges = {}, []
    atom = r'(\w+)(?:\[([^\]]*)\]|\{([^}]*)\})?'
    pattern = re.compile(r'^\s*'+atom+r'\s*(-\.->|-->)\s*(?:\|([^|]*)\|)?\s*'+atom)
    for line in source.splitlines():
        match = pattern.match(line)
        if not match: continue
        a, al, ad, arrow, label, b, bl, bd = match.groups()
        for key, label_, diamond in [(a, al or ad, bool(ad)), (b, bl or bd, bool(bd))]:
            if key not in nodes: nodes[key] = {'label':label_ or key}
            elif label_: nodes[key]['label'] = label_
            if diamond: nodes[key]['diamond'] = True
            if key in ['Hold','Candidate','Verify']: nodes[key]['type'] = 'hold'
            if key.startswith('Private') or key == 'Review': nodes[key]['type'] = 'private'
            if key in ['PublicCommit','PublicBaseline','Anchor']: nodes[key]['type'] = 'publish'
        edges.append((a,b,label or '',arrow=='-.->'))
    return nodes, edges

def state_graph(source):
    nodes, edges = {}, []
    for line in source.splitlines():
        match = re.match(r'\s*(\[\*\]|\w+)\s*-->\s*(\[\*\]|\w+)\s*(?::\s*(.*))?',line)
        if not match: continue
        a,b,label = match.groups(); a = 'start' if a=='[*]' else a; b = 'end' if b=='[*]' else b
        for key in [a,b]: nodes[key] = {'label':key, 'type':'hold' if key in ['failed','pending','blocked'] else 'private' if key in ['observed','completed'] else 'storage'}
        edges.append((a,b,label or '',False))
    return nodes,edges

def fk_graph(source):
    nodes,edges={},[]
    for line in source.splitlines():
        match=re.match(r'\s*(\w+)\s+([^ ]+)\s+(\w+)\s*:\s*(.*)',line)
        if not match:continue
        a,card,b,label=match.groups();nodes[a]={'label':a,'type':'storage'};nodes[b]={'label':b,'type':'storage'}
        cardinality={'||--o{':'1 -> 0..N','||--o|':'1 -> 0..1','o|--o{':'0..1 -> 0..N'}.get(card,card)
        edges.append((a,b,label+'  '+cardinality,False))
    return nodes,edges

def sequence_svg(source):
    actors=[];events=[]
    for line in source.splitlines():
        m=re.match(r'\s*participant (\w+) as (.*)',line)
        if m:actors.append((m[1],m[2]))
        m=re.match(r'\s*(\w+)(-->>|->>)(\w+):\s*(.*)',line)
        if m:events.append(m.groups())
    width=1400;step=width/len(actors);height=180+len(events)*78
    pieces=[f'<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sequenza logica e confini atomici" viewBox="0 0 {width} {height}"><defs><marker id="sequence-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#6366f1"/></marker></defs>']
    positions={key:(i+.5)*step for i,(key,_) in enumerate(actors)}
    for key,label in actors:
        x=positions[key];pieces += [f'<rect x="{x-step*.44}" y="18" width="{step*.88}" height="58" rx="9" fill="#eef2ff" stroke="#a5b4fc"/>', f'<text x="{x}" y="44" text-anchor="middle" font-family="Arial" font-size="12" fill="#1e293b">']
        for j,part in enumerate(textwrap.wrap(label,20)):pieces.append(f'<tspan x="{x}" dy="{16 if j else 0}">{esc(part)}</tspan>')
        pieces += ['</text>',f'<path d="M{x},86 V{height-40}" stroke="#cbd5e1" stroke-dasharray="4 6"/>']
    for i,(a,kind,b,label) in enumerate(events):
        y=124+i*78;x1=positions[a];x2=positions[b]
        if label.startswith('S15'):pieces.append(f'<rect x="5" y="{y-29}" width="{width-10}" height="75" rx="8" fill="#eaf2ff"/>')
        if a==b:pieces.append(f'<path d="M{x1},{y} h45 v23 h-45" fill="none" stroke="#6366f1" marker-end="url(#sequence-arrow)"/>')
        else:
            dash = 'stroke-dasharray="5 4"' if kind == '-->>' else ''
            pieces.append(f'<path d="M{x1},{y+19} H{x2}" stroke="#6366f1" stroke-width="1.6" {dash} marker-end="url(#sequence-arrow)"/>')
        center=max(190,min(width-190,(x1+x2)/2));parts=textwrap.wrap(label,74)
        for j,part in enumerate(parts[:3]):pieces.append(f'<text x="{center}" y="{y-9+j*14}" text-anchor="middle" font-family="Arial" font-size="11.5" fill="#334155">{esc(part)}</text>')
    pieces.append('</svg>');svg=''.join(pieces);(OUT/'sequence.svg').write_text(svg);return svg

OVERVIEW_NODES={
 'entry':{'label':'1. Richiesta autorizzata'},'queue':{'label':'2. Coda persistente e lease','type':'storage'},
 'capture':{'label':'3. Acquisizione e artefatto privato'},'checks':{'label':'4. Identità, inventario V2, link e prove','diamond':True},
 'hold':{'label':'Sospensione: prove mancanti o incerte','type':'hold'},'private':{'label':'Observe: risultati privati','type':'private'},
 'confirm':{'label':'5. Contesto, conferma e confronto'},'waiting':{'label':'Attesa altra cattura: task completato, non fonte qualificata','type':'hold'},'mode':{'label':'Modalità del run','diamond':True},'models':{'label':'6. Analista, span e verificatore'},
 'review':{'label':'Revisione: impatto alto o esito incerto','type':'hold'},'publication':{'label':'7. Gate pubblicabile: V2 e zero allegati','diamond':True,'type':'publish'},
 'commit':{'label':'8. Transazione DB: snapshot, change, claim, graph/evento opzionali','type':'storage'},
 'notify':{'label':'9. Outbox separata: consenso e consegna'},
}
OVERVIEW_EDGES=[('entry','queue','',False),('queue','capture','',False),('capture','checks','',False),('checks','hold','non idoneo alla modalità richiesta',False),('checks','confirm','parent modificato e confrontabile',False),('confirm','waiting','conferma non ancora disponibile',False),('confirm','models','confermato; delta non solo formattazione',False),('models','review','hold richiesto',False),('models','mode','span e verifica superati',False),('mode','private','observe',False),('mode','publication','publish: ricontrollo di tutti i gate',False),('publication','hold','non pubblicabile',False),('publication','commit','prove sufficienti e contesto valido',False),('commit','notify','solo notifiche abilitate',False)]
SVGS={'overview':dot_render('overview',OVERVIEW_NODES,OVERVIEW_EDGES)}
for item in MODEL['diagrams']:
    key=item['id'];source=item['mermaid'];(OUT/(key+'.mmd')).write_text(source+'\n')
    if key=='sequence':svg=sequence_svg(source)
    elif key=='declared_foreign_keys':svg=dot_render(key,*fk_graph(source),'LR')
    elif key in ['task_status','review_status','outbox_status']:svg=dot_render(key,*state_graph(source),'LR')
    else:svg=dot_render(key,*flow_graph(source),'LR' if key=='application_references' else 'TB')
    SVGS[key]=svg

briefs={'waiting':('Attesa di conferma','La prima cattura conclude il task con conferma in attesa. Serve una futura invocazione esterna che crei un nuovo run; non è una fonte qualificata.'),'mode':('Modalità del run','Observe conserva risultati e claim privati. Publish richiede controlli aggiuntivi già alla valutazione e nuovamente prima del commit.'),'entry':('Ingresso autorizzato','Cron e pannello admin possono accodare lavoro. La risposta di accettazione non significa scansione già eseguita.'),'queue':('Persistenza e controllo del lavoro','Chiavi idempotenti, dipendenze, CAS, token di lease e generazione impediscono commit di task cancellati o superati.'),'capture':('Una copia verificabile','Trasporto, byte, testo e artefatto hanno prove diverse. Un HTTP 200 o un hash locale non certificano una policy intera.'),'checks':('Copertura rispetto al riferimento','Il riferimento è revisionato separatamente. Si confrontano blocchi, sezioni, occorrenze, ordine, link e allegati, senza autenticare automaticamente l’editore.'),'hold':('Una sospensione conserva le prove','Il task può essere completato con un esito di revisione. Fonte qualificata e capacità giornaliera restano misure separate.'),'private':('Observe mantiene l’isolamento','Nessuna nuova baseline pubblica, PolicyChange o notifica. Anche allegati perfettamente corrispondenti restano in osservazione.'),'confirm':('Conferma e contesto','Una rappresentazione modificata richiede una seconda cattura in un run diverso, almeno un’ora dopo. Un 304 non conferma un cambiamento.'),'models':('Interpretazione supportata','Gli span devono corrispondere ai testi conservati e coprire i delta. Il verificatore ha identità distinta; ciò non prova indipendenza scientifica.'),'review':('Supervisione senza deroghe','Una persona può ispezionare e fermare il processo, ma non approvare una prova mancante. Rebaseline è una richiesta di due nuove catture, non adozione immediata.'),'publication':('Gate della pubblicazione','Inventario V2 corrispondente, zero allegati attesi e gli altri vincoli soddisfatti. È una capacità implementata, non attivata da questo atlante.'),'commit':('Atomicità locale','Le modifiche autorevoli, l’eventuale proiezione canonica con dual-write attivo e l’eventuale evento outbox vengono salvati insieme nel database; nessuna chiamata di rete entra nella transazione.'),'notify':('Consegna separata','L’outbox ricontrolla pubblicazione, consenso e preferenze. La presa in carico SMTP non garantisce consegna esattamente una volta.')}
MODEL['overviewDetails']={key:{'title':t,'text':v} for key,(t,v) in briefs.items()}
tabs=[('overview','Panoramica')]+[(r['id'],r['title']) for r in MODEL['atlasSummariesIt']]+[('gates',str(len(MODEL['gates']))+' controlli'),('audit','Audit e limiti')]
buttons=''.join(f'<button class="tab" role="tab" aria-selected="{str(i==0).lower()}" data-tab="{key}" id="tab-{key}">{esc(title)}</button>' for i,(key,title) in enumerate(tabs))
panels=[]
for key,title in tabs:
    if key in SVGS:
        summary='Percorso compatto di un documento principale modificato e confrontabile dopo una baseline esistente. Baseline iniziale, 304, replay e riuso delle analisi sono nello schema completo. Seleziona un nodo per scopo e limiti.' if key=='overview' else SUMMARIES[key]['summary']
        downloads=f'<a href="{key}.svg" download>SVG</a>' + (f'<a href="{key}.mmd" download>Mermaid</a>' if key!='overview' else '<a href="overview.png" download>PNG</a>')
        note='Linee continue: relazioni dichiarate in Prisma, in una vista selettiva. I vincoli effettivi del database online non sono stati verificati in questo audit.' if key=='declared_foreign_keys' else 'Linee tratteggiate: riferimenti applicativi; il nome Id non crea una foreign key.' if key=='application_references' else 'Le distanze della sequenza non rappresentano tempi misurati.' if key=='sequence' else 'Delivered indica fanout registrato, oppure presa in carico del destinatario (anche senza invio quando il consenso non è più valido). Non è prova della ricezione dell’email.' if key=='outbox_status' else 'Codice del candidato: non rappresenta il motore attualmente in produzione.'
        sourceblock=f'<details><summary>Sorgente Mermaid verificabile</summary><pre>{esc(next(r["mermaid"] for r in MODEL["diagrams"] if r["id"]==key))}</pre></details>' if key!='overview' else ''
        panels.append(f'<section class="panel {"active" if key=="overview" else ""}" id="panel-{key}" role="tabpanel" aria-labelledby="tab-{key}"><div class="section-head"><div><p class="eyebrow">SCHEMA DEL WORKFLOW</p><h2>{esc(title)}</h2></div><div class="exports">{downloads}</div></div><p class="description">{esc(summary)}</p><p class="mobile-hint">Su schermi piccoli scorri lo schema in orizzontale, oppure apri il file SVG.</p><div class="figure-wrap" data-view="{key}">{SVGS[key]}</div><p class="figure-note">{esc(note)}</p>{sourceblock}</section>')
    elif key=='gates':
        rows=''.join('<tr><td>'+esc(g['gate'])+'</td><td>'+esc(g['branch'])+'</td><td>'+esc(g['condition'])+'</td><td><code>'+esc(g['sources'])+'</code></td></tr>' for g in MODEL['gates'])
        panels.append('<section class="panel" id="panel-gates" role="tabpanel" aria-labelledby="tab-gates"><p class="eyebrow">CONDIZIONI, NON PERCENTUALI DI CERTEZZA</p><h2>28 controlli del codice</h2><p class="description">Matrice ricostruita dal codice, con fonti. Non è una dichiarazione di 28 prove live né una certificazione dell’intera pipeline.</p><div class="table-scroll"><table><thead><tr><th>Controllo</th><th>Percorso</th><th>Condizione</th><th>Fonte</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>')
    else:
        cards=''.join('<article class="finding"><span class="severity">'+f['severity']+'</span><h3>'+esc(f['title'])+'</h3><p><b>Prima:</b> '+esc(f['before'])+'</p><p><b>Dopo:</b> '+esc(f['after'])+'</p><small>Controllo negativo: '+esc(f['test'])+'</small></article>' for f in MODEL['findings'])
        limits=''.join('<li>'+esc(t)+'</li>' for t in MODEL['limits'])
        panels.append('<section class="panel" id="panel-audit" role="tabpanel" aria-labelledby="tab-audit"><p class="eyebrow">RIESAME E PROVE</p><h2>Cinque discrepanze corrette</h2><p class="description">Tre agenti separati hanno verificato codice e schemi. Due modelli cloud gratuiti e Qwen locale hanno fornito pareri, verificati e anche respinti. I modelli non hanno eseguito test e non certificano il risultato.</p><div class="findings">'+cards+'</div><h3>Limiti ancora aperti</h3><ul class="limits">'+limits+'</ul><p>Le prime risposte cloud erano parziali; il riesame focalizzato è completo. Quattro generazioni verificate: costo API totale 0 USD. Il riepilogo dei pareri distingue osservazioni, controprove e decisioni.</p></section>')
def source_links(value):
    text=str(value);parts=[];last=0
    pattern=r'([A-Za-z0-9_/.-]+\.(?:tsx?|prisma)):(\d+)'
    engine_names={'store.ts','pipeline.ts','acquisition.ts','coverage.ts','claims.ts','claimLedger.ts','outbox.ts','hostedWorker.ts','document.ts'}
    for match in re.finditer(pattern,text):
        path,line=match.group(1),int(match.group(2));relative=path
        if path in engine_names:relative='src/lib/engine/'+path
        elif path.startswith('api/'):relative='src/app/'+path
        elif '/' not in path and path.endswith('.ts'):relative='src/lib/'+path
        target=ROOT/relative;parts.append(esc(text[last:match.start()]))
        if target.is_file() and 0<line<=len(target.read_text().splitlines()):
            href='https://github.com/sev7enITA/policywatcher/blob/'+MODEL['checkpoint']+'/'+quote(relative,safe='/')+'#L'+str(line)
            parts.append('<a target="_blank" rel="noopener" href="'+esc(href)+'">'+esc(match.group(0))+'</a>')
        else:parts.append(esc(match.group(0)))
        last=match.end()
    parts.append(esc(text[last:]));return ''.join(parts)
source_rows=''.join('<tr><th>'+esc(str(k))+'</th><td>'+source_links(v)+'</td></tr>' for k,v in MODEL['edgeSourceRows'].items())
logo=base64.b64encode((ROOT/'public/logo-mark.png').read_bytes()).decode()
page=r'''<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>PolicyWatcher: atlante del workflow verificato</title><link rel="icon" href="data:image/png;base64,__LOGO__"><style>
:root{--ink:#0f172a;--body:#334155;--muted:#64748b;--line:#e2e8f0;--brand:#6366f1;--cyan:#06b6d4;--paper:#f8fafc}*{box-sizing:border-box}body{margin:0;color:var(--body);background:var(--paper);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,select{font:inherit}button,a,select{outline-offset:4px}a{color:#4f46e5}button{cursor:pointer}.shell{max-width:1500px;margin:auto;padding:26px 34px 50px}.top{display:flex;align-items:center;gap:13px;justify-content:space-between}.brand{display:flex;align-items:center;gap:12px;font-weight:750;color:var(--ink)}.brand img{width:42px;height:42px;object-fit:contain}.brand small{display:block;color:var(--muted);font-size:11px;font-weight:600;letter-spacing:.13em}.tag{border:1px solid #c7d2fe;border-radius:100px;padding:5px 12px;color:#4338ca;background:#eef2ff;font-size:12px}.hero{margin:38px 0 28px;max-width:1030px}.eyebrow{font-size:11px;font-weight:750;letter-spacing:.15em;color:#6366f1;margin:0 0 10px}h1,h2,h3{color:var(--ink);line-height:1.14}h1{font-size:clamp(31px,4vw,54px);letter-spacing:-.045em;margin:0 0 20px;font-weight:750}h1 span{color:var(--brand)}.lede{font-size:18px;max-width:900px;color:#475569}.boundary{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}.boundary span{padding:5px 11px;border:1px solid var(--line);border-radius:6px;background:white;font-size:12px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:27px}.stat{padding:18px 21px;border:1px solid var(--line);background:white;border-radius:13px}.stat strong{font-size:29px;display:block;color:var(--ink);letter-spacing:-.035em}.stat small{display:block;color:var(--muted);font-size:12px}.tabs{display:flex;gap:6px;overflow:auto;padding:0 0 13px;scrollbar-width:thin}.tab{flex-shrink:0;border:1px solid var(--line);background:white;padding:9px 13px;border-radius:8px;color:#475569;font-size:13px}.tab[aria-selected=true]{background:#4f46e5;border-color:#4f46e5;color:white}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:19px}.canvas{min-width:0}.panel{display:none;background:white;border:1px solid var(--line);border-radius:16px;padding:27px;box-shadow:0 2px 8px #0f172a04}.panel.active{display:block}.section-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}h2{font-size:25px;letter-spacing:-.025em;margin:0 0 14px}.description{font-size:14px;color:#64748b;margin:0 0 20px;max-width:820px}.exports{display:flex;gap:8px}.exports a{font-size:12px;text-decoration:none;padding:5px 8px;border:1px solid var(--line);border-radius:6px}.mobile-hint{display:none;font-size:11px;color:#64748b}.figure-wrap{overflow:auto;border:1px solid #edf0f7;border-radius:10px;background:linear-gradient(135deg,#fcfcff,white);padding:12px;min-width:0}.figure-wrap svg{display:block;width:100%;height:auto;min-height:200px}.figure-wrap.zoom svg{width:170%;max-width:none}.figure-note{font-size:11px;color:#64748b}.node{cursor:pointer}.node:focus path,.node:focus polygon,.node.selected path,.node.selected polygon{stroke:#6366f1;stroke-width:2.8px}.node.dim{opacity:.55}aside{position:sticky;top:20px;align-self:start}.detail-card,.scenario-card{background:white;border:1px solid var(--line);border-radius:13px;padding:19px;margin-bottom:13px}.detail-card h3{font-size:18px;margin:6px 0 12px}.detail-card p{font-size:13px;color:#64748b}.scenario-card label{font-size:12px;font-weight:650;display:block;margin-bottom:8px}.scenario-card select{width:100%;border:1px solid #cbd5e1;background:white;border-radius:6px;padding:8px;font-size:13px;color:#334155}.scenario-result{font-size:13px;border-left:3px solid #06b6d4;padding-left:12px;margin:15px 0 0}.tiny{font-size:11px;color:#64748b}.tools{display:flex;gap:9px;margin:14px 0}.tools button{border:1px solid #cbd5e1;background:white;border-radius:6px;padding:7px 10px;font-size:12px}.legend{font-size:11px;display:grid;gap:7px}.legend span:before{content:"";width:10px;height:10px;display:inline-block;border:1px solid #cbd5e1;border-radius:3px;margin-right:7px;background:#e6f8f5}.legend span:nth-child(2):before{background:#fff3dd}.legend span:nth-child(3):before{background:#ecebff}.legend span:nth-child(4):before{background:#eaf2ff}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:12px}th,td{text-align:left;vertical-align:top;padding:10px 9px;border-bottom:1px solid #e2e8f0}thead th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;background:#f8fafc}code,pre{font-family:ui-monospace,SFMono-Regular,monospace;font-size:11px}td code{overflow-wrap:anywhere}details{font-size:12px;margin-top:18px}summary{cursor:pointer;color:#4f46e5}pre{overflow:auto;background:#f8fafc;border-radius:8px;padding:15px;line-height:1.55}.finding{border:1px solid #e2e8f0;border-radius:9px;padding:17px}.findings{display:grid;grid-template-columns:1fr 1fr;gap:12px}.finding h3{font-size:17px;margin:8px 0 12px}.finding p{font-size:12px}.finding small{font:10px/1.5 ui-monospace,monospace;overflow-wrap:anywhere}.severity{background:#fff3dd;color:#92400e;font-size:10px;border-radius:5px;padding:3px 7px}.limits{padding-left:18px;font-size:13px}.limits li{margin:9px 0}.sources{margin-top:25px;background:white;border:1px solid var(--line);border-radius:12px;padding:18px}.sources h3{margin:0;font-size:17px}.sources details{max-height:600px;overflow:auto}footer{margin-top:22px;color:#64748b;font-size:11px}.foot-grid{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap}.doc-link{white-space:nowrap}@media(max-width:1000px){.workspace{grid-template-columns:1fr}aside{position:static;display:grid;grid-template-columns:1fr 1fr;gap:12px}.shell{padding:20px}.hero{margin-top:28px}.stats{grid-template-columns:1fr 1fr}.detail-card,.scenario-card{margin:0}.panel{padding:20px}}@media(max-width:540px){.mobile-hint{display:block}.figure-wrap svg{min-width:680px}.figure-wrap.zoom svg{min-width:1100px}.top{align-items:flex-start}.tag{font-size:10px;max-width:150px}.brand{font-size:14px}.lede{font-size:16px}.stats{gap:8px}.stat{padding:13px}.stat strong{font-size:25px}.workspace aside,.findings{grid-template-columns:1fr}.section-head{display:block}.exports{margin-bottom:12px}.shell{padding:16px}.panel{padding:15px}.tab{font-size:12px}.source-table{table-layout:fixed}}@media print{.node.dim{opacity:1!important}.figure-wrap svg{min-width:0!important}@page{size:A4 landscape;margin:13mm}body{background:white}.shell{max-width:none;padding:0}.top,.tabs,aside,.tools,.exports,.sources,footer,details{display:none!important}.hero{margin:0 0 15px}.hero h1{font-size:29px}.lede{font-size:13px}.stats{margin-bottom:12px}.stat{padding:9px}.stat strong{font-size:20px}.workspace{display:block}.panel{display:block!important;border:0;padding:10px 0;box-shadow:none;break-before:page}.panel:first-child{break-before:auto}.figure-wrap{border:0;padding:0;overflow:visible}.figure-wrap svg,.figure-wrap.zoom svg{width:100%;max-height:155mm}.figure-note{font-size:9px}.description{font-size:11px}.finding p,.limits{font-size:10px}h2{font-size:21px}.findings{grid-template-columns:1fr 1fr}.table-scroll{overflow:visible}table{font-size:9px}th,td{padding:5px}.boundary{display:none}}
</style></head><body><main class="shell"><header class="top"><div class="brand"><img src="data:image/png;base64,__LOGO__" alt="PolicyWatcher"><div>PolicyWatcher<small>ENGINE 6 / WORKFLOW ATLAS</small></div></div><span class="tag">Candidato locale · nessun deployment</span></header><section class="hero"><p class="eyebrow">AUDIT DEL 22 NOVEMBRE 2026</p><h1>Dalla fonte alla decisione.<br><span>Ogni passaggio, verificabile.</span></h1><p class="lede">Il workflow reale di acquisizione, controllo delle prove, revisione e pubblicazione. Schemi ricostruiti dal codice e corretti dopo il riesame, con i limiti ancora aperti resi espliciti.</p><div class="boundary"><span>Prodotto stabile 5.6: pacchetto separato</span><span>Preview: risultati privati</span><span>Fonte codice: __CHECKPOINT__</span></div></section><section class="stats" aria-label="Perimetro delle verifiche"><div class="stat"><strong>__TESTS__</strong><small>test locali superati · __SKIPPED__ saltati</small></div><div class="stat"><strong>__NEGATIVE__</strong><small>controprove negative, poi ripristino</small></div><div class="stat"><strong>__DIAGRAMS__</strong><small>schemi con riferimenti al codice</small></div><div class="stat"><strong>0 USD</strong><small>costo verificato di 4 chiamate cloud</small></div></section><nav class="tabs" role="tablist" aria-label="Schemi e audit">__TABS__</nav><div class="workspace"><div class="canvas">__PANELS__</div><aside><section class="scenario-card"><label for="scenario">Esplora un esito illustrativo</label><select id="scenario"><option value="observe">Osservazione privata</option><option value="missing">Prove mancanti</option><option value="attachments">Allegati corrispondenti</option><option value="publish">Pubblicazione del documento principale</option><option value="highimpact">Impatto alto</option></select><p class="scenario-result" id="scenario-result"></p><p class="tiny">Solo spiegazione del codice: non avvia scansioni, modelli, approvazioni o invii.</p><div class="tools"><button id="zoom">Ingrandisci schema</button><button id="print">Stampa / PDF</button></div><div class="legend"><span>Privato / osservazione</span><span>Sospensione / revisione</span><span>Pubblicazione condizionata</span><span>Persistenza / transazione DB</span></div></section><section class="detail-card" id="node-detail" aria-live="polite"><p class="eyebrow">ISPEZIONA UN PASSAGGIO</p><h3 id="detail-title">Una pipeline, più domande</h3><p id="detail-text">Seleziona un nodo della panoramica. Trasferimento, copertura, interpretazione e atomicità restano verifiche distinte.</p></section></aside></div><section class="sources"><h3>Tracciabilità dei diagrammi</h3><p class="tiny">Archi e gate riportano file e linee del checkpoint verificato. Sono fonti di codice; non prove di esecuzione online.</p><a class="doc-link" href="workflow.md">Specifica completa</a> · <a href="model.json">Modello e riferimenti JSON</a><details><summary>Apri i riferimenti degli archi</summary><table class="source-table"><tbody>__SOURCES__</tbody></table></details></section><footer><div class="foot-grid"><span>PolicyWatcher · codice __CHECKPOINT__ · 22 novembre 2026</span><span>Nessuna cattura live aggiunta · 500 policy/giorno ancora da qualificare</span></div></footer></main><script type="application/json" id="atlas-data">__MODEL__</script><script>
const model=JSON.parse(document.getElementById('atlas-data').textContent);
const scenarios={observe:{text:'Observe conserva risultati ed evidenze privati. Non crea una nuova baseline pubblica, un cambiamento pubblico o una notifica.',dim:['publication','commit','notify']},missing:{text:'Una prova mancante o incongruente produce una sospensione. Il task può concludersi, ma la fonte non è qualificata.',dim:['private','confirm','models','publication','commit','notify']},attachments:{text:'La copertura degli allegati può corrispondere, ma l’analisi delle loro modifiche è ancora da qualificare: è ammesso solo observe; un tentativo publish viene sospeso.',dim:['publication','commit','notify']},publish:{text:'Percorso implementato per il solo parent: V2 corrispondente, nessun allegato, contesto e conferma validi, interpretazioni supportate e modalità publish abilitata. Non è attivato da questo atlante.',dim:['private']},highimpact:{text:'Un cambiamento ad alto impatto richiede revisione. L’approvazione umana ricontrolla le prove e non può derogare ai gate obbligatori.',dim:['commit','notify']}};
function scenario(){const value=document.getElementById('scenario').value;const current=scenarios[value];document.getElementById('scenario-result').textContent=current.text;document.querySelectorAll('#panel-overview .node').forEach(el=>el.classList.toggle('dim',current.dim.includes(el.id.split('--')[1])));}
function activate(key){document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===key)));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+key));history.replaceState(null,'','#'+key);}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.tab)));
document.querySelectorAll('#panel-overview .node').forEach(el=>{const key=el.id.split('--')[1],detail=model.overviewDetails[key];if(!detail)return;el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',detail.title);function choose(){document.querySelectorAll('.node.selected').forEach(n=>n.classList.remove('selected'));el.classList.add('selected');document.getElementById('detail-title').textContent=detail.title;document.getElementById('detail-text').textContent=detail.text;}el.addEventListener('click',choose);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});});
document.getElementById('scenario').addEventListener('change',scenario);document.getElementById('zoom').addEventListener('click',()=>{const f=document.querySelector('.panel.active .figure-wrap');if(f)f.classList.toggle('zoom');});document.getElementById('print').addEventListener('click',()=>window.print());
const initial=location.hash.slice(1);if(document.getElementById('panel-'+initial))activate(initial);scenario();
</script></body></html>'''
page=page.replace('__LOGO__',logo).replace('__CHECKPOINT__',MODEL['checkpoint'][:7]).replace('__TABS__',buttons).replace('__PANELS__',''.join(panels)).replace('__SOURCES__',source_rows).replace('__MODEL__',json.dumps(MODEL,ensure_ascii=False).replace('</','<\\/')).replace('\u2014',' - ')
page=page.replace('__TESTS__',format(MODEL['audit']['applicationTestsPassed'],',').replace(',','.')).replace('__SKIPPED__',str(MODEL['audit']['applicationTestsSkipped'])).replace('__NEGATIVE__',str(MODEL['audit']['negativeControls'])).replace('__DIAGRAMS__',str(len(MODEL['diagrams'])))
(OUT/'index.html').write_text(page)
print(json.dumps({'html':str(OUT/'index.html'),'diagramViews':len(SVGS),'mermaidDiagrams':len(MODEL['diagrams']),'gateRows':len(MODEL['gates']),'networkDependencies':0}))
