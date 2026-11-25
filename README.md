# BRM TECNICAL — Ornamente personalizate, tăiate la laser

Site de prezentare pentru **BRM TECNICAL**, atelier de ornamente personalizate
tăiate cu laser, din **Târgu Neamț, județ Neamț, România**.

Design realizat după modelul [dardeiarna.ro](https://dardeiarna.ro/) —
coronițe și decorațiuni personalizate, cu previzualizare live.

## Ce conține

- **Previzualizare live** a coroniței personalizate: text (deasupra / nume / dedesubt) + 3 culori (negru, roșu, auriu), cu trimitere directă pe email
- **Colecție de 24 de modele** cu filtre (Crăciun, Personalizate, Paște, Primăvară & mămici, Ediții italiene)
- **Cum comanzi** în 4 pași, **Întrebări frecvente**, **Contact** cu formular pe email
- Countdown pentru comenzile de Crăciun, meniu mobil, benzi rulante cu modele

## Contact

| | |
|---|---|
| **Email** | brm_tecnical@yahoo.com |
| **Atelier** | Târgu Neamț, județ Neamț, România |

## Rulare locală

Nu are nevoie de build — e HTML/CSS/JS static.

```bash
# opțiunea 1: deschide direct
start index.html

# opțiunea 2: server local (recomandat pentru previzualizare live)
python -m http.server 8000
# apoi deschide http://localhost:8000
```

## Publicare pe GitHub Pages

1. Creează un repo nou pe GitHub (de ex. `brm-tecnical`) și urcă fișierele:

   ```bash
   git init
   git add .
   git commit -m "Site BRM TECNICAL – ornamente personalizate"
   git remote add origin https://github.com/<user>/brm-tecnical.git
   git push -u origin main
   ```

2. În repo → **Settings → Pages → Source: Deploy from a branch** →
   branch `main` / folder `/ (root)` → **Save**.

3. Site-ul devine disponibil pe `https://<user>.github.io/brm-tecnical/`.

## Structură

```
SITE BRM/
├── index.html          # pagina principală (totul pe o singură pagină)
├── css/style.css       # stiluri (paletă & tipografie după dardeiarna.ro)
├── js/main.js          # previzualizare live, filtre, countdown, formular
├── images/             # modele redimensionate (1000×1000) + variante culoare
├── README.md
└── .gitignore          # ignoră imaginile Gemini originale (nemodificate)
```

## Personalizări rapide

- **Prețurile** sunt în `index.html`, în fiecare card (`<p class="card-p">…</p>`) — schimbă-le acolo.
- **Termenul Crăciun** (15 decembrie) — în `js/main.js`, funcția countdown.
- **Culorile** site-ului — în `css/style.css`, secțiunea `:root`.
- **Textele / modelele** — direct în `index.html`.

> Notă: imaginile originale generate cu Gemini rămân în folderul acesta,
> dar sunt ignorate de git (`.gitignore`) ca să nu mărească repo-ul.
