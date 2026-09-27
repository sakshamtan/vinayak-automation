#!/usr/bin/env node
/**
 * Generates a static HTML page per product plus sitemap.xml and robots.txt.
 * Runs automatically after `npm run build` via the postbuild script.
 *
 * Each page is written to build/product/<SKU>/index.html so Cloudflare Pages
 * serves it as /product/<SKU> — a real, indexable URL with the product name,
 * brand and description embedded in the HTML, not behind JavaScript.
 *
 * Set the production URL before deploying:
 *   SITE_URL=https://yourdomain.in npm run build
 */

const fs = require('fs');
const path = require('path');

// ─── config ──────────────────────────────────────────────────────────────────
// Keep these in sync with src/data.js
const SITE_URL    = (process.env.SITE_URL || 'https://vinayak-automation.pages.dev').replace(/\/$/, '');
const WA_NUMBER   = '919818092533';
const COMPANY     = 'Vinayak Automation Products';
const ADDRESS     = 'Plot No. 461, Indira Vihar, Dr Mukerjee Nagar, Near BBM Depot, Delhi - 110009';
const PHONE       = '+91-9818092533';
const EMAIL       = 'vinayakautomation10@gmail.com';
const TIMING      = 'Mon – Sat, 10:00 AM – 6:00 PM';
const MAPS_URL    = 'https://maps.app.goo.gl/TfHSWKaDjoAxuLsh6';

const BUILD_DIR   = path.join(__dirname, '..', 'build');
const CSV_PATH    = path.join(__dirname, '..', 'public', 'catalog.csv');

// ─── CSV parser (mirrors App.js parseCsv) ────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let field = '', row = [], insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && next === '"') { field += '"'; i++; }
    else if (ch === '"') { insideQuotes = !insideQuotes; }
    else if (ch === ',' && !insideQuotes) { row.push(field.trim()); field = ''; }
    else if ((ch === '\n' || ch === '\r') && !insideQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(field.trim()); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else { field += ch; }
  }
  if (field || row.length > 0) { row.push(field.trim()); if (row.some(Boolean)) rows.push(row); }

  const [headers = [], ...data] = rows;
  return data.map((r, i) => {
    const p = headers.reduce((obj, h, hi) => { obj[h] = r[hi] || ''; return obj; }, {});
    return { id: p.sku || `${p.name}-${i}`, ...p };
  });
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────
function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%230d0d0d'/%3E%3Cg fill='none' stroke='%23f2b705' stroke-width='4.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 9 L9 25 L25 41'/%3E%3Cpath d='M55 9 L55 25 L39 41'/%3E%3Cpath d='M25 41 L32 48'/%3E%3Cpath d='M39 41 L32 48'/%3E%3Cpath d='M32 48 L32 56'/%3E%3C/g%3E%3Ccircle cx='9' cy='9' r='4' fill='%23f2b705'/%3E%3Ccircle cx='55' cy='9' r='4' fill='%23f2b705'/%3E%3Ccircle cx='32' cy='56' r='4' fill='%23f2b705'/%3E%3C/svg%3E`;

const BRAND_SVG = `<svg width="26" height="26" viewBox="0 0 64 64" fill="none" stroke="#f2b705" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 9 L9 25 L25 41"/><path d="M55 9 L55 25 L39 41"/><path d="M25 41 L32 48"/><path d="M39 41 L32 48"/><path d="M32 48 L32 56"/><circle cx="9" cy="9" r="3.4" fill="#f2b705" stroke="none"/><circle cx="55" cy="9" r="3.4" fill="#f2b705" stroke="none"/><circle cx="32" cy="56" r="3.4" fill="#f2b705" stroke="none"/></svg>`;

