// GET /api/data            →  { regs, closings, seq, version }
// PUT /api/data { regs, closings, seq, version }  →  salva; 409 se la versione sul server è cambiata.
// L'utente generico può solo aggiungere; modifiche ed eliminazioni di voci esistenti solo all'amministratore.
const { getDb, cors, auth, readBody, CAMPO } = require('./_lib');

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function onlyAdditions(oldList, newList) {
  const byId = new Map(newList.map(x => [x.id, x]));
  return oldList.every(o => byId.has(o.id) && same(o, byId.get(o.id)));
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const who = auth(req);
  if (!who) return res.status(401).json({ error: 'Accesso scaduto: entra di nuovo.' });
  try {
    const col = (await getDb()).collection('data');
    const cur = await col.findOne({ _id: CAMPO });
    if (req.method === 'GET') {
      return res.json(cur ? { regs: cur.regs, closings: cur.closings, seq: cur.seq, version: cur.version } : { regs: [], closings: [], seq: 1, version: 0 });
    }
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Metodo non consentito' });
    const body = await readBody(req);
    if (!Array.isArray(body.regs) || !Array.isArray(body.closings)) return res.status(400).json({ error: 'Dati non validi' });
    const curVersion = cur ? cur.version : 0;
    if (body.version !== curVersion) return res.status(409).json({ error: 'Dati cambiati da un altro dispositivo', version: curVersion, regs: cur ? cur.regs : [], closings: cur ? cur.closings : [], seq: cur ? cur.seq : 1 });
    if (who.role !== 'admin' && cur && !(onlyAdditions(cur.regs, body.regs) && onlyAdditions(cur.closings, body.closings)))
      return res.status(403).json({ error: 'Solo l’amministratore può modificare o eliminare registrazioni esistenti.' });
    const doc = { regs: body.regs, closings: body.closings, seq: Number(body.seq) || 1, version: curVersion + 1, updatedAt: new Date(), updatedBy: who.name };
    await col.updateOne({ _id: CAMPO }, { $set: doc }, { upsert: true });
    res.json({ ok: true, version: doc.version });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Errore del server: ' + e.message }); }
};
