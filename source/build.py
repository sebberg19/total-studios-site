import re,base64,json,os,shutil
import sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=ROOT+'/source/index.source.html'; OUT=ROOT+'/site'
DOMAIN='https://totalstudios.ca'
shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT+'/fonts')
s=open(SRC,encoding='utf8').read()
# fonts out
fonts=re.findall(r'url\(data:font/woff2;base64,([^)]+)\)',s); assert len(fonts)==2
for b,n in zip(fonts,['archivo','cascadia-mono-light']):
    open(f'{OUT}/fonts/{n}.woff2','wb').write(base64.b64decode(b))
names=iter(['archivo','cascadia-mono-light'])
s=re.sub(r'url\(data:font/woff2;base64,[^)]+\)',lambda m:'url(/fonts/%s.woff2)'%next(names),s)
# remove debug banner helper display only on error is fine; keep
P={
'accueil':('/','Total Studios Montréal | Photographie sportive','Équipe de photographie sportive et de contenu digital à Montréal pour les athlètes, les clubs et les ligues de football et de soccer.'),
'galerie':('/galerie/','Total Studios Montréal | Galerie média','Photos et vidéos de football et de soccer réalisées par TOTAL STUDIOS à Montréal.'),
'services':('/services/','Total Studios Montréal | Services','Photographie, vidéographie et contenu digital pour les athlètes, les clubs et les ligues. Livraison des photos traitées environ 48 heures après la session.'),
'a-propos':('/a-propos/','Total Studios Montréal | À propos','TOTAL STUDIOS est une équipe de photographie sportive et de contenu digital fondée à Montréal, par passion pour le sport et le travail bien fait.'),
'contact':('/contact/','Total Studios Montréal | Contact','Écrivez à TOTAL STUDIOS à info@totalstudios.ca pour vos projets de photographie sportive, de vidéo et de contenu digital.'),
'reserver':('/reserver/','Total Studios Montréal | Réserver une session','Réservez une session photo ou vidéo pour un match, un entraînement ou un événement de football ou de soccer, ou une saison complète.'),
}
ld={"@context":"https://schema.org","@graph":[
 {"@type":"ProfessionalService","@id":DOMAIN+"/#org","name":"TOTAL STUDIOS","url":DOMAIN+"/","email":"info@totalstudios.ca","logo":DOMAIN+"/apple-touch-icon.png","image":DOMAIN+"/og.png",
  "description":"Équipe de photographie sportive et de contenu digital fondée à Montréal, pour les athlètes, les clubs et les ligues de football et de soccer.",
  "address":{"@type":"PostalAddress","addressLocality":"Montréal","addressRegion":"QC","addressCountry":"CA"},
  "areaServed":{"@type":"City","name":"Montréal","geo":{"@type":"GeoCoordinates","latitude":45.5019,"longitude":-73.5674}},"knowsLanguage":["fr-CA","en-CA"],"foundingLocation":{"@type":"Place","name":"Montréal, Québec, Canada"},"alternateName":["Total Studios","TOTAL STUDIOS Montréal"],"contactPoint":{"@type":"ContactPoint","contactType":"réservations et renseignements","email":"info@totalstudios.ca","availableLanguage":["fr","en"],"areaServed":"CA-QC"},
  "knowsAbout":["Photographie sportive","Vidéographie sportive","Football","Soccer","Contenu digital","Identité visuelle"],
  "makesOffer":[{"@type":"Offer","itemOffered":{"@type":"Service","name":"Photographie et vidéographie sportive","description":"Portraits d’athlètes, couverture de matchs et d’événements, banques d’images et de vidéos pour clubs, équipes et joueurs."}},
                {"@type":"Offer","itemOffered":{"@type":"Service","name":"Contenu digital","description":"Visuels et templates de publications, identité visuelle et affiches promotionnelles."}}]},
 {"@type":"WebSite","@id":DOMAIN+"/#site","url":DOMAIN+"/","name":"TOTAL STUDIOS","inLanguage":["fr-CA","en-CA"],"publisher":{"@id":DOMAIN+"/#org"}}]}
