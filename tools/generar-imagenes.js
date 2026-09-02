/*
  Ejecuta tools/generar-imagenes.html en Chrome headless, recoge los PNG que
  dibuja y los escribe en assets/img/. Ademas empaqueta favicon.ico a partir de
  los PNG de 16, 32 y 48 px.

  Uso, desde la raiz del repositorio y con un servidor estatico ya levantado:
      node tools/generar-imagenes.js http://127.0.0.1:8732

  Requiere Chrome instalado. No instala dependencias.
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BASE = process.argv[2] || 'http://127.0.0.1:8732';
const RAIZ = path.resolve(__dirname, '..');
const DESTINO = path.join(RAIZ, 'assets', 'img');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => fs.existsSync(p));

if (!CHROME) { console.error('No encuentro Chrome.'); process.exit(1); }

console.log('Renderizando en Chrome headless…');
const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=20000',
  '--dump-dom', `${BASE}/tools/generar-imagenes.html`,
], { encoding: 'utf8', maxBuffer: 1 << 28 });

const m = dom.match(/<pre id="datos">([\s\S]*?)<\/pre>/);
if (!m) { console.error('La pagina no produjo datos. ¿Esta el servidor sirviendo la raiz del repo?'); process.exit(1); }

const datos = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
fs.mkdirSync(DESTINO, { recursive: true });

const png = {};
for (const [nombre, dataUrl] of Object.entries(datos)) {
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  png[nombre] = buf;
  const salida = nombre === 'og.jpg'
    ? path.join(DESTINO, 'og.jpg')
    : path.join(DESTINO, nombre);
  fs.writeFileSync(salida, buf);
  console.log(`  ${path.relative(RAIZ, salida)}  ${buf.length} bytes`);
}

// --- favicon.ico: contenedor ICO con los PNG dentro (soportado desde Vista) ---
function empaquetarIco(imagenes) {
  const n = imagenes.length;
  const cabecera = Buffer.alloc(6);
  cabecera.writeUInt16LE(0, 0);   // reservado
  cabecera.writeUInt16LE(1, 2);   // tipo 1 = icono
  cabecera.writeUInt16LE(n, 4);

  const entradas = [];
  let desplazamiento = 6 + n * 16;
  for (const { lado, buf } of imagenes) {
    const e = Buffer.alloc(16);
    e.writeUInt8(lado >= 256 ? 0 : lado, 0);   // ancho
    e.writeUInt8(lado >= 256 ? 0 : lado, 1);   // alto
    e.writeUInt8(0, 2);                        // colores de paleta
    e.writeUInt8(0, 3);                        // reservado
    e.writeUInt16LE(1, 4);                     // planos
    e.writeUInt16LE(32, 6);                    // bits por pixel
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(desplazamiento, 12);
    entradas.push(e);
    desplazamiento += buf.length;
  }
  return Buffer.concat([cabecera, ...entradas, ...imagenes.map(i => i.buf)]);
}

const ico = empaquetarIco([
  { lado: 16, buf: png['favicon-16.png'] },
  { lado: 32, buf: png['favicon-32.png'] },
  { lado: 48, buf: png['favicon-48.png'] },
]);
fs.writeFileSync(path.join(RAIZ, 'favicon.ico'), ico);
console.log(`  favicon.ico  ${ico.length} bytes  (16, 32, 48)`);

// los PNG intermedios de 16/32/48 solo existian para el .ico
for (const t of ['favicon-16.png', 'favicon-32.png', 'favicon-48.png']) {
  fs.unlinkSync(path.join(DESTINO, t));
}
fs.renameSync(path.join(DESTINO, 'favicon-180.png'), path.join(RAIZ, 'apple-touch-icon.png'));
fs.renameSync(path.join(DESTINO, 'favicon-512.png'), path.join(DESTINO, 'icono-512.png'));
console.log('  apple-touch-icon.png y assets/img/icono-512.png colocados');
console.log('Listo.');
