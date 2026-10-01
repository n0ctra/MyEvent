/* ============================================================
   MyEvent Tech — Auth store.
   Sesión + usuarios mock en localStorage.
   API: signIn, signUp, signOut, getCurrentUser, isLoggedIn,
        on, requireAuth, mountAuthNav.
   ============================================================ */
   (function () {
    'use strict';
  
    const USERS_KEY   = 'myevent.users.v1';
    const SESSION_KEY = 'myevent.session.v1';
  
    // Cuenta demo
    const SEED_USERS = [
      {
        id: 'u_demo',
        name: 'Camila Restrepo',
        email: 'demo@myevent.tech',
        password: 'demo1234',
        role: 'attendee',
        preferences: { acceptTerms: true, acceptMarketing: true },
        createdAt: '2025-09-01T00:00:00Z'
      }
    ];
  
    const listeners = new Set();
  
    const storage = {
      read(key) {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
        catch { return null; }
      },
      write(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); }
        catch (e) { console.warn('[auth] persist falló:', e); }
      },
      remove(key) {
        try { localStorage.removeItem(key); } catch {}
      }
    };
  
    let users = (function bootstrap() {
      const stored = storage.read(USERS_KEY);
      if (Array.isArray(stored) && stored.length) return stored;
      storage.write(USERS_KEY, SEED_USERS);
      return SEED_USERS.slice();
    })();
  
    let session = storage.read(SESSION_KEY); // { userId, createdAt }
  
    function emit() {
      listeners.forEach((fn) => { try { fn(session); } catch (e) { console.error(e); } });
    }
    function persistUsers() { storage.write(USERS_KEY, users); }
    function persistSession() {
      if (session) storage.write(SESSION_KEY, session);
      else storage.remove(SESSION_KEY);
      emit();
    }
    function normalizeEmail(e) { return String(e || '').trim().toLowerCase(); }
    function publicUser(u) {
      if (!u) return null;
      const { password, ...rest } = u;
      return rest;
    }
  
    const auth = {
      getCurrentUser() {
        if (!session) return null;
        const u = users.find((x) => x.id === session.userId);
        return u ? publicUser(u) : null;
      },
      isLoggedIn() { return !!auth.getCurrentUser(); },
  
      signIn({ email, password }) {
        const em = normalizeEmail(email);
        const u = users.find((x) => x.email === em);
        if (!u) return { ok: false, error: 'No existe una cuenta con ese correo.' };
        if (u.password !== password) return { ok: false, error: 'Contraseña incorrecta.' };
        session = { userId: u.id, createdAt: new Date().toISOString() };
        persistSession();
        return { ok: true, user: publicUser(u) };
      },
  
      /**
       * Crea una cuenta nueva y deja la sesión iniciada.
       * @param {{
       *   name: string,
       *   email: string,
       *   password: string,
       *   role?: 'attendee' | 'organizer',
       *   acceptTerms?: boolean,
       *   acceptMarketing?: boolean
       * }} payload
       */
      signUp(payload) {
        const p = payload || {};
        const name = String(p.name || '').trim();
        const em   = normalizeEmail(p.email);
        const pwd  = String(p.password || '');
        const role = (p.role === 'organizer') ? 'organizer' : 'attendee';
  
        if (!name) return { ok: false, error: 'Ingresa tu nombre completo.' };
        if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
          return { ok: false, error: 'Correo electrónico inválido.' };
        }
        if (pwd.length < 8) {
          return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
        }
        if (users.some((x) => x.email === em)) {
          return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
        }
  
        const u = {
          id: 'u_' + Math.random().toString(36).slice(2, 10),
          name,
          email: em,
          password: pwd,
          role,
          preferences: {
            acceptTerms: !!p.acceptTerms,
            acceptMarketing: !!p.acceptMarketing
          },
          createdAt: new Date().toISOString()
        };
        users.push(u);
        persistUsers();
  
        session = { userId: u.id, createdAt: new Date().toISOString() };
        persistSession();
        return { ok: true, user: publicUser(u) };
      },
  
      signOut() {
        session = null;
        persistSession();
      },
  
      on(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
  
      /**
       * Si hay sesión → true.
       * Si no → redirige a loginPath?return=<url actual> y devuelve false.
       */
      requireAuth(loginPath, returnUrl) {
        if (auth.isLoggedIn()) return true;
        const ret = returnUrl || (window.location.pathname + window.location.search + window.location.hash);
        const sep = loginPath.includes('?') ? '&' : '?';
        window.location.href = loginPath + sep + 'return=' + encodeURIComponent(ret);
        return false;
      },
  
      /**
       * Rellena un contenedor con botones de sesión.
       */
      mountAuthNav(slotId, opts) {
        const slot = document.getElementById(slotId);
        if (!slot) return;
        const loginPath = (opts && opts.loginPath) || 'pages/login/';
        const registerPath = (opts && opts.registerPath) || (loginPath + '?tab=signup');
  
        function render() {
          slot.innerHTML = '';
          const user = auth.getCurrentUser();
  
          if (user) {
            const hi = document.createElement('span');
            hi.className = 'hidden sm:inline text-label-md text-on-surface-variant';
            hi.textContent = 'Hola, ' + user.name.split(' ')[0];
            slot.appendChild(hi);
  
            const out = document.createElement('button');
            out.type = 'button';
            out.className = 'inline-flex items-center justify-center px-4 py-2 font-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all';
            out.textContent = 'Cerrar sesión';
            out.addEventListener('click', () => auth.signOut());
            slot.appendChild(out);
          } else {
            const login = document.createElement('a');
            login.className = 'inline-flex items-center justify-center px-4 py-2 font-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all';
            login.href = loginPath;
            login.textContent = 'Iniciar sesión';
            slot.appendChild(login);
  
            const reg = document.createElement('a');
            reg.className = 'inline-flex items-center justify-center px-4 py-2 font-label-lg text-on-primary bg-primary hover:bg-primary-container rounded-full transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.28)] active:scale-95';
            reg.href = registerPath;
            reg.textContent = 'Registrarse';
            slot.appendChild(reg);
          }
        }
  
        auth.on(render);
        render();
      }
    };
  
    window.auth = auth;
  })();