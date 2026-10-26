import { createServer } from 'node:http';

export function createHttpServer(broker, { maxBody = 8192, perMinute = 60 } = {}) {
  const hits = new Map();
  setInterval(() => hits.clear(), 60e3).unref();
  const send = (res, out) => {
    const h = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY' };
    if (out.location) { res.writeHead(out.status, { ...h, location: out.location }); return res.end(); }
    if (out.json) { res.writeHead(out.status, { ...h, 'content-type': 'application/json' }); return res.end(JSON.stringify(out.json)); }
    res.writeHead(out.status, { ...h, 'content-type': 'text/plain; charset=utf-8' }); res.end(out.text || '');
  };
  return createServer(async (req, res) => {
    try {
      const ip = req.socket.remoteAddress || '?';
      const n = (hits.get(ip) || 0) + 1; hits.set(ip, n);
      if (n > perMinute) return send(res, { status: 429, text: 'Too many requests' });
      const url = new URL(req.url, 'http://local');
      const q = Object.fromEntries(url.searchParams);
      if (req.method === 'GET' && url.pathname === '/healthz') return send(res, { status: 200, json: { ok: true } });
      if (req.method === 'GET' && url.pathname === '/oauth/authorize') return send(res, broker.authorize(q));
      if (req.method === 'GET' && url.pathname === '/oauth/google/callback') return send(res, await broker.googleCallback(q));
      if (req.method === 'POST' && url.pathname === '/oauth/token') {
        if (!String(req.headers['content-type'] || '').startsWith('application/x-www-form-urlencoded')) return send(res, { status: 415, json: { error: 'invalid_request' } });
        let body = '';
        for await (const chunk of req) { body += chunk; if (body.length > maxBody) return send(res, { status: 413, json: { error: 'invalid_request' } }); }
        return send(res, await broker.token(Object.fromEntries(new URLSearchParams(body))));
      }
      send(res, { status: 404, text: 'Not found' });
    } catch {
      send(res, { status: 500, json: { error: 'server_error' } });
    }
  });
}