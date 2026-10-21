// Brand-aware card renderer (1080x1350). Usage: node render.js cards.json out [brand.json]
// Without brand.json it renders the Playa Breve look, so it can replace the old renderer.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const DEFAULT = { name: 'PLAYA BREVE', logo: 'logo.png', bg: '#111418', text: '#F5F1E8', sub: '#D9D4C7', muted: '#9AA1AC', rule: '#2B3038',
  accent: '#FFCE1F', headFont: 'anton/files/anton-latin-400-normal.woff2', headSize: 104, bigSize: 260, sourceLabel: 'Fuente' };
const brandFile = process.argv[4] || (fs.existsSync('brand.json') ? 'brand.json' : null);
const B = Object.assign({}, DEFAULT, brandFile ? JSON.parse(fs.readFileSync(brandFile, 'utf8')) : {});
const font = f => 'data:font/woff2;base64,' + fs.readFileSync(require.resolve('@fontsource/' + f)).toString('base64');
const head = font(B.headFont), inter8 = font(B.bodyBold || 'inter/files/inter-latin-800-normal.woff2'), inter5 = font(B.bodyRegular || 'inter/files/inter-latin-500-normal.woff2');
const logo = 'data:image/png;base64,' + fs.readFileSync(path.resolve(path.dirname(brandFile || '.'), B.logo)).toString('base64');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const hl = s => esc(s).replace(/\*(.+?)\*/g, '<span class="hl">$1</span>');
const html = c => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Head;src:url(${head})}@font-face{font-family:Body;font-weight:800;src:url(${inter8})}@font-face{font-family:Body;font-weight:500;src:url(${inter5})}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1350px;background:${B.bg};color:${B.text};font-family:Body;position:relative;overflow:hidden}
.top{position:absolute;top:52px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center}
.brand{font-family:Body;font-weight:800;font-size:29px;letter-spacing:2.5px;display:flex;align-items:center;gap:22px}.brand img{width:92px;height:92px;border-radius:50%}
.tag{border:3px solid ${B.accent};color:${B.accent};font-weight:800;font-size:26px;letter-spacing:3px;padding:12px 22px;border-radius:8px}
.main{position:absolute;left:72px;right:72px;top:210px;bottom:220px;display:flex;flex-direction:column;justify-content:center;gap:40px}
.big{font-family:Head;font-size:${c.bigSize || B.bigSize}px;line-height:.9;color:${B.accent}}
h1{font-family:Head;font-weight:400;font-size:${c.titleSize || B.headSize}px;line-height:1.1;letter-spacing:-1px}.hl{color:${B.accent}}
.sub{font-weight:500;font-size:40px;line-height:1.35;color:${B.sub}}.sub b{font-weight:800;color:${B.text}}
.foot{position:absolute;left:72px;right:72px;bottom:64px;border-top:3px solid ${B.rule};padding-top:28px;display:flex;justify-content:space-between;font-size:26px;color:${B.muted};font-weight:500}.foot b{color:${B.text};font-weight:800}
</style></head><body><div class="top"><div class="brand"><img src="${logo}">${esc(B.name)}</div><div class="tag">${esc(c.tag)}</div></div>
<div class="main">${c.big ? `<div class="big">${esc(c.big)}</div>` : ''}<h1>${hl(c.title)}</h1>${c.sub ? `<p class="sub">${c.sub}</p>` : ''}</div>
<div class="foot"><span>${esc(B.sourceLabel)}: <b>${esc(c.source)}</b></span><span>${esc(c.date)}</span></div></body></html>`;
(async () => {
  const cards = JSON.parse(fs.readFileSync(process.argv[2] || 'cards.json', 'utf8')); const out = process.argv[3] || 'out'; fs.mkdirSync(out, { recursive: true });
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(x => fs.existsSync(x) && fs.statSync(x).isFile());
  const b = await chromium.launch(exe ? { executablePath: exe } : {}); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const c of cards) {
    for (let i = 0; i < 12; i++) { await p.setContent(html(c)); await p.evaluate(() => document.fonts.ready);
      const over = await p.evaluate(() => { const m = document.querySelector('.main'); return m.scrollHeight > m.clientHeight + 2; });
      if (!over) break; c.titleSize = Math.round((c.titleSize || B.headSize) * .93); c.bigSize = Math.round((c.bigSize || B.bigSize) * .93); }
    await p.screenshot({ path: path.join(out, c.file + '.png') }); console.log('ok', c.file);
  }
  await b.close();
})();
