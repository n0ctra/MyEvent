/* ============================================================
   MyEvent Tech — Auth con Supabase.
   Incluye email/password + OAuth con Google.
   ============================================================ */

   import { supabase } from './supabase-client.js';

   const listeners = new Set();
   
   let currentProfile = null;
   let resolveReady;
   const authReadyPromise = new Promise((res) => { resolveReady = res; });
   
   // ---------- Helpers ----------
   function emit() {
     listeners.forEach((fn) => {
       try { fn(currentProfile); } catch (e) { console.error(e); }
     });
   }
   
   async function loadProfile(userId) {
     if (!userId) return null;
     const { data, error } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', userId)
       .single();
     if (error) {
       console.error('[auth] loadProfile:', error);
       return null;
     }
     return data;
   }
   
   function translateError(msg) {
     const map = {
       'Invalid login credentials': 'Correo o contraseña incorrectos.',
       'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión.',
       'User already registered': 'Ya existe una cuenta con ese correo.',
       'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
       'Unable to validate email address: invalid format': 'Correo electrónico inválido.',
       'Signup requires a valid password': 'Debes escribir una contraseña.',
       'User not found': 'No existe una cuenta con ese correo.'
     };
     return map[msg] || msg || 'Error desconocido.';
   }
   
   // ---------- Init: cargar sesión existente ----------
   (async function init() {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (session?.user) {
         currentProfile = await loadProfile(session.user.id);
       }
     } catch (e) {
       console.error('[auth] init:', e);
     } finally {
       emit();
       resolveReady();
     }
   })();
   
   // ---------- Suscripción a cambios de sesión ----------
   supabase.auth.onAuthStateChange(async (event, session) => {
     if (event === 'SIGNED_OUT' || !session) {
       currentProfile = null;
       emit();
       return;
     }
     if (
       event === 'SIGNED_IN' ||
       event === 'TOKEN_REFRESHED' ||
       event === 'USER_UPDATED'
     ) {
       currentProfile = await loadProfile(session.user.id);
       emit();
     }
   });
   
   // ---------- API pública ----------
   export const auth = {
     ready: authReadyPromise,
   
     getCurrentUser() {
       return currentProfile;
     },
   
     isLoggedIn() {
       return !!currentProfile;
     },
   
     async signIn({ email, password }) {
       const { data, error } = await supabase.auth.signInWithPassword({ email, password });
       if (error) return { ok: false, error: translateError(error.message) };
       currentProfile = await loadProfile(data.user.id);
       return { ok: true, user: currentProfile };
     },
   
     async signUp({ name, email, password, role, acceptTerms, acceptMarketing }) {
       const { data, error } = await supabase.auth.signUp({
         email,
         password,
         options: {
           data: {
             name: String(name || '').trim(),
             role: role === 'organizer' ? 'organizer' : 'attendee',
             accept_terms: !!acceptTerms,
             accept_marketing: !!acceptMarketing
           }
         }
       });
       if (error) return { ok: false, error: translateError(error.message) };
   
       if (!data.session) {
         return {
           ok: false,
           needsConfirmation: true,
           error: 'Revisa tu correo para confirmar la cuenta antes de iniciar sesión.'
         };
       }
   
       currentProfile = await loadProfile(data.user.id);
       return { ok: true, user: currentProfile };
     },
   
     /**
      * Inicia sesión con Google (OAuth).
      * Redirige al usuario a Google. Tras el consentimiento, Google devuelve
      * al usuario a `redirectTo` con la sesión ya creada por Supabase.
      * @param {string} redirectTo URL a la que volver después del login (por defecto: origen actual)
      */
     async signInWithGoogle(redirectTo) {
       const { data, error } = await supabase.auth.signInWithOAuth({
         provider: 'google',
         options: {
           redirectTo: redirectTo || window.location.origin,
           queryParams: {
             access_type: 'offline',
             prompt: 'consent'
           }
         }
       });
       if (error) {
         console.error('[auth] signInWithGoogle:', error);
         return { ok: false, error: 'No se pudo iniciar con Google.' };
       }
       // El navegador se redirige automáticamente; esta línea no se alcanza.
       return { ok: true, data };
     },
   
     async signOut() {
       await supabase.auth.signOut();
       currentProfile = null;
       emit();
     },
   
     on(fn) {
       listeners.add(fn);
       return () => listeners.delete(fn);
     },
   
     requireAuth(loginPath, returnUrl) {
       if (auth.isLoggedIn()) return true;
       const ret = returnUrl || (window.location.pathname + window.location.search + window.location.hash);
       const sep = loginPath.includes('?') ? '&' : '?';
       window.location.href = loginPath + sep + 'return=' + encodeURIComponent(ret);
       return false;
     },
   
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
           hi.textContent = 'Hola, ' + (user.name || '').split(' ')[0];
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
   
       auth.ready.then(render);
       auth.on(render);
     }
   };