# Génère les codes QR de la carte d'affaires (adresse courte /qr qui compte les scans puis redirige vers /carte/).
import re,os,segno
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL='HTTPS://TOTALSTUDIOS.CA/QR'  # majuscules = mode alphanumérique : moins de modules, donc des modules plus gros à l'impression
q=segno.make(URL,error='h',micro=False,boost_error=False)
M=[list(r) for r in q.matrix];n=len(M)
KW,KH=9,5;cx0=(n-KW)//2;cy0=(n-KH)//2  # noyau dégagé au centre (modules)
RING=((.6,.35,.15,0),(.7,.45,.2,0))  # (horizontal, vertical): probabilité de retrait par anneau, de plus en plus clairsemé vers l'extérieur
B=((0,8,2,10),(12,4,14,6),(3,11,1,9),(15,7,13,5))  # matrice de tramage 4x4 (motif régulier, pas de hasard)
def dist(x,y):
    dx=max(cx0-x,0,x-(cx0+KW-1));dy=max(cy0-y,0,y-(cy0+KH-1));return dx,dy
def func(x,y):return (x<9 and y<9) or (x>=n-8 and y<9) or (x<9 and y>=n-8) or (x>=n-9 and y>=n-9 and x<=n-5 and y<=n-5)
def inbox(x,y):
    dx,dy=dist(x,y)
    if dx==0 and dy==0:return True
    if func(x,y):return False
    if x<cx0+KW//2 and y>=cy0+KH//2:return False  # en bas à gauche, on garde les carrés (sinon c'est trop vide)
    d=max(dx,dy)
    if d>4:return False
    pr=RING[0 if dx>=dy else 1][d-1]
    return (B[y%4][x%4]+.5)/16<pr
def fav(name):
    t=open(f'{ROOT}/source/assets/{name}',encoding='utf8').read()
    return re.search(r'<svg[^>]*>(.*)</svg>',t,re.S).group(1)
def build(fg,bg,favname,path):
    Q=4;S=n+2*Q;d=''
    for y in range(n):
        x=0
        while x<n:
            if M[y][x] and not inbox(x,y):
                x0=x
                while x<n and M[y][x] and not inbox(x,y):x+=1
                d+=f'M{x0+Q} {y+Q}h{x-x0}v1h-{x-x0}z'
            else:x+=1
    C=Q+n/2;sc=6.8/551
    inner=re.sub(r'class="cls-1"','',fav(favname))
    inner=re.sub(r'<defs>.*?</defs>','',inner,flags=re.S)
    svg=f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" shape-rendering="crispEdges"><rect width="{S}" height="{S}" fill="{bg}"/><path d="{d}" fill="{fg}"/><g transform="translate({C} {C}) scale({sc:.6f}) translate(-594.5 -587.5)" fill="{fg}" shape-rendering="geometricPrecision">{inner}</g></svg>\n'
    open(path,'w',encoding='utf8').write(svg)
os.makedirs(f'{ROOT}/source/qr',exist_ok=True)
build('#000','#fff','favicon-noir.svg',f'{ROOT}/source/qr/QR_carte_noir-sur-blanc.svg')
build('#fff','#000','favicon-blanc.svg',f'{ROOT}/source/qr/QR_carte_blanc-sur-noir.svg')
print('modules',n)
