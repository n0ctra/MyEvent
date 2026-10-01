/* ============================================================
   Renderiza el detalle de CUALQUIER evento.
   Reserva requiere sesión y persiste en reservationsStore.
   ============================================================ */
   (function () {
    'use strict';
  
    const id = window.getEventIdFromUrl ? window.getEventIdFromUrl() : null;
    const event = id
      ? window.eventsStore.getById(id)
      : window.eventsStore.getAll()[0];
  
    if (!event) return renderNotFound(id);
  
    if (window.auth) {
      window.auth.mountAuthNav('auth-nav', { loginPath: '../login/' });
    }
  
    // ---------- HERO ----------
    document.title = event.title + ' | MyEvent Tech';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && event.description?.[0]) metaDesc.content = event.description[0];
  
    setText('#breadcrumb-title', event.title);
    setText('#hero-title', event.title);
  
    const heroImg = document.getElementById('hero-image');
    if (event.heroImage) {
      heroImg.src = event.heroImage;
      heroImg.alt = event.title;
    } else {
      heroImg.replaceWith(makePlaceholder(event.title));
    }
  
    const cat = window.categoryStyle(event.category);
    const urgency = window.computeUrgency(event);
  
    const chips = document.getElementById('hero-chips');
    chips.appendChild(chip(cat.badge, cat.label));
    if (event.date) chips.appendChild(chip('bg-white/15 text-white', window.formatDateLong(event.date)));
    if (urgency) {
      chips.appendChild(chip(
        window.urgencyClasses(urgency.tone),
        urgency.label,
        urgency.tone === 'urgent' ? 'local_fire_department' : null,
        'font-semibold'
      ));
    }
  
    const meta = document.getElementById('hero-meta');
    if (event.location) meta.appendChild(metaItem('location_on', 'text-primary-fixed-dim', event.location));
    if (Number.isFinite(event.unitPrice)) {
      const priceEl = metaItem('payments', 'text-primary-fixed-dim', window.formatCOP(event.unitPrice, event.currency));
      priceEl.lastChild.classList.add('text-white', 'font-semibold');
      meta.appendChild(priceEl);
    }
    if (Number.isFinite(event.spotsLeft) && Number.isFinite(event.spotsTotal)) {
      meta.appendChild(metaItem('event_seat', 'text-emerald-400',
        event.spotsLeft + ' de ' + event.spotsTotal + ' cupos'));
    }
  
    if (event.organizer?.name) {
      document.getElementById('hero-organizer').appendChild(buildOrganizer(event.organizer));
    }
  
    document.getElementById('hero').classList.remove('hidden');
  
    // ---------- DESCRIPCIÓN ----------
    if (event.description.length || event.highlights.length) {
      const body = document.getElementById('description-body');
      event.description.forEach((p) => {
        const el = document.createElement('p');
        el.textContent = p;
        body.appendChild(el);
      });
      const hl = document.getElementById('highlights');
      event.highlights.forEach((h) => hl.appendChild(highlightChip(h.icon, h.text)));
      document.getElementById('block-description').classList.remove('hidden');
    }
  
    // ---------- GALERÍA ----------
    if (event.gallery.length) {
      const gallery = document.getElementById('gallery');
      event.gallery.forEach((g) => gallery.appendChild(galleryItem(g)));
      gallery.classList.remove('hidden');
    }
  
    // ---------- AGENDA ----------
    if (event.agenda.length) {
      const dur = window.formatDuration(event.durationMinutes);
      if (dur) document.getElementById('duration-badge').textContent = 'Duración total: ' + dur;
      const tl = document.getElementById('agenda-timeline');
      event.agenda.forEach((item) => tl.appendChild(agendaItem(item)));
      document.getElementById('block-agenda').classList.remove('hidden');
    }
  
    // ---------- UBICACIÓN ----------
    if (event.location || event.address) {
      setText('#location-title', event.location || '');
      setText('#location-address', event.address || '');
      setText('#map-label', event.mapLabel || event.location || '');
      const extra = document.getElementById('location-extra');
      if (event.transport) extra.appendChild(infoCard('commute', 'Transporte y accesos', event.transport));
      if (event.parking)   extra.appendChild(infoCard('local_parking', 'Parqueadero', event.parking));
      document.getElementById('block-location').classList.remove('hidden');
    }
  
    // ---------- FAQs ----------
    if (event.faqs.length) {
      const list = document.getElementById('faqs-list');
      event.faqs.forEach((f) => list.appendChild(faqItem(f)));
      document.getElementById('block-faqs').classList.remove('hidden');
    }
  
    // ---------- Widget de reserva ----------
    initBookingWidget(event);
  
    // ================================================================
    // Helpers
    // ================================================================
    function setText(sel, text) {
      const el = document.querySelector(sel);
      if (el) el.textContent = text;
    }
  
    function chip(classes, text, icon, extra) {
      const span = document.createElement('span');
      span.className = 'px-3.5 py-1 rounded-full backdrop-blur-md font-label-sm tracking-wider uppercase flex items-center gap-1.5 ' + classes + ' ' + (extra || '');
      if (icon) {
        const i = document.createElement('span');
        i.className = 'material-symbols-outlined text-[16px]';
        i.textContent = icon;
        span.appendChild(i);
      }
      span.appendChild(document.createTextNode(text));
      return span;
    }
  
    function metaItem(icon, iconClass, text) {
      const d = document.createElement('div');
      d.className = 'flex items-center gap-2';
      const ic = document.createElement('span');
      ic.className = 'material-symbols-outlined ' + iconClass + ' text-[20px]';
      ic.textContent = icon;
      const tx = document.createElement('span');
      tx.textContent = text;
      d.appendChild(ic);
      d.appendChild(tx);
      return d;
    }
  
    function buildOrganizer(org) {
      const wrap = document.createElement('div');
      wrap.className = 'flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10';
  
      const initials = document.createElement('div');
      initials.className = 'w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm font-bold';
      initials.textContent = org.name.trim().charAt(0).toUpperCase();
      wrap.appendChild(initials);
  
      const right = document.createElement('div');
      right.className = 'flex items-center gap-1 text-white';
  
      const name = document.createElement('span');
      name.className = 'font-label-md';
      name.textContent = org.name;
      right.appendChild(name);
  
      if (org.verified) {
        const v = document.createElement('span');
        v.className = 'material-symbols-outlined material-symbols-filled text-primary-fixed-dim text-[18px]';
        v.title = 'Organizador verificado';
        v.textContent = 'verified';
        right.appendChild(v);
      }
      wrap.appendChild(right);
      return wrap;
    }
  
    function highlightChip(icon, text) {
      const d = document.createElement('div');
      d.className = 'flex items-center gap-2 text-on-surface bg-surface-container px-3.5 py-2 rounded-xl';
      const ic = document.createElement('span');
      ic.className = 'material-symbols-outlined text-primary text-[20px]';
      ic.textContent = icon || 'star';
      const tx = document.createElement('span');
      tx.className = 'font-label-md';
      tx.textContent = text;
      d.appendChild(ic);
      d.appendChild(tx);
      return d;
    }
  
    function galleryItem(g) {
      const wrap = document.createElement('div');
      wrap.className = 'relative rounded-2xl overflow-hidden h-48 bg-surface-container-high shadow-sm group';
      const img = document.createElement('img');
      img.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500';
      img.src = g.src || '';
      img.alt = g.alt || '';
      img.loading = 'lazy';
      if (g.objectPosition) img.style.objectPosition = g.objectPosition;
      wrap.appendChild(img);
  
      if (g.caption) {
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4';
        const cap = document.createElement('span');
        cap.className = 'text-white font-label-md font-semibold';
        cap.textContent = g.caption;
        overlay.appendChild(cap);
        wrap.appendChild(overlay);
      }
      return wrap;
    }
  
    function agendaItem(item) {
      const dot = window.DOT_STYLES[item.dot] || window.DOT_STYLES.primary;
      const wrap = document.createElement('div');
      wrap.className = 'relative';
  
      const dotEl = document.createElement('span');
      dotEl.className = 'absolute -left-[26px] top-1 w-5 h-5 rounded-full ' + dot + ' flex items-center justify-center ring-4 ring-surface-container-lowest';
      const dotInner = document.createElement('span');
      dotInner.className = 'w-2 h-2 rounded-full bg-white';
      dotEl.appendChild(dotInner);
      wrap.appendChild(dotEl);
  
      const head = document.createElement('div');
      head.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1';
      const h3 = document.createElement('h3');
      h3.className = 'font-headline-sm font-semibold text-on-surface';
      h3.textContent = item.title || '';
      const time = document.createElement('span');
      time.className = 'font-code-num text-label-lg font-bold text-primary';
      time.textContent = item.time || '';
      head.appendChild(h3);
      head.appendChild(time);
      wrap.appendChild(head);
  
      if (item.description) {
        const p = document.createElement('p');
        p.className = 'font-body-sm text-on-surface-variant';
        p.textContent = item.description;
        wrap.appendChild(p);
      }
      return wrap;
    }
  
    function infoCard(icon, title, text) {
      const d = document.createElement('div');
      d.className = 'p-4 rounded-xl bg-surface-container-low flex items-start gap-3';
      const ic = document.createElement('span');
      ic.className = 'material-symbols-outlined text-primary text-[24px]';
      ic.textContent = icon;
      const body = document.createElement('div');
      const t = document.createElement('p');
      t.className = 'font-label-md font-bold text-on-surface';
      t.textContent = title;
      const x = document.createElement('p');
      x.className = 'font-body-sm text-on-surface-variant';
      x.textContent = text;
      body.appendChild(t);
      body.appendChild(x);
      d.appendChild(ic);
      d.appendChild(body);
      return d;
    }
  
    function faqItem(f) {
      const d = document.createElement('div');
      d.className = 'p-4 rounded-xl bg-surface-container-low';
      const h3 = document.createElement('h3');
      h3.className = 'font-headline-sm font-semibold text-on-surface flex items-center gap-2 mb-1';
      const ic = document.createElement('span');
      ic.className = 'material-symbols-outlined text-primary text-[20px]';
      ic.textContent = f.icon || 'help';
      const q = document.createElement('span');
      q.textContent = f.question || '';
      h3.appendChild(ic);
      h3.appendChild(q);
      const a = document.createElement('p');
      a.className = 'font-body-sm text-on-surface-variant';
      a.textContent = f.answer || '';
      d.appendChild(h3);
      d.appendChild(a);
      return d;
    }
  
    function makePlaceholder(title) {
      const div = document.createElement('div');
      div.className = 'w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-tertiary/20';
      div.setAttribute('aria-label', title);
      return div;
    }
  
    // ================================================================
    // Widget de reserva
    // ================================================================
    function initBookingWidget(event) {
      const soldOut = event.spotsLeft === 0;
      const cfg = {
        unitPrice: Number(event.unitPrice) || 0,
        min: 1,
        max: Math.max(1, Math.min(event.maxPerOrder || 10, event.spotsLeft || 10)),
        initial: soldOut ? 0 : 1,
        soldOut
      };
  
      const els = {
        count:         document.getElementById('ticket-count'),
        labelCalc:     document.getElementById('label-tickets-calc'),
        subtotal:      document.getElementById('tickets-subtotal'),
        total:         document.getElementById('total-price'),
        submitBtn:     document.getElementById('btn-submit'),
        submitBtnText: document.getElementById('btn-submit-text'),
        submitBtnIcon: document.querySelector('#btn-submit .material-symbols-outlined'),
        dec:           document.getElementById('btn-decrement'),
        inc:           document.getElementById('btn-increment'),
        form:          document.getElementById('reservation-form'),
        success:       document.getElementById('booking-success'),
        successCode:   document.getElementById('booking-success-code'),
        unitPriceEl:   document.getElementById('unit-price-display'),
        maxLabel:      document.getElementById('max-tickets-label'),
        spotsLabel:    document.getElementById('spots-left-label'),
        nameInput:     document.getElementById('name'),
        emailInput:    document.getElementById('email'),
        phoneInput:    document.getElementById('phone'),
        notesInput:    document.getElementById('notes'),
        authNotice:    document.getElementById('booking-auth')
      };
  
      if (els.unitPriceEl) els.unitPriceEl.textContent = window.formatCOP(cfg.unitPrice, event.currency);
      if (els.maxLabel)    els.maxLabel.textContent = cfg.max;
      if (els.spotsLabel)  els.spotsLabel.textContent = event.spotsLeft ?? 0;
  
      let tickets = cfg.initial;
      let busy = false;
  
      // --- Estado de sesión ---
      function refreshAuthState() {
        if (!window.auth || !els.authNotice) return;
        const user = window.auth.getCurrentUser();
        els.authNotice.innerHTML = '';
  
        if (user) {
          if (els.nameInput && !els.nameInput.value)   els.nameInput.value   = user.name;
          if (els.emailInput && !els.emailInput.value) els.emailInput.value = user.email;
  
          const row = document.createElement('div');
          row.className = 'flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200';
          row.innerHTML =
            '<div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-label-md font-bold shrink-0"></div>' +
            '<div class="flex-1 min-w-0">' +
              '<p class="font-label-md text-emerald-900">Reservando como <span class="font-bold"></span></p>' +
              '<p class="font-body-sm text-emerald-700 truncate"></p>' +
            '</div>' +
            '<button type="button" class="text-emerald-700 hover:text-emerald-900 font-label-md shrink-0" data-auth-action="switch">Cambiar</button>';
  
          row.querySelector('div.w-8').textContent = user.name.trim().charAt(0).toUpperCase();
          row.querySelector('span.font-bold').textContent = user.name.split(' ')[0];
          row.querySelector('p.font-body-sm').textContent = user.email;
  
          row.querySelector('[data-auth-action="switch"]').addEventListener('click', () => {
            window.auth.signOut();
          });
  
          els.authNotice.appendChild(row);
          els.authNotice.classList.remove('hidden');
          els.authNotice.classList.add('block');
        } else {
          const row = document.createElement('div');
          row.className = 'flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200';
          row.innerHTML =
            '<span class="material-symbols-outlined text-amber-700 text-[22px] shrink-0">lock</span>' +
            '<div class="flex-1">' +
              '<p class="font-label-md text-amber-900">Inicia sesión para reservar</p>' +
              '<p class="font-body-sm text-amber-800">Serás redirigido a la página de acceso.</p>' +
            '</div>' +
            '<a class="text-amber-800 hover:text-amber-900 font-label-md font-bold shrink-0" href="../login/" data-auth-action="go-login">Entrar</a>';
  
          row.querySelector('[data-auth-action="go-login"]').addEventListener('click', (e) => {
            e.preventDefault();
            const ret = window.location.pathname + window.location.search;
            window.location.href = '../login/?return=' + encodeURIComponent(ret);
          });
  
          els.authNotice.appendChild(row);
          els.authNotice.classList.remove('hidden');
          els.authNotice.classList.add('block');
        }
      }
  
      if (window.auth) {
        window.auth.on(refreshAuthState);
        refreshAuthState();
      }
  
      // --- Render stepper ---
      function render() {
        const total = tickets * cfg.unitPrice;
        if (els.count)     els.count.textContent = tickets;
        if (els.labelCalc) els.labelCalc.textContent = tickets + ' x Entrada General';
        if (els.subtotal)  els.subtotal.textContent = window.formatCOP(total, event.currency);
        if (els.total)     els.total.textContent = window.formatCOP(total, event.currency);
        if (els.submitBtnText && !cfg.soldOut) {
          els.submitBtnText.textContent = 'Reservar plaza (' + window.formatCOP(total, event.currency) + ') · PSE / Tarjeta';
        }
        if (els.dec) els.dec.disabled = cfg.soldOut || tickets <= cfg.min;
        if (els.inc) els.inc.disabled = cfg.soldOut || tickets >= cfg.max;
      }
  
      function change(delta) {
        const next = tickets + delta;
        if (next < cfg.min || next > cfg.max) return;
        tickets = next;
        render();
      }
  
      if (els.dec) els.dec.addEventListener('click', () => change(-1));
      if (els.inc) els.inc.addEventListener('click', () => change(1));
  
      // --- Estado agotado ---
      if (cfg.soldOut) {
        if (els.submitBtn) {
          els.submitBtn.disabled = true;
          els.submitBtn.classList.remove('bg-primary', 'hover:bg-primary-container');
          els.submitBtn.classList.add('bg-surface-container-highest', 'text-on-surface-variant', 'cursor-not-allowed');
          if (els.submitBtnText) els.submitBtnText.textContent = 'Evento agotado · Lista de espera';
          if (els.submitBtnIcon) els.submitBtnIcon.textContent = 'notifications_active';
        }
        [els.dec, els.inc].forEach((b) => b && (b.disabled = true));
        els.form?.querySelectorAll('input, textarea').forEach((f) => (f.disabled = true));
      }
  
      // --- Submit ---
      if (els.form) {
        els.form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (busy || cfg.soldOut) return;
  
          // 1) Auth primero
          if (window.auth && !window.auth.requireAuth('../login/')) return;
  
          // 2) Validación
          if (!els.form.reportValidity()) return;
  
          busy = true;
          els.submitBtn.classList.add('opacity-75', 'pointer-events-none');
          if (els.submitBtnText) els.submitBtnText.textContent = 'Procesando reserva...';
  
          const user = window.auth ? window.auth.getCurrentUser() : null;
  
          window.setTimeout(() => {
            // 3) Crear la reserva real
            let reservation = null;
            if (window.reservationsStore && user) {
              reservation = window.reservationsStore.create({
                userId:         user.id,
                eventId:        event.id,
                eventTitle:     event.title,
                eventDate:      event.date,
                eventLocation:  event.location,
                eventAddress:   event.address,
                eventImage:     event.heroImage,
                eventCategory:  event.category,
                tickets:        tickets,
                unitPrice:      cfg.unitPrice,
                total:          tickets * cfg.unitPrice,
                currency:       event.currency || 'COP',
                attendee: {
                  name:  els.nameInput  ? els.nameInput.value.trim()  : '',
                  email: els.emailInput ? els.emailInput.value.trim() : '',
                  phone: els.phoneInput ? els.phoneInput.value.trim() : '',
                  notes: els.notesInput ? els.notesInput.value.trim() : ''
                }
              });
            }
  
            busy = false;
            els.submitBtn.classList.remove('opacity-75', 'pointer-events-none');
            els.submitBtn.classList.remove('bg-primary');
            els.submitBtn.classList.add('bg-emerald-600');
            if (els.submitBtnText) els.submitBtnText.textContent = 'Reserva Confirmada ✓';
            if (els.submitBtnIcon) els.submitBtnIcon.textContent = 'check_circle';
            if (els.successCode && reservation) els.successCode.textContent = reservation.code;
            els.success?.classList.remove('hidden');
            els.success?.classList.add('flex');
            els.success?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 900);
        });
      }
  
      render();
    }
  
    // ---------- 404 ----------
    function renderNotFound(missingId) {
      const main = document.querySelector('main');
      if (!main) return;
      main.innerHTML =
        '<div class="max-w-3xl mx-auto px-6 py-24 text-center">' +
          '<span class="material-symbols-outlined text-6xl text-outline mb-4">event_busy</span>' +
          '<h1 class="font-headline-lg text-on-surface mb-3">Evento no encontrado</h1>' +
          '<p class="font-body-md text-on-surface-variant mb-6">' +
            (missingId ? 'No existe un evento con id "' + missingId + '".' : 'No se especificó un evento.') +
          '</p>' +
          '<a href="../../" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg">' +
            '<span class="material-symbols-outlined text-base">arrow_back</span>Volver a la cartelera' +
          '</a>' +
        '</div>';
    }
  })();