/* ============================================================
   MyEvent Tech — Store de eventos.
   API única para leer/crear/actualizar/eliminar.
   Hoy persiste en localStorage + seed.
   Mañana: solo cambias `storage` por fetch() y ya.
   ============================================================ */
   (function () {
    'use strict';
  
    const LS_KEY = 'myevent.events.v1';
    const SEED   = window.MYEVENT_SEED || [];
    const listeners = new Set();
  
    // ---------- Adaptador de persistencia (reemplazable por API real) ----------
    const storage = {
      read() {
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : null;
        } catch { return null; }
      },
      write(list) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
        catch (e) { console.warn('[events-store] no se pudo persistir:', e); }
      }
    };
  
    // ---------- Estado en memoria ----------
    let events = (function bootstrap() {
      const stored = storage.read();
      if (stored && stored.length) return stored;
      storage.write(SEED);
      return SEED.slice();
    })();
  
    // ---------- Utilidades ----------
    const slugify = (s) =>
      String(s).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
    const nowISO = () => new Date().toISOString();
  
    function toArray(v) {
      if (v == null) return [];
      return Array.isArray(v) ? v.filter(Boolean) : [v];
    }
  
    function emit() {
      listeners.forEach((fn) => { try { fn(events); } catch (e) { console.error(e); } });
    }
  
    function persist() { storage.write(events); emit(); }
  
    function normalize(input) {
      const e = Object.assign({}, input);
  
      if (!e.id) {
        const base = slugify(e.title || 'evento');
        let candidate = base, i = 2;
        while (events.some((x) => x.id === candidate)) candidate = base + '-' + (i++);
        e.id = candidate;
      }
  
      e.currency        = e.currency || 'COP';
      e.unitPrice       = Number(e.unitPrice) || 0;
      e.spotsTotal      = Number.isFinite(e.spotsTotal) ? e.spotsTotal : null;
      e.spotsLeft       = Number.isFinite(e.spotsLeft) ? e.spotsLeft : e.spotsTotal;
      e.maxPerOrder     = Number(e.maxPerOrder) || 10;
      e.durationMinutes = Number(e.durationMinutes) || null;
      e.description     = toArray(e.description);
      e.highlights      = toArray(e.highlights);
      e.gallery         = toArray(e.gallery);
      e.agenda          = toArray(e.agenda);
      e.faqs            = toArray(e.faqs);
      e.organizer       = typeof e.organizer === 'string'
                            ? { name: e.organizer, verified: true }
                            : (e.organizer || { name: 'MyEvent Tech', verified: true });
  
      e.createdAt = e.createdAt || nowISO();
      e.updatedAt = nowISO();
      return e;
    }
  
    // ---------- API pública ----------
    const store = {
      getAll() {
        return events.slice().sort((a, b) => {
          const ta = a.date ? Date.parse(a.date) : Infinity;
          const tb = b.date ? Date.parse(b.date) : Infinity;
          return ta - tb;
        });
      },
  
      getById(id) {
        if (!id) return null;
        return events.find((e) => e.id === id) || null;
      },
  
      create(input) {
        const e = normalize(input);
        events.push(e);
        persist();
        return e;
      },
  
      update(id, patch) {
        const i = events.findIndex((e) => e.id === id);
        if (i < 0) return null;
        events[i] = normalize(Object.assign({}, events[i], patch, { id }));
        persist();
        return events[i];
      },
  
      remove(id) {
        const before = events.length;
        events = events.filter((e) => e.id !== id);
        if (events.length !== before) persist();
        return events.length !== before;
      },
  
      replaceAll(list) {
        events = toArray(list).map(normalize);
        persist();
        return store.getAll();
      },
  
      on(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
  
      _raw() { return events.slice(); }
    };
  
    window.eventsStore = store;
  
    // ---------- Helper de URL: extrae ?id= / ?event= / #id= / #/slug ----------
    window.getEventIdFromUrl = function () {
      const search = window.location.search || '';
      const hash   = window.location.hash   || '';
  
      const sp = new URLSearchParams(search.replace(/^\?/, ''));
      let id = sp.get('id') || sp.get('event');
      if (id) return id;
  
      const hp = new URLSearchParams(hash.replace(/^#\??/, '').replace(/^\//, ''));
      id = hp.get('id') || hp.get('event');
      if (id) return id;
  
      const m = hash.match(/^#\/?([a-z0-9-]+)/i);
      return m ? m[1] : null;
    };
  })();