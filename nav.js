/* =========================================================
   nav.js · Navegación entre páginas
   ========================================================= */
   (function initNav() {
    'use strict';
  
    /* Rutas relativas a la RAÍZ del proyecto */
    const ROUTES = {
      'cartelera':      'index.html',
      'event-detail':   'pages/event-detail/index.html',
      'login': 'pages/login/index.html',
      'my-event': 'pages/my-event/index.html',
      'new-event':         'pages/new-event/index.html',
      'preferences':     'pages/preferences/index.html',
      'register':        'pages/register/index.html'
    };
  
    const ROOT = (document.documentElement.dataset.root || './').replace(/\/*$/, '/');
  
    function buildUrl(path, params) {
      const target = ROUTES[path];
      if (!target) { console.warn('[nav] Ruta desconocida:', path); return null; }
      const url = new URL(ROOT + target, window.location.href);
      if (params) new URLSearchParams(params).forEach((v, k) => url.searchParams.set(k, v));
      return url;
    }
  
    function go(path, params) {
      const url = buildUrl(path, params);
      if (url) window.location.href = url.href;
    }
  
    function init() {
      const currentPage = document.documentElement.dataset.page;
  
      /* --- Enlaces/botones con [data-path] --- */
      document.querySelectorAll('[data-path]').forEach((el) => {
        const url = buildUrl(el.dataset.path, el.dataset.params);
        if (!url) return;
        const isCurrent = el.dataset.path === currentPage;
  
        if (el.tagName === 'A') {
          el.setAttribute('href', url.href);
          if (isCurrent) {
            el.addEventListener('click', (e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          }
        } else {
          el.style.cursor = 'pointer';
          el.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isCurrent) window.location.href = url.href;
          });
        }
      });
  
      /* --- Marca el enlace activo del nav --- */
      document.querySelectorAll('[data-active-classes]').forEach((nav) => {
        const activeClasses = nav.dataset.activeClasses || '';
        nav.querySelectorAll('a[data-path]').forEach((a) => {
          if (!a.dataset.idleClasses) a.dataset.idleClasses = a.className;
          const isActive = a.dataset.path === currentPage;
          a.className = isActive ? activeClasses : a.dataset.idleClasses;
          if (isActive) a.setAttribute('aria-current', 'page');
          else a.removeAttribute('aria-current');
        });
      });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
    /* API pública por si la necesitas luego */
    window.MyEventNav = { go, buildUrl, ROUTES, ROOT };
  })();