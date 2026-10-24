# Versioni dell'app Tesoreria Campo Gedeoni

Il numero di versione è visibile nella pagina di accesso e in fondo al menu.
Ogni modifica fa salire la versione di un decimo (1.1, 1.2 … 1.9, poi 2.0).

## 4.2 – 24/10/2026
- Nuova registrazione: sotto "Spese del Campo" c'è la **Nota spese** per scrivere cosa è stato pagato;
  è obbligatoria quando si inserisce un importo di spese. La nota compare nel dettaglio della
  registrazione (Storico) e nel dettaglio del conto Spese del Campo (Rendiconto e Bilancio).

## 4.1 – 24/10/2026
- Indirizzo ufficiale dell'app: https://gtesoreria.vercel.app (usato dal pulsante Condividi e nelle slide).
- `/api/health` spiega in italiano cosa manca se il collegamento al database non funziona.

## 4.0 – 24/10/2026
- **Dati condivisi tra tutti i dispositivi**: registrazioni, chiusure e account sono salvati su un
  server (API su Vercel + database MongoDB Atlas). Chi registra dal telefono viene visto subito dagli altri;
  l'app ricontrolla il server ogni minuto e quando si torna sull'app.
- Accesso con password custodite sul server (non più nel codice). "Rimani connesso" vale 90 giorni.
- Primo avvio: se sul dispositivo ci sono dati inseriti con le versioni precedenti, l'app propone di
  caricarli nel database condiviso.
- Se due persone salvano insieme, la seconda viene avvisata e vede i dati aggiornati.
- L'account di prova `test` resta sul dispositivo, con dati inventati.

## 3.7 – 22/10/2026
- L'anno fiscale si chiude con il **bonifico di chiusura**: se è registrato entro il 31 maggio l'anno si
  chiude il 31 maggio; se arriva dopo, l'anno resta aperto e si chiude il giorno del bonifico, e il nuovo
  anno parte dal giorno seguente. Nella Chiusura Cassa c'è la casella "Questo bonifico chiude l'anno fiscale".
- Alla chiusura ripartono da zero registrazioni, entrate, spese e bonifici; restano solo i saldi di ogni
  conto, che diventano il riporto. Riepilogo, Rendiconto e Bilancio lo dicono esplicitamente.
- Dati di prova: bonifici di chiusura l'8/6/2025 (in ritardo) e il 28/5/2026 (in tempo).

## 3.6 – 22/10/2026
- Bilancio e Rendiconto: righe dei totali più compatte, i numeri non si sovrappongono sul telefono.

## 3.5 – 22/10/2026
- **Anno fiscale 1 giugno – 31 maggio** per tutti gli account.
- Nuova pagina **Bilancio Storico**: un bilancio per ogni anno fiscale (riporto 1/6, entrate, spese e
  bonifici, saldo 31/5). Il 31 maggio l'anno si chiude da solo e viene archiviato; il 1° giugno i conti
  ripartono dai saldi rimasti (riporto). La chiusura è contabile: non sposta denaro.
- **Rendiconto del Campo** mostra l'anno fiscale in corso con la colonna "Riporto 1/6"; il dettaglio di
  un conto parte dal riporto. Il Riepilogo riassume l'anno fiscale in corso.
- Registrazioni o chiusure con data in un anno già chiuso: solo l'amministratore, con conferma; il
  bilancio archiviato viene ricalcolato.

## 3.4 – 21/10/2026
- Dati di prova: cassa attuale portata a circa 3.800 € (offerte scalate, quote più frequenti ma
  sempre multiple di 38 e 9 €). Proporzioni invariate: Offerte ≈ 40%, quote ≈ 20%, PWT ≈ 10%.

