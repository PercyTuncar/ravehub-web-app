#!/usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as cheerio from 'cheerio';
import { request } from 'undici';
import robotsParser from 'robots-parser';
import { XMLParser } from 'fast-xml-parser';
import Ajv from 'ajv';
import { imageSize } from 'image-size';
import fs from 'fs/promises';
import path from 'node:path';

const UA_GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

// ---- JSON-LD helpers (subtipos y @graph) ----
function flattenJsonLd(node) {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(flattenJsonLd);
  if (node['@graph']) return flattenJsonLd(node['@graph']);
  return [node];
}

function getTypes(node) {
  const t = node?.['@type'];
  if (!t) return [];
  return Array.isArray(t) ? t : [t];
}

const EVENT_LIKE = new Set([
  'Event', 'MusicEvent', 'MusicFestival', 'Festival', 'TheaterEvent', 'SportsEvent'
]);

const ARTICLE_LIKE = new Set([
  'Article', 'NewsArticle', 'BlogPosting', 'Report', 'TechArticle', 'AnalysisNewsArticle'
]);

function isEventLike(t) {
  return EVENT_LIKE.has(t);
}
function isArticleLike(t) {
  return ARTICLE_LIKE.has(t);
}

function firstNonEmpty(...arr) {
  for (const v of arr) if (v && String(v).trim()) return v;
  return '';
}

async function fetchRaw(url, { ua = UA_GOOGLEBOT, maxRedirects = 0 } = {}) {
  try {
    const res = await request(url, {
      method: 'GET',
      headers: { 'User-Agent': ua, 'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8' },
      maxRedirections: maxRedirects
    });
    return res;
  } catch (e) {
    return { statusCode: 0, headers: {}, body: { text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) }, error: e };
  }
}

async function fetchChain(url) {
  const chain = [];
  let current = url;
  for (let i = 0; i < 10; i++) {
    const { statusCode, headers } = await fetchRaw(current);
    chain.push({ url: current, status: statusCode, location: headers.location });
    if ([301, 302, 307, 308].includes(statusCode) && headers.location) {
      const next = new URL(headers.location, current).toString();
      if (next === current) break;
      current = next;
      continue;
    }
    break;
  }
  return chain;
}

async function fetchRendered(url) {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent(UA_GOOGLEBOT);
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-ES,es;q=0.9' });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  const html = await page.content();
  const info = await page.evaluate(() => {
    const robots = document.querySelector('meta[name="robots"]')?.content || '';
    const canon = document.querySelector('link[rel="canonical"]')?.href || '';
    const lang = document.documentElement.lang || '';
    const h1 = document.querySelector('h1')?.textContent?.trim() || '';
    // variantes comunes de fecha modificada
    const metaMod = document.querySelector('meta[property="article:modified_time"]')?.content
                 || document.querySelector('meta[name="article:modified_time"]')?.content
                 || document.querySelector('time[datetime][itemprop="dateModified"]')?.getAttribute('datetime')
                 || '';
    const links = Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href'));
    return { robots, canon, lang, h1, metaMod, links };
  });
  await browser.close();
  return { html, headers: info };
}

// ---------- JSON-LD ----------
function extractJsonLd(html) {
  const $ = cheerio.load(html);
  const blocks = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const txt = $(el).text();
      const json = JSON.parse(txt);
      blocks.push(...flattenJsonLd(json));
    } catch {}
  });
  return blocks;
}

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

function normalizeImageField(img, baseUrl) {
  const arr = toArray(img).map(x => {
    if (!x) return null;
    if (typeof x === 'string') return new URL(x, baseUrl).toString();
    if (typeof x === 'object' && x.url) return new URL(x.url, baseUrl).toString();
    return null;
  }).filter(Boolean);
  return [...new Set(arr)];
}

