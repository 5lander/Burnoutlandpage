/*
  Sube la huella de version (?v=) de CSS y JS en las cuatro paginas a la vez y
  despues corre verificar-paginas.js.

  .htaccess cachea CSS y JS un ano. Sin una huella nueva, quien ya visito el
  sitio sigue viendo el CSS viejo con el HTML nuevo: ya paso una vez (README,
  "Antes de cada push que toque CSS o JS"). Esto sustituye al sed a mano.

  Uso, desde la raiz:
    node tools/subir-version.js            -> ?v=AAAAMMDD de hoy (o AAAAMMDDb, c... si ya existe)
    node tools/subir-version.js 20261201   -> ese valor
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const PAGINAS = ['index.html', 'gracias.html', 'privacidad.html', 'terminos.html'];
const RE = /(\.(?:css|js)\?v=)([\w-]+)/g;

const actual = (fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8').match(/\.css\?v=([\w-]+)/) || [])[1];
let nueva = process.argv[2];
if (!nueva) {
  const d = new Date();
  const hoy = '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  nueva = hoy;
  // Mismo dia que la actual: se le pone la letra siguiente (b, c, d...).
  if (actual && actual.startsWith(hoy)) {
    const letra = actual.slice(hoy.length);
    nueva = hoy + (letra ? String.fromCharCode(letra.charCodeAt(0) + 1) : 'b');
  }
}
if (!/^[\w-]+$/.test(nueva)) { console.error('Huella no valida: ' + nueva); process.exit(1); }

for (const p of PAGINAS) {
  const f = path.join(RAIZ, p);
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(RE, '$1' + nueva));
}
console.log(`?v=${actual} -> ?v=${nueva} en ${PAGINAS.length} paginas`);
execFileSync(process.execPath, [path.join(__dirname, 'verificar-paginas.js')], { stdio: 'inherit' });
