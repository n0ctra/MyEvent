/* ============================================================
   Crear nuevo evento — guarda en Supabase.
   El publish es ASÍNCRONO (await eventsStore.create).
   ============================================================ */

   import { eventsStore } from '../../events-store.js';
   import { auth } from '../../auth-store.js';
   
   (async function () {
     'use strict';
   
     await auth.ready;
   
     if (!auth.isLoggedIn()) {
       const ret = window.location.pathname + window.location.search;
       window.location.replace('../login/?return=' + encodeURIComponent(ret));
       return;
     }
   
     auth.mountAuthNav('auth-nav', { loginPath: '../login/' });
   
     const DRAFT_KEY = 'myevent.draft.v1';
     const AUTOSAVE_MS = 800;
   
     const CATEGORY_MAP = {
       'Concierto':  { key: 'musica',       label: 'Concierto & Live' },
       'Taller':     { key: 'talleres',     label: 'Taller & Workshop' },
       'Cena':       { key: 'gastronomia',  label: 'Cena & Gastronomía' },
       'Meetup':     { key: 'tech',         label: 'Meetup & Networking' },
       'Acústico':   { key: 'musica',       label: 'Sesión Acústica' },
       'Exposición': { key: 'talleres',     label: 'Exposición de Arte' },
       'Café':       { key: 'cafe',         label: 'Café & Cata' },
       'Otro':       { key: 'talleres',     label: 'Evento' }
     };
   
     const DEFAULT_HERO = {
       musica:      'https://lh3.googleusercontent.com/aida-public/AB6AXuBYeoy_q4XWUZGGIfnz7416sDJQLYQKPluQk8rikrt4BnwZXQdYQT1RhIUi-Og_A8QSs3otQyIBj32OYDzdZ5Lalp80jjSUImHVwSY2P-9aa_5r1E5QU3U9vfoynREk6x6ydEagyRXXZwUk9Yme4WxpTPpslg9T-ja_CoJyK49XwweBnYxzcOavfTX5UaiNXRXMgAwn4ZitstYYx3pxf7jU5mlhcrlqBkX5S_bnq1hSXTVl8s5SknKCDA',
       cafe:        'https://lh3.googleusercontent.com/aida-public/AB6AXuBrC1r57CH8EUiaCuou--jWnQbteuEKiZnpQ2Praoi6g48GXIbkKQsCIVzwM-K-aRqZiscOM_stHERQXZrYc_EmGYKpN7hQnAMduKrWY0jZHAo2_jR5ZCI1bLaSmskoOPprFu5m9JZsczeoXA6xy0BFgj6FVYCCQhObLidkA9DtougttTY68uW1zhyNx43sa_Ow6l4ix2DdS0DsM4V4iGdfV1EiLK50j0nItKzPC74QGHAgnVT_cgZKlA',
       gastronomia: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2MuedrwPUL0gMMh7nDNx9_jYuVYvwmRHCKJ5iKrUDTffVjlHJaH8xkjjve4VinisoBSOqoJrI6nkJfxy9gZPCXzMCrEB79LlCqo7048ACpS7pWzm_0KbL0ca2x_OiSQ0aZnnsJA2IPiaQgLiGjb3ZCRpB82q7iv3QshW-A2lr3mAqN780nVS2dfqBMxp_kiZiC_qhY7pYK3qERkxH4Y4R15Yd2-gkFT5Wkjc0bFM1e0sYGRXelob4FQ',
       talleres:    'https://lh3.googleusercontent.com/aida-public/AB6AXuChNbNYq1vBNxdyEajEyp2QIaXVRASRZvzcL4uH2_Qh7U3BEH05YSwJCX8eaA2u0LHBSdcnkXW-GMuUL7N6_CqGhZPVwpxfyh-yg_7Z91PqBVe6TaEhrQvxKA-PYRotZYLi6mOQ39fmIMag2n2DXi94VhTsAlH38Gtz3Fp2IlK4Cptg_BUm3pjILTI2hnx0QtvQEt44SSbX4rQL4qoU_uTBfHFhBIAE6zXC0sEm_4zRcsfkLjOIYbTYpQ',
       tech:        'https://lh3.googleusercontent.com/aida-public/AB6AXuAVJTxhXNa2pTDPNZjL8obeuQf6SI2HNacFUsEN7HYaL429xABgQnsIusEYaB3TE8mlErwVJSoiD47RPfdQK2H0jcGhKhjewkBCtkxaDWrGCkfl2tKggboOQFpMiI9YV6DTYHTbMPDXa3O5eb1AapvdTbG4CdfdTkyx0M_ZNuRn8AZSeBrqak3HIpyUzgR2QJIjG4JhfNucXZtS2aofh8zmFsf1KIjtSNzLQPhf6MNlsml28n01OzHESQ'
     };
   
     const els = {
       title:            document.getElementById('eventTitle'),
       category:         document.getElementById('eventCategory'),
       description:      document.getElementById('eventDescription'),
       date:             document.getElementById('eventDate'),
       startTime:        document.getElementById('eventStartTime'),
       endTime:          document.getElementById('eventEndTime'),
       venueName:        document.getElementById('venueName'),
       venueAddress:     document.getElementById('venueAddress'),
       capacitySlider:   document.getElementById('capacitySlider'),
       capacityNumber:   document.getElementById('capacityNumber'),
       ticketPrice:      document.getElementById('ticketPrice'),
       netRevenue:       document.getElementById('netRevenueDisplay'),
       titleCounter:     document.getElementById('titleCounter'),
       waitlist:         document.getElementById('waitlistCheck'),
       btnFree:          document.getElementById('btnPricingFree'),
       btnPaid:          document.getElementById('btnPricingPaid'),
       limitMinus:       document.getElementById('btnMinusLimit'),
       limitPlus:        document.getElementById('btnPlusLimit'),
       limitVal:         document.getElementById('ticketLimitVal'),
       form:             document.getElementById('eventForm'),
       saveDraftBtn:     document.getElementById('saveDraftBtn'),
       publishBtn:       document.getElementById('publishBtn'),
       previewTitle:     document.getElementById('previewTitle'),
       previewCategory:  document.getElementById('previewCategoryBadge'),
       previewDesc:      document.getElementById('previewDesc'),
       previewDate:      document.getElementById('previewDateStr'),
       previewVenue:     document.getElementById('previewVenueStr'),
       previewPrice:     document.getElementById('previewPriceBadge'),
       previewCapacity:  document.getElementById('previewCapacityLabel'),
       previewCapacityBar: document.getElementById('previewCapacityBar'),
       previewImage:     document.getElementById('previewImage'),
       previewMapLabel:  document.getElementById('previewMapLabel'),
       previewOrgName:   document.getElementById('previewOrganizerName'),
       previewOrgAvatar: document.getElementById('previewOrganizerAvatar'),
       statusLabel:      document.getElementById('statusLabel'),
       checklistProgress:document.getElementById('checklistProgress'),
       checklist:        document.getElementById('checklist'),
       toast:            document.getElementById('toastNotification'),
       toastIcon:        document.getElementById('toastIcon'),
       toastMsg:         document.getElementById('toastMsg')
     };
   
     let autosaveTimer = null;
     let isPublishing = false;
   
     // ---------- Helpers ----------
     function getCategory() {
       const raw = els.category ? els.category.value : 'Concierto';
       return CATEGORY_MAP[raw] || CATEGORY_MAP['Otro'];
     }
   
     function selectedTags() {
       const pills = document.querySelectorAll('#tagContainer .tag-pill.bg-primary');
       return Array.from(pills).map((p) => p.textContent.trim().replace(/^#/, ''));
     }
   
     function selectedSpaceType() {
       const active = document.querySelector('#spaceTypeGroup .space-type-btn.bg-primary');
       return active ? active.getAttribute('data-type') : 'Al aire libre';
     }
   
     function isFreePricing() {
       return els.btnFree && els.btnFree.classList.contains('bg-surface-container-lowest');
     }
   
     function formatCOP(amount) {
       return '$ ' + Math.round(Number(amount) || 0).toLocaleString('es-CO') + ' COP';
     }
   
     function parseDateTime(dateStr, timeStr) {
       if (!dateStr || !timeStr) return null;
       return dateStr + 'T' + timeStr + ':00-05:00';
     }
   
     function computeDuration(startStr, endStr) {
       if (!startStr || !endStr) return null;
       const [sh, sm] = startStr.split(':').map(Number);
       const [eh, em] = endStr.split(':').map(Number);
       if ([sh, sm, eh, em].some((n) => !Number.isFinite(n))) return null;
       let mins = (eh * 60 + em) - (sh * 60 + sm);
       if (mins <= 0) mins += 24 * 60;
       return mins;
     }
   
     function showNotification(message, icon) {
       if (!els.toast || !els.toastMsg) return;
       els.toastMsg.textContent = message;
       if (els.toastIcon && icon) els.toastIcon.textContent = icon;
       els.toast.classList.remove('translate-y-32', 'opacity-0');
       els.toast.classList.add('translate-y-0', 'opacity-100');
       window.setTimeout(() => {
         els.toast.classList.add('translate-y-32', 'opacity-0');
         els.toast.classList.remove('translate-y-0', 'opacity-100');
       }, 3200);
     }
   
     // ---------- Cálculos y preview ----------
     function updateCalculations() {
       const cap = parseInt(els.capacityNumber.value, 10) || 0;
       const price = parseFloat(els.ticketPrice.value) || 0;
       const net = cap * price * 0.94;
   
       if (els.netRevenue) els.netRevenue.textContent = formatCOP(net);
   
       if (els.previewPrice) {
         if (price <= 0) {
           els.previewPrice.textContent = 'Gratis';
           els.previewPrice.className = 'px-3 py-1 rounded-full bg-emerald-600 text-white font-headline-sm shadow-md';
         } else {
           els.previewPrice.textContent = '$ ' + Math.round(price).toLocaleString('es-CO') + ' COP';
           els.previewPrice.className = 'px-3.5 py-1 rounded-full bg-primary text-on-primary font-headline-sm shadow-md';
         }
       }
       if (els.previewCapacity) els.previewCapacity.textContent = cap + ' plazas libres';
       if (els.previewCapacityBar) {
         const pct = Math.min(100, Math.max(4, (cap / 150) * 100));
         els.previewCapacityBar.style.width = pct + '%';
       }
     }
   
     function updateTitlePreview() {
       const v = els.title.value;
       if (els.titleCounter) els.titleCounter.textContent = v.length + '/80';
       if (els.previewTitle) els.previewTitle.textContent = v.trim() || 'Título de tu evento';
     }
   
     function updateCategoryPreview() {
       const cat = getCategory();
       if (els.previewCategory) {
         els.previewCategory.innerHTML =
           '<span class="w-1.5 h-1.5 rounded-full bg-primary"></span> ' + cat.label;
       }
       if (els.previewImage) els.previewImage.src = DEFAULT_HERO[cat.key] || DEFAULT_HERO.musica;
     }
   
     function updateDescPreview() {
       if (!els.previewDesc) return;
       els.previewDesc.textContent =
         els.description.value.trim() || 'La descripción de tu evento aparecerá aquí.';
     }
   
     function updateDatePreview() {
       if (!els.date.value || !els.previewDate) return;
       const dateObj = new Date(els.date.value + 'T12:00:00');
       const days   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
       const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
       const dayName = days[dateObj.getDay()] || 'Fecha';
       const dayNum  = dateObj.getDate();
       const monthName = months[dateObj.getMonth()] || '';
       els.previewDate.textContent = dayName + ', ' + dayNum + ' ' + monthName + ' • ' + (els.startTime.value || '20:00');
     }
   
     function updateVenuePreview() {
       const vName = els.venueName.value.trim() || 'Lugar por definir';
       const vAddr = els.venueAddress.value.trim();
       if (els.previewVenue) els.previewVenue.textContent = vName + ' • Quindío';
       if (els.previewMapLabel) els.previewMapLabel.textContent = vAddr || (vName + ', Quindío');
     }
   
     function updateOrganizerPreview() {
       const user = auth.getCurrentUser();
       if (!user) return;
       if (els.previewOrgName)   els.previewOrgName.textContent = user.name + ' (Organizador)';
       if (els.previewOrgAvatar) els.previewOrgAvatar.textContent = user.name.trim().charAt(0).toUpperCase();
     }
   
     function updateChecklist() {
       const items = [
         { ok: !!els.title.value.trim(), text: 'Título y narrativa atractiva' },
         { ok: !!els.date.value && !!els.startTime.value, text: 'Fecha y hora de inicio definidas' },
         { ok: !!els.venueName.value.trim(), text: 'Ubicación del evento' },
         { ok: (parseInt(els.capacityNumber.value, 10) || 0) >= 5, text: 'Aforo calibrado (mínimo 5)' },
         { ok: !isFreePricing() ? (parseFloat(els.ticketPrice.value) > 0) : true, text: 'Precio configurado' }
       ];
       const done = items.filter((i) => i.ok).length;
       const pct = Math.round((done / items.length) * 100);
   
       if (els.checklistProgress) els.checklistProgress.textContent = pct + '% Listo';
   
       if (els.checklist) {
         els.checklist.innerHTML = '';
         items.forEach((item) => {
           const row = document.createElement('div');
           row.className = 'flex items-center gap-2 text-on-surface-variant font-body-sm';
           const icon = document.createElement('span');
           icon.className = 'material-symbols-outlined text-sm ' + (item.ok ? 'text-emerald-600' : 'text-outline');
           icon.textContent = item.ok ? 'check_circle' : 'radio_button_unchecked';
           const txt = document.createElement('span');
           txt.textContent = item.text;
           row.appendChild(icon);
           row.appendChild(txt);
           els.checklist.appendChild(row);
         });
       }
     }
   
     // ---------- Borrador ----------
     function collectDraft() {
       return {
         title:        els.title.value,
         category:     els.category.value,
         description:  els.description.value,
         date:         els.date.value,
         startTime:    els.startTime.value,
         endTime:      els.endTime.value,
         venueName:    els.venueName.value,
         venueAddress: els.venueAddress.value,
         capacity:     els.capacityNumber.value,
         ticketPrice:  els.ticketPrice.value,
         isFree:       isFreePricing(),
         ticketLimit:  els.limitVal.textContent,
         waitlist:     els.waitlist.checked,
         spaceType:    selectedSpaceType(),
         tags:         selectedTags()
       };
     }
   
     function applyDraft(d) {
       if (!d) return;
       if (d.title)        els.title.value        = d.title;
       if (d.category)     els.category.value     = d.category;
       if (d.description)  els.description.value  = d.description;
       if (d.date)         els.date.value         = d.date;
       if (d.startTime)    els.startTime.value    = d.startTime;
       if (d.endTime)      els.endTime.value      = d.endTime;
       if (d.venueName)    els.venueName.value    = d.venueName;
       if (d.venueAddress) els.venueAddress.value = d.venueAddress;
       if (d.capacity)     els.capacityNumber.value = d.capacity;
       if (d.ticketPrice !== undefined && !d.isFree) els.ticketPrice.value = d.ticketPrice;
       if (d.ticketLimit)  els.limitVal.textContent = d.ticketLimit;
       if (d.waitlist !== undefined) els.waitlist.checked = !!d.waitlist;
   
       if (els.capacitySlider && els.capacityNumber.value) {
         els.capacitySlider.value = els.capacityNumber.value;
       }
   
       setPricingMode(d.isFree ? 'free' : 'paid');
   
       if (Array.isArray(d.tags)) {
         document.querySelectorAll('#tagContainer .tag-pill').forEach((pill) => {
           const tag = pill.textContent.trim().replace(/^#/, '');
           setPillState(pill, d.tags.includes(tag));
         });
       }
       if (d.spaceType) {
         document.querySelectorAll('#spaceTypeGroup .space-type-btn').forEach((btn) => {
           setSpaceBtnState(btn, btn.getAttribute('data-type') === d.spaceType);
         });
       }
     }
   
     function saveDraft(silent) {
       try {
         localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
         if (els.statusLabel) els.statusLabel.textContent = 'Borrador guardado';
         if (!silent) showNotification('Borrador guardado.', 'draft');
       } catch (e) { console.warn('[new-event] draft:', e); }
     }
   
     function loadDraft() {
       try {
         const raw = localStorage.getItem(DRAFT_KEY);
         return raw ? JSON.parse(raw) : null;
       } catch { return null; }
     }
   
     function clearDraft() {
       try { localStorage.removeItem(DRAFT_KEY); } catch {}
     }
   
     function scheduleAutosave() {
       if (autosaveTimer) window.clearTimeout(autosaveTimer);
       if (els.statusLabel) els.statusLabel.textContent = 'Guardando...';
       autosaveTimer = window.setTimeout(() => saveDraft(true), AUTOSAVE_MS);
     }
   
     // ---------- Pricing / espacio / pills ----------
     const PRICING_ACTIVE_CLASSES   = ['py-3','px-4','rounded-xl','font-label-lg','bg-surface-container-lowest','text-primary','shadow-sm','transition-all'];
     const PRICING_INACTIVE_CLASSES = ['py-3','px-4','rounded-xl','font-label-lg','transition-all','text-on-surface-variant','hover:text-on-surface'];
   
     function setPricingMode(mode) {
       if (mode === 'free') {
         els.ticketPrice.value = '0';
         els.ticketPrice.disabled = true;
         els.btnFree.className = PRICING_ACTIVE_CLASSES.join(' ');
         els.btnPaid.className = PRICING_INACTIVE_CLASSES.join(' ');
       } else {
         els.ticketPrice.disabled = false;
         if (parseFloat(els.ticketPrice.value) === 0) els.ticketPrice.value = '';
         els.btnPaid.className = PRICING_ACTIVE_CLASSES.join(' ');
         els.btnFree.className = PRICING_INACTIVE_CLASSES.join(' ');
       }
       updateCalculations();
     }
   
     if (els.btnFree && els.btnPaid && els.ticketPrice) {
       els.btnFree.addEventListener('click', () => { setPricingMode('free'); scheduleAutosave(); });
       els.btnPaid.addEventListener('click', () => { setPricingMode('paid'); scheduleAutosave(); });
     }
   
     const SPACE_ACTIVE   = 'space-type-btn flex flex-col items-center justify-center p-3 rounded-2xl bg-primary text-on-primary shadow-sm transition-all text-center';
     const SPACE_INACTIVE = 'space-type-btn flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-all text-center';
   
     function setSpaceBtnState(btn, active) {
       btn.className = active ? SPACE_ACTIVE : SPACE_INACTIVE;
     }
   
     document.querySelectorAll('#spaceTypeGroup .space-type-btn').forEach((btn) => {
       btn.addEventListener('click', () => {
         document.querySelectorAll('#spaceTypeGroup .space-type-btn').forEach((b) => setSpaceBtnState(b, false));
         setSpaceBtnState(btn, true);
         scheduleAutosave();
       });
     });
   
     const PILL_ACTIVE   = 'tag-pill px-3 py-1.5 rounded-full text-label-sm font-label-sm bg-primary text-on-primary transition-all';
     const PILL_INACTIVE = 'tag-pill px-3 py-1.5 rounded-full text-label-sm font-label-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all';
   
     function setPillState(pill, active) {
       pill.className = active ? PILL_ACTIVE : PILL_INACTIVE;
     }
   
     document.querySelectorAll('#tagContainer .tag-pill').forEach((pill) => {
       pill.addEventListener('click', () => {
         const wasOn = pill.classList.contains('bg-primary');
         setPillState(pill, !wasOn);
         scheduleAutosave();
       });
     });
   
     // ---------- Stepper de límite ----------
     if (els.limitMinus && els.limitPlus && els.limitVal) {
       els.limitMinus.addEventListener('click', () => {
         const v = parseInt(els.limitVal.textContent, 10) || 1;
         if (v > 1) { els.limitVal.textContent = v - 1; scheduleAutosave(); }
       });
       els.limitPlus.addEventListener('click', () => {
         const v = parseInt(els.limitVal.textContent, 10) || 1;
         if (v < 10) { els.limitVal.textContent = v + 1; scheduleAutosave(); }
       });
     }
   
     // ---------- Capacidad ----------
     if (els.capacitySlider && els.capacityNumber) {
       els.capacitySlider.addEventListener('input', (e) => {
         els.capacityNumber.value = e.target.value;
         updateCalculations(); updateChecklist(); scheduleAutosave();
       });
       els.capacityNumber.addEventListener('input', (e) => {
         els.capacitySlider.value = e.target.value;
         updateCalculations(); updateChecklist(); scheduleAutosave();
       });
     }
   
     // ---------- Bind inputs ----------
     function bindInput(el, fn) {
       if (!el) return;
       el.addEventListener('input', () => { fn(); updateChecklist(); scheduleAutosave(); });
       el.addEventListener('change', () => { fn(); updateChecklist(); scheduleAutosave(); });
     }
   
     bindInput(els.title,       updateTitlePreview);
     bindInput(els.category,    updateCategoryPreview);
     bindInput(els.description, updateDescPreview);
     bindInput(els.date,        updateDatePreview);
     bindInput(els.startTime,   updateDatePreview);
     bindInput(els.endTime,     () => {});
     bindInput(els.venueName,   updateVenuePreview);
     bindInput(els.venueAddress,updateVenuePreview);
     bindInput(els.ticketPrice, updateCalculations);
     bindInput(els.waitlist,    () => {});
   
     // ---------- Validación y armado ----------
     function validateForm() {
       const missing = [];
       if (!els.title.value.trim())      missing.push('Título');
       if (!els.date.value)              missing.push('Fecha');
       if (!els.startTime.value)         missing.push('Hora de inicio');
       if (!els.venueName.value.trim())  missing.push('Nombre del lugar');
       const cap = parseInt(els.capacityNumber.value, 10) || 0;
       if (cap < 5) missing.push('Aforo (mínimo 5)');
       const pricingFree = isFreePricing();
       const price = parseFloat(els.ticketPrice.value) || 0;
       if (!pricingFree && price <= 0) missing.push('Precio o marcar "Entrada Gratuita"');
       return missing;
     }
   
     function buildEventFromForm() {
       const cat        = getCategory();
       const cap        = parseInt(els.capacityNumber.value, 10) || 0;
       const price      = parseFloat(els.ticketPrice.value) || 0;
       const limit      = parseInt(els.limitVal.textContent, 10) || 4;
       const isFree     = isFreePricing();
       const user       = auth.getCurrentUser();
       const durationMin= computeDuration(els.startTime.value, els.endTime.value);
   
       const descText = els.description.value.trim();
       const description = descText
         ? descText.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
         : [];
   
       const tags = selectedTags();
       const highlights = tags.map((t) => ({ icon: 'local_offer', text: t }));
       highlights.push({ icon: 'deck', text: selectedSpaceType() });
   
       return {
         title:           els.title.value.trim(),
         category:        cat.key,
         date:            parseDateTime(els.date.value, els.startTime.value),
         durationMinutes: durationMin,
         location:        els.venueName.value.trim(),
         address:         els.venueAddress.value.trim() || (els.venueName.value.trim() + ', Quindío'),
         mapLabel:        els.venueName.value.trim(),
         heroImage:       DEFAULT_HERO[cat.key] || DEFAULT_HERO.musica,
         gallery:         [],
         currency:        'COP',
         unitPrice:       isFree ? 0 : price,
         spotsTotal:      cap,
         spotsLeft:       cap,
         maxPerOrder:     limit,
         description:     description,
         highlights:      highlights,
         agenda:          [],
         faqs:            [],
         transport:       '',
         parking:         '',
         waitlist:        els.waitlist.checked,
         tags:            tags
       };
     }
   
     // ---------- Publicar (async) ----------
     async function handlePublish() {
       if (isPublishing) return;
   
       if (!auth.isLoggedIn()) {
         const ret = window.location.pathname + window.location.search;
         window.location.href = '../login/?return=' + encodeURIComponent(ret);
         return;
       }
   
       const missing = validateForm();
       if (missing.length) {
         showNotification('Completa: ' + missing.join(', '), 'error');
         return;
       }
   
       isPublishing = true;
       els.publishBtn.disabled = true;
       els.publishBtn.classList.add('opacity-60', 'cursor-not-allowed');
       if (els.statusLabel) els.statusLabel.textContent = 'Publicando...';
   
       let created;
       try {
         created = await eventsStore.create(buildEventFromForm());
       } catch (e) {
         console.error('[new-event] create:', e);
         showNotification('No se pudo publicar: ' + (e.message || 'error'), 'error');
         isPublishing = false;
         els.publishBtn.disabled = false;
         els.publishBtn.classList.remove('opacity-60', 'cursor-not-allowed');
         if (els.statusLabel) els.statusLabel.textContent = 'Error al publicar';
         return;
       }
   
       clearDraft();
       if (els.statusLabel) els.statusLabel.textContent = 'Publicado ✓';
       showNotification('¡Tu evento "' + created.title + '" ya está publicado!', 'check_circle');
   
       window.setTimeout(() => {
         window.location.href = '../event-detail/?id=' + encodeURIComponent(created.id);
       }, 1300);
     }
   
     if (els.publishBtn) els.publishBtn.addEventListener('click', handlePublish);
     if (els.form) {
       els.form.addEventListener('submit', (e) => {
         e.preventDefault();
         handlePublish();
       });
     }
     if (els.saveDraftBtn) {
       els.saveDraftBtn.addEventListener('click', () => saveDraft(false));
     }
   
     // ---------- Defaults + draft ----------
     if (els.capacityNumber && !els.capacityNumber.value) {
       els.capacityNumber.value = 30;
       if (els.capacitySlider) els.capacitySlider.value = 30;
     }
     if (els.ticketPrice && !els.ticketPrice.value) {
       els.ticketPrice.value = 75000;
     }
   
     const draft = loadDraft();
     if (draft) {
       applyDraft(draft);
       if (els.statusLabel) els.statusLabel.textContent = 'Borrador restaurado';
     }
   
     updateTitlePreview();
     updateCategoryPreview();
     updateDescPreview();
     updateDatePreview();
     updateVenuePreview();
     updateOrganizerPreview();
     updateCalculations();
     updateChecklist();
   
     auth.on(() => {
       updateOrganizerPreview();
       if (!auth.isLoggedIn()) {
         const ret = window.location.pathname + window.location.search;
         window.location.replace('../login/?return=' + encodeURIComponent(ret));
       }
     });
   })();