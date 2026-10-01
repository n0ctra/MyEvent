(function () {
  let selectedRole = 'attendee';

  window.selectRole = function (role) {
    selectedRole = role;
    const cardAttendee = document.getElementById('card-attendee');
    const cardOrganizer = document.getElementById('card-organizer');
    const checkAttendee = document.getElementById('check-attendee');
    const checkOrganizer = document.getElementById('check-organizer');

    if (role === 'attendee') {
      cardAttendee.className = 'cursor-pointer relative p-5 rounded-xl transition-all duration-300 shadow-md bg-surface-container-lowest ring-2 ring-primary';
      cardOrganizer.className = 'cursor-pointer relative p-5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md bg-surface-container-low hover:bg-surface-container-lowest';

      checkAttendee.className = 'w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center';
      checkAttendee.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span>';

      checkOrganizer.className = 'w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40';
      checkOrganizer.innerHTML = '<span class="material-symbols-outlined text-[16px]">radio_button_unchecked</span>';
    } else {
      cardOrganizer.className = 'cursor-pointer relative p-5 rounded-xl transition-all duration-300 shadow-md bg-surface-container-lowest ring-2 ring-secondary';
      cardAttendee.className = 'cursor-pointer relative p-5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md bg-surface-container-low hover:bg-surface-container-lowest';

      checkOrganizer.className = 'w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center';
      checkOrganizer.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span>';

      checkAttendee.className = 'w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center opacity-40';
      checkAttendee.innerHTML = '<span class="material-symbols-outlined text-[16px]">radio_button_unchecked</span>';
    }
  };

  window.togglePasswordVisibility = function () {
    const pwdInput = document.getElementById('password');
    const icon = document.getElementById('eye-icon');
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      pwdInput.type = 'password';
      icon.textContent = 'visibility';
    }
  };

  window.updatePasswordStrength = function (val) {
    const bar1 = document.getElementById('bar-1');
    const bar2 = document.getElementById('bar-2');
    const bar3 = document.getElementById('bar-3');
    const bar4 = document.getElementById('bar-4');
    const label = document.getElementById('strength-label');

    const len = val.length;
    if (len < 6) {
      bar1.className = 'flex-1 rounded-full bg-error transition-all';
      bar2.className = 'flex-1 rounded-full bg-surface-container-highest transition-all';
      bar3.className = 'flex-1 rounded-full bg-surface-container-highest transition-all';
      bar4.className = 'flex-1 rounded-full bg-surface-container-highest transition-all';
      label.textContent = 'Baja';
      label.className = 'text-error font-semibold';
    } else if (len < 10) {
      bar1.className = 'flex-1 rounded-full bg-primary transition-all';
      bar2.className = 'flex-1 rounded-full bg-primary transition-all';
      bar3.className = 'flex-1 rounded-full bg-surface-container-highest transition-all';
      bar4.className = 'flex-1 rounded-full bg-surface-container-highest transition-all';
      label.textContent = 'Media';
      label.className = 'text-primary font-semibold';
    } else {
      bar1.className = 'flex-1 rounded-full bg-primary transition-all';
      bar2.className = 'flex-1 rounded-full bg-primary transition-all';
      bar3.className = 'flex-1 rounded-full bg-primary transition-all';
      bar4.className = 'flex-1 rounded-full bg-secondary transition-all';
      label.textContent = 'Muy segura';
      label.className = 'text-secondary font-semibold';
    }
  };
})();
