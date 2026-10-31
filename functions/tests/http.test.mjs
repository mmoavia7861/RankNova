import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';

const require = createRequire(import.meta.url);
const { ranknovaApi } = require('../lib/index.cjs');

async function withServer(run) {
  const server = createServer(async (req, res) => {
    // The Firebase HTTP framework normally parses JSON before it calls the function.
    // Simulate that behavior in this standalone smoke-test server.
    let raw = '';
    for await (const part of req) raw += part;
    if (req.headers['content-type']?.includes('application/json') && raw) {
      req.body = JSON.parse(raw);
    }
    // Firebase's real onRequest runtime supplies Express response methods.
    // Node's raw http.ServerResponse in this test does not, so emulate them.
    res.status = code => { res.statusCode = code; return res; };
    res.json = payload => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(payload));
      return res;
    };
    try {
      await ranknovaApi(req, res);
    } catch (error) {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Test handler failure' }));
      }
      throw error;
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('Firebase HTTP function responds with a real JSON health payload', async () => {
  await withServer(async base => {
    const result = await fetch(base + '/api/health', { signal: AbortSignal.timeout(5000) });
    assert.equal(result.status, 200);
    assert.equal((await result.json()).status, 'ok');
  });
});

test('Firebase HTTP function denies untrusted browser origins', async () => {
  await withServer(async base => {
    const result = await fetch(base + '/api/audit', {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: { 'Origin': 'https://attacker.invalid', 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' })
    });
    assert.equal(result.status, 403);
  });
});

test('Firebase HTTP function rejects internal URLs without fetching them', async () => {
  await withServer(async base => {
    const result = await fetch(base + '/api/audit', {
      method: 'POST',
      headers: { 'Origin': 'https://mmoavia7861.github.io', 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://127.0.0.1/' })
    });
    assert.equal(result.status, 400);
    assert.match((await result.json()).error, /internal|localhost|forbidden/i);
  });
});


test('Direct Firebase HTTPS function path returns health and permits GitHub Pages CORS', async () => {
  await withServer(async base => {
    const result = await fetch(base + '/ranknovaApi/api/health', {
      signal: AbortSignal.timeout(5000),
      headers: { Origin: 'https://mmoavia7861.github.io' }
    });
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('access-control-allow-origin'), 'https://mmoavia7861.github.io');
    assert.equal((await result.json()).status, 'ok');
  });
});

test('Project-specific Firebase Hosting origin is permitted but other Hosting origins are denied', async () => {
  await withServer(async base => {
    const own = await fetch(base + '/api/health', {
      headers: { Origin: 'https://gen-lang-client-0081440357.web.app' }
    });
    assert.equal(own.status, 200);
    assert.equal(own.headers.get('access-control-allow-origin'), 'https://gen-lang-client-0081440357.web.app');
    const other = await fetch(base + '/api/health', {
      headers: { Origin: 'https://unrelated.firebaseapp.com' }
    });
    assert.equal(other.status, 403);
  });
});

test('Firebase direct function supports browser OPTIONS preflight', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/ranknovaApi/api/audit', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://mmoavia7861.github.io',
        'Access-Control-Request-Method': 'POST'
      }
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://mmoavia7861.github.io');
  });
});
