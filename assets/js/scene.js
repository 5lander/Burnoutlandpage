(function(){
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var cv = document.getElementById('fx'), ctx = cv.getContext('2d');
var path = document.getElementById('iso');
var ISO2D = new Path2D(path.getAttribute('d'));
var W=0,H=0,DPR=1;

function resize(){
  DPR = Math.min(devicePixelRatio||1, 2);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = W*DPR; cv.height = H*DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}

// --- muestreo del isotipo real (línea central + grosor) ---
// El numero de particulas baja en equipos de pocos nucleos. El umbral es
// hardwareConcurrency >= 4: a partir de ahi N no se toca y el render es
// identico al aprobado. Por debajo se escala proporcionalmente, con un suelo
// medido (tools/medir-particulas.html): es el N a partir del cual el trazo
// abre huecos mayores que los del propio render aprobado, 2400 en escritorio
// y 800 en movil. Se redondea a 2500 y 800 por margen.
// Si el navegador no expone hardwareConcurrency se asume 4, es decir, sin cambio.
var movil = window.innerWidth < 760;
var N_BASE = movil ? 2600 : 7000;
var N_MIN  = movil ? 800 : 2500;
var nucleos = navigator.hardwareConcurrency || 4;
var N = nucleos >= 4 ? N_BASE : Math.max(N_MIN, Math.round(N_BASE * nucleos / 4));
var HALF = 76.4;               // medio grosor en unidades del viewBox
var P = [];
var total = path.getTotalLength();
for(var i=0;i<N;i++){
  var l = Math.random()*total;
  var a = path.getPointAtLength(l), b = path.getPointAtLength(Math.min(total,l+.8));
  var tx = b.x-a.x, ty = b.y-a.y, m = Math.hypot(tx,ty)||1;
  var nx = -ty/m, ny = tx/m;
  var off = (Math.random()*2-1)*HALF;
  var x = a.x + nx*off - 500, y = a.y + ny*off - 500;   // centrado en 0,0
  var d = Math.hypot(x,y)||1;
  P.push({
    bx:x, by:y,                       // posición en el símbolo
    dx:x/d, dy:y/d,                   // dirección para la vista explotada
    cx:(Math.random()*2-1), cy:(Math.random()*2-1), cz:Math.random(), // caos
    x:0, y:0, s:Math.random()*1.3+1.0,
    lo: Math.random()<.30, tr: Math.random(),
    c: Math.random()<.055 ? '#A47CFF' : (Math.random()<.012 ? '#FF4D1A' : '#6C2BFF')
  });
}


// --- muestreo del logotipo BURN(iso)UT: letras en pixeles + hueco para la O ---
var TXT=[], oC={x:0,y:0}, oD=.1, TX=null, oLeftX=0;
function buildText(){
  var F=220, oc=document.createElement('canvas'), c2=oc.getContext('2d');
  c2.font='700 '+F+'px Poppins, system-ui, sans-serif';
  var w1=c2.measureText('BURN').width, w2=c2.measureText('UT').width, gap=F*0.80;
  var tw=w1+gap+w2, th=F*1.4;
  oc.width=Math.ceil(tw)+40; oc.height=Math.ceil(th);
  c2=oc.getContext('2d');
  c2.font='700 '+F+'px Poppins, system-ui, sans-serif';
  c2.textBaseline='alphabetic'; c2.fillStyle='#fff';
  var base=F*1.05;
  c2.fillText('BURN',20,base); c2.fillText('UT',20+w1+gap,base);
  var img=c2.getImageData(0,0,oc.width,oc.height).data, pts=[];
  for(var y=0;y<oc.height;y+=2) for(var x=0;x<oc.width;x+=2)
    if(img[(y*oc.width+x)*4+3]>128) pts.push([x,y]);
  if(!pts.length) return;
  var W0=tw+40, cx=W0/2, cy=base-F*0.36;      // centro optico del lockup
  TXT=[]; for(var i=0;i<pts.length;i++) TXT.push({x:(pts[i][0]-cx)/W0, y:(pts[i][1]-cy)/W0});
  oC={x:(20+w1+gap/2-cx)/W0, y:(base-F*0.36-cy)/W0};   // centro del hueco de la O
  oD=(F*0.74)/W0;                                       // diametro del isotipo en la O
  TX={fs:F/W0, ax:(20-cx)/W0, bx:(20+w1+gap-cx)/W0, by:(base-cy)/W0,
      ow:c2.measureText('O').width/W0, cap:(F*0.36)/W0};
  oLeftX = (20-cx)/W0 - (F*0.74)/W0*0.95;   // centro del isotipo cuando pasa al frente
}
if(document.fonts && document.fonts.ready) document.fonts.ready.then(buildText); 
buildText();

// centroide de cada uno de los cuatro nodos, para anclar las etiquetas
var QC=[{x:0,y:0,n:0},{x:0,y:0,n:0},{x:0,y:0,n:0},{x:0,y:0,n:0}];
P.forEach(function(o){ var q=(o.bx>0?1:0)+(o.by>0?2:0); QC[q].x+=o.bx; QC[q].y+=o.by; QC[q].n++; });
QC.forEach(function(q){ if(q.n){ q.x/=q.n; q.y/=q.n; } });

var scene = document.getElementById('scene'), stage = document.getElementById('stage');
var layers = [0,1,2,3,4].map(function(i){return document.getElementById('l'+i)});
var tags = ['t1','t2','t3','t4'].map(function(i){return document.getElementById(i)});
var brand = document.querySelector('.brand');
var pbar = document.getElementById('pbar'), phase = document.getElementById('phase'),
    head = document.getElementById('head'), hint = document.querySelector('.hint');
var PH = ['01 · EL PROBLEMA','02 · EL GIRO','03 · LO QUE HACEMOS','04 · BURNOUT'];
var prog = 0, target = 0;
// P5 · una sola vez: aviso de que se ha pasado la mitad del recorrido
var mitadAvisada = false;
// estado del bucle: se define aqui porque frame() lo consulta (ver mas abajo)
var corriendo = false, enPantalla = true, visible = true;

function scroll(){
  var r = scene.getBoundingClientRect();
  var recorrido = scene.offsetHeight - stage.offsetHeight;
  var t = -r.top / recorrido;
  target = Math.max(0, Math.min(1, t));

  if(hint) hint.style.opacity = target > .04 ? 0 : '';

  // P5 · medicion. Va aqui dentro a proposito: reusa el unico listener de
  // scroll que ya existe (pasivo) en vez de anadir otro, y no toca ni prog ni
  // el bucle de rAF, que siguen gobernados por revisar(). Emite y se apaga.
  //
  // recorrido > 1 descarta el caso de movimiento reducido, donde la escena mide
  // una pantalla justa, no hay recorrido que medir y la division daria infinito.
  if(!mitadAvisada && recorrido > 1 && target >= .5){
    mitadAvisada = true;
    try{ dispatchEvent(new CustomEvent('bo:escena-mitad')); }catch(e){}
  }
}
addEventListener('scroll', scroll, {passive:true});
addEventListener('resize', function(){resize(); scroll();});

function ease(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
function seg(p,a,b){ return Math.max(0, Math.min(1,(p-a)/(b-a))); }

function frame(){
  prog += (target - prog)*(target>0.86 ? 0.42 : 0.16);
  var p = prog;

  var assemble = ease(seg(p,.02,.26));
  var spin     = seg(p,.26,.44);
  var explode  = ease(seg(p,.44,.64));
  var lock     = ease(seg(p,.66,.78));      // retorno: el bucle se vuelve firma
  var solid    = ease(seg(p,.76,.84));      // las letras cuajan en tipografia
  var rel      = seg(p,.82,.92);            // relevo de la O, con el logotipo quieto
  var exitR    = seg(p,.92,1);              // vuelo al nav: solo el ultimo tramo
  var exitU    = Math.pow(exitR,1.7);       // absorcion hacia arriba

  var scale = Math.min(W,H) * (W>900?0.38:0.52) / 1000;
  var cxp = W*(0.5 + (W>900 ? 0.15*(1-lock) : 0)), cyp = H*((W>900? 0.5-0.07*lock : 0.30) + (W>900?0:0.10*lock));
  var fly  = ease(seg(exitR,0,.92));      // el acople ocupa el ultimo tramo completo
  var oIn  = ease(seg(rel,.05,.50));      // la O entra rodando desde la derecha
  var swap = ease(seg(rel,.40,1));        // al chocar, desplaza al isotipo hasta el frente
  var roll = -swap*Math.PI*2;             // rueda sin deslizar: giro antihorario
  var rollO = -(1-oIn)*Math.PI*3;         // la O gira mientras viaja y llega alineada
  var isoCX = oC.x + (oLeftX-oC.x)*swap;
  var ang = spin*Math.PI/2;
  var ca = Math.cos(ang), sa = Math.sin(ang);
  var push = explode*(1-lock)*Math.min(W,H)*0.14;
  var LW = Math.min(W*(W>900?0.74:0.60), 880);
  if(swap>0) cxp += swap*0.11*LW;      // recentrar: el isotipo suma ancho por la izquierda
  if(fly>0 && brand){
    var bR = brand.getBoundingClientRect();
    var bx = bR.left + bR.width/2, by = bR.top + bR.height/2;
    // curva: primero sube, luego se recuesta hacia la izquierda
    var arc = Math.sin(fly*Math.PI)*H*0.07;
    var fS = Math.pow(fly,0.55);        // la escala baja primero
    var fP = Math.pow(fly,1.35);        // la posicion llega despues
    cxp += ((bx+bR.width*0.06)-cxp)*fP;
    cyp += (by-cyp)*fP - arc*(1-fly);
    LW  += (bR.width*0.82-LW)*fS;
  }
  var isoS = (oD*LW)/1000;

  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle = 'rgba(8,8,12,0.26)';
  ctx.fillRect(0,0,W,H);

  if(assemble>0 && exitR<1){
    var rad = Math.min(W,H)*0.44;
    var g = ctx.createRadialGradient(cxp,cyp,0,cxp,cyp,rad);
    g.addColorStop(0,'rgba(108,43,255,'+(0.20*assemble*(1-exitU)).toFixed(3)+')');
    g.addColorStop(.55,'rgba(62,18,176,'+(0.08*assemble*(1-exitU)).toFixed(3)+')');
    g.addColorStop(1,'rgba(8,8,12,0)');
    ctx.fillStyle=g; ctx.fillRect(cxp-rad,cyp-rad,rad*2,rad*2);
  }
  ctx.globalCompositeOperation='lighter';

  var t = performance.now()*0.0004, nT = TXT.length;
  for(var i=0;i<P.length;i++){
    var o = P[i];
    var rx = o.bx*ca - o.by*sa, ry = o.bx*sa + o.by*ca;
    var ex = o.dx*ca - o.dy*sa, ey = o.dx*sa + o.dy*ca;
    var tgx = cxp + rx*scale + ex*push;
    var tgy = cyp + ry*scale + ey*push;
    var chx = cxp + o.cx*W*0.62 + Math.sin(t+o.cz*9)*26;
    var chy = cyp + o.cy*H*0.66 + Math.cos(t*1.3+o.cz*7)*26;
    var x = chx + (tgx-chx)*assemble;
    var y = chy + (tgy-chy)*assemble;

    if(lock>0 && nT){
      var lx, ly;
      if(o.lo){                                   // el isotipo: primero es la O, luego rueda al frente
        var cr = Math.cos(roll), sr = Math.sin(roll);
        lx = cxp + isoCX*LW + (o.bx*cr - o.by*sr)*isoS;
        ly = cyp + oC.y*LW  + (o.bx*sr + o.by*cr)*isoS;
      }else{                                      // migra a las letras
        var q = TXT[(o.tr*nT)|0];
        lx = cxp + q.x*LW; ly = cyp + q.y*LW;
      }
      x += (lx-x)*lock; y += (ly-y)*lock;
    }

    if(exitU>0) y -= (1-fly)*exitU*H*(0.18+o.tr*0.20);
    var k = exitR>0 ? 0.34 : 0.14;   // en el relevo las particulas siguen la forma sin arrastre
    o.x += (x-o.x)*k; o.y += (y-o.y)*k;
    var a = .22 + assemble*.5 + lock*.25;
    if(TX && TXT.length){
      if(!o.lo) a *= (1-solid*0.92);      // las letras ceden ante la tipografia solida
      else if(swap>0) a *= Math.max(0, Math.min(1, (fly-0.02)/0.18));  // el simbolo se granula al despegar
    }
    a *= (1-Math.pow(Math.max(0,(exitR-0.955)/0.045),1.4));
    if(a>0.01){ ctx.fillStyle = o.c; ctx.globalAlpha = a; ctx.fillRect(o.x, o.y, o.s, o.s); }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation='source-over';

  if(solid>0 && TX){
    var lift = (1-fly)*exitU*H*0.18;
    ctx.save();
    ctx.globalAlpha = solid*(1-Math.pow(Math.max(0,(exitR-0.955)/0.045),1.3));
    ctx.fillStyle = '#F6F5F2';
    ctx.font = '700 '+(TX.fs*LW)+'px Poppins, system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('BURN', cxp+TX.ax*LW, cyp+TX.by*LW-lift);
    ctx.fillText('UT',   cxp+TX.bx*LW, cyp+TX.by*LW-lift);
    // el isotipo, nitido, rodando a la izquierda del logotipo
    if(swap>0 && fly<0.22){
      var isoPix = oD*LW;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, swap*3) * (1-fly/0.22);
      ctx.translate(cxp + isoCX*LW, cyp + oC.y*LW - lift);
      ctx.rotate(roll);
      ctx.scale(isoPix/1000, isoPix/1000);
      ctx.translate(-500,-500);
      ctx.strokeStyle = '#F6F5F2'; ctx.lineWidth = 152.79; ctx.lineCap = 'round';
      ctx.stroke(ISO2D);
      ctx.restore();
    }
    if(oIn>0){
      var oX = cxp + oC.x*LW + (1-oIn)*LW*0.80;
      var oY = cyp + TX.by*LW - TX.cap*LW - lift;
      ctx.save();
      ctx.globalAlpha *= oIn;
      ctx.translate(oX, oY);
      ctx.rotate(rollO);
      ctx.textAlign = 'center';
      ctx.fillText('O', 0, TX.cap*LW);
      ctx.restore();
    }
    ctx.restore();
  }

  var idx = p<.22?0 : p<.40?1 : p<.66?2 : p<.76?3 : 4;
  layers.forEach(function(l,i){ l.classList.toggle('on', i===idx); });
  phase.textContent = PH[Math.min(3,idx)];
  pbar.style.transform = 'scaleX('+p+')';
  head.classList.toggle('in', exitR>0.02);             // el menu toma su sitio (aun invisible)
  head.classList.toggle('silent', exitR<=0.88);        // y solo se revela al recibir el logo
  if(brand) brand.style.opacity = exitR>0.88 ? 1 : 0;
  stage.style.zIndex = fly>0.08 && exitR<0.99 ? 70 : 1;
  if(layers[4]){
    layers[4].style.transform = 'translateY('+(-exitU*46)+'px)';
    layers[4].style.opacity = idx===4 ? Math.max(0, 1-Math.max(0,(exitR-0.72)/0.28)) : '';
  }
  var showTags = explode>.18 && lock<.25 && W>1100;
  tags.forEach(function(tg,i){
    tg.classList.toggle('on', showTags);
    if(!showTags) return;
    var q = QC[[0,1,3,2][i]];                      // NO, NE, SO, SE
    var qx = q.x*ca - q.y*sa, qy = q.x*sa + q.y*ca;
    var d = Math.hypot(qx,qy)||1;
    var out = 1 + (128 + push*0.85)/(d*scale);     // se separa del nodo hacia afuera
    var tx = Math.max(150, Math.min(W-150, cxp + qx*scale*out));
    var ty = Math.max(110, Math.min(H-110, cyp + qy*scale*out));
    tg.style.transform = 'translate(-50%,-50%) translate('+tx+'px,'+ty+'px)';
  });

  if(corriendo) requestAnimationFrame(frame);
}

// --- el bucle solo corre cuando la escena se ve y la pestaña esta delante ---
// Mientras el usuario lee el formulario o se va a otra pestaña no hay motivo
// para seguir pintando: son 7000 particulas por fotograma quemando bateria.
function arrancar(){
  if(corriendo || reduce) return;
  corriendo = true;
  // Al reanudar se relee el scroll y se sincroniza prog con target. Sin esto el
  // bucle arrastraria el valor congelado y recuperaria la fase con una animacion
  // visible: la escena entraria en una fase que no corresponde al scroll real.
  scroll();
  prog = target;
  requestAnimationFrame(frame);
}
function parar(){ corriendo = false; }
function revisar(){ (visible && enPantalla) ? arrancar() : parar(); }

document.addEventListener('visibilitychange', function(){
  visible = !document.hidden;
  revisar();
});

resize(); scroll();
if(reduce){
  // versión estática: símbolo ensamblado, sin recorrido
  target = prog = .32;
  ctx.fillStyle='#08080C'; ctx.fillRect(0,0,W,H);
  var sc = Math.min(W,H)*0.46/1000;
  P.forEach(function(o){ ctx.fillStyle=o.c; ctx.fillRect(W*0.5+o.bx*sc, H*0.5+o.by*sc, 1.6,1.6); });
  layers[0].classList.add('on'); head.classList.add('in');
} else {
  if(typeof IntersectionObserver === 'function'){
    new IntersectionObserver(function(es){
      enPantalla = es[0].isIntersecting;
      revisar();
    }, {threshold:0}).observe(stage);
  }
  arrancar();
}
})();
