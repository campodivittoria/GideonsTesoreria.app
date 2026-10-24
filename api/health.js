// GET /api/health → verifica server e database, con una diagnosi leggibile (senza mai mostrare la password)
const { getDb, cors } = require('./_lib');

function checkUri(uri) {
  const out = { presente: !!uri, problemi: [] };
  if (!uri) { out.problemi.push('Su Vercel manca la variabile MONGODB_URI.'); return out; }
  const s = uri.trim();
  if (s !== uri) out.problemi.push('La stringa ha spazi all’inizio o alla fine: cancellali.');
  if (/^["']|["']$/.test(s)) out.problemi.push('La stringa è tra virgolette: toglile.');
  const m = s.match(/^mongodb(\+srv)?:\/\/([^:@\/]*)(?::([^@]*))?@([^\/?]+)/);
  if (!m) { out.problemi.push('La stringa non inizia con mongodb+srv://utente:password@indirizzo'); return out; }
  const [, , user, pw = '', host] = m;
  out.utente = decodeURIComponent(user);
  out.indirizzo = host;
  out.lunghezzaPassword = pw.length;
  if (!pw) out.problemi.push('Manca la password dopo il nome utente (formato: utente:password@).');
  if (/[<>]/.test(pw) || /db_password/i.test(pw)) out.problemi.push('Al posto della password c’è ancora <db_password>: va sostituita con la password vera, senza < >.');
  if (/[@:\/?#\[\]%\s]/.test(decodeURIComponent(pw)) && !/%[0-9A-F]{2}/i.test(pw)) out.problemi.push('La password contiene caratteri speciali (@ : / ? # % spazio): rigenerala su Atlas con "Autogenerate".');
  return out;
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const diag = { variabili: { MONGODB_URI: checkUri(process.env.MONGODB_URI), JWT_SECRET: !!process.env.JWT_SECRET } };
  if (!process.env.JWT_SECRET) diag.variabili.problemaJWT = 'Su Vercel manca la variabile JWT_SECRET.';
  try {
    const db = await getDb(); await db.command({ ping: 1 });
    res.json({ ok: !!process.env.JWT_SECRET, db: db.databaseName, jwt: !!process.env.JWT_SECRET, ...diag });
  } catch (e) {
    let cosaFare = 'Controlla la variabile MONGODB_URI su Vercel e poi fai Redeploy.';
    if (/bad auth|authentication failed/i.test(e.message)) cosaFare = `Utente o password non corrispondono. Su Atlas → Database Access, l'utente deve chiamarsi esattamente "${diag.variabili.MONGODB_URI.utente || '?'}"; rigenera la password (Edit → Edit Password → Autogenerate → Update User), mettila in MONGODB_URI su Vercel e fai Redeploy.`;
    else if (/SSL|tls|alert|ECONNREFUSED|timed out|Server selection/i.test(e.message)) cosaFare = 'Atlas rifiuta la connessione: in Atlas → Network Access deve esserci 0.0.0.0/0 (Active).';
    else if (/ENOTFOUND|querySrv/i.test(e.message)) cosaFare = 'L’indirizzo del cluster nella stringa è sbagliato: ricopialo da Atlas → Connect → Drivers.';
    res.status(500).json({ ok: false, errore: e.message, cosaFare, ...diag });
  }
};
