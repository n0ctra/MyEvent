/* ============================================================
   MyEvent Tech — Página de login / registro
   - Modo signin / signup (toggle in-page, conservando el diseño)
   - Password toggle
   - Indicador de email válido
   - Integración con auth-store
   - Redirección a ?return= tras éxito
   ============================================================ */
   (function () {
    'use strict';
  
    if (!window.auth) {
      console.warn('[login] auth-store no está cargado.');
      return;
    }
  
    // ---------- Referencias ----------
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
      remember:     document.getElementById('remember-me')
    };
  
    let mode = 'signin';
  
    // ---------- URL helpers ----------
    function getReturnUrl() {
      const params = new URLSearchParams(window.location.search);
      const ret = params.get('return');
      if (!ret) return '../../';
      if (/^https?:\/\//i.test(ret) || ret.startsWith('//')) return '../../';
      return ret;
    }
  
    // ---------- Mensajes ----------
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
  
    // ---------- Modo ----------
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
  
    // ---------- Submit ----------
    if (els.form) {
      els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError();
  
        const payload = {
          name:     els.nameInput ? els.nameInput.value : '',
          email:    els.email ? els.email.value : '',
          password: els.password ? els.password.value : ''
        };
  
        const result = (mode === 'signup')
          ? window.auth.signUp(payload)
          : window.auth.signIn(payload);
  
        if (!result.ok) {
          showError(result.error || 'No se pudo completar la operación.');
          return;
        }
  
        // Éxito → volver al origen
        window.location.replace(getReturnUrl());
      });
    }
  
    // ---------- Init ----------
    const params = new URLSearchParams(window.location.search);
  
    // Si ya hay sesión y no vienen con ?force, saltamos el form
    if (window.auth.isLoggedIn() && !params.get('force')) {
      window.location.replace(getReturnUrl());
      return;
    }
  
    setMode(params.get('tab') === 'signup' ? 'signup' : 'signin');
  })();