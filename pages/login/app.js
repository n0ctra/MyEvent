/* ============================================================
   MyEvent Tech — Iniciar sesión
   Toggle de contraseña + credenciales demo
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
  
    const emailField = document.getElementById('email-field');
    const btnAttendee = document.getElementById('btn-demo-attendee');
    const btnOrganizer = document.getElementById('btn-demo-organizer');
  
    if (btnAttendee && emailField && pwdField) {
      btnAttendee.addEventListener('click', function () {
        emailField.value = 'invitado.jazz@velada.live';
        pwdField.value = 'asistente2025';
        highlightField();
      });
    }
  
    if (btnOrganizer && emailField && pwdField) {
      btnOrganizer.addEventListener('click', function () {
        emailField.value = 'creator.studio@myevent.pro';
        pwdField.value = 'organizadorVIP2025';
        highlightField();
      });
    }
  
    function highlightField() {
      if (emailField) {
        emailField.classList.add('bg-primary-fixed/20');
        setTimeout(() => {
          emailField.classList.remove('bg-primary-fixed/20');
        }, 600);
      }
    }
  })();