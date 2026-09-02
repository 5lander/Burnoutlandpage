/*
  Reproduce lo que hace el rastreador de WhatsApp al pegar un enlace, para
  detectar lo que romperia la previsualizacion antes de publicar.

  NO es una previsualizacion real de WhatsApp: no hay forma de pedirle a la app
  que renderice desde aqui. Lo que se comprueba es todo lo que esta bajo nuestro
  control y suele fallar:

    - El rastreador no ejecuta JavaScript: las etiquetas deben estar en el HTML.
    - Solo lee el principio del documento: si og: queda muy abajo, no lo ve.
    - og:image tiene que ser absoluta y descargable sin redirecciones.
    - Por encima de ~600 KB la imagen se descarta y no se muestra tarjeta.
    - Sin og:image:width/height puede elegir tarjeta pequena en vez de grande.

  Uso:  node tools/simular-whatsapp.js http://127.0.0.1:8732/index.html
*/
const http = require('http');
const https = require('https');

const UA = 'WhatsApp/2.23.20.0 A';   // el rastreador se identifica asi
const LIMITE_IMAGEN = 600 * 1024;
const VENTANA_HTML = 300 * 1024;     // solo mira el principio del documento

const objetivo = process.argv[2];
if (!objetivo) { console.error('Falta la URL'); process.exit(1); }

function pedir(url, cabeceras = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': UA, ...cabeceras } }, res => {
      const trozos = [];
      let n = 0;
      res.on('data', c => { trozos.push(c); n += c.length; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, cuerpo: Buffer.concat(trozos), bytes: n }));
    }).on('error', reject);
  });
}

function metaEtiquetas(html) {
  const out = {};
  const re = /<meta\s+[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const t = m[0];
    const prop = (t.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1];
    const cont = (t.match(/content\s*=\s*["']([^"']*)["']/i) || [])[1];
    if (prop && cont !== undefined && !(prop in out)) out[prop] = { valor: cont, pos: m.index };
  }
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  if (title) out['<title>'] = { valor: title.trim(), pos: html.indexOf('<title') };
  return out;
}

function dimensionesJPEG(buf) {
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const marca = buf[i + 1];
    if (marca >= 0xC0 && marca <= 0xCF && marca !== 0xC4 && marca !== 0xC8 && marca !== 0xCC) {
      return { alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

(async () => {
  console.log(`Pidiendo ${objetivo} como "${UA}"\n`);
  const pag = await pedir(objetivo);
  const html = pag.cuerpo.toString('utf8');
  console.log(`HTTP ${pag.status} · ${pag.bytes} bytes · ${pag.headers['content-type']}`);

  const meta = metaEtiquetas(html.slice(0, VENTANA_HTML));
  const quiero = ['<title>', 'og:title', 'og:description', 'og:image', 'og:url', 'og:type',
                  'og:site_name', 'og:locale', 'og:image:width', 'og:image:height', 'og:image:alt',
                  'description', 'twitter:card', 'twitter:image'];

  let fallos = 0;
  console.log('\nEtiquetas que lee el rastreador:');
  for (const k of quiero) {
    const v = meta[k];
    if (!v) { console.log(`  FALTA  ${k}`); if (k.startsWith('og:') && !k.startsWith('og:image:')) fallos++; continue; }
    const corte = v.valor.length > 88 ? v.valor.slice(0, 88) + '…' : v.valor;
    console.log(`  ok  ${k.padEnd(18)} byte ${String(v.pos).padStart(6)}  ${corte}`);
  }

  const img = meta['og:image'];
  if (!img) { console.log('\nSIN og:image: no habria tarjeta.'); process.exit(1); }
  if (!/^https?:\/\//i.test(img.valor)) { console.log('\nog:image NO es absoluta.'); fallos++; }

  // se descarga desde la copia local equivalente, porque el dominio aun no existe
  const ruta = img.valor.replace(/^https?:\/\/[^/]+/, '');
  const local = objetivo.replace(/\/[^/]*$/, '') + ruta;
  console.log(`\nDescargando la imagen (equivalente local de ${img.valor}):`);
  const im = await pedir(local);
  console.log(`  HTTP ${im.status} · ${im.bytes} bytes · ${im.headers['content-type']}`);

  const dim = dimensionesJPEG(im.cuerpo);
  if (dim) console.log(`  dimensiones reales: ${dim.ancho}x${dim.alto}`);
  const dw = meta['og:image:width'] && +meta['og:image:width'].valor;
  const dh = meta['og:image:height'] && +meta['og:image:height'].valor;
  if (dim && dw && dh && (dim.ancho !== dw || dim.alto !== dh)) {
    console.log(`  ERROR: og:image:width/height dicen ${dw}x${dh}`); fallos++;
  }
  if (im.bytes > LIMITE_IMAGEN) { console.log(`  ERROR: pasa de ${LIMITE_IMAGEN} bytes; WhatsApp la descartaria`); fallos++; }
  else console.log(`  peso ok: ${(im.bytes / 1024).toFixed(1)} KB de ${(LIMITE_IMAGEN / 1024).toFixed(0)} KB permitidos`);
  if (dim && dim.ancho / dim.alto < 1.3) console.log('  aviso: proporcion poco ancha, podria salir tarjeta pequena');

  console.log('\nTarjeta que se construiria:');
  console.log('  ┌────────────────────────────────────────────────┐');
  console.log('  │  [imagen ' + (dim ? `${dim.ancho}x${dim.alto}` : '?') + ']');
  console.log('  │  ' + (meta['og:title'] || {}).valor);
  console.log('  │  ' + ((meta['og:description'] || {}).valor || '').slice(0, 76));
  console.log('  │  ' + ((meta['og:url'] || {}).valor || '').replace(/^https?:\/\//, ''));
  console.log('  └────────────────────────────────────────────────┘');

  console.log(fallos ? `\n${fallos} problema(s) que romperian la tarjeta.` : '\nSin problemas detectables desde aqui.');
  process.exit(fallos ? 1 : 0);
})();
