(function(){
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;


// --- secuencia de apertura ---
(function(){
  var boot=document.getElementById('boot'), num=document.getElementById('bnum'), bar=document.getElementById('bbar');
  var seen=false; try{ seen = sessionStorage.getItem('bo_seen')==='1'; }catch(e){}
  if(reduce || seen){ if(boot) boot.remove(); document.body.classList.remove('boot'); return; }
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  window.scrollTo(0,0);
  var v=0, t0=performance.now();
  (function tick(){
    v = Math.min(100, ((performance.now()-t0)/1700)*100);
    num.textContent = (v<10?'0':'') + Math.floor(v);
    bar.style.width = v+'%';
    if(v<100) requestAnimationFrame(tick);
    else setTimeout(function(){
      boot.classList.add('out');
      document.body.classList.remove('boot');
      window.scrollTo(0,0);
      try{ sessionStorage.setItem('bo_seen','1'); }catch(e){}
      setTimeout(function(){ boot.remove(); }, 700);
    }, 260);
  })();
})();

// reveals
var io = new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
var pio = new IntersectionObserver(function(es){es.forEach(function(e,i){if(e.isIntersecting){setTimeout(function(){e.target.classList.add('on')},i*140);pio.unobserve(e.target)}})},{threshold:.4});
document.querySelectorAll('#pipe .step').forEach(function(el){pio.observe(el)});

// Compartido entre el bucle de la tarjeta y el visor: mientras el visor esta
// abierto el bucle mudo no debe arrancar. Bloquear el desplazamiento del fondo
// mueve la maquetacion lo justo para que el IntersectionObserver vuelva a
// dispararse, y sin esta bandera el bucle se reanudaba por detras del visor.
var visorAbierto = false;

// ── reel del portafolio ─────────────────────────────────────────────────────
// El video no se descarga hasta que su tarjeta se acerca a pantalla, se para al
// salir y no llega a pedirse siquiera con movimiento reducido: ahi se queda el
// poster. Mismo criterio que el bucle del canvas en P4, y por lo mismo: no
// gastar bateria ni datos en algo que nadie esta mirando.
// Recorre TODAS las tarjetas con video, no solo la primera: asi añadir otra
// pieza al portafolio es solo HTML, como dice el README.
(function(){
  var vids = [].slice.call(document.querySelectorAll('.tile video'));
  if(!vids.length) return;
  vids.forEach(function(v){ v.muted = true; });   // Safari mira la propiedad, no solo el atributo

  function poster(v){
    if(v.poster || !v.dataset.poster) return;
    v.poster = v.dataset.poster;
  }
  // Sin IntersectionObserver no hay forma de saber cuando acercarse: se deja el
  // poster puesto y ya. Con movimiento reducido, tambien: poster y nada mas.
  if(typeof IntersectionObserver !== 'function' || reduce){ vids.forEach(poster); return; }

  var obs = new IntersectionObserver(function(es){
    es.forEach(function(e){
      var v = e.target;
      if(!e.isIntersecting){ v.pause(); return; }
      poster(v);
      if(visorAbierto) return;
      if(v.preload === 'none'){ v.preload = 'auto'; v.load(); }
      // play() devuelve una promesa que el navegador puede rechazar (ahorro de
      // datos, pestana en segundo plano). Si la rechaza, se queda el poster.
      var pr = v.play();
      if(pr && pr['catch']) pr['catch'](function(){});
    });
  }, {rootMargin:'200px 0px'});
  vids.forEach(function(v){ obs.observe(v); });
})();

// ── visor del reel ──────────────────────────────────────────────────────────
// Abre la pieza completa, tal y como se grabo: 1920x1080, con sonido y sin el
// recorte 4:5 de la tarjeta. Se apoya en <dialog> nativo, que ya trae el
// atrapado de foco, la tecla Escape, la inertizacion del resto de la pagina y
// la devolucion del foco al cerrar.
//
// No sabe nada de ninguna pieza en concreto: coge el archivo, la portada y el
// rotulo de la tarjeta desde la que se abre, asi que vale para cualquier pieza.
(function(){
  var visor = document.getElementById('visor'), vv = document.getElementById('visor-v');
  if(!visor || !vv || typeof visor.showModal !== 'function') return;
  var meta = visor.querySelector('.visor-meta');
  var bucle = null;                                  // el bucle de la tarjeta abierta

  function abrir(tarjeta){
    var src = tarjeta.dataset.full;
    if(!src) return;
    // Solo se descarga al abrir, y no se vuelve a pedir si ya es la misma pieza.
    if(vv.getAttribute('src') !== src){
      vv.poster = tarjeta.dataset.fullPoster || '';
      vv.src = src;
    }
    var mono = tarjeta.querySelector('.mono'), tit = tarjeta.querySelector('h4');
    meta.innerHTML = '';
    if(mono){ var sp = document.createElement('span'); sp.textContent = mono.textContent; meta.appendChild(sp); }
    if(tit){ meta.appendChild(document.createTextNode(tit.textContent)); }
    visor.setAttribute('aria-label', 'Reel: ' + (tit ? tit.textContent : ''));

    visorAbierto = true;
    bucle = tarjeta.querySelector('video');
    if(bucle) bucle.pause();                         // el bucle mudo estorba al sonido
    // Compensa el ancho de la barra de desplazamiento que se va al bloquear el
    // fondo; sin esto la pagina da un salto lateral al abrir y al cerrar.
    var hueco = window.innerWidth - document.documentElement.clientWidth;
    if(hueco > 0) document.body.style.paddingRight = hueco + 'px';
    document.body.classList.add('visor-abierto');
    visor.showModal();
    var pr = vv.play();
    if(pr && pr['catch']) pr['catch'](function(){});
  }

  // Se dispara con el <dialog>, venga el cierre de donde venga: del boton, de
  // Escape o del clic en el fondo.
  visor.addEventListener('close', function(){
    visorAbierto = false;
    vv.pause(); vv.currentTime = 0;
    document.body.classList.remove('visor-abierto');
    document.body.style.paddingRight = '';
    // Solo si su bucle ya se habia cargado: si no, lo arranca el observador
    // cuando la tarjeta se acerque, con su poster y su carga diferida.
    if(bucle && !reduce && bucle.preload !== 'none'){
      var pr = bucle.play();
      if(pr && pr['catch']) pr['catch'](function(){});
    }
  });

  // Clic en el fondo: en un dialogo modal el evento llega con target en el
  // propio <dialog>, porque el contenido esta dentro de .visor-caja.
  visor.addEventListener('click', function(e){ if(e.target === visor) visor.close(); });
  visor.querySelector('[data-cerrar]').onclick = function(){ visor.close(); };

  // El boton de play es el camino con teclado; la tarjeta entera, el del raton.
  document.querySelectorAll('.tile[data-full]').forEach(function(t){
    t.onclick = function(){ abrir(t); };
    var b = t.querySelector('[data-visor]');
    if(b) b.onclick = function(e){ e.stopPropagation(); abrir(t); };
  });
})();

// ── formulario ──────────────────────────────────────────────────────────────

// MARCADOR · PENDIENTE. URL del webhook de n8n que recibe el lead.
// Sustituir por la URL real antes de publicar. Mientras el valor siga sin
// empezar por http, el formulario valida y muestra el resumen pero no envia,
// y lo dice en pantalla en vez de fallar en silencio.
// El webhook debe responder con cabecera Access-Control-Allow-Origin para
// https://burnout.ec, o el navegador bloqueara la peticion.
var ENDPOINT = 'PENDIENTE_URL_WEBHOOK_N8N';

// MARCADOR · PENDIENTE. WhatsApp de contacto en formato internacional, solo
// digitos, por ejemplo '593991234567'. Se ofrece como via alternativa cuando
// el envio falla. Mientras no sea un numero, no se muestra el enlace.
var WHATSAPP = 'PENDIENTE_NUMERO_WHATSAPP';

// Segundos minimos entre la carga de la pagina y el envio. Por debajo de esto
// no es una persona rellenando tres pasos.
var MIN_SEGUNDOS = 3;
// Corte de la peticion si el servidor no responde.
var TIMEOUT_MS = 15000;

// Medicion. Envoltorio seguro: si medicion.js no esta o el consentimiento no
// se ha dado, la llamada no hace nada. app.js no depende de ese archivo.
function medir(n, d){ if(window.BO && window.BO.medir) window.BO.medir(n, d); }

var T0 = Date.now();
var hayEndpoint = /^https?:\/\//i.test(ENDPOINT);
var hayWhatsapp = /^\d{8,15}$/.test(WHATSAPP);

var panes=[].slice.call(document.querySelectorAll('.pane')), dots=[].slice.call(document.querySelectorAll('.steps i')),
    ok=document.querySelector('.ok'), step=0, challenge='—', challengeLabel='—';
function show(n){panes.forEach(function(p,i){p.classList.toggle('on',i===n)});dots.forEach(function(d,i){d.classList.toggle('on',i<=n)});step=n}
// Al cambiar de paso, el boton que se acaba de pulsar desaparece con display:none
// y el foco se cae al body: con teclado se pierde el hilo. Se lleva al primer
// control del paso nuevo.
function foco(n){
  var p = panes[n]; if(!p) return;
  var c = p.querySelector('input:not([tabindex="-1"]), button, a, select, textarea');
  if(c) c.focus();
}
document.querySelectorAll('[data-next]').forEach(function(b){b.onclick=function(){
  var hecho=step+1;                                    // numero del paso que se deja atras
  show(step+1); foco(step); medir('form_paso',{paso:hecho});
}});
document.querySelectorAll('[data-prev]').forEach(function(b){b.onclick=function(){show(step-1);foco(step)}});
document.querySelectorAll('.chip').forEach(function(c){c.onclick=function(){
  document.querySelectorAll('.chip').forEach(function(x){x.classList.remove('sel');x.setAttribute('aria-pressed','false')});
  c.classList.add('sel'); c.setAttribute('aria-pressed','true');
  challenge=c.dataset.val;                 // valor interno que viaja a n8n
  challengeLabel=c.textContent.trim();     // texto que ve la persona, para el resumen
  limpiar('e-reto');
}});

// --- errores por campo ---
function marcar(idError, idCampo, mensaje){
  var e=document.getElementById(idError);
  if(e){ e.textContent=mensaje; e.classList.add('on'); }
  if(idCampo){ var c=document.getElementById(idCampo); if(c) c.setAttribute('aria-invalid','true'); }
}
function limpiar(idError, idCampo){
  var e=document.getElementById(idError);
  if(e){ e.textContent=''; e.classList.remove('on'); }
  if(idCampo){ var c=document.getElementById(idCampo); if(c) c.removeAttribute('aria-invalid'); }
}
['f1','f4'].forEach(function(id){
  var c=document.getElementById(id); if(!c) return;
  c.addEventListener('input', function(){ limpiar(id==='f1'?'e1':'e4', id); });
});
var chkConsent=document.getElementById('consent');
if(chkConsent) chkConsent.addEventListener('change', function(){ if(chkConsent.checked) limpiar('e-consent'); });

// --- estado del envio ---
var fstatus=document.getElementById('fstatus'), btnSend=document.querySelector('[data-send]');
var textoBoton=btnSend?btnSend.textContent:'', enviando=false;
function estado(html, malo){
  if(!fstatus) return;
  fstatus.innerHTML=html;
  fstatus.classList.toggle('bad', !!malo);
  fstatus.classList.toggle('on', !!html);
}
function bloquear(si){
  enviando=si;
  if(!btnSend) return;
  btnSend.disabled=si;
  btnSend.textContent = si ? 'Enviando…' : textoBoton;
}
function viaWhatsapp(){
  return hayWhatsapp
    ? ' O escríbenos directo por <a href="https://wa.me/'+WHATSAPP+'" target="_blank" rel="noopener">WhatsApp</a>.'
    : '';
}

// --- validacion ---
// Telefono. Se acepta como lo escribe la gente aqui y se normaliza a formato
// internacional antes de enviar. Espacios, guiones, puntos y parentesis dan igual:
//   0991234567   09 9123 4567   ->  +593991234567
//   991234567                    ->  +593991234567
//   593991234567                 ->  +593991234567
//   +593 99 123 4567             ->  +593991234567
// Un numero de otro pais escrito con + se acepta tal cual, sin tocarlo.
// Devuelve null solo si no puede ser un movil ecuatoriano ni un internacional.
function normalizarTel(bruto){
  var s = (bruto||'').replace(/[\s().\-]/g,'');
  if(!s) return null;

  // Internacional de otro pais: se respeta literalmente.
  if(s.charAt(0)==='+' && s.slice(0,4)!=='+593'){
    return /^\+[1-9]\d{6,14}$/.test(s) ? s : null;
  }

  // Ecuador: nos quedamos con el numero nacional y le quitamos el cero de marcado.
  var n = s.replace(/^\+?593/,'').replace(/^\+/,'');
  if(!/^\d+$/.test(n)) return null;
  n = n.replace(/^0/,'');
  return /^9\d{8}$/.test(n) ? '+593'+n : null;   // movil: 9 seguido de 8 digitos
}

function validar(){
  var fallos=[];
  limpiar('e1','f1'); limpiar('e4','f4'); limpiar('e-reto'); limpiar('e-consent');

  if(!document.getElementById('f1').value.trim()){
    marcar('e1','f1','Escribe tu nombre para saber con quién hablamos.');
    fallos.push({pane:0, foco:'f1'});
  }
  if(challenge==='—'){
    marcar('e-reto',null,'Elige el desafío que más te aprieta ahora mismo.');
    fallos.push({pane:1, foco:'.chip'});
  }
  var tel=document.getElementById('f4').value.trim();
  if(!tel){
    marcar('e4','f4','Necesitamos un WhatsApp para responderte.');
    fallos.push({pane:2, foco:'f4'});
  } else if(!normalizarTel(tel)){
    marcar('e4','f4','Ese número no parece un WhatsApp válido. Escríbelo como 0991234567 o como +593 99 123 4567.');
    fallos.push({pane:2, foco:'f4'});
  }
  if(chkConsent && !chkConsent.checked){
    marcar('e-consent',null,'Necesitamos tu autorización para tratar tus datos y poder contactarte.');
    fallos.push({pane:2, foco:'consent'});
  }
  return fallos;
}

// --- payload ---
// Este es el objeto que viaja en el POST. Los campos opcionales vacios van como
// cadena vacia, no como guion: el guion es un adorno de la demo y haria pasar
// cualquier comprobacion de "campo no vacio" en n8n.
function construirPayload(){
  var v=function(id){ return document.getElementById(id).value.trim(); };
  return {
    event: 'lead.audit_requested',
    timestamp: new Date().toISOString(),
    data: {
      full_name: v('f1'),
      company_brand: v('f2'),
      social_or_web: v('f3'),
      main_challenge: challenge,
      whatsapp_phone: normalizarTel(v('f4')) || '',
      source_campaign: 'landing_organico'
    }
  };
}
// Resumen en pantalla. Antes se pintaba aqui el JSON del POST tal cual: sirve
// para revisar el flujo, pero a quien rellena el formulario le dice poco y le
// deja la impresion de estar viendo una pagina a medio hacer. Ahora se muestran
// etiquetas y valores, y los opcionales vacios se ocultan en vez de pintar un
// guion. El objeto real que viaja en el POST se sigue viendo en la consola.
function pintarResumen(p){
  var d=p.data;
  var filas={
    'r-nombre': d.full_name,
    'r-marca':  d.company_brand,
    'r-perfil': d.social_or_web,
    'r-reto':   challengeLabel==='—' ? '' : challengeLabel,
    'r-tel':    d.whatsapp_phone
  };
  Object.keys(filas).forEach(function(id){
    var dd=document.getElementById(id); if(!dd) return;
    var v=filas[id];
    dd.textContent = v || '—';
    if(dd.parentNode) dd.parentNode.hidden = !v;   // fila vacia, fila fuera
  });
  var caja=document.getElementById('resumen');
  if(caja) caja.classList.add('on');
  if(window.console && console.info) console.info('[BURNOUT] payload del lead:', p);
}

// --- envio ---
document.querySelector('[data-send]').onclick=function(){
  if(enviando) return;                                   // sin doble envio

  var fallos=validar();
  if(fallos.length){
    fallos.sort(function(a,b){return a.pane-b.pane});
    var primero=fallos[0];
    estado('Revisa los campos marcados: falta '+fallos.length+(fallos.length===1?' dato.':' datos.'), true);
    if(step!==primero.pane) show(primero.pane);
    var destino = primero.foco.charAt(0)==='.' ? document.querySelector(primero.foco) : document.getElementById(primero.foco);
    if(destino) destino.focus();
    return;
  }

  // Trampa anti-spam. El bot ve una confirmacion, pero no se envia nada ni se
  // pasa por gracias.html, para no ensuciar la medicion de conversion.
  var trampa=document.getElementById('f-empresa-2');
  var rapido=(Date.now()-T0)/1000 < MIN_SEGUNDOS;
  if((trampa && trampa.value) || rapido){
    panes.forEach(function(p){p.classList.remove('on')}); dots.forEach(function(d){d.classList.add('on')}); ok.classList.add('on');
    return;
  }

  var payload=construirPayload();
  pintarResumen(payload);                                // visible antes de enviar

  if(!hayEndpoint){
    if(window.console && console.warn) console.warn('[BURNOUT] falta configurar ENDPOINT en assets/js/app.js: no se ha enviado nada.');
    estado('Todavía no podemos recibir solicitudes desde este formulario. Escríbenos a <a href="mailto:hola@burnout.ec">hola@burnout.ec</a> con estos datos y te agendamos la sesión igual.'+viaWhatsapp(), true);
    return;
  }

  bloquear(true);
  estado('Enviando tus datos…', false);

  var ctrl = typeof AbortController!=='undefined' ? new AbortController() : null;
  var corte = setTimeout(function(){ if(ctrl) ctrl.abort(); }, TIMEOUT_MS);

  fetch(ENDPOINT, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload),
    signal: ctrl ? ctrl.signal : undefined
  }).then(function(res){
    clearTimeout(corte);
    if(!res.ok) throw {tipo:'http', codigo:res.status};
    // Marca de paso por el formulario. gracias.html la lee para distinguir la
    // conversion real de quien entra directo a esa URL, y la borra al leerla.
    try{ sessionStorage.setItem('bo_lead', String(Date.now())); }catch(e){}
    medir('envio_exitoso', {reto:challenge});
    location.href='gracias.html';
  })['catch'](function(err){
    clearTimeout(corte);
    bloquear(false);                                     // los datos siguen ahi: puede reintentar
    // El codigo de estado interesa a quien mantiene la landing, no a quien la
    // usa: va a la consola, y en pantalla queda que hacer a continuacion.
    if(window.console && console.warn) console.warn('[BURNOUT] envio fallido:', err);
    var msg;
    if(err && err.tipo==='http'){
      msg = err.codigo>=500
        ? 'Algo falló de nuestro lado y no es culpa tuya. Espera un momento y pulsa Enviar otra vez.'
        : 'No pudimos registrar tu solicitud. Revisa que el WhatsApp esté bien escrito y vuelve a intentarlo.';
    } else if(err && err.name==='AbortError'){
      msg = 'La respuesta está tardando demasiado. Tus datos siguen escritos: pulsa Enviar para reintentar.';
    } else {
      msg = 'No pudimos enviar tu solicitud. Revisa tu conexión y pulsa Enviar otra vez. Tus datos siguen escritos.';
    }
    estado(msg+viaWhatsapp(), true);
  });
};
})();