async function fetchImageDims(imgUrl) {
  try {
    const res = await fetchRaw(imgUrl, { ua: UA_GOOGLEBOT, maxRedirects: 5 });
    if (!res.statusCode || res.statusCode >= 400) return { ok: false, reason: `HTTP ${res.statusCode}` };
    const ab = await res.body.arrayBuffer();
    const buf = Buffer.from(ab);
    const dim = imageSize(buf);
    return { ok: true, width: dim.width, height: dim.height, type: dim.type };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

function validateSchemaBlocks(blocks, { expectedCanonical }) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const errors = [];
  const warnings = [];

  const has = v => v !== undefined && v !== null && `${v}`.trim() !== '';

  blocks.forEach((b, i) => {
    const types = getTypes(b);
    const t0 = types[0];

    // ARTICLE-LIKE: BlogPosting / NewsArticle / Article...
    if (types.some(isArticleLike)) {
      const headline = firstNonEmpty(b.headline, b.name);
      if (!has(headline)) errors.push(`[ArticleLike#${i}] falta "headline/name"`);
      if (!has(b.datePublished)) errors.push(`[ArticleLike#${i}] falta "datePublished"`);
      if (!has(b.author)) errors.push(`[ArticleLike#${i}] falta "author"`);
      if (!has(b.image)) warnings.push(`[ArticleLike#${i}] recomendable "image" >=1200px`);
      if (!has(b.dateModified)) warnings.push(`[ArticleLike#${i}] recomendable "dateModified"`);
    }

    // EVENT-LIKE: Event / MusicEvent / MusicFestival...
    if (types.some(isEventLike)) {
      const name = firstNonEmpty(b.name, b.headline);
      if (!has(name)) errors.push(`[EventLike#${i}] falta "name"`);
      if (!has(b.startDate)) errors.push(`[EventLike#${i}] falta "startDate"`);
      if (!has(b.location)) errors.push(`[EventLike#${i}] falta "location"`);
      if (!has(b.offers)) warnings.push(`[EventLike#${i}] recomendable "offers" (precio/availability/url)`);
      if (!has(b.eventAttendanceMode)) warnings.push(`[EventLike#${i}] "eventAttendanceMode" recomendado`);
      if (!has(b.eventStatus)) warnings.push(`[EventLike#${i}] "eventStatus" recomendado`);
    }

    // PRODUCT
    if (types.includes('Product')) {
      if (!has(b.name)) errors.push(`[Product#${i}] falta "name"`);
      if (!has(b.offers)) errors.push(`[Product#${i}] falta "offers" con price/currency/availability/url`);
    }

    // mainEntityOfPage vs canonical
    const me = b.mainEntityOfPage;
    const id = typeof me === 'string' ? me : me?.['@id'];
    if (id && expectedCanonical) {
      try {
        if (new URL(id).toString() !== new URL(expectedCanonical).toString()) {
          warnings.push(`[${t0 || 'Schema'}#${i}] mainEntityOfPage != canonical`);
        }
      } catch {}
    }
  });

  return { errors, warnings };
}

// ---------- Clasificador de ruta y reglas SEO por sección ----------
function classifyRoute(url, $, htmlInfo) {
  const p = new URL(url).pathname;

  const hasPaginationLinks = $('a[href*="/page/"], a[href*="?page="]').length > 0;

  if (/^\/blog(\/)?$/.test(p) || /^\/blog\/page\//.test(p)) {
    return { type: 'blog-list', checks: { expectPagination: true } };
  }
  if (/^\/blog\/categoria\//.test(p) || /^\/blog\/categorias\//.test(p)) {
    return { type: 'blog-category', checks: { expectPagination: true, shouldBeIndexable: true } };
  }
  if (/^\/blog\/[^/]+$/.test(p)) {
    // ahora esperamos cualquier ARTICLE-LIKE
    return { type: 'blog-detail', checks: { expectArticleLike: true, compareH1Headline: true } };
  }

  if (/^\/eventos(\/)?$/.test(p) || /^\/eventos\/page\//.test(p)) {
    return { type: 'events-list', checks: { expectPagination: true } };
  }
  if (/^\/eventos\/[^/]+\/comprar$/.test(p)) {
    return { type: 'events-buy', checks: { mustNoindex: true } };
  }
  if (/^\/eventos\/[^/]+$/.test(p)) {
    // ahora esperamos cualquier EVENT-LIKE (MusicEvent, MusicFestival, ...)
    return { type: 'events-detail', checks: { expectEventLike: true, compareH1Headline: false } };
  }

  if (/^\/tienda(\/)?$/.test(p)) {
    // si hay ?color/order etc, deberíamos ver canónico a base o noindex
    const hasFacet = /\b(color|size|order|brand|category|tag)\b/i.test(new URL(url).search);
    return { type: 'shop-list', checks: { facets: hasFacet } };
  }
  if (/^\/tienda\/categoria\//.test(p)) {
    const hasFacet = /\b(color|size|order|brand|category|tag)\b/i.test(new URL(url).search);
    return { type: 'shop-category', checks: { facets: hasFacet, expectPagination: true } };
  }
  if (/^\/tienda\/checkout$/.test(p) || /^\/tienda\/carrito$/.test(p)) {
    return { type: 'shop-checkout', checks: { mustNoindex: true } };
  }
  if (/^\/tienda\/[^/]+$/.test(p)) {
    return { type: 'shop-detail', checks: { expectJsonLd: ['Product'], compareH1Headline: true } };
  }

  if (/^\/(auth|admin|user)(\/|$)/.test(p)) {
    return { type: 'private', checks: { mustNoindex: true } };
  }
  if (/^\/api\//.test(p)) {
    return { type: 'api', checks: { mustXRobots: true } };
  }

  return { type: 'other', checks: {} };
}

function summarizeIssues({ route, htmlInfo, canonicalTag, robotsHeader, schemaBlocks, schemaVal, paginated, facets, xrobots, imageFindings, h1HeadlineDiff, dateMismatch }) {
  const issues = [];

  // Noindex / X-Robots
  if (route.checks?.mustNoindex) {
    if (!/noindex/i.test(htmlInfo.robots || '')) issues.push('Debe tener <meta robots=noindex>');
  }
  if (route.checks?.mustXRobots) {
    if (!xrobots) issues.push('API debe enviar X-Robots-Tag: noindex');
  }

  // Paginación
  if (route.checks?.expectPagination && !paginated) issues.push('Listado/categoría sin enlaces de paginación HTML');

  // Facetas
  if (route.type.startsWith('shop') || route.type === 'blog-list' || route.type === 'blog-category') {
    if (facets?.hasFacet && !(facets.hasNoindex || facets.canonicalToBase)) {
      issues.push('Facetas indexables: añadir noindex,follow o canónico a base');
    }
  }

  // JSON-LD esperado (por supertipo)
  if (route.checks?.expectEventLike || route.checks?.expectArticleLike || route.checks?.expectJsonLd?.length) {
    const allTypes = schemaBlocks.flatMap(getTypes);

    if (route.checks?.expectEventLike) {
      const hasEvent = allTypes.some(isEventLike);
      if (!hasEvent) issues.push('Schema esperado (Event-like) no encontrado');
    }

    if (route.checks?.expectArticleLike) {
      const hasArticle = allTypes.some(isArticleLike);
      if (!hasArticle) issues.push('Schema esperado (Article-like) no encontrado');
    }

    // compat: si alguna ruta usa expectJsonLd exacto
    if (route.checks?.expectJsonLd?.length) {
      const hit = allTypes.some(t => route.checks.expectJsonLd.includes(t));
      if (!hit) issues.push(`Schema esperado (${route.checks.expectJsonLd.join('/')}) no encontrado`);
    }
  }

  // Errores de schema
  if (schemaVal.errors.length) issues.push(`Schema errores: ${schemaVal.errors.length}`);

  // Imágenes JSON-LD < 1200
  if (imageFindings?.some(f => f.ok && f.width < 1200)) issues.push('Imágenes de schema < 1200px');

  // H1 vs headline
  if (h1HeadlineDiff) issues.push('H1 y headline (schema) difieren en exceso');

  // dateModified desalineado
  if (dateMismatch) issues.push('dateModified del schema y del HTML no coinciden');

  // Canónico vacío
  if (!canonicalTag) issues.push('Falta <link rel="canonical">');

  return issues;
}

// ---------- Checks auxiliares ----------
function getCanonical($) {
  return $('link[rel="canonical"]').attr('href') || '';
}
function hasPagination($) {
  return $('a[href*="/page/"], a[href*="?page="]').length > 0;
}
function facetsInfo(url, $, canonicalTag) {
  const u = new URL(url);
  const hasFacet = ['category','tag','color','size','brand','order','sort'].some(k => u.searchParams.has(k));
  const canonicalToBase = canonicalTag && (new URL(canonicalTag, url).pathname === u.pathname && !new URL(canonicalTag, url).search);
  const hasNoindex = /noindex/i.test($('meta[name="robots"]').attr('content') || '');
  return { hasFacet, canonicalToBase, hasNoindex };
}
function xRobotsNoindex(headers) {
  const v = (headers['x-robots-tag'] || headers['X-Robots-Tag'] || '').toString().toLowerCase();
  return v.includes('noindex');
}
function normalizeStr(s) { return (s || '').trim().replace(/\s+/g,' ').toLowerCase(); }

// ---------- Auditor de UNA URL ----------
async function testSingleUrl({ validateImages = true } = {}) {
  const { url } = await inquirer.prompt([{ name: 'url', message: 'URL a auditar', validate: u => u.startsWith('http') }]);
  const spin = ora('Analizando...').start();

  const chain = await fetchChain(url);
  const final = chain[chain.length-1]?.url || url;
  const head = await fetchRaw(final, { maxRedirects: 0 });
  const headers = head.headers;

  const htmlRendered = await fetchRendered(final);
  const html = htmlRendered.html;
  const info = htmlRendered.headers;

  const $ = cheerio.load(html);
  const canonicalTag = getCanonical($);
  const jsonldBlocks = extractJsonLd(html);
  const schemaVal = validateSchemaBlocks(jsonldBlocks, { expectedCanonical: canonicalTag });

  // Reglas por sección
  const route = classifyRoute(final, $, info);

  // Paginación/facetas
  const paginated = hasPagination($);
  const facets = facetsInfo(final, $, canonicalTag);

  // Imagenes de JSON-LD (valida 1 por bloque para rendimiento)
  const imageFindings = [];
  if (validateImages) {
    for (const b of jsonldBlocks) {
      const imgs = normalizeImageField(b.image, final).slice(0, 1);
      for (const img of imgs) {
        const dim = await fetchImageDims(img);
        imageFindings.push({ url: img, ...dim });
      }
    }
  }

  // Comparación H1 vs headline (dif > 20% de long o distinto después de normalizar)
  let h1HeadlineDiff = false;
  if (route.checks?.compareH1Headline) {
    const articleNode = jsonldBlocks.find(b => getTypes(b).some(isArticleLike));
    const headline = articleNode ? firstNonEmpty(articleNode.headline, articleNode.name) : '';
    const a = normalizeStr(info.h1);
    const b = normalizeStr(headline);
    if (a && b) {
      const longer = Math.max(a.length, b.length);
      const distance = levenshtein(a, b);
      if (longer > 0 && distance / longer > 0.2) h1HeadlineDiff = true;
    }
  }

  // dateModified HTML vs schema
  const schemaMod = jsonldBlocks.find(b => b.dateModified)?.dateModified || '';
  const htmlMod = info.metaMod || '';
  const dateMismatch = schemaMod && htmlMod && (new Date(schemaMod).toISOString().slice(0,10) !== new Date(htmlMod).toISOString().slice(0,10));

  const issues = summarizeIssues({
    route, htmlInfo: info, canonicalTag, robotsHeader: headers, schemaBlocks: jsonldBlocks,
    schemaVal, paginated, facets, xrobots: xRobotsNoindex(headers), imageFindings, h1HeadlineDiff, dateMismatch
  });

  spin.stop();

  console.log(chalk.cyan('\n— Cadena de redirecciones —'));
  chain.forEach((h, i) => console.log(`${i+1}. [${h.status}] ${h.url}${h.location ? ' → '+h.location : ''}`));

  console.log(chalk.cyan('\n— HTTP final —'));
  console.table({
    status: head.statusCode,
    'content-type': headers['content-type'],
    'cache-control': headers['cache-control'],
    'x-robots-tag': headers['x-robots-tag'] || headers['X-Robots-Tag'] || ''
  });

  console.log(chalk.cyan('\n— HTML renderizado —'));
  console.table({
    route: route.type,
    title: $('title').first().text().trim(),
    h1: info.h1 || '(none)',
    lang: info.lang,
    meta_robots: info.robots || '(none)',
    canonical: canonicalTag || '(none)',
    html_dateModified: info.metaMod || '(none)'
  });

  // Imprimir schemas "bonito" y guardarlos
  await printAndSaveJsonLd(jsonldBlocks, final);

  console.log(chalk.cyan('\n— JSON-LD —'));
  console.log(`bloques: ${jsonldBlocks.length}`);
  if (schemaVal.errors.length) console.log(chalk.red('Errores:\n - ' + schemaVal.errors.join('\n - ')));
  if (schemaVal.warnings.length) console.log(chalk.yellow('Avisos:\n - ' + schemaVal.warnings.join('\n - ')));
  if (validateImages) {
    console.log(chalk.cyan('\n— Imágenes del schema (min 1200px) —'));
    for (const it of imageFindings) {
      if (!it.ok) console.log(`• ${it.url}  →  error: ${it.reason}`);
      else {
        const ok = it.width >= 1200 ? chalk.green('OK') : chalk.red('SMALL');
        console.log(`• ${it.url}  →  ${ok}  (${it.width}x${it.height})`);
      }
    }
  }

  console.log(chalk.cyan('\n— Reglas por sección —'));
  if (route.checks?.expectPagination) console.log(`Paginación HTML: ${paginated ? 'sí' : chalk.red('no')}`);
  if (route.type.includes('shop') || route.type === 'blog-list' || route.type === 'blog-category') {
    if (facets.hasFacet) {
      console.log(`Facetas en URL: sí`);
      console.log(` - Canónico a base: ${facets.canonicalToBase ? 'sí' : 'no'}`);
      console.log(` - Meta noindex: ${facets.hasNoindex ? 'sí' : 'no'}`);
    }
  }

  console.log(chalk.cyan('\n— Diferencias —'));
  console.log(`H1 vs headline: ${h1HeadlineDiff ? chalk.red('difieren') : 'OK'}`);
  console.log(`dateModified HTML vs schema: ${dateMismatch ? chalk.yellow('desalineado') : 'OK'}`);

  // Regla crítica: noindex anula rich results
  if (/noindex/i.test(info.robots || '')) {
    issues.push('La página está en noindex: Google ignorará el structured data aquí.');
  }

  console.log(chalk.cyan('\n— Issues detectados —'));
  if (!issues.length) console.log(chalk.green('✔ Sin issues críticos según reglas.'));
  else issues.forEach(i => console.log('• ' + chalk.red(i)));
}

// Levenshtein simple (para comparar H1/headline)
function levenshtein(a, b) {
  const an = a.length, bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i-1][j] + 1, matrix[i][j-1] + 1, matrix[i-1][j-1] + cost);
    }
  }
  return matrix[bn][an];
}

