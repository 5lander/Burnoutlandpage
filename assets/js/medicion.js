/*
  Medicion.

  Toda la analitica del sitio pasa por aqui, y la regla es una sola: antes de
  que la persona diga que si no ocurre nada. Ni se inserta el script de la
  herramienta, ni se escribe una cookie, ni sale una peticion del navegador.
  Rechazar se guarda y se respeta: no se vuelve a preguntar ni se carga nada en
  visitas posteriores.

  Los eventos disparados antes de la decision se guardan en un array en memoria
  (cola). Un array en memoria no es una peticion ni una cookie: no sale del
  navegador. Si la persona acepta, se envian; si rechaza, se tiran. Asi el
  "inicio de formulario" de quien acepta a los diez segundos no se pierde.

  API publica, para que app.js no dependa de este archivo:
    window.BO.medir(nombre, datos)   registra un evento
    window.BO.consentimiento()       'si' | 'no' | null
    window.BO.registro               eventos ya registrados (depuracion y pruebas)
  Ademas se emite un CustomEvent 'bo:medicion' por cada evento registrado, que
  es lo que usan las pruebas para verificar sin depender de la herramienta.
*/
(function(){
'use strict';

// MARCADOR · PENDIENTE. Identificador de la propiedad de medicion (GA4: G-XXXXXXXXXX).
// Mientras no tenga esa forma NO se carga ninguna herramienta ni se hace ninguna
// peticion: los eventos se registran igual en window.BO.registro, que es lo que
// permite probar el flujo completo sin haber contratado todavia la herramienta.
var MEDICION_ID  = 'PENDIENTE_ID_MEDICION';
var MEDICION_SRC = 'https://www.googletagmanager.com/gtag/js?id=';

var CLAVE    = 'bo_consentimiento';
var VERSION  = 1;    // subir si cambia lo que se pide consentir: vuelve a preguntar
var MAX_COLA = 40;   // tope de eventos en espera, para no crecer sin limite
var MAX_REG  = 100;  // tope del registro de depuracion

var BO = window.BO = window.BO || {};
BO.registro = [];

// ── consentimiento almacenado ───────────────────────────────────────────────
// localStorage y no cookie: una cookie viaja en cada peticion al servidor y
// aqui no hace ninguna falta. En navegacion privada puede lanzar excepcion; si
// no se puede guardar, se vuelve a preguntar en la siguiente visita, que es el
// fallo seguro correcto (preguntar de mas, nunca cargar de mas).
function leer(){
  try{
    var v = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if(v && v.v === VERSION && (v.r === 'si' || v.r === 'no')) return v.r;
  }catch(e){}
  return null;
}
function guardar(r){
  try{ localStorage.setItem(CLAVE, JSON.stringify({v:VERSION, r:r, t:new Date().toISOString()})); }catch(e){}
}

var decision = leer(), cola = [], cargada = false;

// ── la herramienta ──────────────────────────────────────────────────────────
function cargar(){
  if(cargada) return;
  cargada = true;
  if(!/^G-[A-Z0-9]{6,}$/i.test(MEDICION_ID)) return;   // sin ID real, ni una peticion

  // El stub de gtag se define antes de que llegue el script: asi los eventos
  // que ocurren mientras descarga se encolan en dataLayer en vez de perderse.
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', MEDICION_ID, {anonymize_ip:true});

  var s = document.createElement('script');
  s.async = true;
  s.src = MEDICION_SRC + encodeURIComponent(MEDICION_ID);
  document.head.appendChild(s);
}

// ── registro de eventos ─────────────────────────────────────────────────────
function registrar(ev){
  if(BO.registro.length < MAX_REG) BO.registro.push(ev);
  try{ dispatchEvent(new CustomEvent('bo:medicion', {detail:ev})); }catch(e){}
  if(window.gtag) window.gtag('event', ev.nombre, ev.datos);
}
function medir(nombre, datos){
  var ev = {nombre:nombre, datos:datos || {}, t:Date.now()};
  if(decision === 'no') return;                  // se descarta, no se guarda
  if(decision === 'si'){ registrar(ev); return; }
  if(cola.length < MAX_COLA) cola.push(ev);      // en memoria, sin salir de aqui
}
BO.medir = medir;
BO.consentimiento = function(){ return decision; };

// ── banner ──────────────────────────────────────────────────────────────────
var caja = null;

function cerrar(){
  if(!caja) return;
  caja.parentNode.removeChild(caja);
  caja = null;
}
function aceptar(){
  decision = 'si'; guardar('si'); cerrar();
  cargar();                                       // gtag ya existe al vaciar
  var c = cola; cola = [];
  c.forEach(registrar);
  medir('consentimiento', {decision:'aceptado'});
}
function rechazar(){
  decision = 'no'; guardar('no'); cerrar();
  cola = [];                                      // lo encolado se tira
}

function pintar(){
  caja = document.createElement('section');
  caja.className = 'ck';
  caja.id = 'ck';
  caja.setAttribute('role', 'region');
  caja.setAttribute('aria-label', 'Aviso de medición');
  // Texto definitivo. Dice las tres cosas que tiene que decir un aviso de este
  // tipo para que el consentimiento sea informado: quien mide, que se mide y que
  // pasa si dices que no. El detalle completo esta en el apartado 7 de
  // privacidad.html; aqui va la version corta, que es la que se lee de verdad.
  caja.innerHTML =
    '<p class="ck-t">' +
    'Este sitio <b>no usa cookies</b>. Si aceptas, medimos de forma anónima qué ' +
    'secciones se usan, con Google Analytics. Si rechazas, no se carga nada. ' +
    'En ningún caso se mide lo que escribes en el formulario. ' +
    '<a href="privacidad.html">Cómo tratamos tus datos</a>.</p>' +
    '<div class="ck-b">' +
      '<button type="button" class="btn btn-s" data-ck="no">Rechazar</button>' +
      '<button type="button" class="btn btn-s" data-ck="si">Aceptar</button>' +
    '</div>';
  caja.addEventListener('click', function(e){
    var b = e.target.closest('[data-ck]');
    if(!b) return;
    b.getAttribute('data-ck') === 'si' ? aceptar() : rechazar();
  });
  // Primero en el DOM: con teclado se llega al aviso antes que a la navegacion.
  // Visualmente da igual, porque va fijo abajo (y por eso no desplaza nada:
  // un elemento fijo esta fuera del flujo y no puede aportar CLS).
  document.body.insertBefore(caja, document.body.firstChild);
}

// Se pinta de inmediato, no al terminar el preloader. Dos razones, y la segunda
// se midio:
//   1. El preloader es opaco y cubre toda la pantalla (z-index 120 contra 100),
//      asi que el aviso no se ve hasta que se retira: no aparece de golpe dos
//      segundos despues, esta ahi cuando la pagina se destapa.
//   2. Esperar lo convertia en el ultimo bloque grande en pintarse y por tanto
//      en el elemento del LCP: 4136 ms en 4G frente a 1084 ms del h1. Pintarlo
//      con el resto devuelve la metrica a su sitio.
if(decision === null)      pintar();
else if(decision === 'si') cargar();
// decision === 'no': no se pinta el aviso y no se carga nada. Fin.

// ── eventos que se cablean aqui ─────────────────────────────────────────────

// Clic en WhatsApp. Delegado en document porque el unico enlace wa.me lo inserta
// app.js cuando falla el envio: no existe en el HTML inicial.
document.addEventListener('click', function(e){
  var a = e.target.closest && e.target.closest('a[href*="wa.me"], a[href^="whatsapp:"]');
  if(a) medir('whatsapp_clic', {destino:a.getAttribute('href'), desde:location.pathname});
});

// Inicio de formulario: la primera vez que alguien toca cualquier control de la
// tarjeta. focusin cubre teclado y raton, y los chips son botones.
var form = document.querySelector('.form');
if(form) form.addEventListener('focusin', function ini(){
  form.removeEventListener('focusin', ini);
  medir('form_inicio', {});
});

// Mitad de la escena. No hay listener de scroll nuevo: scene.js ya tiene uno
// pasivo y avisa una sola vez desde dentro. Nada de esto reanuda el bucle de
// rAF, que sigue gobernado por el IntersectionObserver y visibilitychange.
addEventListener('bo:escena-mitad', function(){ medir('escena_mitad', {}); });

// Conversion. Se mide en la pagina de gracias, no en el clic del boton: el clic
// dice que se pulso, la pagina dice que se llego. Si alguien entra directo a
// gracias.html sin pasar por el formulario, el evento se registra igual pero
// marcado como directo, para poder descontarlo.
if(document.body.hasAttribute('data-conversion')){
  var origen = 'directo';
  try{
    var t = parseInt(sessionStorage.getItem('bo_lead') || '0', 10);
    if(t && Date.now() - t < 600000){ origen = 'formulario'; }
    sessionStorage.removeItem('bo_lead');
  }catch(e){}
  medir('conversion', {origen:origen});
}
})();
