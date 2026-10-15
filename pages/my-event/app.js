/* ============================================================
   MyEvent Tech — Mis Reservas
   - Gate de sesión
   - Renderiza reservas del usuario (Próximas / Pasadas / Canceladas)
   - Modal QR, cancelar, "Guardar en Wallet"
   - Sidebar con estadísticas reales
   ============================================================ */
   (function () {
    'use strict';
  
    // ---------- Gate de sesión ----------
    if (window.auth && !window.auth.isLoggedIn()) {
      const ret = window.location.pathname + window.location.search;
      window.location.replace('../login/?return=' + encodeURIComponent(ret));
      return;
    }
  
    if (!window.reservationsStore || !window.eventsStore) {
      console.error('[my-event] falta reservations-store o events-store');
      return;
    }
  
    if (window.auth) {
      window.auth.mountAuthNav('auth-nav', { loginPath: '../login/' });
    }
  
    // ---------- Estado ----------
    let activeTab = 'upcoming'; // upcoming | past | cancelled
    let cachedReservations = [];
  
    // ---------- Referencias ----------
    const els = {
      list:         document.getElementById('reservationList'),
      tabs:         document.querySelectorAll('.tab-btn'),
      countUp:      document.getElementById('tab-count-upcoming'),
      countPast:    document.getElementById('tab-count-past'),
      countCancel:  document.getElementById('tab-count-cancelled'),
      modal:        document.getElementById('ticketModal'),
      modalCard:    document.getElementById('modalCard'),
      modalTitle:   document.getElementById('modalEventTitle'),
      modalCode:    document.getElementById('modalEventCode'),
      modalMeta:    document.getElementById('modalEventMeta'),
      modalClose:   document.getElementById('modalCloseBtn'),
      modalWallet:  document.getElementById('modalWalletBtn'),
      toast:        document.getElementById('toast'),
      toastIcon:    document.getElementById('toastIcon'),
      toastMsg:     document.getElementById('toastMessage'),
      // Sidebar
      activityYear: document.getElementById('activityYear'),
      activityAt:   document.getElementById('activityAttended'),
      barCafe:      document.getElementById('bar-cafe'),
      barMusica:    document.getElementById('bar-musica'),
      barTech:      document.getElementById('bar-tech'),
      pctCafe:      document.getElementById('pct-cafe'),
      pctMusica:    document.getElementById('pct-musica'),
      pctTech:      document.getElementById('pct-tech'),
      progressCircle: document.getElementById('progressCircle'),
      explorerHint: document.getElementById('explorerHint'),
      // Referral
      referralLink:    document.getElementById('referralLink'),
      copyReferralBtn: document.getElementById('copyReferralBtn'),
      referralFriends: document.getElementById('referralFriends'),
      referralCredits: document.getElementById('referralCredits'),
      helpBtn:         document.getElementById('helpBtn')
    };
  
    // ---------- Utilidades ----------
    function isPast(iso) {
      if (!iso) return false;
      const t = Date.parse(iso);
      return Number.isFinite(t) && t < Date.now();
    }
  
    function formatDateLong(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d)) return '';
      const date = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
      const time = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
      return date.charAt(0).toUpperCase() + date.slice(1) + ' · ' + time + ' h';
    }
  
    function formatCOP(amount) {
      const n = Number(amount) || 0;
      if (n === 0) return 'Gratis';
      return '$ ' + n.toLocaleString('es-CO') + ' COP';
    }
  
    function categoryStyle(key) {
      return window.categoryStyle ? window.categoryStyle(key) : {
        label: key || 'Evento',
        badge: 'bg-surface-container-highest text-on-surface-variant',
        accent: 'from-outline to-outline-variant'
      };
    }
  
    // ---------- Toast ----------
    function triggerToast(message, icon) {
      if (!els.toast || !els.toastMsg) return;
      els.toastMsg.textContent = message;
      if (els.toastIcon && icon) els.toastIcon.textContent = icon;
      els.toast.classList.remove('translate-y-20', 'opacity-0');
      els.toast.classList.add('translate-y-0', 'opacity-100');
      window.clearTimeout(triggerToast.__t);
      triggerToast.__t = window.setTimeout(() => {
        els.toast.classList.add('translate-y-20', 'opacity-0');
        els.toast.classList.remove('translate-y-0', 'opacity-100');
      }, 3200);
    }
  
    // ---------- Modal ----------
    let modalCurrent = null;
  
    function openModal(reservation) {
      if (!els.modal) return;
      modalCurrent = reservation;
      if (els.modalTitle) els.modalTitle.textContent = reservation.eventTitle || 'Evento';
      if (els.modalCode)  els.modalCode.textContent  = reservation.code || '—';
      if (els.modalMeta) {
        const parts = [];
        if (reservation.eventDate)     parts.push(formatDateLong(reservation.eventDate));
        if (reservation.eventLocation) parts.push(reservation.eventLocation);
        if (reservation.tickets)       parts.push(reservation.tickets + ' boleta' + (reservation.tickets > 1 ? 's' : ''));
        els.modalMeta.textContent = parts.join(' · ');
      }
      els.modal.classList.remove('opacity-0', 'pointer-events-none');
      els.modal.classList.add('opacity-100');
      els.modal.setAttribute('aria-hidden', 'false');
      if (els.modalCard) {
        els.modalCard.classList.remove('scale-95');
        els.modalCard.classList.add('scale-100');
      }
      document.body.classList.add('overflow-hidden');
    }
  
    function closeModal() {
      if (!els.modal) return;
      els.modal.classList.add('opacity-0', 'pointer-events-none');
      els.modal.classList.remove('opacity-100');
      els.modal.setAttribute('aria-hidden', 'true');
      if (els.modalCard) {
        els.modalCard.classList.add('scale-95');
        els.modalCard.classList.remove('scale-100');
      }
      document.body.classList.remove('overflow-hidden');
      modalCurrent = null;
    }
  
    if (els.modalClose) els.modalClose.addEventListener('click', closeModal);
    if (els.modal) {
      els.modal.addEventListener('click', (e) => {
        if (e.target === els.modal) closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && els.modal && els.modal.getAttribute('aria-hidden') === 'false') {
        closeModal();
      }
    });
  
    // ---------- Wallet download ----------
    function downloadPass(reservation) {
      if (!reservation) return;
      const lines = [
        'MyEvent Tech — Pase de acceso',
        '==============================',
        'Evento:  ' + (reservation.eventTitle || ''),
        'Fecha:   ' + (formatDateLong(reservation.eventDate) || ''),
        'Lugar:   ' + (reservation.eventLocation || ''),
        'Boletas: ' + (reservation.tickets || 0),
        'Total:   ' + (formatCOP(reservation.total || 0)),
        'Código:  ' + (reservation.code || ''),
        '',
        'Presenta este código en la entrada del evento.',
        'MyEvent Tech · Armenia, Quindío'
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pase-' + (reservation.code || 'myevent') + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast('Pase descargado. Añádelo a tu Wallet.', 'download');
    }
  
    if (els.modalWallet) {
      els.modalWallet.addEventListener('click', () => {
        if (modalCurrent) downloadPass(modalCurrent);
        else triggerToast('Abre un pase primero.', 'info');
      });
    }
  
    // ---------- Cancelar ----------
    function handleCancel(reservation) {
      const ok = window.confirm(
        '¿Cancelar tu reserva para "' + reservation.eventTitle + '"?\n\nEsta acción no se puede deshacer.'
      );
      if (!ok) return;
      window.reservationsStore.cancel(reservation.id);
      triggerToast('Reserva cancelada. Puedes verla en "Canceladas".', 'cancel');
    }
  
    // ---------- Filtrar por tab ----------
    function getReservationsByTab(tab, all) {
      if (tab === 'cancelled') {
        return all.filter((r) => r.status === 'cancelled');
      }
      if (tab === 'past') {
        return all.filter((r) => r.status !== 'cancelled' && isPast(r.eventDate));
      }
      // upcoming (default)
      return all.filter((r) => r.status !== 'cancelled' && !isPast(r.eventDate));
    }
  
    // ---------- Render tarjeta ----------
    function buildCard(r) {
      const cat = categoryStyle(r.eventCategory);
      const cancelled = r.status === 'cancelled';
  
      const card = document.createElement('article');
      card.className = 'reservation-card bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col sm:flex-row transition-all hover:shadow-md ' +
        (cancelled ? 'opacity-75' : '');
  
      const imgSrc = r.eventImage || '';
      const imgHTML = imgSrc
        ? '<img src="' + imgSrc + '" alt="" class="w-full h-full object-cover ' + (cancelled ? 'grayscale' : '') + '" loading="lazy">'
        : '';
  
      card.innerHTML =
        '<div class="sm:w-40 h-32 sm:h-auto bg-surface-container shrink-0 relative overflow-hidden">' +
          imgHTML +
          '<span class="absolute top-3 left-3 px-2 py-0.5 rounded-full font-label-sm ' + cat.badge + '">' + cat.label + '</span>' +
          (cancelled
            ? '<span class="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm">Cancelada</span>'
            : '') +
        '</div>' +
        '<div class="flex-1 p-5 flex flex-col justify-between gap-4">' +
          '<div>' +
            '<div class="flex items-center gap-2 text-on-surface-variant font-label-sm mb-1">' +
              '<span class="material-symbols-outlined text-[14px]">schedule</span>' +
              '<span data-slot="date"></span>' +
            '</div>' +
            '<h3 class="font-headline-sm text-on-surface line-clamp-2 mb-1 ' + (cancelled ? 'line-through opacity-70' : '') + '" data-slot="title"></h3>' +
            '<p class="font-body-sm text-on-surface-variant flex items-center gap-1.5">' +
              '<span class="material-symbols-outlined text-[14px] text-primary">location_on</span>' +
              '<span data-slot="location"></span>' +
            '</p>' +
          '</div>' +
          '<div class="pt-4 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">' +
            '<div class="flex items-center gap-5">' +
              '<div>' +
                '<span class="block font-label-sm text-on-surface-variant uppercase tracking-wider">Boletas</span>' +
                '<span class="font-code-num text-body-md text-on-surface font-bold" data-slot="tickets"></span>' +
              '</div>' +
              '<div>' +
                '<span class="block font-label-sm text-on-surface-variant uppercase tracking-wider">Total</span>' +
                '<span class="font-code-num text-body-md text-on-surface font-bold" data-slot="total"></span>' +
              '</div>' +
              '<div class="hidden sm:block">' +
                '<span class="block font-label-sm text-on-surface-variant uppercase tracking-wider">Código</span>' +
                '<span class="font-code-num text-body-md text-primary font-bold" data-slot="code"></span>' +
              '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
              '<a data-slot="view-event" class="px-3 py-2 rounded-full font-label-md text-on-surface-variant hover:text-on-surface bg-surface-container-lowest hover:bg-surface-container-high transition-colors">Ver evento</a>' +
              (cancelled
                ? ''
                : '<button data-slot="cancel" type="button" class="px-3 py-2 rounded-full font-label-md text-error hover:bg-error-container transition-colors">Cancelar</button>') +
              '<button data-slot="open" type="button" class="px-4 py-2 rounded-full font-label-md bg-primary hover:bg-primary-container text-on-primary shadow-sm transition-all active:scale-95">Ver pase</button>' +
            '</div>' +
          '</div>' +
        '</div>';
  
      card.querySelector('[data-slot="date"]').textContent     = formatDateLong(r.eventDate);
      card.querySelector('[data-slot="title"]').textContent    = r.eventTitle || '';
      card.querySelector('[data-slot="location"]').textContent = r.eventLocation || '';
      card.querySelector('[data-slot="tickets"]').textContent  = (r.tickets || 0) + 'x';
      card.querySelector('[data-slot="total"]').textContent    = formatCOP(r.total || 0);
      card.querySelector('[data-slot="code"]').textContent     = r.code || '';
  
      const viewEvent = card.querySelector('[data-slot="view-event"]');
      if (viewEvent) viewEvent.href = '../event-detail/?id=' + encodeURIComponent(r.eventId || '');
  
      const cancelBtn = card.querySelector('[data-slot="cancel"]');
      if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(r));
  
      const openBtn = card.querySelector('[data-slot="open"]');
      if (openBtn) openBtn.addEventListener('click', () => openModal(r));
  
      return card;
    }
  
    // ---------- Empty state por tab ----------
    function buildEmptyState(tab) {
      const config = {
        upcoming: {
          icon: 'event_available',
          title: 'No tienes reservas próximas',
          body: 'Explora la cartelera y reserva tu próxima experiencia en el Eje Cafetero.'
        },
        past: {
          icon: 'history',
          title: 'Aún no has asistido a ningún evento',
          body: 'Cuando pase la fecha de tus reservas, aparecerán aquí.'
        },
        cancelled: {
          icon: 'block',
          title: 'No tienes reservas canceladas',
          body: 'Las reservas que canceles aparecerán en esta pestaña.'
        }
      };
      const c = config[tab] || config.upcoming;
  
      const wrap = document.createElement('div');
      wrap.className = 'bg-surface-container-lowest rounded-xl p-12 shadow-sm text-center';
      wrap.innerHTML =
        '<div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">' +
          '<span class="material-symbols-outlined text-[32px] text-on-surface-variant">' + c.icon + '</span>' +
        '</div>' +
        '<h2 class="font-headline-sm text-on-surface mb-2"></h2>' +
        '<p class="font-body-md text-on-surface-variant max-w-md mx-auto mb-6"></p>' +
        (tab === 'upcoming'
          ? '<a href="../../" class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary font-label-lg shadow-[0_4px_14px_0_rgba(37,99,235,0.28)] transition-all active:scale-95">' +
              '<span class="material-symbols-outlined text-[18px]">calendar_month</span>Explorar cartelera' +
            '</a>'
          : '');
  
      wrap.querySelector('h2').textContent = c.title;
      wrap.querySelector('p').textContent = c.body;
      return wrap;
    }
  
    // ---------- Render principal ----------
    function render() {
      const all = cachedReservations;
      const upcoming = getReservationsByTab('upcoming', all);
      const past     = getReservationsByTab('past', all);
      const cancel   = getReservationsByTab('cancelled', all);
  
      if (els.countUp)    els.countUp.textContent    = upcoming.length;
      if (els.countPast)  els.countPast.textContent  = past.length;
      if (els.countCancel)els.countCancel.textContent= cancel.length;
  
      const current = activeTab === 'past' ? past
                    : activeTab === 'cancelled' ? cancel
                    : upcoming;
  
      els.list.innerHTML = '';
      if (!current.length) {
        els.list.appendChild(buildEmptyState(activeTab));
      } else {
        current.forEach((r) => els.list.appendChild(buildCard(r)));
      }
    }
  
    // ---------- Tabs ----------
    function setActiveTab(btn, tab) {
      activeTab = tab;
      els.tabs.forEach((b) => {
        const on = b === btn;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.classList.toggle('bg-surface-container-lowest', on);
        b.classList.toggle('text-primary', on);
        b.classList.toggle('shadow-sm', on);
        b.classList.toggle('text-on-surface-variant', !on);
        b.classList.toggle('hover:text-on-surface', !on);
      });
      render();
    }
  
    els.tabs.forEach((btn) => {
      btn.addEventListener('click', () => setActiveTab(btn, btn.dataset.tab));
    });
  
    // ---------- Sidebar ----------
    function updateSidebar(userReservations) {
      const year = new Date().getFullYear();
      if (els.activityYear) els.activityYear.textContent = String(year);
  
      const attended = userReservations.filter((r) =>
        r.status === 'attended' || (r.status !== 'cancelled' && isPast(r.eventDate))
      ).length;
      if (els.activityAt) els.activityAt.textContent = String(attended);
  
      // Distribución de intereses
      const total = userReservations.length || 0;
      let countCafe = 0, countMusica = 0, countTech = 0;
      userReservations.forEach((r) => {
        const c = r.eventCategory;
        if (c === 'cafe') countCafe++;
        else if (c === 'tech') countTech++;
        else if (c) countMusica++; // musica, gastronomia, talleres
      });
      const pctCafe = total ? Math.round((countCafe / total) * 100) : 0;
      const pctMusica = total ? Math.round((countMusica / total) * 100) : 0;
      const pctTech = total ? Math.round((countTech / total) * 100) : 0;
  
      if (els.barCafe)   els.barCafe.style.width   = pctCafe + '%';
      if (els.barMusica) els.barMusica.style.width = pctMusica + '%';
      if (els.barTech)   els.barTech.style.width   = pctTech + '%';
  
      if (els.pctCafe)   els.pctCafe.textContent   = pctCafe + '%';
      if (els.pctMusica) els.pctMusica.textContent = pctMusica + '%';
      if (els.pctTech)   els.pctTech.textContent   = pctTech + '%';
  
      // Progreso hacia "Pase Quindío Explorer" (meta: 5 experiencias)
      const goal = 5;
      const pct = Math.min(100, Math.round((attended / goal) * 100));
      if (els.progressCircle) {
        els.progressCircle.setAttribute('stroke-dasharray', pct + ', 100');
      }
      if (els.explorerHint) {
        els.explorerHint.textContent = attended >= goal
          ? '¡Felicidades! Has completado el pase'
          : 'Asiste a ' + (goal - attended) + ' experiencia' + ((goal - attended) > 1 ? 's' : '') + ' más para desbloquear el pase';
      }
    }
  
    // ---------- Referral ----------
    function updateReferral() {
      const user = window.auth ? window.auth.getCurrentUser() : null;
      const slug = user ? (user.id || 'tu-enlace') : 'tu-enlace';
      const url = 'myevent.co/inv/' + slug;
      if (els.referralLink) els.referralLink.textContent = url;
      if (els.copyReferralBtn) {
        els.copyReferralBtn.onclick = () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(url)
              .then(() => triggerToast('Enlace copiado al portapapeles', 'content_copy'))
              .catch(() => triggerToast('Copia manualmente: ' + url, 'content_copy'));
          } else {
            triggerToast('Copia manualmente: ' + url, 'content_copy');
          }
        };
      }
      // (0 amigos, $0 acumulados — placeholder hasta integrar backend real)
    }
  
    // ---------- Help ----------
    if (els.helpBtn) {
      els.helpBtn.addEventListener('click', () => {
        triggerToast('Centro de ayuda próximamente. Escríbenos a soporte@myevent.tech', 'help_center');
      });
    }
  
    // ---------- Reactividad ----------
    function refresh() {
      const user = window.auth ? window.auth.getCurrentUser() : null;
      if (!user) return;
      cachedReservations = window.reservationsStore.getByUser(user.id);
      render();
      updateSidebar(cachedReservations);
      updateReferral();
    }
  
    // Si cambia la sesión → vuelve a comprobar gate
    if (window.auth) {
      window.auth.on(() => {
        if (!window.auth.isLoggedIn()) {
          const ret = window.location.pathname + window.location.search;
          window.location.replace('../login/?return=' + encodeURIComponent(ret));
        } else {
          refresh();
        }
      });
    }
  
    // Si cambian las reservas → re-render
    window.reservationsStore.on(() => {
      refresh();
    });
  
    // ---------- Init ----------
    refresh();
  })();