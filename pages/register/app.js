/* ============================================================
   MyEvent Tech — Registro
   - Role selector (attendee/organizer)
   - Password visibility toggle + strength meter
   - Submit → auth.signUp() → redirect a ?return=
   - Si ya hay sesión → redirige sin mostrar el form
   ============================================================ */
   (function () {
    'use strict';
  
    if (!window.auth) {
      console.warn('[register] auth-store no está cargado.');
      return;
    }
  
    // ---------- Constantes de estilos ----------
    const ROLE_ACTIVE = {
      attendee: {
        card: 'role-card cursor-pointer relative p-5 rounded-xl transition-all duration-300 shadow-md bg-surface-container-lowest ring-2 ring-primary',
        check: 'w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center',
        checkIcon: 'check'
      },
      organizer: {
        card: 'role-card cursor-pointer relative p-5 rounded-xl transition-all duration-300 shadow-md bg-surface-container-lowest ring-2 ring-secondary',
        check: 'w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center',
        checkIcon: 'check'
      }
    };
  
    const ROLE_INACTIVE = {
      attendee: {
        card: 'role-card cursor-pointer relative p-5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md bg-surface-container-low hover:bg-surface-container-lowest',
        check: 'w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40',
        checkIcon: 'radio_button_unchecked'
      },
      organizer: {
        card: 'role-card cursor-pointer relative p-5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md bg-surface-container-low hover:bg-surface-container-lowest',
        check: 'w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40',
        checkIcon: 'radio_button_unchecked'
      }
    };
  
    const STRENGTH_COLORS = ['bg-error', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
    const STRENGTH_LABELS = ['Débil', 'Regular', 'Buena', 'Excelente'];
  
    // ---------- Estado ----------
    let selectedRole = 'attendee';
    let busy = false;
  
    // ---------- Referencias ----------
    const els = {
      form:         document.getElementById('register-form'),
      fullname:     document.getElementById('fullname'),
      email:        document.getElementById('email'),
      password:     document.getElementById('password'),
      togglePwd:    document.getElementById('toggle-pwd-btn'),
      eyeIcon:      document.getElementById('eye-icon'),
      bars: [
        document.getElementById('bar-1'),
        document.getElementById('bar-2'),
        document.getElementById('bar-3'),
        document.getElementById('bar-4')
      ],
      strengthLbl:  document.getElementById('strength-label'),
      acceptTerms:  document.getElementById('accept-terms'),
      acceptMkt:    document.getElementById('accept-marketing'),
      submit:       document.getElementById('register-submit'),
      submitText:   document.getElementById('register-submit-text'),
      submitIcon:   document.getElementById('register-submit-icon'),
      error:        document.getElementById('register-error'),
      errorText:    document.getElementById('register-error-text'),
      loginLink:    document.getElementById('login-link'),
      cardAttendee: document.getElementById('card-attendee'),
      cardOrganizer:document.getElementById('card-organizer'),
      checkAttendee:document.getElementById('check-attendee'),
      checkOrganizer:document.getElementById('check-organizer'),
      roleGroup:    document.getElementById('role-selector-group')
    };
  
    // ---------- URL helpers ----------
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
  
    // ---------- Role selector ----------
    function selectRole(role) {
      selectedRole = (role === 'organizer') ? 'organizer' : 'attendee';
  
      // Attendee
      if (els.cardAttendee) {
        els.cardAttendee.className = (selectedRole === 'attendee')
          ? ROLE_ACTIVE.attendee.card
          : ROLE_INACTIVE.attendee.card;
        els.cardAttendee.setAttribute('aria-checked', String(selectedRole === 'attendee'));
      }
      if (els.checkAttendee) {
        els.checkAttendee.className = (selectedRole === 'attendee')
          ? ROLE_ACTIVE.attendee.check
          : ROLE_INACTIVE.attendee.check;
        const icon = els.checkAttendee.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = (selectedRole === 'attendee')
          ? ROLE_ACTIVE.attendee.checkIcon
          : ROLE_INACTIVE.attendee.checkIcon;
      }
  
      // Organizer
      if (els.cardOrganizer) {
        els.cardOrganizer.className = (selectedRole === 'organizer')
          ? ROLE_ACTIVE.organizer.card
          : ROLE_INACTIVE.organizer.card;
        els.cardOrganizer.setAttribute('aria-checked', String(selectedRole === 'organizer'));
      }
      if (els.checkOrganizer) {
        els.checkOrganizer.className = (selectedRole === 'organizer')
          ? ROLE_ACTIVE.organizer.check
          : ROLE_INACTIVE.organizer.check;
        const icon = els.checkOrganizer.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = (selectedRole === 'organizer')
          ? ROLE_ACTIVE.organizer.checkIcon
          : ROLE_INACTIVE.organizer.checkIcon;
      }
    }
  
    // Wire role cards
    if (els.cardAttendee) {
      els.cardAttendee.addEventListener('click', () => selectRole('attendee'));
      els.cardAttendee.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          selectRole('attendee');
        }
      });
    }
    if (els.cardOrganizer) {
      els.cardOrganizer.addEventListener('click', () => selectRole('organizer'));
      els.cardOrganizer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          selectRole('organizer');
        }
      });
    }
  
    // ---------- Password toggle ----------
    if (els.togglePwd && els.password && els.eyeIcon) {
      els.togglePwd.addEventListener('click', () => {
        const isHidden = els.password.type === 'password';
        els.password.type = isHidden ? 'text' : 'password';
        els.eyeIcon.textContent = isHidden ? 'visibility_off' : 'visibility';
        els.togglePwd.setAttribute('aria-pressed', String(isHidden));
        els.togglePwd.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
      });
    }
  
    // ---------- Password strength ----------
    function updatePasswordStrength(value) {
      const v = String(value || '');
      const bars = els.bars;
      if (!bars[0] || !els.strengthLbl) return;
  
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
  
      bars.forEach((bar, i) => {
        if (!bar) return;
        bar.classList.remove('bg-error', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-surface-container-highest');
        if (v.length > 0 && i < score) {
          bar.classList.add(STRENGTH_COLORS[score - 1]);
        } else {
          bar.classList.add('bg-surface-container-highest');
        }
      });
  
      if (v.length === 0) {
        els.strengthLbl.textContent = '—';
        els.strengthLbl.className = 'text-on-surface-variant font-semibold';
      } else {
        const idx = Math.max(0, score - 1);
        els.strengthLbl.textContent = STRENGTH_LABELS[idx];
        const colorMap = ['text-error', 'text-orange-500', 'text-yellow-600', 'text-emerald-600'];
        els.strengthLbl.className = colorMap[idx] + ' font-semibold';
      }
    }
  
    if (els.password) {
      els.password.addEventListener('input', (e) => updatePasswordStrength(e.target.value));
    }
  
    // ---------- Submit ----------
    function setProcessing(on) {
      busy = on;
      if (!els.submit) return;
      els.submit.disabled = on;
      els.submit.classList.toggle('opacity-60', on);
      els.submit.classList.toggle('cursor-not-allowed', on);
      if (els.submitText) els.submitText.textContent = on ? 'Creando cuenta...' : 'Crear mi cuenta gratis';
      if (els.submitIcon) els.submitIcon.textContent = on ? 'hourglass_top' : 'arrow_forward';
    }
  
    function handleSubmit(e) {
      if (e) e.preventDefault();
      if (busy) return;
      clearError();
  
      const fullname = els.fullname ? els.fullname.value.trim() : '';
      const email    = els.email    ? els.email.value.trim()    : '';
      const password = els.password ? els.password.value        : '';
      const acceptTerms = els.acceptTerms ? els.acceptTerms.checked : false;
      const acceptMkt   = els.acceptMkt   ? els.acceptMkt.checked   : false;
  
      // Validación rápida en cliente
      if (!fullname) { showError('Ingresa tu nombre completo.'); return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Correo electrónico inválido.'); return;
      }
      if (password.length < 8) {
        showError('La contraseña debe tener al menos 8 caracteres.'); return;
      }
      if (!acceptTerms) {
        showError('Debes aceptar los Términos del Servicio para continuar.'); return;
      }
  
      setProcessing(true);
  
      // auth.signUp es síncrono, pero simulamos una micro-espera para UX
      window.setTimeout(() => {
        const result = window.auth.signUp({
          name: fullname,
          email,
          password,
          role: selectedRole,
          acceptTerms,
          acceptMarketing: acceptMkt
        });
  
        if (!result.ok) {
          setProcessing(false);
          showError(result.error || 'No se pudo crear la cuenta.');
          return;
        }
  
        // Éxito → redirige
        window.location.replace(getReturnUrl());
      }, 500);
    }
  
    if (els.form) {
      els.form.addEventListener('submit', handleSubmit);
    }
  
    // ---------- Init ----------
    const params = new URLSearchParams(window.location.search);
  
    // Si ya hay sesión, redirige (a menos que vengan con ?force)
    if (window.auth.isLoggedIn() && !params.get('force')) {
      window.location.replace(getReturnUrl());
      return;
    }
  
    // Preseleccionar rol si viene por URL: ?role=organizer
    const roleParam = params.get('role');
    selectRole(roleParam === 'organizer' ? 'organizer' : 'attendee');
  
    // Propagar ?return= al login link (por si el usuario cambia de opinión)
    if (els.loginLink) {
      const ret = params.get('return');
      if (ret) els.loginLink.href = '../login/?return=' + encodeURIComponent(ret);
    }
  })();