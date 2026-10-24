// PUT /api/users (solo amministratore)
// { currentPassword, user: { name, password? }, admin: { name, password? } }  oppure  { currentPassword, reset: true }
const { getDb, ensureUsers, cors, auth, readBody, bcrypt, sign } = require('./_lib');
const DEFAULTS = { user: { name: 'campodivittoria', pw: 'vittoriaT' }, admin: { name: 'amministratore', pw: '030287' } };

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const who = auth(req);
  if (!who || who.role !== 'admin') return res.status(403).json({ error: 'Solo l’amministratore può cambiare gli account.' });
  try {
    const users = await ensureUsers(await getDb());
    if (req.method === 'GET') {
      const list = await users.find({}, { projection: { _id: 0, name: 1, role: 1 } }).toArray();
      return res.json({ user: list.find(u => u.role === 'user').name, admin: list.find(u => u.role === 'admin').name });
    }
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Metodo non consentito' });
    const body = await readBody(req);
    const adminDoc = await users.findOne({ role: 'admin' });
    if (!body.currentPassword || !bcrypt.compareSync(String(body.currentPassword), adminDoc.hash)) return res.status(401).json({ error: 'La password attuale dell’amministratore non è corretta.' });
    let user, admin;
    if (body.reset) { user = { name: DEFAULTS.user.name, password: DEFAULTS.user.pw }; admin = { name: DEFAULTS.admin.name, password: DEFAULTS.admin.pw }; }
    else { user = body.user || {}; admin = body.admin || {}; }
    const un = String(user.name || '').trim(), an = String(admin.name || '').trim();
    if (!un || !an) return res.status(400).json({ error: 'I nomi utente non possono essere vuoti.' });
    if (un.toLowerCase() === an.toLowerCase()) return res.status(400).json({ error: 'I due nomi utente devono essere diversi.' });
    if (un.toLowerCase() === 'test' || an.toLowerCase() === 'test') return res.status(400).json({ error: '“test” è riservato all’account di prova.' });
    for (const [role, u] of [['user', user], ['admin', admin]]) {
      if (u.password && String(u.password).length < 4) return res.status(400).json({ error: 'Le password devono avere almeno 4 caratteri.' });
      const set = { name: u.name.trim(), nameLower: u.name.trim().toLowerCase() };
      if (u.password) set.hash = bcrypt.hashSync(String(u.password), 10);
      await users.updateOne({ role }, { $set: set });
    }
    res.json({ ok: true, token: sign({ name: an, role: 'admin' }), admin: an, user: un });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Errore del server: ' + e.message }); }
};