// ---------- Robots & Sitemap ----------
async function testRobotsSitemap() {
  const { base } = await inquirer.prompt([{ name: 'base', message: 'Dominio base', default: 'https://www.ravehublatam.com' }]);
  const robotsUrl = new URL('/robots.txt', base).toString();
  const smUrl = new URL('/sitemap.xml', base).toString();
  const spin = ora('Descargando robots.txt y sitemap.xml...').start();

  const robRes = await fetchRaw(robotsUrl, { maxRedirects: 5 });
  const robTxt = await robRes.body.text();
  const robots = robotsParser(robotsUrl, robTxt);

  const smRes = await fetchRaw(smUrl, { maxRedirects: 5 });
  const smText = await smRes.body.text();
  const xml = new XMLParser({ ignoreAttributes: false }).parse(smText);
  const urls = (xml.urlset?.url || []).map(u => (u.loc));

  spin.stop();
  console.log(chalk.cyan('\n— robots.txt —'));
  console.log(robTxt);
  console.log(chalk.yellow('\nRecomendado bloquear:'), '/admin/ /auth/ /user/ /api/ /tienda/checkout /eventos/*/comprar');

  console.log(chalk.cyan('\n— sitemap.xml —'));
  console.log(`Total URLs: ${urls.length}`);
  const bad = urls.filter(u => u.includes('?'));
  if (bad.length) console.log(chalk.red('❌ URLs con parámetros (evitar en sitemap):\n - ' + bad.join('\n - ')));
  else console.log(chalk.green('✔ Sin parámetros en sitemap.'));

  console.log(chalk.cyan('\n— Muestreo de estado (5 URLs) —'));
  for (const u of urls.slice(0,5)) {
    const r = await fetchRaw(u, { maxRedirects: 0 });
    console.log(`[${r.statusCode}] ${u}`);
  }
}