const CSS = `
:root{--bg:#0d0d0d;--surface:#111111;--border:#2a2a2a;--text:#f5f5f0;--muted:#9a9a92;--accent:#f2b705;--font:"IBM Plex Mono",monospace}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:15px;line-height:1.6}
a{color:var(--accent);text-decoration:none}
a:hover{color:#ffce33}
.wrap{max-width:1100px;margin:0 auto;padding:0 clamp(20px,5vw,64px)}
/* header */
header{border-bottom:1px solid var(--border);background:var(--surface)}
.header-inner{display:flex;align-items:center;justify-content:space-between;height:60px;gap:16px}
.brand{display:flex;align-items:center;gap:10px;color:var(--text);font-weight:700;font-size:14px;letter-spacing:.04em;text-decoration:none}
.brand strong{display:block;line-height:1.1}
.brand small{display:block;font-size:11px;font-weight:400;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}
/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 18px;font-family:var(--font);font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border:1px solid transparent;text-decoration:none;white-space:nowrap}
.btn-primary{background:var(--accent);color:#111}
.btn-primary:hover{background:#ffce33;color:#111}
.btn-wa{background:#25D366;color:#fff;border-color:#25D366;font-size:13px;min-height:44px;padding:0 22px}
.btn-wa:hover{background:#1db954;color:#fff}
.btn-enquire{border-color:var(--accent);color:var(--accent);background:transparent;min-height:44px;padding:0 22px;font-size:13px}
.btn-enquire:hover{background:rgba(242,183,5,.1)}
/* breadcrumb */
.breadcrumb{padding:24px 0 0;font-size:12px;color:var(--muted)}
.breadcrumb a{color:var(--accent)}
.breadcrumb span{color:var(--muted)}
/* product layout */
.product-page{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);margin:20px 0}
.product-page.no-image{grid-template-columns:1fr}
.product-image{aspect-ratio:4/3;overflow:hidden;background:var(--surface)}
.product-image img{width:100%;height:100%;object-fit:cover}
.product-content{background:var(--surface);padding:32px;display:flex;flex-direction:column;gap:18px}
.kicker{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
h1{font-family:var(--font);font-size:24px;font-weight:700;line-height:1.25}
.description{color:var(--muted);font-size:14px;line-height:1.7}
/* specs table */
.specs{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border)}
.specs div{background:var(--bg);padding:10px 14px}
.specs dt{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.specs dd{margin:3px 0 0;font-weight:700;font-size:14px}
.price-row{grid-column:1/-1}
.price-value{color:var(--accent);font-size:16px}
/* actions */
.actions{display:flex;gap:10px;flex-wrap:wrap}
/* back link */
.back-link{padding:32px 0;font-size:13px}
/* footer */
footer{border-top:1px solid var(--border);margin-top:48px}
.footer-inner{padding:28px 0;font-size:12px;color:var(--muted)}
.footer-inner strong{display:block;color:var(--text);margin-bottom:8px;font-size:14px}
.footer-links{display:flex;gap:16px;margin-top:8px;flex-wrap:wrap}
/* responsive */
@media(max-width:700px){
  .product-page{grid-template-columns:1fr}
  .header-inner .btn{display:none}
}
`;

