// Funzioni comuni dell'API: connessione a MongoDB, utenti, token, CORS.
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DEFAULT_USERS = [
  { role: 'user',  name: 'campodivittoria', pw: 'vittoriaT' },
  { role: 'admin', name: 'amministratore',  pw: '030287' }
];
const CAMPO = 'campodivittoria'; // un solo documento dati per il Campo

let clientPromise = null;
async function getDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI non impostata');
  if (!clientPromise) clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'tesoreria');
}

// Crea gli utenti iniziali la prima volta
async function ensureUsers(db) {
  const col = db.collection('users');
  if (await col.countDocuments() === 0) {
    await col.insertMany(DEFAULT_USERS.map(u => ({ role: u.role, name: u.name, nameLower: u.name.toLowerCase(), hash: bcrypt.hashSync(u.pw, 10) })));
  }
  return col;
}

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

function sign(user) {
  return jwt.sign({ name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '90d' });
}
function auth(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer (.+)$/);
  if (!m) return null;
  try { return jwt.verify(m[1], process.env.JWT_SECRET); } catch (e) { return null; }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return new Promise((resolve, reject) => {
    let s = ''; req.on('data', c => s += c); req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
  });
}

module.exports = { getDb, ensureUsers, cors, sign, auth, readBody, bcrypt, CAMPO };
