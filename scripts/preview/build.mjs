// Gera UM arquivo HTML autônomo (CSS, JS, fontes, imagens e uma API fictícia embutidos) para você
// abrir com duplo clique e navegar por todas as telas, sem servidor.
//   npm run preview   →   dist/terra-dos-canions-preview.html
import { build } from 'esbuild';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { FOUNDING_PARTNERS } from '../seed.js';
import { attractions } from '../../server/content/attractions.js';
import { tirolesaContent } from '../../server/content/tirolesa.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUB = join(ROOT, 'public');
const OUT = process.argv[2] || join(ROOT, 'dist', 'terra-dos-canions-preview.html');
const read = (p) => readFileSync(join(PUB, p), 'utf8');
const b64 = (buf, mime) => `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;

// ---- Imagens e fontes embutidas ----
const IMG = {};
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) walk(full);
    else if (f.endsWith('.svg')) IMG['/' + relative(PUB, full).split('\\').join('/')] = b64(readFileSync(full), 'image/svg+xml');
  }
})(join(PUB, 'img'));
const sampleQr = b64(await QRCode.toString('TDC1.EXEMPLO-DE-INGRESSO-SEM-VALIDADE', { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#10261b', light: '#ffffff' } }), 'image/svg+xml');

const inlineFonts = (css) => css.replace(/url\("(\/fonts\/[^"]+\.woff2)"\)/g, (_, p) => `url("${b64(readFileSync(join(PUB, p)), 'font/woff2')}")`);
const siteCss = inlineFonts(read('css/site.css'));
const adminCss = read('admin/admin.css');

// ---- JS: cada página vira um bundle ESM; globais do navegador são redirecionadas para a janela-pai ----
const absResolve = { name: 'abs', setup(b) { b.onResolve({ filter: /^\/js\// }, (a) => ({ path: `${PUB}${a.path}` })); } };
async function bundle(entry) {
  const r = await build({
    entryPoints: [join(PUB, entry)], bundle: true, write: false, format: 'esm', target: 'esnext', plugins: [absResolve],
    define: { 'location.pathname': '__LOC.pathname', 'location.search': '__LOC.search', 'location.hash': '__LOC.hash', 'location.href': '__LOC.href', 'location.assign': '__LOC.assign', 'location.reload': '__LOC.reload', localStorage: '__LS', history: '__HIST' },
  });
  let t = r.outputFiles[0].text.replaceAll('</script', '<\\/script');
  // Imagens que dependem do servidor viram imagens embutidas.
  t = t.replace(/"(\/img\/[^"]+\.svg)"/g, (_, p) => `window.parent.__ASSETS.img[${JSON.stringify(p)}]`);
  t = t.replace(/`\/img\/hero\/\$\{(\w+)\}\.svg`/g, (_, v) => `window.parent.__ASSETS.img["/img/hero/" + ${v} + ".svg"]`);
  t = t.replace(/`\/api\/(orders|admin\/qr)\/[^`]*?(qr|image)\.svg`/g, 'window.parent.__ASSETS.qr');
  return t;
}

// Roda dentro de cada iframe, antes de qualquer script da página.
const preamble = `<script>(function(){var P=window.parent;var u=new URL('http://x'+P.__current);
window.__LOC={pathname:u.pathname,search:u.search,hash:'',href:'https://preview.local'+P.__current,assign:function(x){P.__go(x)},reload:function(){P.__go(P.__current)}};
window.__LS={getItem:function(k){return k in P.__ls?P.__ls[k]:null},setItem:function(k,v){P.__ls[k]=String(v)},removeItem:function(k){delete P.__ls[k]}};
window.__HIST={replaceState:function(){}};
window.fetch=function(url,o){var path=String(url).replace(/^\\/api/,'');var r=P.__api((o&&o.method)||'GET',path,o&&o.body?JSON.parse(o.body):undefined);
return Promise.resolve(new Response(JSON.stringify(r.data),{status:r.status,headers:{'Content-Type':'application/json'}}))};
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');
/* Âncoras (#reservar) NUNCA devem navegar: dentro de um srcdoc elas resolveriam contra o arquivo-pai e o recarregariam dentro do quadro (barra duplicada). */
if(h.charAt(0)==='#'){e.preventDefault();var t=h.length>1&&document.getElementById(h.slice(1));if(t)t.scrollIntoView({behavior:'smooth'});return}
if(h.charAt(0)==='/'&&h.charAt(1)!=='/'){e.preventDefault();P.__go(h)}});
function fix(i){var s=i.getAttribute('src')||'';if(s.indexOf('/api/')===0)i.src=P.__ASSETS.qr;else if(P.__ASSETS.img[s])i.src=P.__ASSETS.img[s]}
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType!==1)return;if(n.tagName==='IMG')fix(n);n.querySelectorAll&&n.querySelectorAll('img').forEach(fix)})})}).observe(document,{childList:true,subtree:true});
})();<\/script>`;