## 3.3 – 21/10/2026
- Dati di prova: le quote annue sono multipli esatti di 38 € (un Gedeone) e di 9 € (un'Ausiliaria),
  cioè 38 o 76 € e 9, 18 o 27 €. Offerte ridotte di conseguenza: quote ≈ 20%, Offerte ≈ 40%,
  PWT ≈ 10%, cassa sempre sotto i 3.000 €.

## 3.2 – 21/10/2026
- Dati di prova: Offerte Gedeoni + Ausiliarie ≈ 40%, PWT Gedeoni + Ausiliarie ≈ 10%,
  Quote annue ≈ 20%, resto ≈ 30%. Cassa sempre sotto i 3.000 €.

## 3.1 – 21/10/2026
- Due nuovi conti per tutti gli account: **Quota annua Gedeoni** e **Quota annua Ausiliarie**
  (dopo "Offerte nuovi Ausiliarie"). Presenti nel foglio di registrazione, nel grafico, nel
  Rendiconto e nella Chiusura Cassa.
- Dati di prova: le due quote annue pesano il 20% della cassa; Offerte Gedeoni + Ausiliarie
  restano intorno al 50%; cassa sempre sotto i 3.000 €.

## 3.0 – 21/10/2026
- Dati di prova: Offerte Gedeoni + Offerte Ausiliarie pesano circa il 50% della cassa
  (40% + 10%); Pro Campo scende al 17%. Cassa sempre sotto i 3.000 €.

## 2.9 – 21/10/2026
- Dati di prova ridimensionati: la cassa resta sempre sotto i 3.000 € (circa 2.400 € oggi,
  picco di circa 2.700 € a fine 2025 prima della chiusura).

## 2.8 – 21/10/2026
- L'account di prova `test` è amministratore sui dati di prova: può modificare ed eliminare
  registrazioni e chiusure. Non ha accesso a Impostazioni (gli account veri restano protetti).

## 2.7 – 21/10/2026
- Account di prova **test / test**: entra in un ambiente separato con 100 registrazioni inventate
  su due anni e due chiusure di cassa annuali, rigenerate a ogni accesso. I dati veri restano intatti.
  Una striscia gialla segnala che si stanno vedendo dati di prova.
- Il nome utente non distingue più maiuscole e minuscole (es. "Test", "Campodivittoria").

## 2.6 – 21/10/2026
- Pulsante **Condividi** in alto a destra (al posto dell'icona): apre la scheda di condivisione del
  telefono (WhatsApp, Messaggi, Mail, copia link…); dove non c'è, una finestra con Copia link,
  WhatsApp, SMS ed Email.

## 2.5 – 21/10/2026
- Impostazioni: l'amministratore può di nuovo modificare nome utente e password di entrambi gli
  account (come nella 2.3), con la ripetizione della nuova password per ciascuno.

## 2.4 – 21/10/2026
- Impostazioni: si modificano solo nome utente e password dell'amministratore (con ripetizione
  della nuova password). L'utente generico resta fisso e non modificabile.

## 2.3 – 21/10/2026
- Nuova voce **Impostazioni** (solo amministratore): cambio di nome utente e password dell'utente
  generico e dell'amministratore, con conferma della password attuale; tasto per ripristinare quelli iniziali.
- L'amministratore può **modificare o eliminare** qualsiasi registrazione (data, luogo, tutti gli importi)
  e qualsiasi chiusura di cassa, dal dettaglio nello Storico. L'app impedisce modifiche che manderebbero
  un conto sotto zero.

## 2.2 – 21/10/2026
- "Registrazione Prima Nota" diventa "Storico Registrazioni": linea del tempo raggruppata per mese,
  con giorno, luogo, numero di conti e totale di ogni registrazione; chiusure di cassa in rosso.

## 2.1 – 21/10/2026
- Controllo automatico degli aggiornamenti: all'apertura (e quando si torna sull'app) confronta
  la versione pubblicata con quella in uso e, se è nuova, mostra la striscia "Aggiorna".

## 2.0 – 21/10/2026
- Passaggio alla versione 2.0 su richiesta del tesoriere; da qui si prosegue con 2.1, 2.2 …

## 1.1 – 21/10/2026
- Numero di versione visibile nell'app e questo elenco delle modifiche.

## 1.0 – 21/10/2026
Prima versione completa:
- Accesso con utente generico e amministratore, con "Rimani connesso".
- Menu a tendina laterale (☰).
- Riepilogo iniziale con grafico a ciambella, totali Pro Campo / altri conti / cassa,
  e pulsante "Nuova Registrazione" (popup con data, luogo, tutti i conti e totale).
- Rendiconto del Campo compatto per telefono; l'amministratore corregge gli importi dal dettaglio.
- Registrazione Prima Nota con popup per ogni registrazione e chiusura.
- Chiusura Cassa Annua con dati del bonifico, somme da togliere e saldi in cassa.
- Icona dell'app (emblema dei Gedeoni, euro e grafico) e installazione sulla schermata Home.