for v,(path,title,desc) in P.items():
    h=s
    ldp=json.loads(json.dumps(ld))
    T={'accueil':'WebPage','galerie':'CollectionPage','services':'WebPage','a-propos':'AboutPage','contact':'ContactPage','reserver':'WebPage'}[v]
    ldp['@graph'].append({"@type":T,"@id":DOMAIN+path+"#page","url":DOMAIN+path,"name":title,"description":desc,"inLanguage":"fr-CA","isPartOf":{"@id":DOMAIN+"/#site"},"about":{"@id":DOMAIN+"/#org"}})
    if v!='accueil':
        ldp['@graph'].append({"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Accueil","item":DOMAIN+"/"},{"@type":"ListItem","position":2,"name":title.split(' | ')[0] if v!='reserver' else 'Réserver',"item":DOMAIN+path}]})
    ldj=json.dumps(ldp,ensure_ascii=False,separators=(',',':'))
    head=f'''<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{DOMAIN}{path}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#000000"><meta name="geo.region" content="CA-QC"><meta name="geo.placename" content="Montréal"><meta name="geo.position" content="45.5019;-73.5674"><meta name="ICBM" content="45.5019, -73.5674">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="/favicon-noir.svg" type="image/svg+xml" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon-blanc.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon-noir-64.png" sizes="64x64" type="image/png" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon-blanc-64.png" sizes="64x64" type="image/png" media="(prefers-color-scheme: dark)">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="text/plain" href="/llms.txt" title="TOTAL STUDIOS (résumé pour les assistants IA)">
<link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/cascadia-mono-light.woff2" as="font" type="font/woff2" crossorigin>
<meta property="og:type" content="website"><meta property="og:site_name" content="TOTAL STUDIOS"><meta property="og:locale" content="fr_CA"><meta property="og:locale:alternate" content="en_CA">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:url" content="{DOMAIN}{path}"><meta property="og:image" content="{DOMAIN}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Logo TOTAL STUDIOS, blanc sur fond noir"><meta name="twitter:image:alt" content="Logo TOTAL STUDIOS, blanc sur fond noir">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="{DOMAIN}/og.png">
<script type="application/ld+json">{ldj}</script>'''
    h,n=re.subn(r'<title>.*?</title>\s*<meta name="description"[^>]*>',lambda m:head,h,count=1,flags=re.S);assert n==1
    h=h.replace('<script>\nconst V=','<script>window.__V="%s"</script>\n<script>\nconst V='%v,1); assert '__V=' in h
    a="if(!V.includes(h))h='accueil'"; assert h.count(a)==1
    h=h.replace(a,"if(!V.includes(h)){const p=location.pathname.replace(/^\\/|\\/$/g,'');h=V.includes(p)?p:(p?(window.__V||'accueil'):'accueil')}")
    h=re.sub(r'href="#(accueil|galerie|services|a-propos|contact|reserver)"',lambda m:'href="%s"'%('/' if m.group(1)=='accueil' else '/%s/'%m.group(1)),h)
    assert h.count('const at=')==1; h=h.replace('const at=','let at=')
    t_old="document.title=l=='en'?EN[T0]:T0;MD.content=l=='en'?EN[D0]:D0;"; assert h.count(t_old)==1
    h=h.replace(t_old,"document.title=(l=='en'&&EN[T0])||T0;MD.content=(l=='en'&&EN[D0])||D0;")
    pg=json.dumps({('accueil' if k=='accueil' else k):{'p':P[k][0],'t':P[k][1],'d':P[k][2]} for k in P},ensure_ascii=False)
    nav='''const PG=%s;
function setMeta(v){const x=PG[v];if(!x)return;T0=x.t;D0=x.d;document.title=(LG=='en'&&EN[T0])||T0;MD.content=(LG=='en'&&EN[D0])||D0;const u='%s'+x.p,q=(s,a,val)=>{const e=document.querySelector(s);if(e)e.setAttribute(a,val)};q('link[rel=canonical]','href',u);q('meta[property="og:url"]','content',u);q('meta[property="og:title"]','content',x.t);q('meta[property="og:description"]','content',x.d);q('meta[name="twitter:title"]','content',x.t)}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^="/"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;const u=new URL(a.href,location.href),p=u.pathname.replace(/^\\/|\\/$/g,''),v=p||'accueil';if(!V.includes(v))return;e.preventDefault();if(location.pathname!==u.pathname)history.pushState({},'',u.pathname);go();setMeta(v)});
window.addEventListener('popstate',()=>{const p=location.pathname.replace(/^\\/|\\/$/g,'');go();setMeta(p||'accueil')});
''' % (pg,DOMAIN)
    i=h.rindex('</script>'); h=h[:i]+nav+h[i:]
    h=h.replace('<section class="v" id="accueil"','<section class="v" id="accueil"') 
    h=re.sub(r'(<section class="v[^"]*)(" id="%s")'%v,r'\1 on\2',h,count=1)
    h=re.sub(r'<section class="(v[^"]*)" id="([a-z-]+)"',lambda m:m.group(0) if m.group(2)==v else m.group(0)+' hidden aria-hidden="true"',h)
    h=re.sub(r'<section class="(v[^"]*) on" id="%s"'%v,lambda m:m.group(0),h)
    g="$$('.v').forEach(e=>e.classList.toggle('on',e.id==h))"; assert h.count(g)==1
    h=h.replace(g,"$$('.v').forEach(e=>{e.classList.toggle('on',e.id==h);e.hidden=e.id!=h;e.setAttribute('aria-hidden',e.id!=h)})")
    d=OUT+path; os.makedirs(d,exist_ok=True); open(d+'index.html','w',encoding='utf8').write(h)
