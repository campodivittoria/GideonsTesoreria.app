# Gestionale Salone – piano e decisioni

Gestionale per parrucchieri con sito per i clienti (prenotazioni + negozio), costruito da zero
prendendo come riferimento **Pagest** (il gestionale usato oggi in salone).
Questa cartella è provvisoria: andrà spostata in un repository suo (es. `gestionale-salone`).

## Decisioni prese
- **Su misura**, niente Odoo o altri progetti open source (nessuno è adatto a un salone italiano).
- **Regime forfettario**: niente IVA, niente contabilità. Lo scontrino resta obbligatorio
  (reparto della cassa impostato come "senza IVA – forfettario", natura N2.2: da confermare col tecnico).
  Le fatture le fa il commercialista.
- **Tecnologia** come la Tesoreria: pagine HTML/CSS/JS senza framework, funzioni API su **Vercel**,
  dati su **MongoDB Atlas**, pagamenti con **Stripe** (prima in modalità prova).
- **Modalità prova**: se l'API non è raggiungibile l'app funziona lo stesso con dati nel browser,
  così si prova subito dal telefono.

## Sito per i clienti (`index.html`)
- **Prenota**: servizi (prezzo e durata) → operatore o "chiunque" → giorno → solo orari davvero liberi
  → nome, telefono, email, consenso privacy → pagare online o in salone (regola nelle impostazioni).
- Prenotazione **senza registrazione**; il cliente viene riconosciuto dal telefono e collegato alla sua scheda.
- **Conferma automatica**, tranne i servizi segnati "da approvare" (es. colore lungo, sposa).
- Codice di 6 caratteri per vedere o **disdire** (fino a X ore prima).
- **Negozio**: prodotti e buoni regalo, carrello, ritiro in salone o spedizione (spedizione = pagamento online).
- Più avanti: area personale con accesso via email senza password, promemoria WhatsApp/SMS/email, fidelity.

## Gestionale (`gestionale.html`)
- **Agenda** per operatore (colonne), nuovi appuntamenti, blocchi/pause, approvazione prenotazioni online.
- **Clienti**: scheda, telefono, note, formula colore, storico visite e acquisti.
- **Listino**: servizi (durata, prezzo, chi li fa, prenotabile online, da approvare) e prodotti.
- **Magazzino**: scorte, scorta minima, prodotti in vendita / uso interno.
- **Cassa**: "Incassa" dall'appuntamento → contanti/carta/misto → scontrino in coda per la cassa fiscale.
- **Ordini online**, **Statistiche** (incasso per operatore, servizi e prodotti più venduti), **Impostazioni**.

## Cassa fiscale
Pagest oggi è già collegato alla stampante fiscale, quindi la cassa accetta comandi in rete.
Piano: un piccolo programma **ponte** in salone (`ponte-cassa/`) legge dall'API gli scontrini "in coda"
e li manda al registratore (protocollo Epson ePOS fiscal XML, se la cassa è Epson).
**Da sapere**: marca e modello della cassa e il suo indirizzo IP (nelle impostazioni di Pagest).
POS: per ora quello attuale (importo digitato a mano); in futuro eventualmente Stripe Terminal.

## Stato del lavoro
- [x] `assets/core.js`: tutta la logica (orari liberi, prenotazioni, disdette, ordini, pagamenti, incassi, anteprima scontrino).
- [ ] `assets/store.js`: dati in modalità prova (browser) o tramite API.
- [ ] `index.html` + `assets/site.js`: sito clienti.
- [ ] `gestionale.html` + `assets/admin.js`: gestionale.
- [ ] `api/`: login (JWT), dati, funzioni pubbliche, Stripe Checkout, coda scontrini per il ponte.
- [ ] `ponte-cassa/`: programma per la cassa fiscale.

## Da fare con Chrome su Pagest
Girare tutte le sezioni di Pagest e annotare in `PAGEST.md`: menu, schermate, campi di ogni scheda,
flussi (nuovo appuntamento, incasso, chiusura cassa), impostazioni della cassa fiscale (modello, IP, reparti,
codici di pagamento). **Non** copiare dati di clienti reali né password.