// ---------- Batch desde sitemap con Reporte HTML/CSV ----------
async function testBatchFromSitemap() {
  const { sm, limit, validateImgs } = await inquirer.prompt([
    { name: 'sm', message: 'URL del sitemap.xml', default: 'https://www.ravehublatam.com/sitemap.xml' },
    { type: 'confirm', name: 'validateImgs', message: '¿Validar imágenes del JSON-LD (descarga)?', default: false }
  ]);

  const spin = ora('Leyendo sitemap...').start();
  const smRes = await fetchRaw(sm, { maxRedirects: 5 });
  const text = await smRes.body.text();
  const xml = new XMLParser({ ignoreAttributes: false }).parse(text);
  const urls = (xml.urlset?.url || []).map(u => (u.loc));
  spin.succeed(`Sitemap con ${urls.length} URLs`);

  const target = urls.slice(0, limit);
  const rows = [];

  for (const u of target) {
    const s = ora(`Auditando ${u}`).start();
    const chain = await fetchChain(u);
    const final = chain[chain.length-1]?.url || u;
    const res = await fetchRaw(final);
    const headers = res.headers;
    const html = await res.body.text();
    const $ = cheerio.load(html);

    const canonical = getCanonical($);
    const paginated = hasPagination($);
    const infoRender = { robots: $('meta[name="robots"]').attr('content') || '' }; // render ligero (sin puppeteer en batch)
    const route = classifyRoute(final, $, infoRender);
    const jsonld = extractJsonLd(html);
    const schemaVal = validateSchemaBlocks(jsonld, { expectedCanonical: canonical });

    let imgWarn = '';
    if (validateImgs) {
      const imgs = jsonld.flatMap(b => normalizeImageField(b.image, final).slice(0,1));
      for (const img of imgs.slice(0,1)) {
        const dim = await fetchImageDims(img);
        if (dim.ok && dim.width < 1200) imgWarn = `schema image <1200 (${dim.width}x${dim.height})`;
      }
    }

    const facets = facetsInfo(final, $, canonical);

    const issues = summarizeIssues({
      route, htmlInfo: infoRender, canonicalTag: canonical, robotsHeader: headers, schemaBlocks: jsonld,
      schemaVal, paginated, facets, xrobots: xRobotsNoindex(headers),
      imageFindings: [], h1HeadlineDiff: false, dateMismatch: false
    });

    const allTypes = jsonld.flatMap(getTypes);
    const hasEventLike = allTypes.some(isEventLike);
    const hasArticleLike = allTypes.some(isArticleLike);

    rows.push({
      url: final,
      status: res.statusCode,
      route: route.type,
      canonical: canonical || '(none)',
      canonical_ok: canonical ? (new URL(canonical, final).pathname === new URL(final).pathname) : false,
      robots_meta: infoRender.robots || '(none)',
      x_robots: headers['x-robots-tag'] || headers['X-Robots-Tag'] || '',
      jsonld: jsonld.length,
      schema_err: schemaVal.errors.length,
      event_like: hasEventLike,
      article_like: hasArticleLike,
      types_short: allTypes.slice(0,3).join('|'),
      paginated,
      facets: facets.hasFacet,
      issues: (imgWarn ? [imgWarn, ...issues] : issues).join(' | ')
    });

    s.succeed(route.type + ' OK');
  }

  await writeReports(rows);
}

