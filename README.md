# Tesoreria Campo Gedeoni

App per il tesoriere del Campo: registra le offerte delle riunioni, tiene i conti, produce il
rendiconto, archivia il bilancio di ogni anno fiscale (1 giugno – 31 maggio) e gestisce la chiusura
di cassa annuale. Pensata per il telefono e per passare le consegne tra un tesoriere e il successivo.

- **App**: https://gtesoreria.vercel.app (anche su https://campodivittoria.github.io/GideonsTesoreria.app/)
- **Account di prova**: utente `test`, password `test` (dati inventati, non toccano quelli veri)

## Come è fatta
- `index.html` – l'app, una sola pagina (HTML + CSS + JavaScript), senza framework.
- `api/` – funzioni server (Node.js) pubblicate su Vercel: accesso, lettura/scrittura dei dati, account.
- Database: MongoDB Atlas (cluster gratuito). Variabili su Vercel: `MONGODB_URI`, `JWT_SECRET`.
- `VERSIONI.md` – elenco delle versioni; il numero compare nella pagina di accesso e nel menu.
- `presentazione/` – slide PowerPoint che riassumono l'app.
