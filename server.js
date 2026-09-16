import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'ioez.sqlite');
const PUBLIC_DIR = __dirname;
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';

fs.mkdirSync(DB_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);
const schemaPath = path.join(__dirname, 'database', 'schema.sql');
if (fs.existsSync(schemaPath)) db.exec(fs.readFileSync(schemaPath, 'utf8'));

function nowId() {
  return crypto.randomUUID();
}

function seedUpdates() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM updates').get()?.count ?? 0;
  if (count) return;
  const stmt = db.prepare('INSERT INTO updates (id, version, title, description, created_at) VALUES (?, ?, ?, ?, ?)');
  const rows = [
    ['0.1.0', 'Backend real', 'Añadido servidor Node.js, SQLite, API de chat y persistencia.', '2026-09-16T23:45:00Z'],
    ['0.0.8', 'API en Ajustes', 'Configuración de API key, modelo y prueba de conexión desde Ajustes.', '2026-09-16T21:20:00Z'],
    ['0.0.8', 'Creador Sbtias', 'La interfaz y los metadatos muestran a Sbtias como creador de ioez.', '2026-09-16T21:10:00Z']
  ];
  for (const [version, title, description, createdAt] of rows) stmt.run(nowId(), version, title, description, createdAt);
}
seedUpdates();

function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(body);
}

function corsHeaders(req) {
  const configured = process.env.CORS_ORIGIN?.trim();
  const origin = req.headers.origin;
  if (!configured) return origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  const allowed = configured.split(',').map(s => s.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
  return {};
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-30).map(m => ({
    role: ['system', 'user', 'assistant'].includes(m?.role) ? m.role : 'user',
    content: String(m?.content ?? '').slice(0, 12000)
  })).filter(m => m.content.trim());
}

function ensureGuestUser() {
  const email = 'guest@ioez.local';
  let user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
  if (!user) {
    const id = nowId();
    db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(id, 'Guest', email, 'backend-managed');
    user = { id, name: 'Guest', email };
  }
  return user;
}

function ensureConversation(userId, conversationId, model = DEFAULT_MODEL) {
  if (conversationId) {
    const existing = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
    if (existing) return existing.id;
  }
  const id = nowId();
  db.prepare('INSERT INTO conversations (id, user_id, title, model) VALUES (?, ?, ?, ?)').run(id, userId, 'Nuevo chat', model);
  return id;
}

function saveMessage(conversationId, role, content) {
  db.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)').run(nowId(), conversationId, role, content);
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);
}

async function handleChat(req, res) {
  const body = await readJson(req);
  const messages = cleanMessages(body.messages);
  if (!messages.length) return send(res, 400, { error: 'No hay mensajes válidos.' });

  const user = ensureGuestUser();
  const model = String(body.model || DEFAULT_MODEL).slice(0, 160);
  const conversationId = ensureConversation(user.id, body.conversationId, model);
  const userMessage = [...messages].reverse().find(m => m.role === 'user');
  if (userMessage) saveMessage(conversationId, 'user', userMessage.content);

  const serverKey = process.env.OPENROUTER_API_KEY?.trim();
  const clientKey = String(req.headers['x-openrouter-key'] || '').trim();
  const apiKey = serverKey || clientKey;
  if (!apiKey) return send(res, 503, { error: 'Configura OPENROUTER_API_KEY en el backend o una clave personal en Ajustes.' });

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'ioez AI'
    },
    body: JSON.stringify({ model, messages, stream: false })
  });

  const text = await upstream.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = { error: text.slice(0, 1000) }; }
  if (!upstream.ok) return send(res, upstream.status, { error: payload?.error?.message || payload?.error || `OpenRouter respondió ${upstream.status}.` });

  const answer = payload?.choices?.[0]?.message?.content;
  if (!answer) return send(res, 502, { error: 'La respuesta del modelo no contenía texto.' });
  saveMessage(conversationId, 'assistant', String(answer));
  db.prepare('INSERT INTO usage_events (id, user_id, conversation_id, model, credits_used) VALUES (?, ?, ?, ?, ?)').run(nowId(), user.id, conversationId, model, 0);
  return send(res, 200, { answer: String(answer), conversationId, model });
}

function routeApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, { ok: true, service: 'ioez-backend', creator: 'Sbtias', database: 'sqlite', model: DEFAULT_MODEL });
  }

  if (req.method === 'GET' && url.pathname === '/api/updates') {
    const updates = db.prepare('SELECT version, title, description, created_at AS createdAt FROM updates ORDER BY created_at DESC').all();
    return send(res, 200, { updates });
  }

  if (req.method === 'GET' && url.pathname === '/api/conversations') {
    const user = ensureGuestUser();
    const conversations = db.prepare('SELECT id, title, model, created_at AS createdAt, updated_at AS updatedAt FROM conversations WHERE user_id = ? ORDER BY updated_at DESC').all(user.id);
    return send(res, 200, { conversations });
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/conversations/')) {
    const id = decodeURIComponent(url.pathname.split('/').pop());
    const messages = db.prepare('SELECT role, content, created_at AS createdAt FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(id);
    return send(res, 200, { messages });
  }

  if (req.method === 'POST' && url.pathname === '/api/chat') return handleChat(req, res);
  return send(res, 404, { error: 'Ruta no encontrada.' });
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon'
};

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname.includes('..')) return send(res, 400, { error: 'Ruta inválida.' }), true;
  const filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 400, { error: 'Ruta inválida.' }), true;
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600' });
  if (req.method === 'HEAD') return res.end(), true;
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...cors, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-OpenRouter-Key' });
    return res.end();
  }
  if (req.url?.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
    try { return routeApi(req, res, new URL(req.url, `http://${req.headers.host || 'localhost'}`)); }
    catch (error) { console.error(error); return send(res, 500, { error: 'Error interno del servidor.' }); }
  }
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (!serveStatic(req, res, url)) send(res, 404, 'Not found');
  } catch (error) { console.error(error); send(res, 500, 'Server error'); }
});

server.listen(PORT, HOST, () => {
  console.log(`ioez backend running on http://${HOST}:${PORT}`);
});

function shutdown() {
  try { db.close(); } finally { server.close(() => process.exit(0)); }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