async function writeReports(rows) {
  const dir = path.resolve(process.cwd(), 'reports');
  await fs.mkdir(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  // CSV
  const csvHeader = ['url','status','route','canonical','canonical_ok','robots_meta','x_robots','jsonld','schema_err','event_like','article_like','types_short','paginated','facets','issues'];
  const csv = [csvHeader.join(',')]
    .concat(rows.map(r => csvHeader.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(',')))
    .join('\n');
  const csvPath = path.join(dir, `seo-report-${ts}.csv`);
  await fs.writeFile(csvPath, csv, 'utf8');

  // HTML
  const htmlRows = rows.map(r => `
    <tr>
      <td><a href="${r.url}" target="_blank">${r.url}</a></td>
      <td>${r.status}</td>
      <td>${r.route}</td>
      <td>${escapeHtml(r.canonical)}</td>
      <td>${r.canonical_ok ? '✔' : '✖'}</td>
      <td>${escapeHtml(r.robots_meta)}</td>
      <td>${escapeHtml(r.x_robots)}</td>
      <td>${r.jsonld}</td>
      <td>${r.schema_err}</td>
      <td>${r.event_like ? '✔' : '—'}</td>
      <td>${r.article_like ? '✔' : '—'}</td>
      <td>${escapeHtml(r.types_short)}</td>
      <td>${r.paginated ? '✔' : '—'}</td>
      <td>${r.facets ? 'sí' : 'no'}</td>
      <td>${escapeHtml(r.issues)}</td>
    </tr>`).join('\n');

  const html = `<!doctype html>
  <meta charset="utf-8">
  <title>SEO Report</title>
  <style>
    body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:24px}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ddd;padding:8px;font-size:14px;vertical-align:top}
    th{background:#f6f7f8;position:sticky;top:0}
    tr:hover{background:#fafafa}
    code{background:#f3f3f3;padding:2px 4px;border-radius:3px}
  </style>
  <h1>SEO Report</h1>
  <p>Filas: ${rows.length}</p>
  <table>
    <thead>
      <tr><th>URL</th><th>Status</th><th>Ruta</th><th>Canonical</th><th>Canonical OK</th><th>Meta robots</th><th>X-Robots</th><th>JSON-LD</th><th>Schema err</th><th>Event-like</th><th>Article-like</th><th>Types</th><th>Paginación</th><th>Facetas</th><th>Issues</th></tr>
    </thead>
    <tbody>${htmlRows}</tbody>
  </table>`;
  const htmlPath = path.join(dir, `seo-report-${ts}.html`);
  await fs.writeFile(htmlPath, html, 'utf8');

  console.log(chalk.green(`\n✔ Reportes guardados:`));
  console.log('CSV : ' + chalk.yellow(csvPath));
  console.log('HTML: ' + chalk.yellow(htmlPath));
}

async function printAndSaveJsonLd(blocks, finalUrl) {
  console.log(chalk.cyan('\n— Tipos de JSON-LD encontrados —'));
  if (!blocks.length) {
    console.log('(ninguno)');
    return;
  }

  blocks.forEach((b, i) => {
    const types = getTypes(b).join(', ') || '(sin @type)';
    const id = b['@id'] || b.id || '';
    const name = firstNonEmpty(b.name, b.headline, b.title);
    const startDate = b.startDate || '';
    const datePublished = b.datePublished || '';
    const offers = Array.isArray(b.offers) ? b.offers.length : (b.offers ? 1 : 0);
    const images = (() => {
      const img = b.image;
      if (!img) return 0;
      if (Array.isArray(img)) return img.length;
      return 1;
    })();

    console.log(`[#${i}] ${types}`);
    if (id) console.log(`   @id: ${id}`);
    if (name) console.log(`   name/headline: "${name}"`);
    if (startDate) console.log(`   startDate: ${startDate}`);
    if (datePublished) console.log(`   datePublished: ${datePublished}`);
    if (offers) console.log(`   offers: ${offers}`);
    if (images) console.log(`   image: ${images}`);
    const main = b.mainEntityOfPage ? (typeof b.mainEntityOfPage === 'string' ? b.mainEntityOfPage : b.mainEntityOfPage['@id']) : '';
    if (main) console.log(`   mainEntityOfPage: ${main}`);
  });

  // Guardar copia en reports/jsonld
  const dir = path.resolve(process.cwd(), 'reports/jsonld');
  await fs.mkdir(dir, { recursive: true });
  const slugSafe = new URL(finalUrl).pathname.replace(/[\/]+/g, '_').replace(/^_/, '');
  const out = path.join(dir, `jsonld${slugSafe}.json`);
  await fs.writeFile(out, JSON.stringify(blocks, null, 2), 'utf8');
  console.log(chalk.gray(`\nGuardado JSON-LD: ${out}`));
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g,m=>({'&':'&','<':'<','>':'>','"':'"'}[m])); }

