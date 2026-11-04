import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// SEO heads and HTTP-200 entrypoints, not fully prerendered React content.
const root = resolve('dist');
const entry = join(root, 'index.html');
if (!existsSync(entry)) throw new Error('Build with GITHUB_PAGES=true first.');
const template = readFileSync(entry, 'utf8');
if (!template.includes('/RankNova/assets/')) throw new Error('This requires the GitHub Pages Vite build.');
const pages = JSON.parse(readFileSync(resolve('src/lib/pageMetadata.json'), 'utf8'));
const site = 'https://mmoavia7861.github.io/RankNova';
const logo = site + '/assets/aistudio/RankNova_Growth_Analytics_Logo_037f0c19.png';
const esc = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function makeHtml(route, info) {
  const canonical = site + (route === '/' ? '/' : route + '/');
  let html = template;
  function swap(regex, value) {
    if (!regex.test(html)) throw new Error('Missing required head tag: ' + regex);
    html = html.replace(regex, value);
  }
  swap(/<title>[^<]*<\/title>/i, '<title>' + esc(info.title) + '</title>');
  swap(/<meta name="description"[^>]*>/i, '<meta name="description" content="' + esc(info.description) + '" />');
  swap(/<meta property="og:title"[^>]*>/i, '<meta property="og:title" content="' + esc(info.title) + '" />');
  swap(/<meta property="og:description"[^>]*>/i, '<meta property="og:description" content="' + esc(info.description) + '" />');
  swap(/<meta property="og:image"[^>]*>/i, '<meta property="og:image" content="' + logo + '" />');
  return html.replace('</head>',
    '<link rel="canonical" href="' + esc(canonical) + '" />\n' +
    '<meta property="og:url" content="' + esc(canonical) + '" />\n' +
    '<meta name="twitter:image" content="' + logo + '" />\n' +
    '<meta name="robots" content="index, follow" />\n</head>');
}
for (const [route, info] of Object.entries(pages)) {
  if (!route.startsWith('/') || route.includes('..') || route === '/admin' || !info.title || !info.description) {
    throw new Error('Invalid public route metadata: ' + route);
  }
  const target = route === '/' ? entry : join(root, route.slice(1), 'index.html');
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, makeHtml(route, info));
}
// Unknown routes retain an HTTP 404 and must not be advertised to crawlers.
writeFileSync(join(root, '404.html'), template.replace('</head>',
  '<meta name="robots" content="noindex, follow" />\n</head>'));
const locs = Object.keys(pages).map(route => {
  const loc = site + (route === '/' ? '/' : route + '/');
  return '  <url><loc>' + esc(loc) + '</loc></url>';
});
writeFileSync(join(root, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  locs.join('\n') + '\n</urlset>\n');
console.log('Generated ' + locs.length + ' SEO route documents plus sitemap.xml.');
