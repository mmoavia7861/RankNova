import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep, extname } from 'node:path';
import assert from 'node:assert/strict';

// Mimic the real GitHub Pages /RankNova/ asset prefix exactly.
// Vite preview in this repository does not mount assets at /RankNova/ and returns 404,
// so it is not an accurate hosting compatibility test.
const root = resolve('dist');
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.json':'application/json'};
const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const requested = decodeURIComponent(url.pathname);
  if (requested !== '/RankNova' && !requested.startsWith('/RankNova/')) {
    res.writeHead(404);res.end('Unknown path');return;
  }
  const relative = requested.replace(/^\/RankNova\/?/, '') || 'index.html';
  const file = resolve(root, relative);
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403);res.end('Invalid path');return;
  }
  const target = existsSync(file) ? file : resolve(root, '404.html');
  if (!existsSync(target)) {res.writeHead(404);res.end('Not found');return;}
  res.setHeader('Content-Type', mime[extname(target)] || 'application/octet-stream');
  if (!existsSync(file)) res.statusCode = 404;
  res.end(readFileSync(target));
});
await new Promise(resolveReady => server.listen(4173, '127.0.0.1', resolveReady));

let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const errors = [];
  const failed = [];
  const responses = [];
  page.on('pageerror', err => errors.push(err.stack || err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  page.on('requestfailed', req => failed.push(req.url() + ' : ' + req.failure()?.errorText));
  page.on('response', response => { if (response.status() >= 400) responses.push(response.status() + ' ' + response.url()); });
  const url = 'http://127.0.0.1:4173/RankNova/';
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(5500);
  console.log('LOCAL_STATUS',response?.status());
  console.log('LOCAL_TITLE',await page.title());
  console.log('LOCAL_ROOT_LENGTH', (await page.locator('#root').innerHTML()).length);
  console.log('LOCAL_BROWSER_ERRORS', JSON.stringify(errors.slice(0,30),null,2));
  console.log('LOCAL_FAILED_REQUESTS', JSON.stringify(failed.slice(0,25),null,2));
  console.log('LOCAL_NON_2XX_RESPONSES', JSON.stringify(responses.slice(0,25),null,2));
  await page.screenshot({ path: 'browser-startup.png', fullPage: true });

  // Also diagnose what visitors really receive from published GitHub Pages.
  const live = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const liveErrors = [], liveFailures = [], assets = [];
  live.on('pageerror', err => liveErrors.push(err.stack || err.message));
  live.on('console', msg => { if (msg.type() === 'error') liveErrors.push('console: ' + msg.text()); });
  live.on('requestfailed', req => liveFailures.push(req.url() + ' : ' + req.failure()?.errorText));
  live.on('response', res => { if (res.status() >= 400) assets.push(res.status() + ' ' + res.url()); });
  try {
    const liveResponse = await live.goto('https://mmoavia7861.github.io/RankNova/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await live.waitForTimeout(5500);
    console.log('LIVE_SITE_STATUS', liveResponse?.status());
    console.log('LIVE_ROOT_LENGTH', (await live.locator('#root').innerHTML()).length);
    console.log('LIVE_MODULE_SCRIPTS', JSON.stringify(await live.locator('script[type="module"]').evaluateAll(nodes => nodes.map(n => n.src))));
    console.log('LIVE_PAGE_ERRORS', JSON.stringify(liveErrors.slice(0,30), null, 2));
    console.log('LIVE_FAILED_REQUESTS', JSON.stringify(liveFailures.slice(0,30), null, 2));
    console.log('LIVE_NON_2XX_RESPONSES', JSON.stringify(assets.slice(0,30), null, 2));
    await live.screenshot({ path: 'browser-live-debug.png', fullPage: true });
  } catch (error) {
    console.log('LIVE_DIAGNOSTIC_FETCH_ERROR', String(error));
  }
  assert.ok((await page.locator('#root').locator('*').count()) > 1, 'The local production build React root is blank');
  assert.equal(errors.length, 0, 'Local browser has uncaught errors');
  assert.ok((await page.locator('h1').count()) > 0, 'Home page heading missing');
  console.log('PASS: RankNova local production build renders with /RankNova/ static hosting.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
}
