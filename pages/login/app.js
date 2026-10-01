/* ============================================================
   MyEvent Tech — Iniciar sesión
   Toggle de contraseña
   ============================================================ */

  (function () {
    const pwdField = document.getElementById('password-field');
    const toggleBtn = document.getElementById('toggle-pwd-btn');
    const toggleIcon = document.getElementById('toggle-pwd-icon');
  
    if (toggleBtn && pwdField && toggleIcon) {
      toggleBtn.addEventListener('click', function () {
        const isPassword = pwdField.type === 'password';
        pwdField.type = isPassword ? 'text' : 'password';
        toggleIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
      });
    }
  })();