async function testPrivateAndApi() {
  const { base } = await inquirer.prompt([{ name: 'base', message: 'Dominio base', default: 'https://www.ravehublatam.com' }]);
  const candidates = [
    '/admin', '/auth/login', '/user/profile', '/tienda/checkout',
    '/eventos/dummy/comprar', '/api/seo/preview', '/api/tickets/generate-pdf'
  ];
  console.log(chalk.cyan('\n— Verificación rápida de noindex/X-Robots —'));
  for (const p of candidates) {
    const url = new URL(p, base).toString();
    const r = await fetchRaw(url);
    const txt = await r.body.text().catch(()=> '');
    const metaNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(txt);
    const xRobots = (r.headers['x-robots-tag'] || r.headers['X-Robots-Tag'] || '').toString();
    console.table([{ url, status: r.statusCode, meta_noindex: metaNoindex, x_robots_tag: xRobots }]);
  }
}

async function runLighthouse() {
  const { url, cats } = await inquirer.prompt([
    { name: 'url', message: 'URL a analizar con Lighthouse', default: 'https://www.ravehublatam.com' },
    { type: 'checkbox', name: 'cats', message: 'Categorías', choices: ['performance','seo','best-practices','accessibility'], default: ['performance','seo'] }
  ]);
  console.log(chalk.gray('\nEjecuta en consola (Chrome requerido):'));
  console.log(chalk.yellow(`npx lighthouse "${url}" --only-categories=${cats.join(',')} --preset=mobile --view`));
  console.log('Guarda JSON con:  --output json --output-path report.json');
}