const pageDefs = {
  index: ['index.html', 'js/home.js'], tirolesa: ['tirolesa.html', 'js/tirolesa.js'], atrativos: ['atrativos.html', 'js/attractions.js'], atrativo: ['atrativo.html', 'js/attraction.js'],
  parceiros: ['parceiros.html', 'js/partners.js'], parceiro: ['parceiro.html', 'js/partner.js'], produtos: ['produtos.html', 'js/products.js'], pedido: ['pedido.html', 'js/order.js'],
  privacidade: ['privacidade.html', 'js/legal.js'], termos: ['termos.html', 'js/legal.js'], admin: ['admin/index.html', 'admin/admin.js'], 404: ['404.html', null],
};
const pages = {};
for (const [k, [html, js]] of Object.entries(pageDefs)) {
  let h = read(html)
    .replace(/<link rel="stylesheet" href="\/css\/site.css">/, () => `<style>${siteCss}</style>`)
    .replace(/<link rel="stylesheet" href="\/admin\/admin.css">/, () => `<style>${adminCss}</style>`)
    .replace(/<link rel="(icon|preload)"[^>]*>\n?/g, '')
    .replace(/src="(\/img\/[^"]+\.svg)"/g, (_, p) => `src="${IMG[p]}"`);
  if (js) {
    const code = await bundle(js);
    h = h.replace(/<script type="module" src="[^"]+"><\/script>/, () => `<script type="module">${code}</script>`);
  }
  pages[k] = h.replace('<head>', () => '<head>' + preamble);
}

// ---- Dados fictícios ----
const partners = FOUNDING_PARTNERS.map(([slug, name, category]) => ({
  slug, name, category, tagline: 'Parceiro fundador — perfil em breve', description: '', whatsapp: '', phone: '', website: '', instagram: '', address: '',
  featured: false, plan: 'fundador', attractionSlug: slug === 'pousada-costao-do-cambara' ? 'costao-do-cambara' : null,
}));
Object.assign(partners.find((p) => p.slug === 'canyons-chalet'), {
  tagline: 'Exemplo de perfil preenchido', address: 'Endereço de exemplo, Cambará do Sul/RS', instagram: '@exemplo',
  description: 'Texto de exemplo: assim aparece a descrição de um parceiro depois que ele (ou você) preenche o perfil no painel. Aqui entram os diferenciais, tipos de acomodação, horários etc.',
});
const data = {
  attractions, partners,
  product: {
    slug: 'tirolesa-mais-alta-das-americas', name: 'Tirolesa Mais Alta das Américas',
    summary: 'Voe sobre o Cânion Fortaleza, a cerca de 750 m do chão, em uma descida de 720 m no Parque Nacional da Serra Geral.',
    rules: { minWeightKg: 40, maxWeightKg: 110, minAge: 0, minorAge: 18 }, maxPerOrder: 10,
    groupDiscounts: [{ label: 'Desconto de grupo (4+ ingressos)', minQty: 4, percent: 10 }], holdMinutes: 15, paymentMethods: ['pix', 'card'],
    ...tirolesaContent, waiver: { version: tirolesaContent.waiver.version, text: tirolesaContent.waiver.text },
  },
};
const mock = readFileSync(join(ROOT, 'scripts', 'preview', 'mock.js'), 'utf8');
const json = (o) => JSON.stringify(o).replaceAll('<', '\\u003c');

const TABS = [['Início', '/'], ['Produtos', '/produtos'], ['Tirolesa (via placa QR)', '/q/praca-01'], ['Atrativos', '/atrativos'], ['Página de atrativo', '/atrativos/serra-geral'],
  ['Parceiros', '/parceiros'], ['Página de parceiro', '/parceiros/canyons-chalet'], ['Meu pedido', '__order'], ['Admin', '/admin'], ['Privacidade', '/privacidade'], ['Termos', '/termos']];

