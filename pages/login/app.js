/* ============================================================
   MyEvent Tech — Página de login / registro (modo signin).
   Incluye: Google OAuth + email/password.
   ============================================================ */

   import { auth } from '../../auth-store.js';

   (async function () {
     'use strict';
   
     await auth.ready;
   
     if (!auth) {
       console.warn('[login] auth-store no está cargado.');
       return;
     }
   
     const els = {
       form:         document.getElementById('login-form'),
       email:        document.getElementById('email-field'),
       emailValid:   document.getElementById('email-valid-icon'),
       password:     document.getElementById('password-field'),
       toggleBtn:    document.getElementById('toggle-pwd-btn'),
       toggleIcon:   document.getElementById('toggle-pwd-icon'),
       nameField:    document.getElementById('field-name'),
       nameInput:    document.getElementById('name-field'),
       submitText:   document.getElementById('submit-cta-text'),
       error:        document.getElementById('auth-error'),
       errorText:    document.getElementById('auth-error-text'),
       eyebrow:      document.getElementById('eyebrow-text'),
       title:        document.getElementById('auth-title'),
       subtitle:     document.getElementById('auth-subtitle'),
       altPrompt:    document.getElementById('alt-prompt'),
       altAction:    document.getElementById('alt-action'),
       remember:     document.getElementById('remember-me'),
       googleBtn:    document.getElementById('google-login-btn')
     };
   
     let mode = 'signin';
     let busy = false;
   
     // ---------- Return URL ----------
     function getReturnUrl() {
       const params = new URLSearchParams(window.location.search);
       const ret = params.get('return');
       if (!ret) return '../../';
       if (/^https?:\/\//i.test(ret) || ret.startsWith('//')) return '../../';
       return ret;
     }
   
     // ---------- Errores ----------
     function showError(msg) {
       if (!els.error || !els.errorText) return;
       els.errorText.textContent = msg;
       els.error.classList.remove('hidden');
       els.error.classList.add('flex');
     }
     function clearError() {
       if (!els.error) return;
       els.error.classList.add('hidden');
       els.error.classList.remove('flex');
     }
   
     // ---------- Modo signin / signup ----------
     function setMode(next) {
       mode = next;
       clearError();
       const isSignup = mode === 'signup';
   
       if (els.nameField) els.nameField.classList.toggle('hidden', !isSignup);
       if (els.nameInput) els.nameInput.required = isSignup;
       if (els.password)  els.password.autocomplete = isSignup ? 'new-password' : 'current-password';
   
       if (els.eyebrow)  els.eyebrow.textContent  = isSignup ? 'Crea tu cuenta' : 'Acceso a tu cuenta';
       if (els.title) {
         els.title.innerHTML = isSignup
           ? 'Únete a <span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">MyEvent Tech</span>'
           : 'Inicia sesión en <span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">MyEvent Tech</span>';
       }
       if (els.subtitle) {
         els.subtitle.textContent = isSignup
           ? 'Crea tu cuenta gratis para reservar experiencias, gestionar tus entradas y recibir avisos de cupos liberados.'
           : 'Accede a tus entradas en Wallet, sincroniza tus reservas en el Eje Cafetero y gestiona tus eventos en un solo lugar.';
       }
       if (els.submitText) els.submitText.textContent = isSignup ? 'Crear mi cuenta' : 'Entrar a MyEvent';
       if (els.altPrompt)  els.altPrompt.textContent  = isSignup ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?';
       if (els.altAction)  els.altAction.textContent  = isSignup ? 'Inicia sesión' : 'Regístrate gratis';
     }
   
     if (els.altAction) {
       els.altAction.addEventListener('click', () => {
         setMode(mode === 'signin' ? 'signup' : 'signin');
       });
     }
   
     // ---------- Password toggle ----------
     if (els.toggleBtn && els.password && els.toggleIcon) {
       els.toggleBtn.addEventListener('click', () => {
         const isHidden = els.password.type === 'password';
         els.password.type = isHidden ? 'text' : 'password';
         els.toggleIcon.textContent = isHidden ? 'visibility_off' : 'visibility';
         els.toggleBtn.setAttribute('aria-pressed', String(isHidden));
         els.toggleBtn.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
       });
     }
   
     // ---------- Email valid icon ----------
     if (els.email && els.emailValid) {
       els.email.addEventListener('input', () => {
         const ok = els.email.checkValidity() && els.email.value.trim() !== '';
         els.emailValid.classList.toggle('hidden', !ok);
       });
     }
   
     // ---------- Google OAuth ----------
     if (els.googleBtn) {
       els.googleBtn.addEventListener('click', async () => {
         clearError();
         els.googleBtn.disabled = true;
         els.googleBtn.classList.add('opacity-60', 'cursor-not-allowed');
   
         // Guardamos el destino final para retomarlo tras volver de Google
         sessionStorage.setItem('auth_return_url', getReturnUrl());
   
         const redirectBack = window.location.origin + '/pages/login/';
         const result = await auth.signInWithGoogle(redirectBack);
   
         if (!result.ok) {
           els.googleBtn.disabled = false;
           els.googleBtn.classList.remove('opacity-60', 'cursor-not-allowed');
           showError(result.error || 'No se pudo iniciar con Google.');
         }
         // Si ok: el navegador ya está redirigiendo a Google.
       });
     }
   
     // ---------- Submit email/password ----------
     if (els.form) {
       els.form.addEventListener('submit', async (e) => {
         e.preventDefault();
         if (busy) return;
         busy = true;
         clearError();
   
         const payload = {
           name:     els.nameInput ? els.nameInput.value : '',
           email:    els.email ? els.email.value : '',
           password: els.password ? els.password.value : ''
         };
   
         let result;
         if (mode === 'signup') {
           result = await auth.signUp({ ...payload, role: 'attendee' });
         } else {
           result = await auth.signIn(payload);
         }
   
         busy = false;
   
         if (!result.ok) {
           showError(result.error || 'No se pudo completar la operación.');
           return;
         }
   
         window.location.replace(getReturnUrl());
       });
     }
   
     // ---------- Init ----------
     const params = new URLSearchParams(window.location.search);
   
     // Detectar retorno de OAuth (Google redirige con #access_token=...)
     const hasOAuthHash =
       window.location.hash.includes('access_token') ||
       window.location.hash.includes('error_description');
   
     if (hasOAuthHash) {
       // El cliente Supabase procesa el hash; esperamos a que auth.ready resuelva
       // y luego redirigimos al return guardado.
       const savedReturn = sessionStorage.getItem('auth_return_url') || '../../';
       sessionStorage.removeItem('auth_return_url');
   
       // auth ya está listo (await arriba), comprobamos sesión
       if (auth.isLoggedIn()) {
         window.location.replace(savedReturn);
       } else {
         // Hash con error (usuario canceló o falló)
         showError('No se pudo completar el inicio con Google. Intenta de nuevo.');
         // Limpiar hash de la URL
         history.replaceState(null, '', window.location.pathname + window.location.search);
       }
       return;
     }
   
     // Si ya hay sesión, salta el formulario
     if (auth.isLoggedIn() && !params.get('force')) {
       window.location.replace(getReturnUrl());
       return;
     }
   
     setMode(params.get('tab') === 'signup' ? 'signup' : 'signin');
   })();