// ─── page template ────────────────────────────────────────────────────────────
function buildPage(product) {
  const { sku, name, brand, category, shortDescription, image, availability, priceRange } = product;

  // Title: "Brand Name – Category Supplier Delhi | Company"
  const brandLabel = (brand && brand !== 'Multi Brand' && brand !== 'Vinayak Automation') ? brand : '';
  const titleParts = [brandLabel, name, `${category} Supplier Delhi`, COMPANY].filter(Boolean);
  const pageTitle = titleParts.join(' – ');

  const metaDesc = `${shortDescription}. Buy ${category.toLowerCase()} from ${COMPANY}, Delhi NCR. ${availability || 'Available on enquiry'}. Call or WhatsApp for pricing.`;

  const waText = encodeURIComponent(`Hello ${COMPANY}, I want pricing for: ${name}${sku ? ` (SKU: ${sku})` : ''}`);
  const enquiryLink = `${SITE_URL}/#enquiry`;
  const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(sku)}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: shortDescription,
    sku,
    category,
    brand: { '@type': 'Brand', name: brand || 'Multi Brand' },
    ...(image ? { image } : {}),
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'LocalBusiness',
        name: COMPANY,
        telephone: PHONE,
        url: SITE_URL,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Plot No. 461, Indira Vihar, Dr Mukerjee Nagar, Near BBM Depot',
          addressLocality: 'Delhi',
          postalCode: '110009',
          addressCountry: 'IN',
        },
      },
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(metaDesc)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${esc(name)} | ${esc(COMPANY)}">
  <meta property="og:description" content="${esc(shortDescription)}">
  <meta property="og:url" content="${canonicalUrl}">
  ${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <link rel="icon" href="${FAVICON}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
  <header>
    <div class="wrap header-inner">
      <a class="brand" href="${SITE_URL}">
        ${BRAND_SVG}
        <span><strong>VINAYAK</strong><small>Automation</small></span>
      </a>
      <a class="btn btn-primary" href="${enquiryLink}">Request a Quote</a>
    </div>
  </header>

  <main>
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="${SITE_URL}">Home</a>
        <span> / <a href="${SITE_URL}/#catalogue">Catalogue</a> / ${esc(category)}</span>
      </nav>

      <article class="product-page${image ? '' : ' no-image'}">
        ${image ? `<div class="product-image"><img src="${esc(image)}" alt="${esc(name)}" loading="eager"></div>` : ''}
        <div class="product-content">
          <p class="kicker">${esc(category)}${brand ? ` · ${esc(brand)}` : ''}</p>
          <h1>${esc(name)}</h1>
          <p class="description">${esc(shortDescription)}</p>

          <dl class="specs">
            ${sku ? `<div><dt>SKU</dt><dd>${esc(sku)}</dd></div>` : ''}
            ${brand ? `<div><dt>Brand</dt><dd>${esc(brand)}</dd></div>` : ''}
            ${availability ? `<div><dt>Availability</dt><dd>${esc(availability)}</dd></div>` : ''}
            ${priceRange ? `<div class="price-row"><dt>Price range</dt><dd class="price-value">${esc(priceRange)}</dd></div>` : ''}
          </dl>

          <div class="actions">
            <a class="btn btn-wa" href="https://wa.me/${WA_NUMBER}?text=${waText}" target="_blank" rel="noreferrer">
              WhatsApp for Price
            </a>
            <a class="btn btn-enquire" href="${enquiryLink}">
              Request a Quote
            </a>
          </div>
        </div>
      </article>

      <div class="back-link">
        <a href="${SITE_URL}/#catalogue">← Back to full catalogue</a>
      </div>
    </div>
  </main>

  <footer>
    <div class="wrap footer-inner">
      <strong>${esc(COMPANY)}</strong>
      <p>${esc(ADDRESS)}</p>
      <div class="footer-links">
        <a href="tel:${PHONE}">${esc(PHONE)}</a>
        <a href="mailto:${EMAIL}">${esc(EMAIL)}</a>
        <a href="${MAPS_URL}" target="_blank" rel="noreferrer">Get Directions</a>
        <span>${esc(TIMING)}</span>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

// ─── sitemap ──────────────────────────────────────────────────────────────────
function buildSitemap(skus) {
  const today = new Date().toISOString().split('T')[0];
  const productUrls = skus
    .map(sku => `  <url><loc>${SITE_URL}/product/${encodeURIComponent(sku)}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
${productUrls}
</urlset>`;
}

// ─── robots.txt ───────────────────────────────────────────────────────────────
function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

// ─── main ─────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('build/ directory not found. Run npm run build first.');
    process.exit(1);
  }

  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const products = parseCsv(csv).filter(p => p.name && p.sku);

  if (products.length === 0) {
    console.warn('No products found in catalog.csv — skipping product page generation.');
    return;
  }

  let generated = 0;
  for (const product of products) {
    const dir = path.join(BUILD_DIR, 'product', product.sku);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(product), 'utf8');
    generated++;
  }

  fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), buildSitemap(products.map(p => p.sku)), 'utf8');
  fs.writeFileSync(path.join(BUILD_DIR, 'robots.txt'), buildRobots(), 'utf8');

  console.log(`✓ ${generated} product pages → build/product/<SKU>/index.html`);
  console.log(`✓ sitemap.xml (${products.length + 1} URLs)`);
  console.log(`✓ robots.txt`);
  console.log(`  Site URL: ${SITE_URL}`);
  console.log(`  To change: SITE_URL=https://yourdomain.in npm run build`);
}

main();