async function main() {
  if (process.argv[2] === 'psi') {
    console.log(chalk.gray('Usa PSI si quieres PageSpeed online:'));
    console.log(chalk.yellow('npx psi https://www.ravehublatam.com --strategy=mobile'));
    process.exit(0);
  }

  console.log(chalk.bold('\nRavehub SEO CLI'));
  while (true) {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: '¿Qué quieres hacer?',
      choices: [
        { name: '1) Auditar UNA URL (render, headers, canónico, JSON-LD, imágenes, H1/headline, fechas)', value: 'single' },
        { name: '2) Auditar en lote desde sitemap.xml (y generar HTML/CSV)', value: 'batch' },
        { name: '3) Revisar robots.txt y sitemap.xml', value: 'robots' },
        { name: '4) Verificar privadas y APIs (noindex / X-Robots-Tag)', value: 'private' },
        { name: '5) Sugerencia Lighthouse (SEO/Perf)', value: 'lh' },
        { name: 'Salir', value: 'exit' }
      ]
    }]);

    if (action === 'single') await testSingleUrl({ validateImages: true });
    if (action === 'batch') await testBatchFromSitemap();
    if (action === 'robots') await testRobotsSitemap();
    if (action === 'private') await testPrivateAndApi();
    if (action === 'lh') await runLighthouse();
    if (action === 'exit') break;
  }
}

main().catch(e => { console.error(e); process.exit(1); });