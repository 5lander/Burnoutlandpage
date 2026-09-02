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

// ── formulario ──────────────────────────────────────────────────────────────

// MARCADOR · PENDIENTE. URL del webhook de n8n que recibe el lead.
// Sustituir por la URL real antes de publicar. Mientras el valor siga sin
// empezar por http, el formulario valida y muestra el payload pero no envia,
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

var T0 = Date.now();
var hayEndpoint = /^https?:\/\//i.test(ENDPOINT);
var hayWhatsapp = /^\d{8,15}$/.test(WHATSAPP);

var panes=[].slice.call(document.querySelectorAll('.pane')), dots=[].slice.call(document.querySelectorAll('.steps i')),
    ok=document.querySelector('.ok'), step=0, challenge='—';
function show(n){panes.forEach(function(p,i){p.classList.toggle('on',i===n)});dots.forEach(function(d,i){d.classList.toggle('on',i<=n)});step=n}
document.querySelectorAll('[data-next]').forEach(function(b){b.onclick=function(){show(step+1)}});
document.querySelectorAll('[data-prev]').forEach(function(b){b.onclick=function(){show(step-1)}});
document.querySelectorAll('.chip').forEach(function(c){c.onclick=function(){
  document.querySelectorAll('.chip').forEach(function(x){x.classList.remove('sel');x.setAttribute('aria-pressed','false')});
  c.classList.add('sel'); c.setAttribute('aria-pressed','true'); challenge=c.dataset.val; limpiar('e-reto');
}});
function esc(s){return (s||'').replace(/[<>&"]/g,function(m){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[m]})}

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
// Telefono internacional: admite espacios y separadores al escribir; se valida
// sobre los digitos, en formato E.164 (+ y de 8 a 15 digitos, sin cero inicial).
function telValido(s){ return /^\+[1-9]\d{7,14}$/.test((s||'').replace(/[\s()-]/g,'')); }

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
  } else if(!telValido(tel)){
    marcar('e4','f4','Escríbelo en formato internacional, con el código de país. Ejemplo: +593 99 123 4567.');
    fallos.push({pane:2, foco:'f4'});
  }
  if(chkConsent && !chkConsent.checked){
    marcar('e-consent',null,'Necesitamos tu autorización para tratar tus datos y poder contactarte.');
    fallos.push({pane:2, foco:'consent'});
  }
  return fallos;
}

// --- payload ---
// El mismo objeto que se pinta en pantalla es el que se envia, para que el
// bloque .payload no pueda divergir nunca de lo que recibe n8n.
function construirPayload(){
  var v=function(id){ return document.getElementById(id).value.trim() || '—'; };
  return {
    event: 'lead.audit_requested',
    timestamp: new Date().toISOString(),
    data: {
      full_name: v('f1'),
      company_brand: v('f2'),
      social_or_web: v('f3'),
      main_challenge: challenge,
      whatsapp_phone: v('f4'),
      source_campaign: 'landing_organico'
    }
  };
}
function pintarPayload(p){
  var d=p.data;
  document.getElementById('payload').innerHTML='{\n  <b>"event"</b>: "'+esc(p.event)+'",\n  <b>"timestamp"</b>: "'+esc(p.timestamp)+'",\n  <b>"data"</b>: {\n    <b>"full_name"</b>: "'+esc(d.full_name)+'",\n    <b>"company_brand"</b>: "'+esc(d.company_brand)+'",\n    <b>"social_or_web"</b>: "'+esc(d.social_or_web)+'",\n    <b>"main_challenge"</b>: "'+esc(d.main_challenge)+'",\n    <b>"whatsapp_phone"</b>: "'+esc(d.whatsapp_phone)+'",\n    <b>"source_campaign"</b>: "'+esc(d.source_campaign)+'"\n  }\n}';
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
  pintarPayload(payload);                                // visible antes de enviar

  if(!hayEndpoint){
    estado('El formulario todavía no tiene conectado su destino: falta configurar la constante <b>ENDPOINT</b> en assets/js/app.js. Tus datos no se han enviado.'+viaWhatsapp(), true);
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
    location.href='gracias.html';
  })['catch'](function(err){
    clearTimeout(corte);
    bloquear(false);                                     // los datos siguen ahi: puede reintentar
    var msg;
    if(err && err.tipo==='http'){
      msg = err.codigo>=500
        ? 'El servidor respondió con un error interno (HTTP '+err.codigo+'). No es culpa tuya. Espera un momento y pulsa Enviar otra vez.'
        : 'El servidor rechazó el envío (HTTP '+err.codigo+'). Revisa que el WhatsApp esté bien escrito y vuelve a intentarlo.';
    } else if(err && err.name==='AbortError'){
      msg = 'El servidor tardó más de '+(TIMEOUT_MS/1000)+' segundos en responder. Tus datos siguen escritos: pulsa Enviar para reintentar.';
    } else {
      msg = 'No pudimos conectar con el servidor. Revisa tu conexión y pulsa Enviar otra vez. Tus datos siguen escritos.';
    }
    estado(msg+viaWhatsapp(), true);
  });
};
})();
