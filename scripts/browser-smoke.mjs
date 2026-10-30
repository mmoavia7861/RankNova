import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const server = spawn('node', ['./node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverOutput = '';
server.stdout.on('data', chunk => serverOutput += String(chunk));
server.stderr.on('data', chunk => serverOutput += String(chunk));

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    if (server.exitCode !== null) throw new Error('Preview server exited: '+serverOutput);
    try {
      const res = await fetch('http://127.0.0.1:4173/RankNova/');
      if (res.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error('Preview server not ready: '+serverOutput);
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const errors = [];
  const failed = [];
  page.on('pageerror', err => errors.push(err.stack || err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  page.on('requestfailed', req => failed.push(req.url() + ' : ' + req.failure()?.errorText));
  const url = 'http://127.0.0.1:4173/RankNova/';
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5500);
  console.log('NAV',url,'HTTP',response?.status());
  console.log('PAGE_TITLE',await page.title());
  console.log('ROOT_HTML',(await page.locator('#root').innerHTML()).slice(0,700));
  console.log('BROWSER_ERRORS',JSON.stringify(errors.slice(0,30),null,2));
  console.log('FAILED_REQUESTS',JSON.stringify(failed.slice(0,25),null,2));
  await page.screenshot({ path: 'browser-startup.png', fullPage: true });
  assert.ok((await page.locator('#root').locator('*').count()) > 1, 'The React root is blank after 5.5 seconds');
  assert.equal(errors.length, 0, 'Browser has uncaught errors');
  assert.ok((await page.locator('h1').count()) > 0, 'Home page heading missing');
  console.log('PASS: RankNova home page renders successfully.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
