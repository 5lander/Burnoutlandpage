/*
  Mide el contraste real de cada combinacion de texto y fondo del sitio,
  segun la formula de WCAG 2.1. Las capas semitransparentes se componen
  primero sobre su fondo, que es lo que ve el ojo.

  Uso:  node tools/medir-contraste.js
*/
const PAL = {
  bg:       [0x08, 0x08, 0x0C],   // --bg      onyx
  studio:   [0x10, 0x10, 0x18],   // --studio
  rig:      [0x1A, 0x1A, 0x24],   // --rig
  void_:    [0x1B, 0x07, 0x40],   // --void  (fondo de la modalidad destacada)
  bone:     [0xF6, 0xF5, 0xF2],   // --bone
  ash:      [0x9A, 0x9A, 0xAA],   // --ash
  graphite: [0x7B, 0x7B, 0x85],   // --graphite
  graphrig: [0x82, 0x82, 0x8C],   // --graphite-rig (solo el placeholder)
  surge:    [0xA4, 0x7C, 0xFF],   // --surge
  mist:     [0xE4, 0xD9, 0xFF],   // --mist
  core:     [0x6C, 0x2B, 0xFF],   // --core
  ember:    [0xFF, 0x4D, 0x1A],   // --ember
};

const canal = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const sobre = (color, fondo, alfa) => color.map((c, i) => Math.round(c * alfa + fondo[i] * (1 - alfa)));

// [ etiqueta, color de texto, alfa, fondo, px, negrita, es texto corrido ]
const CASOS = [
  ['p (parrafos)',            PAL.bone, 0.72, PAL.bg,     17, false, true],
  ['p sobre studio',          PAL.bone, 0.72, PAL.studio, 17, false, true],
  ['.lead',                   PAL.bone, 0.72, PAL.bg,     17, false, true],
  ['.ent li (vinetas nodos)', PAL.bone, 0.66, PAL.studio, 14, false, true],
  ['.trust li',               PAL.bone, 0.70, PAL.bg,     14, false, true],
  ['.step p (pipeline)',      PAL.bone, 0.72, PAL.studio, 13, false, true],
  ['.nav-links a',            PAL.bone, 0.62, PAL.bg,     14, false, true],
  ['.tesis',                  PAL.surge, 1,   PAL.studio, 15, false, true],
  ['h1 / h2 / h3',            PAL.bone, 1,    PAL.bg,     34, true,  true],
  ['.chip (texto)',           PAL.bone, 1,    PAL.rig,    14, false, true],
  ['input (texto escrito)',   PAL.bone, 1,    PAL.rig,    15, false, true],
  ['input::placeholder',      PAL.graphrig, 1, PAL.rig,   15, false, false],
  ['.mono / label / .ash',    PAL.ash, 1,     PAL.bg,     11, false, false],
  ['label sobre studio',      PAL.ash, 1,     PAL.studio, 10, false, false],
  ['.resumen dt (etiqueta)',  PAL.ash, 1,     PAL.bg,     13, false, false],
  ['.resumen dd (valor)',     PAL.bone, 1,    PAL.bg,     14, false, true],
  ['.small (Paso 1 de 3)',    PAL.graphite, 1, PAL.studio, 12, false, false],
  ['.para (nodos)',           PAL.graphite, 1, PAL.bg,     10, false, false],
  ['.fmeta (pie)',            PAL.graphite, 1, PAL.studio, 10, false, false],
  ['.hud / .hint (escena)',   PAL.graphite, 1, PAL.bg,     10, false, false],
  ['.boot-lbl (preloader)',   PAL.graphite, 1, PAL.bg,     10, false, false],
  ['.track span (marquesina)', PAL.graphite, 1, PAL.studio, 12, false, false],
  ['.devby (pie)',            PAL.graphite, 1, PAL.studio, 11, false, false],
  ['.tag b (escena)',         PAL.graphite, 1, PAL.bg,     10, false, false],
  ['.step .t',                PAL.surge, 1,   PAL.studio, 10, false, false],
  ['.pill / .tile .mono',     PAL.mist, 0.7,  PAL.bg,     10, false, false],
  ['.badge',                  PAL.ember, 1,   PAL.bg,      9, false, false],
  ['.btn-p (texto en boton)', [255,255,255], 1, PAL.core,  14, false, true],
  ['.ck-t (aviso medicion)',  PAL.ash, 1,     PAL.studio, 13, false, true],
  ['.ck-t a (enlace)',        PAL.surge, 1,   PAL.studio, 13, false, true],
  ['.ck .btn (aceptar/rechazar)', PAL.bone, 1, PAL.studio, 13, false, true],
  ['.vs-a (columna izquierda)', PAL.bone, 0.70, PAL.bg,     14, false, true],
  ['.vs-a b (titulillo)',      PAL.ash, 1,     PAL.bg,      14, false, true],
  ['.vs-b (columna derecha)',  PAL.bone, 0.70, PAL.bg,     14, false, true],
  ['.vs-cab (rotulo)',         PAL.graphite, 1, PAL.studio, 10, false, false],
  ['.vs-acc (rotulo derecho)', PAL.surge, 1,   PAL.studio, 10, false, false],
  ['.plan-b p',                PAL.bone, 0.70, PAL.studio, 14, false, true],
  ['.plan-alto .plan-b p',     PAL.bone, 0.70, PAL.void_,  14, false, true],
  ['.plan-alto .mono surge',   PAL.surge, 1,   PAL.void_,  10, false, false],
  ['.plan-alto .plan-t .mono', PAL.ash, 1,      PAL.void_,  10, false, false],
  ['.plan-alto h3 (mist)',     PAL.mist, 1,    PAL.void_,  24, false, true],
  ['.ent li b / .vs b (bone)', PAL.bone, 1,    PAL.bg,      14, false, true],
  ['.flegal a (pie)',           PAL.graphite, 1, PAL.studio, 11, false, false],
  ['.flegal a[aria-current]',   PAL.ash, 1,     PAL.studio, 11, false, false],
  ['.doc b (clausulas)',        PAL.bone, 1,    PAL.bg,     16, false, true],
  ['.doc a (enlace legal)',     PAL.surge, 1,   PAL.bg,     16, false, true],
  ['.doc-meta (vigencia)',      PAL.ash, 1,     PAL.bg,     11, false, false],
];

