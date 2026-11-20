/*
  Verifica que las cuatro paginas sigan siendo copias coherentes entre si.

  El sitio no tiene build: cabecera, pie, isotipo y huellas de version estan
  copiados a mano en index.html, gracias.html, privacidad.html y terminos.html.
  El README documenta que una copia rota (faltaba un </svg>) dejo dos paginas
  sin cabecera, y que olvidar el ?v= sirvio CSS viejo durante dias. Esto lo
  comprueba en un segundo, sin dependencias.

  Falla (codigo 1) si:
    - el <footer> no es identico en las cuatro paginas (se ignora aria-current)
    - el ?v= no es el mismo en todos los enlaces de las cuatro paginas
    - el d del <path id="iso"> (o de #bootpath) difiere de tools/iso-path.txt
    - en alguna pagina no cuadran las aperturas y cierres de <svg>
    - una pagina no tiene <header>, <footer> o exactamente un <h1>

  Uso, desde la raiz:  node tools/verificar-paginas.js
*/
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const PAGINAS = ['index.html', 'gracias.html', 'privacidad.html', 'terminos.html'];
const leer = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');

const fallos = [];
const html = Object.fromEntries(PAGINAS.map(p => [p, leer(p)]));

// ── pie identico ────────────────────────────────────────────────────────────
const pie = p => {
  const m = html[p].match(/<footer>[\s\S]*?<\/footer>/);
  // Diferencias legitimas: aria-current marca la pagina en la que se esta, y
  // las secundarias enlazan a /#seccion donde la portada pone #seccion.
  return m ? m[0].replace(/\s*aria-current="[^"]*"/g, '').replace(/href="\/#/g, 'href="#') : null;
};
const pieBase = pie('index.html');
for (const p of PAGINAS) {
  const x = pie(p);
  if (!x) { fallos.push(`${p}: no tiene <footer>`); continue; }
  if (x !== pieBase) fallos.push(`${p}: el <footer> difiere del de index.html`);
}

// ── huella de version unica ─────────────────────────────────────────────────
const huellas = new Set();
for (const p of PAGINAS) {
  const vs = [...html[p].matchAll(/\.(?:css|js)\?v=([\w-]+)/g)].map(m => m[1]);
  if (!vs.length) fallos.push(`${p}: ningun CSS o JS lleva ?v=`);
  vs.forEach(v => huellas.add(v));
}
if (huellas.size > 1) fallos.push(`?v= distinto entre enlaces: ${[...huellas].join(', ')}`);

// ── isotipo ─────────────────────────────────────────────────────────────────
const iso = fs.readFileSync(path.join(__dirname, 'iso-path.txt'), 'utf8').trim();
for (const p of PAGINAS) {
  for (const id of ['iso', 'bootpath']) {
    const m = html[p].match(new RegExp(`<path id="${id}" d="([^"]*)"`));
    if (!m) { if (id === 'iso') fallos.push(`${p}: falta <path id="iso">`); continue; }
    if (m[1].trim() !== iso) fallos.push(`${p}: el d de #${id} no coincide con tools/iso-path.txt`);
  }
}

// ── estructura minima ───────────────────────────────────────────────────────
for (const p of PAGINAS) {
  const t = html[p];
  const abre = (t.match(/<svg[\s>]/g) || []).length, cierra = (t.match(/<\/svg>/g) || []).length;
  if (abre !== cierra) fallos.push(`${p}: ${abre} <svg> abiertos y ${cierra} cerrados`);
  if (!/<header[\s>]/.test(t)) fallos.push(`${p}: no tiene <header>`);
  const h1 = (t.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fallos.push(`${p}: tiene ${h1} <h1>, se espera 1`);
}

if (fallos.length) {
  console.error('verificar-paginas: ' + fallos.length + ' fallo(s)\n  - ' + fallos.join('\n  - '));
  process.exit(1);
}
console.log(`verificar-paginas: ok (${PAGINAS.length} paginas, ?v=${[...huellas][0]})`);
