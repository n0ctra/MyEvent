/* ============================================================
   MyEvent Tech — Onboarding / Personalización
   Ciudad + intereses + switches de notificación
   ============================================================ */

// City Pill Selector Interactive Toggle
const cityPills = document.querySelectorAll('.city-pill');
const cityDisplayBadge = document.getElementById('badge-city-display');

cityPills.forEach(pill => {
  pill.addEventListener('click', () => {
    cityPills.forEach(p => {
      p.setAttribute('data-selected', 'false');
      p.className = 'city-pill group flex items-center gap-2.5 px-5 py-3 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-all active:scale-95';
      const icon = p.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.className = 'material-symbols-outlined text-[18px] text-outline';
        icon.style.fontVariationSettings = "'FILL' 0";
      }
      const check = p.querySelector('.ml-1');
      if (check) check.remove();
    });

    pill.setAttribute('data-selected', 'true');
    pill.className = 'city-pill group flex items-center gap-2.5 px-5 py-3 rounded-full bg-primary text-on-primary shadow-sm hover:shadow-md transition-all active:scale-95';

    const icon = pill.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.className = 'material-symbols-outlined text-[18px] text-tertiary-fixed-dim';
      icon.style.fontVariationSettings = "'FILL' 1";
    }

    const cityNameSpan = pill.querySelector('span.font-label-lg');
    if (cityNameSpan) {
      const cityName = cityNameSpan.textContent.trim();
      if (cityDisplayBadge && cityName !== 'Otra ciudad') {
        cityDisplayBadge.textContent = cityName + ', ES';
      }
      const checkIcon = document.createElement('span');
      checkIcon.className = 'material-symbols-outlined text-[16px] ml-1';
      checkIcon.textContent = 'check';
      pill.appendChild(checkIcon);
    }
  });
});

// Multi-option Interest Checkbox Styling Interactive Toggle
const interestCards = document.querySelectorAll('.interest-card');
interestCards.forEach(card => {
  const input = card.querySelector('.interest-input');
  const badge = card.querySelector('.check-badge');
  const iconContainer = card.querySelector('.w-10');

  card.addEventListener('click', (e) => {
    // Toggle logic
    if (e.target !== input) {
      input.checked = !input.checked;
    }

    if (input.checked) {
      card.classList.remove('bg-surface-container-low', 'hover:bg-surface-container');
      card.classList.add('bg-primary-fixed/20', 'shadow-sm');
      badge.classList.remove('bg-surface-container-highest', 'text-transparent');
      badge.classList.add('bg-primary', 'text-on-primary');
      iconContainer.classList.remove('bg-surface-container-highest', 'text-on-surface-variant');
      iconContainer.classList.add('bg-primary', 'text-on-primary');
    } else {
      card.classList.remove('bg-primary-fixed/20', 'shadow-sm');
      card.classList.add('bg-surface-container-low', 'hover:bg-surface-container');
      badge.classList.remove('bg-primary', 'text-on-primary');
      badge.classList.add('bg-surface-container-highest', 'text-transparent');
      iconContainer.classList.remove('bg-primary', 'text-on-primary');
      iconContainer.classList.add('bg-surface-container-highest', 'text-on-surface-variant');
    }
  });
});

// Interactive Notification Switches
const toggleSwitches = document.querySelectorAll('.toggle-switch');
toggleSwitches.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const isChecked = toggle.getAttribute('data-checked') === 'true';
    const knob = toggle.querySelector('span');

    if (isChecked) {
      toggle.setAttribute('data-checked', 'false');
      toggle.classList.remove('bg-primary');
      toggle.classList.add('bg-outline-variant');
      knob.classList.remove('translate-x-6');
      knob.classList.add('translate-x-0');
    } else {
      toggle.setAttribute('data-checked', 'true');
      toggle.classList.remove('bg-outline-variant');
      toggle.classList.add('bg-primary');
      knob.classList.remove('translate-x-0');
      knob.classList.add('translate-x-6');
    }
  });
});