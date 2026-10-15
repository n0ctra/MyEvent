/* ============================================================
   Cartelera (landing): pinta las tarjetas desde eventsStore.
   Filtros por categoría + búsqueda full-text.
   Monta el auth-nav en el header.
   ============================================================ */
   (function () {
    'use strict';
  
    const state = { query: '', category: 'all' };
  
    const container   = document.getElementById('cards-container');
    const searchInput = document.getElementById('event-search-input');
    const dropdown    = document.getElementById('category-dropdown');
    const chipsWrap   = document.getElementById('chip-filters');
  
    if (!container || !window.eventsStore) return;
  
    // ---------- Chips ----------
    function renderChips() {
      const all = window.eventsStore.getAll();
      const counts = all.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {});
  
      chipsWrap.innerHTML = '';
      chipsWrap.appendChild(makeChip('all', 'Todos (' + all.length + ')'));
      Object.keys(window.CATEGORY_STYLES).forEach((key) => {
        const n = counts[key] || 0;
        if (n === 0) return;
        chipsWrap.appendChild(makeChip(key, window.CATEGORY_STYLES[key].label + ' (' + n + ')'));
      });
    }
  
    function makeChip(value, label) {
      const btn = document.createElement('button');
      btn.className = 'filter-chip px-4 py-1.5 rounded-full font-label-md shrink-0 transition-all';
      btn.dataset.filter = value;
      btn.textContent = label;
      btn.addEventListener('click', () => {
        state.category = value;
        if (dropdown) dropdown.value = value;
        applyChipStyles();
        renderCards();
      });
      return btn;
    }
  
    function applyChipStyles() {
      chipsWrap.querySelectorAll('.filter-chip').forEach((c) => {
        const active = c.dataset.filter === state.category;
        c.classList.toggle('active-chip', active);
        c.classList.toggle('bg-inverse-surface', active);
        c.classList.toggle('text-inverse-on-surface', active);
        c.classList.toggle('bg-surface-container', !active);
        c.classList.toggle('text-on-surface-variant', !active);
        c.classList.toggle('hover:bg-surface-container-high', !active);
      });
    }
  
    // ---------- Dropdown ----------
    function renderCategoryDropdown() {
      if (!dropdown) return;
      const current = dropdown.value || 'all';
      dropdown.innerHTML = '';
  
      const all = document.createElement('option');
      all.value = 'all';
      all.textContent = 'Todas las categorías';
      dropdown.appendChild(all);
  
      Object.keys(window.CATEGORY_STYLES).forEach((key) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = window.CATEGORY_STYLES[key].label;
        dropdown.appendChild(opt);
      });
  
      dropdown.value = current;
    }
  
    // ---------- Filtro ----------
    function matches(event) {
      if (state.category !== 'all' && event.category !== state.category) return false;
      if (!state.query) return true;
      const haystack = [
        event.title,
        event.location,
        event.address,
        ...(event.description || []),
        ...(event.highlights || []).map((h) => h.text)
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(state.query);
    }
  
    // ---------- Render tarjetas ----------
    function renderCards() {
      const list = window.eventsStore.getAll().filter(matches);
      container.innerHTML = '';
      if (!list.length) {
        container.appendChild(emptyState());
        return;
      }
      list.forEach((event) => container.appendChild(buildCard(event)));
    }
  
    function emptyState() {
      const d = document.createElement('div');
      d.className = 'col-span-full text-center py-20 text-on-surface-variant';
      d.innerHTML =
        '<span class="material-symbols-outlined text-5xl mb-3 block">search_off</span>' +
        '<p class="font-headline-sm mb-1">Sin resultados</p>' +
        '<p class="font-body-sm">Prueba con otra categoría o término.</p>';
      return d;
    }
  
    function buildCard(event) {
      const cat = window.categoryStyle(event.category);
      const urgency = window.computeUrgency(event);
      const soldOut = event.spotsLeft === 0;
  
      // Estructura raíz → pages/event-detail/
      const href = 'pages/event-detail/?id=' + encodeURIComponent(event.id);
  
      const card = document.createElement('article');
      card.className = 'event-card group flex flex-col justify-between rounded-3xl bg-surface-container-lowest p-6 shadow-[0_2px_16px_rgba(21,27,42,0.05)] hover:shadow-[0_16px_32px_-8px_rgba(0,74,198,0.12)] transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden';
  
      card.innerHTML = `
        <div class="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${cat.accent}"></div>
        <div>
          <div class="flex items-center justify-between gap-2 mb-4">
            <span data-slot="cat-badge" class="inline-flex items-center px-3 py-1 rounded-full font-label-sm uppercase tracking-wide ${cat.badge}"></span>
            <span data-slot="urgency" class="inline-flex items-center gap-1.5 font-label-md px-2.5 py-1 rounded-full"></span>
          </div>
          <div class="relative h-44 rounded-2xl overflow-hidden mb-5 bg-surface-container">
            <img data-slot="image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" alt="">
            <div class="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent"></div>
            <div class="absolute bottom-3 left-3 flex items-center gap-1.5 text-surface-container-lowest font-label-md">
              <span class="material-symbols-outlined text-sm">schedule</span>
              <span data-slot="date"></span>
            </div>
          </div>
          <h3 data-slot="title" class="font-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2 mb-1"></h3>
          <p class="font-body-sm text-on-surface-variant flex items-center gap-1.5 mb-3">
            <span class="material-symbols-outlined text-base text-primary">location_on</span>
            <span data-slot="location"></span>
          </p>
          <p data-slot="description" class="font-body-sm text-on-surface-variant line-clamp-2 mb-6"></p>
        </div>
        <div class="pt-4 bg-surface-container-low rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <span class="block font-label-sm text-on-surface-variant uppercase tracking-wider">Entrada</span>
            <span data-slot="price" class="font-code-num text-on-surface"></span>
          </div>
          <div class="flex items-center gap-2">
            <a data-slot="details" class="px-3 py-2 rounded-full font-label-md text-on-surface-variant hover:text-on-surface bg-surface-container-lowest hover:bg-surface-container-high transition-colors">Detalles</a>
            <a data-slot="book" class="px-4 py-2 rounded-full font-label-md transition-all active:scale-95"></a>
          </div>
        </div>
      `;
  
      card.querySelector('[data-slot="cat-badge"]').textContent = cat.label;
  
      const urgencyEl = card.querySelector('[data-slot="urgency"]');
      if (urgency) {
        urgencyEl.className += ' ' + window.urgencyTextClasses(urgency.tone);
        if (urgency.tone === 'urgent') {
          const dot = document.createElement('span');
          dot.className = 'w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping';
          urgencyEl.appendChild(dot);
        }
        const label = document.createElement('span');
        label.textContent = urgency.label;
        urgencyEl.appendChild(label);
      } else {
        urgencyEl.remove();
      }
  
      const img = card.querySelector('[data-slot="image"]');
      img.src = event.heroImage || '';
      img.alt = event.title;
  
      card.querySelector('[data-slot="date"]').textContent = window.formatDateShort(event.date);
      card.querySelector('[data-slot="title"]').textContent = event.title;
      card.querySelector('[data-slot="location"]').textContent = event.location || '';
      card.querySelector('[data-slot="description"]').textContent = (event.description?.[0] || '').slice(0, 140);
      card.querySelector('[data-slot="price"]').textContent = window.formatCOP(event.unitPrice, event.currency);
  
      card.querySelector('[data-slot="details"]').href = href;
  
      const book = card.querySelector('[data-slot="book"]');
      if (soldOut) {
        book.textContent = 'Agotado';
        book.className += ' bg-surface-container-highest text-on-surface-variant pointer-events-none';
      } else {
        book.textContent = 'Reservar';
        book.href = href;
        book.className += ' bg-primary hover:bg-primary-container text-on-primary shadow-sm';
      }
  
      return card;
    }
  
    // ---------- Inputs ----------
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.query = e.target.value.trim().toLowerCase();
        renderCards();
      });
    }
  
    if (dropdown) {
      dropdown.addEventListener('change', (e) => {
        state.category = e.target.value;
        applyChipStyles();
        renderCards();
      });
    }
  
    // ---------- Reaccionar al store ----------
    window.eventsStore.on(() => {
      renderCategoryDropdown();
      renderChips();
      applyChipStyles();
      renderCards();
    });
  
    // ---------- Init ----------
    renderCategoryDropdown();
    renderChips();
    applyChipStyles();
    renderCards();
  
    // Header: botones de sesión
    if (window.auth) {
      window.auth.mountAuthNav('auth-nav', { loginPath: 'pages/login/' });
    }
  })();