# TOTAL STUDIOS (site web)

- `source/index.source.html` : page source unique (modifiée en conversation avec Claude)
- `source/build.py` : génère le site déployable dans `site/` (polices, pages par adresse, SEO, GEO)
- `site/` : dossier publié par Netlify (ne pas modifier à la main)

Reconstruire : `python3 source/build.py`
