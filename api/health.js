// GET /api/health → verifica che il server e il database rispondano
const { getDb, cors } = require('./_lib');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try { const db = await getDb(); await db.command({ ping: 1 }); res.json({ ok: true, db: db.databaseName, jwt: !!process.env.JWT_SECRET }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
};