const parent = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Terra dos Cânions — pré-visualização completa</title>
<style>
*{box-sizing:border-box}html,body{height:100%;margin:0}body{font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;background:#0e1f17;color:#fff;display:flex;flex-direction:column}
.bar{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center;padding:.6rem 1rem;background:#0a1711;border-bottom:1px solid #24402f}
.bar b{font-family:Georgia,serif;font-size:1.05rem}
.tabs{display:flex;gap:.3rem;flex-wrap:wrap;flex:1}
.tabs button,.dev button{background:transparent;border:1px solid #34573f;color:#cfe5d7;border-radius:999px;padding:.4rem .8rem;font:inherit;cursor:pointer}
.tabs button.on,.dev button.on{background:#c85f1c;border-color:#c85f1c;color:#fff;font-weight:700}
.dev{display:flex;gap:.3rem}
.note{background:#3a2c10;color:#ffe6a8;padding:.4rem 1rem;font-size:.82rem}
.stage{flex:1;min-height:0;display:flex;justify-content:center;align-items:stretch;padding:0;background:#14281e}
.stage.mobile{padding:14px 0}
iframe{border:0;background:#fff;width:100%;height:100%}
.stage.mobile iframe{width:390px;max-width:100%;border-radius:28px;border:8px solid #050d09;box-shadow:0 20px 60px rgba(0,0,0,.6)}
</style></head><body>
<div class="bar"><b>Terra dos Cânions · pré-visualização</b><div class="tabs" id="tabs"></div>
<div class="dev"><button data-m="mobile" class="on">📱 Celular</button><button data-m="desktop">🖥️ Computador</button></div></div>
<div class="note">Dados 100% fictícios, só para você ver e clicar. Nada é salvo e o pagamento é simulado. O painel Admin abre já logado (no site real exige senha + 2FA).</div>
<div class="stage mobile" id="stage"><iframe id="f" title="Pré-visualização do site"></iframe></div>
<script>window.__DATA=${json(data)};window.__ASSETS={img:${json(IMG)},qr:${json(sampleQr)}};window.__PAGES=${json(pages)};window.__ls={};</script>
<script>${mock}</script>
<script>
(function(){
var TABS=${json(TABS)};
var f=document.getElementById('f'),tabs=document.getElementById('tabs');
function pageFor(p){if(p==='/')return'index';if(p==='/tirolesa')return'tirolesa';if(p==='/produtos')return'produtos';if(p==='/atrativos')return'atrativos';if(p.indexOf('/atrativos/')===0)return'atrativo';
if(p==='/parceiros')return'parceiros';if(p.indexOf('/parceiros/')===0)return'parceiro';if(p.indexOf('/pedido/')===0)return'pedido';if(p==='/privacidade')return'privacidade';if(p==='/termos')return'termos';if(p==='/admin')return'admin';return'404'}
window.__go=function(path){
 if(path.indexOf('/q/')===0){window.__ls.tdc_qr=JSON.stringify({q:path.slice(3),t:Date.now()});path='/tirolesa?q='+path.slice(3)}
 window.__current=path;var p=path.split('?')[0];f.srcdoc=window.__PAGES[pageFor(p)];
 [].forEach.call(tabs.children,function(b){var t=b.dataset.p;b.classList.toggle('on',t===p||(t==='/q/praca-01'&&p==='/tirolesa')||(t==='__order'&&p.indexOf('/pedido/')===0))});
};
TABS.forEach(function(t){var b=document.createElement('button');b.textContent=t[0];b.dataset.p=t[1];b.onclick=function(){
 if(t[1]==='__order'){var o=window.__lastOrder&&window.__lastOrder();if(o)window.__go('/pedido/'+o);else alert('Primeiro faça uma reserva na aba Tirolesa — o pedido aparece aqui.');return}
 window.__go(t[1])};tabs.appendChild(b)});
document.querySelectorAll('.dev button').forEach(function(b){b.onclick=function(){document.getElementById('stage').className='stage '+b.dataset.m;document.querySelectorAll('.dev button').forEach(function(x){x.classList.toggle('on',x===b)})}});
window.__go('/');
})();
</script></body></html>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, parent);
console.log(`Pré-visualização gerada: ${OUT} (${(parent.length / 1024).toFixed(0)} KB)`);