# static files
[shutil.copy(ROOT+'/source/assets/'+f,OUT+'/'+f) for f in ['og.png','favicon-noir.svg','favicon-blanc.svg','favicon-noir-64.png','favicon-blanc-64.png','apple-touch-icon.png']]
open(OUT+'/_redirects','w').write('/index.html / 301!\n/accueil / 301!\n/galerie/index.html /galerie/ 301!\n/services/index.html /services/ 301!\n/a-propos/index.html /a-propos/ 301!\n/contact/index.html /contact/ 301!\n/reserver/index.html /reserver/ 301!\n')
four=open(OUT+'/contact/index.html',encoding='utf8').read()
four=re.sub(r'<title>.*?</title>','<title>Total Studios Montréal | Page introuvable</title>',four,count=1,flags=re.S)
four=re.sub(r'<meta name="robots"[^>]*>','<meta name="robots" content="noindex">',four,count=1)
four=re.sub(r'<link rel="canonical"[^>]*>','',four,count=1)
four=re.sub(r'<script type="application/ld\+json">.*?</script>','',four,count=1,flags=re.S)
four=re.sub(r'(<section class="v pg ct on" id="contact"><div class="w"><h1>)Contact(</h1>).*?</dl>',r'\1Page introuvable\2<div class="ex"><p>Cette page n’existe pas. <a href="/" style="color:#fff">Retour à l’accueil</a></p></div>',four,count=1,flags=re.S)
open(OUT+'/404.html','w',encoding='utf8').write(four)
open(OUT+'/robots.txt','w').write(f'''User-agent: *
Allow: /

'''+''.join(f'User-agent: {b}\nAllow: /\n' for b in ['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','Claude-User','PerplexityBot','Google-Extended','Applebot-Extended','Bingbot'])+f'''

Sitemap: {DOMAIN}/sitemap.xml
''')
open(OUT+'/sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'<url><loc>{DOMAIN}{p}</loc><lastmod>2026-11-04</lastmod></url>\n' for p,_,_ in P.values())+'</urlset>\n')
open(OUT+'/llms.txt','w',encoding='utf8').write(f'''# TOTAL STUDIOS

> Équipe de photographie sportive et de contenu digital fondée à Montréal, pour les athlètes, les clubs et les ligues de football et de soccer. Contenu créé par des humains, sans intelligence artificielle générative.

## Services
- Photographie et vidéographie sportive : portraits d’athlètes, couverture de matchs et d’événements sportifs, banques d’images et de vidéos pour clubs, équipes et joueurs.
- Contenu digital : visuels et templates de publications, développement d’identité visuelle, affiches promotionnelles.

## Déroulement
Nous nous déplaçons au match ou à la session, prenons les photos et les vidéos, puis faisons le tri, la retouche et l’étalonnage des couleurs. Les photos traitées sont livrées environ 48 heures après la session. Le délai peut varier pour le montage vidéo, le design graphique et le branding.

## Pages
- [Accueil]({DOMAIN}/)
- [Galerie média]({DOMAIN}/galerie/)
- [Services]({DOMAIN}/services/)
- [À propos]({DOMAIN}/a-propos/)
- [Contact]({DOMAIN}/contact/)
- [Réserver]({DOMAIN}/reserver/)

## Détails
Version complète : {DOMAIN}/llms-full.txt

## Contact
info@totalstudios.ca
Région desservie : Montréal (Québec, Canada). Langues : français (Canada) et anglais.
''')
open(OUT+'/_headers','w').write('''/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/favicon-*
  Cache-Control: public, max-age=604800
/apple-touch-icon.png
  Cache-Control: public, max-age=604800
/og.png
  Cache-Control: public, max-age=604800
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()
''')
open(OUT+'/llms-full.txt','w',encoding='utf8').write(f'''# TOTAL STUDIOS (version détaillée)

> Équipe de photographie sportive et de contenu digital fondée à Montréal, au Québec (Canada). Nous couvrons le football et le soccer pour les athlètes, les clubs et les ligues. Site : {DOMAIN}/

## Qui nous sommes
- Nom : TOTAL STUDIOS
- Type : équipe de photographie sportive, de vidéographie et de contenu digital
- Fondée à : Montréal (Québec, Canada)
- Sport couvert : football / soccer
- Clientèle : athlètes, clubs et ligues
- Langues : français (Canada) et anglais
- Courriel : info@totalstudios.ca
- Approche : humaine et authentique. Nous n’utilisons pas d’intelligence artificielle générative pour créer du contenu. Chaque photo, vidéo et visuel est créé par notre équipe.
- Valeurs : passion du sport, précision, exactitude et travail bien fait.

## Services
### Photographie et vidéographie
Portraits d’athlètes, couverture de matchs, événements sportifs, banques d’images et de vidéos pour clubs, équipes et joueurs. Types de sessions : match, entraînement, événement ou autre. On peut réserver une seule session ou plusieurs, jusqu’à une saison complète.

### Contenu digital
Visuels et templates de publications, développement d’identité visuelle (branding) et affiches promotionnelles, pour les ligues, les clubs et les joueurs.

## Déroulement
1. Vous remplissez le formulaire de réservation ({DOMAIN}/reserver/) : profil (athlète, club ou ligue), type de session, services souhaités (photo, vidéo, contenu digital, branding), date et heure de début, ville et numéro de terrain ou parc.
2. La demande nous est transmise par courriel.
3. Nous vous répondons par courriel pour confirmer les détails et les tarifs.
4. Nous nous déplaçons à votre match ou à votre session et nous nous occupons de tout : photos et vidéos sur place.
5. Nous faisons le tri, la retouche et l’étalonnage des couleurs de chaque image.
6. Vous recevez les photos traitées environ 48 heures après la session. Le délai peut varier selon la demande : un montage vidéo, du design graphique ou du branding demandent un peu plus de temps.

## Questions fréquentes
- Où êtes-vous situés ? À Montréal, au Québec. Nous nous déplaçons aux matchs et aux sessions.
- Quels sports couvrez-vous ? Le football et le soccer.
- Combien de temps pour recevoir les photos ? Environ 48 heures après la session. Le montage vidéo, le design graphique et le branding prennent un peu plus de temps.
- Comment réserver ? Par le formulaire sur {DOMAIN}/reserver/ ou par courriel à info@totalstudios.ca. Nous répondons par courriel pour confirmer les détails et les tarifs.
- Peut-on réserver toute une saison ? Oui, il est possible de choisir plusieurs dates, jusqu’à une saison complète.
- Utilisez-vous l’intelligence artificielle ? Non, pas d’intelligence artificielle générative pour créer le contenu.

## Pages
- Accueil : {DOMAIN}/
- Galerie média : {DOMAIN}/galerie/
- Services : {DOMAIN}/services/
- À propos : {DOMAIN}/a-propos/
- Contact : {DOMAIN}/contact/
- Réserver : {DOMAIN}/reserver/
''')
# favicon + og source: logo defs
m=re.search(r'<svg width="0" height="0" style="position:absolute" aria-hidden="true">.*?</svg>',s,re.S);defs=m.group(0)
pass
print(sorted(os.listdir(OUT)), {f:os.path.getsize(OUT+'/'+f) for f in ['index.html']}, [os.path.getsize(OUT+'/fonts/'+f) for f in os.listdir(OUT+'/fonts')])
