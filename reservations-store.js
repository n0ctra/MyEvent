/* ============================================================
   MyEvent Tech — Store de reservas.
   Persistencia por usuario. Snapshot de datos del evento al momento
   de reservar (para que si el evento cambia, la reserva siga correcta).
   API: getAll, getById, getByUser, create, cancel, on.
   ============================================================ */
   (function () {
    'use strict';
  
    const KEY = 'myevent.reservations.v1';
    const listeners = new Set();
  
    let reservations = (function bootstrap() {
      try {
        const raw = localStorage.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    })();
  
    function persist() {
      try { localStorage.setItem(KEY, JSON.stringify(reservations)); }
      catch (e) { console.warn('[reservations] persist falló:', e); }
      emit();
    }
  
    function emit() {
      listeners.forEach((fn) => { try { fn(reservations); } catch (e) { console.error(e); } });
    }
  
    function genId() {
      return 'res_' + Math.random().toString(36).slice(2, 10);
    }
  
    function genCode() {
      // Alfabeto sin caracteres ambiguos (0/O, 1/I/L)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let s = '';
      for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return 'MET-' + s;
    }
  
    const store = {
      /** Todas las reservas, ordenadas por fecha del evento descendente. */
      getAll() {
        return reservations.slice().sort((a, b) => {
          const ta = a.eventDate ? Date.parse(a.eventDate) : 0;
          const tb = b.eventDate ? Date.parse(b.eventDate) : 0;
          return tb - ta;
        });
      },
  
      getById(id) {
        if (!id) return null;
        return reservations.find((r) => r.id === id) || null;
      },
  
      /** Reservas del usuario actual, ordenadas por fecha de evento descendente. */
      getByUser(userId) {
        if (!userId) return [];
        return reservations
          .filter((r) => r.userId === userId)
          .sort((a, b) => {
            const ta = a.eventDate ? Date.parse(a.eventDate) : 0;
            const tb = b.eventDate ? Date.parse(b.eventDate) : 0;
            return tb - ta;
          });
      },
  
      /** Crea una reserva. Devuelve la reserva con id y code generados. */
      create(data) {
        const r = Object.assign({
          id: genId(),
          code: genCode(),
          status: 'confirmed',
          currency: 'COP',
          createdAt: new Date().toISOString()
        }, data);
        reservations.push(r);
        persist();
        return r;
      },
  
      /** Marca la reserva como cancelada. Devuelve la reserva o null. */
      cancel(id) {
        const i = reservations.findIndex((r) => r.id === id);
        if (i < 0) return null;
        reservations[i] = Object.assign({}, reservations[i], {
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        });
        persist();
        return reservations[i];
      },
  
      /** Reemplaza todo (útil para import/migración). */
      replaceAll(list) {
        reservations = Array.isArray(list) ? list.slice() : [];
        persist();
        return store.getAll();
      },
  
      on(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
  
      _raw() { return reservations.slice(); }
    };
  
    window.reservationsStore = store;
  })();