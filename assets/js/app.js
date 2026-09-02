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

// formulario
var panes=[].slice.call(document.querySelectorAll('.pane')), dots=[].slice.call(document.querySelectorAll('.steps i')),
    ok=document.querySelector('.ok'), step=0, challenge='—';
function show(n){panes.forEach(function(p,i){p.classList.toggle('on',i===n)});dots.forEach(function(d,i){d.classList.toggle('on',i<=n)});step=n}
document.querySelectorAll('[data-next]').forEach(function(b){b.onclick=function(){show(step+1)}});
document.querySelectorAll('[data-prev]').forEach(function(b){b.onclick=function(){show(step-1)}});
document.querySelectorAll('.chip').forEach(function(c){c.onclick=function(){document.querySelectorAll('.chip').forEach(function(x){x.classList.remove('sel')});c.classList.add('sel');challenge=c.dataset.val}});
function esc(s){return (s||'').replace(/[<>&"]/g,function(m){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[m]})}
document.querySelector('[data-send]').onclick=function(){
  var v=function(id){return esc(document.getElementById(id).value.trim())||'—'};
  document.getElementById('payload').innerHTML='{\n  <b>"event"</b>: "lead.audit_requested",\n  <b>"timestamp"</b>: "'+new Date().toISOString()+'",\n  <b>"data"</b>: {\n    <b>"full_name"</b>: "'+v('f1')+'",\n    <b>"company_brand"</b>: "'+v('f2')+'",\n    <b>"social_or_web"</b>: "'+v('f3')+'",\n    <b>"main_challenge"</b>: "'+esc(challenge)+'",\n    <b>"whatsapp_phone"</b>: "'+v('f4')+'",\n    <b>"source_campaign"</b>: "landing_organico"\n  }\n}';
  panes.forEach(function(p){p.classList.remove('on')}); dots.forEach(function(d){d.classList.add('on')}); ok.classList.add('on');
};
})();
