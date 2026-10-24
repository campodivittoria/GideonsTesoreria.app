// POST /api/login  { user, password }  →  { token, name, role }
const { getDb, ensureUsers, cors, sign, readBody, bcrypt } = require('./_lib');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });
  try {
    const { user, password } = await readBody(req);
    if (!user || !password) return res.status(400).json({ error: 'Utente e password obbligatori' });
    const users = await ensureUsers(await getDb());
    const u = await users.findOne({ nameLower: String(user).trim().toLowerCase() });
    if (!u || !bcrypt.compareSync(String(password), u.hash)) return res.status(401).json({ error: 'Utente o password non corretti.' });
    res.json({ token: sign(u), name: u.name, role: u.role });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Errore del server: ' + e.message }); }
};
