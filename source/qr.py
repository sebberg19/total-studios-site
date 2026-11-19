# Génère les codes QR de la carte d'affaires (adresse courte /qr qui compte les scans puis redirige vers /carte/).
import re,os,segno
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL='https://totalstudios.ca/qr'
q=segno.make(URL,error='h',micro=False,boost_error=False)
M=[list(r) for r in q.matrix];n=len(M)
KW,KH=11,7;cx0=(n-KW)//2;cy0=(n-KH)//2  # zone dégagée au centre (modules)
def inbox(x,y):return cx0<=x<cx0+KW and cy0<=y<cy0+KH
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
    C=Q+n/2;sc=7.6/551
    inner=re.sub(r'class="cls-1"','',fav(favname))
    inner=re.sub(r'<defs>.*?</defs>','',inner,flags=re.S)
    svg=f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" shape-rendering="crispEdges"><rect width="{S}" height="{S}" fill="{bg}"/><path d="{d}" fill="{fg}"/><g transform="translate({C} {C}) scale({sc:.6f}) translate(-594.5 -587.5)" fill="{fg}" shape-rendering="geometricPrecision">{inner}</g></svg>\n'
    open(path,'w',encoding='utf8').write(svg)
os.makedirs(f'{ROOT}/source/qr',exist_ok=True)
build('#000','#fff','favicon-noir.svg',f'{ROOT}/source/qr/QR_carte_noir-sur-blanc.svg')
build('#fff','#000','favicon-blanc.svg',f'{ROOT}/source/qr/QR_carte_blanc-sur-noir.svg')
print('modules',n)
