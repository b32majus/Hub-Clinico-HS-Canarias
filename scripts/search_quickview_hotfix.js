// Hotfix búsqueda NHC + Quick View
(function(){
  'use strict';
  var timer=null;
  function nhc(v){ return String(v || '').trim(); }
  function dbReady(){
    if (window.HubTools && HubTools.data && HubTools.data.isLoaded) return true;
    if (window.HubTools && HubTools.data && typeof HubTools.data.initDatabaseFromStorage === 'function') {
      try { return !!HubTools.data.initDatabaseFromStorage(); } catch(e){ console.error(e); return false; }
    }
    return false;
  }
  function notify(msg,type){
    if (window.HubTools && HubTools.utils && typeof HubTools.utils.mostrarNotificacion === 'function') HubTools.utils.mostrarNotificacion(msg,type||'info');
    else console.warn(msg);
  }
  function sync(value, source){
    ['patientSearch','patientId'].forEach(function(id){ var el=document.getElementById(id); if(el && id!==source) el.value=value; });
    var c=document.getElementById('clearPatientSearch'); if(c) c.classList.toggle('hidden', !value);
  }
  function search(value, source){
    var q=nhc(value); sync(q, source); if(!q) return;
    if(!dbReady()){ notify('Cargue la base de datos antes de buscar pacientes.','warning'); return; }
    if(typeof window.showPatientResults === 'function') window.showPatientResults(q);
    else { console.error('showPatientResults no disponible'); notify('No se pudo abrir la vista rápida. Recargue la página.','error'); }
  }
  function debounce(value, source){
    var q=nhc(value); sync(q, source); clearTimeout(timer); if(q.length<3) return;
    timer=setTimeout(function(){ search(q, source); }, 250);
  }
  function clear(){
    ['patientSearch','patientId'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    var c=document.getElementById('clearPatientSearch'); if(c) c.classList.add('hidden');
    var o=document.getElementById('quickViewOverlay'); if(o) o.classList.add('hidden');
    var r=document.getElementById('searchResults'); if(r) r.classList.add('hidden');
    var d=document.getElementById('dashboardContent'); if(d) d.classList.remove('hidden');
    document.body.classList.remove('quick-view-open');
  }
  function bindInput(id){
    var el=document.getElementById(id); if(!el || el.dataset.quickviewHotfixBound==='true') return;
    el.dataset.quickviewHotfixBound='true';
    el.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); search(el.value,id); }});
    el.addEventListener('input', function(){ debounce(el.value,id); });
  }
  function bind(){
    bindInput('patientSearch'); bindInput('patientId');
    var c=document.getElementById('clearPatientSearch'); if(c && c.dataset.quickviewHotfixBound!=='true'){ c.dataset.quickviewHotfixBound='true'; c.addEventListener('click', clear); }
    var s=document.querySelector('.search-container .search-icon'); if(s && s.dataset.quickviewHotfixBound!=='true'){ s.dataset.quickviewHotfixBound='true'; s.style.cursor='pointer'; s.addEventListener('click', function(){ var el=document.getElementById('patientSearch'); if(el) search(el.value,'patientSearch'); }); }
    var i=document.querySelector('.input-wrapper .input-icon'); if(i && i.dataset.quickviewHotfixBound!=='true'){ i.dataset.quickviewHotfixBound='true'; i.style.cursor='pointer'; i.addEventListener('click', function(){ var el=document.getElementById('patientId'); if(el) search(el.value,'patientId'); }); }
  }
  document.addEventListener('DOMContentLoaded', bind);
  window.addEventListener('databaseLoaded', bind);
  document.addEventListener('databaseLoaded', bind);
  window.__hubRunPatientSearch = search;
})();
