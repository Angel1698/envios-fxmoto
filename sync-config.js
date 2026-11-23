/* Pega aquí la dirección de la aplicación web de Apps Script (termina en /exec). Vacía = cada teléfono guarda solo lo suyo. */
window.FX_SYNC_URL = 'https://script.google.com/macros/s/AKfycbyiz-b-FTJ6BNg-JJFRcpt0G5Ssm85JnZK-a76Hf6WakPOnG9cTKiYMlErknT-3HWnnyA/exec';

/* Liga del panel a Gestión (Características del RGP, Sustitutos, Productos activos y Pedido). Va aquí y no en el panel porque el panel se regenera en cada reparto. */
(function(){
  if(!/panel-[0-9a-f]+\.html/.test(location.pathname)) return;
  function add(){
    var w=document.querySelector('nav.tabs .wrap'); if(!w||w.querySelector('a[data-gestion]')) return;
    var a=document.createElement('a'); a.href='gestion-236ef9.html#activos'; a.setAttribute('data-gestion','1');
    a.textContent='Gestión · RGP, sustitutos y activos'; w.appendChild(document.createTextNode(' ')); w.appendChild(a);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',add); else add();
})();
