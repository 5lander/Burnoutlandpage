/*
  Valida el JSON-LD de una pagina contra el vocabulario oficial de schema.org.
  Comprueba, para cada nodo:
    - que el @type existe en el vocabulario
    - que cada propiedad existe
    - que la propiedad esta permitida en ese tipo o en alguno de sus ancestros
  Ademas lista los marcadores PENDIENTE_* que queden dentro.

  Uso:  node tools/validar-jsonld.js <pagina.html> <schemaorg-current-https.jsonld>
*/
const fs = require('fs');

const [, , PAGINA, VOCAB] = process.argv;
if (!PAGINA || !VOCAB) { console.error('Uso: node tools/validar-jsonld.js <pagina.html> <vocabulario.jsonld>'); process.exit(1); }

const vocab = JSON.parse(fs.readFileSync(VOCAB, 'utf8'))['@graph'];
const corto = id => String(id).replace(/^schema:/, '').replace(/^https?:\/\/schema\.org\//, '');
const lista = x => x == null ? [] : (Array.isArray(x) ? x : [x]);

const tipos = new Map();       // nombre -> { padres:[] }
const props = new Map();       // nombre -> Set(tipos donde aplica)
for (const n of vocab) {
  const id = corto(n['@id']);
  const t = lista(n['@type']).map(corto);
  if (t.includes('rdfs:Class') || t.includes('Class')) {
    tipos.set(id, lista(n['rdfs:subClassOf']).map(x => corto(x['@id'] || x)));
  }
  if (t.includes('rdf:Property') || t.includes('Property')) {
    props.set(id, new Set(lista(n['schema:domainIncludes']).map(x => corto(x['@id'] || x))));
  }
}

function ancestros(tipo, vistos = new Set()) {
  if (vistos.has(tipo)) return vistos;
  vistos.add(tipo);
  for (const p of (tipos.get(tipo) || [])) ancestros(p, vistos);
  return vistos;
}

const html = fs.readFileSync(PAGINA, 'utf8');
const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!bloques.length) { console.log(`${PAGINA}: sin JSON-LD`); process.exit(0); }

let errores = 0, avisos = 0, nodos = 0;
const marcadores = new Set();
const RESERVADAS = new Set(['@type', '@id', '@context', '@graph']);

function revisar(nodo, ruta) {
  if (!nodo || typeof nodo !== 'object') return;
  if (Array.isArray(nodo)) return nodo.forEach((x, i) => revisar(x, `${ruta}[${i}]`));

  const t = lista(nodo['@type']).map(corto);
  if (!t.length) {
    // nodo de solo referencia, por ejemplo { "@id": "...#organizacion" }
    if (Object.keys(nodo).length === 1 && nodo['@id']) return;
  }
  nodos++;
  const validos = new Set();
  for (const ti of t) {
    if (!tipos.has(ti)) { console.log(`  ERROR  ${ruta}: el tipo "${ti}" no existe en schema.org`); errores++; }
    else for (const a of ancestros(ti)) validos.add(a);
  }

  for (const [clave, valor] of Object.entries(nodo)) {
    if (RESERVADAS.has(clave)) continue;
    if (typeof valor === 'string' && /PENDIENTE_/.test(valor)) marcadores.add(`${ruta}.${clave} = "${valor}"`);
    if (!props.has(clave)) { console.log(`  ERROR  ${ruta}.${clave}: propiedad inexistente en schema.org`); errores++; continue; }
    const dominio = props.get(clave);
    if (dominio.size && ![...dominio].some(d => validos.has(d))) {
      console.log(`  AVISO  ${ruta}.${clave}: no declarada para ${t.join('/')} (aplica a ${[...dominio].slice(0, 4).join(', ')}…)`);
      avisos++;
    }
    revisar(valor, `${ruta}.${clave}`);
  }
}

console.log(`\n${PAGINA}`);
for (const b of bloques) {
  let j;
  try { j = JSON.parse(b); } catch (e) { console.log(`  ERROR  JSON invalido: ${e.message}`); errores++; continue; }
  const raiz = j['@graph'] ? j['@graph'] : [j];
  raiz.forEach((n, i) => revisar(n, corto(lista(n['@type'])[0]) || `nodo${i}`));
}
console.log(`  ${nodos} nodos · ${errores} errores · ${avisos} avisos`);
if (marcadores.size) {
  console.log('  marcadores pendientes:');
  for (const m of marcadores) console.log(`    · ${m}`);
}
process.exit(errores ? 1 : 0);