// WCAG: 3:1 basta para texto grande (>=24px, o >=18.66px en negrita)
const exigido = (px, negrita) => (px >= 24 || (negrita && px >= 18.66)) ? 3.0 : 4.5;

let fallan = 0, corridoFalla = 0;
console.log('etiqueta                     px    ratio   exige   veredicto');
console.log('─'.repeat(74));
for (const [nombre, color, alfa, fondo, px, negrita, corrido] of CASOS) {
  const efectivo = alfa < 1 ? sobre(color, fondo, alfa) : color;
  const r = contraste(efectivo, fondo);
  const min = exigido(px, negrita);
  const pasa = r >= min;
  if (!pasa) { fallan++; if (corrido) corridoFalla++; }
  const hex = '#' + efectivo.map(c => c.toString(16).padStart(2, '0')).join('');
  console.log(
    nombre.padEnd(28) + String(px).padStart(5) + '  ' +
    r.toFixed(2).padStart(6) + '  ' + min.toFixed(1).padStart(5) + '   ' +
    (pasa ? 'ok' : 'FALLA') + (corrido ? '' : ' (microcopy)') + '   ' + hex
  );
}
console.log('─'.repeat(74));
console.log(`${CASOS.length - fallan}/${CASOS.length} pasan · ${fallan} fallan, de los cuales ${corridoFalla} son texto corrido`);

// ¿Que valor minimo de --graphite alcanzaria 4.5:1 sobre cada fondo?
console.log('\n--graphite tendria que subir a:');
for (const [nom, fondo] of [['sobre --bg', PAL.bg], ['sobre --studio', PAL.studio]]) {
  for (let v = 0x55; v <= 0xFF; v++) {
    const c = [v, v, v + 10];
    if (contraste(c, fondo) >= 4.5) {
      console.log(`  ${nom}: #${v.toString(16)}${v.toString(16)}${(v + 10).toString(16)}  (ratio ${contraste(c, fondo).toFixed(2)})`);
      break;
    }
  }
}
