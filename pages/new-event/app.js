/* ============================================================
   MyEvent Tech — Crear nuevo evento
   Lógica de vista previa en vivo, cálculos y micro-interacciones
   ============================================================ */

   (function initCreateEventModule() {
    // Dynamic binding targets
    const titleInput = document.getElementById('eventTitle');
    const categorySelect = document.getElementById('eventCategory');
    const descInput = document.getElementById('eventDescription');
    const dateInput = document.getElementById('eventDate');
    const timeInput = document.getElementById('eventStartTime');
    const venueNameInput = document.getElementById('venueName');
    const venueAddressInput = document.getElementById('venueAddress');
    const capacitySlider = document.getElementById('capacitySlider');
    const capacityNumber = document.getElementById('capacityNumber');
    const ticketPrice = document.getElementById('ticketPrice');
    const netRevenueDisplay = document.getElementById('netRevenueDisplay');
    const titleCounter = document.getElementById('titleCounter');
  
    // Preview targets
    const previewTitle = document.getElementById('previewTitle');
    const previewCategoryBadge = document.getElementById('previewCategoryBadge');
    const previewDesc = document.getElementById('previewDesc');
    const previewDateStr = document.getElementById('previewDateStr');
    const previewVenueStr = document.getElementById('previewVenueStr');
    const previewPriceBadge = document.getElementById('previewPriceBadge');
    const previewCapacityLabel = document.getElementById('previewCapacityLabel');
  
    // Calculations
    function updateCalculations() {
      const cap = parseInt(capacityNumber.value) || 0;
      const price = parseFloat(ticketPrice.value) || 0;
      const gross = cap * price;
      const net = gross * 0.94; // 6% fee deduction
  
      netRevenueDisplay.textContent = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(net);
  
      if (price <= 0) {
        previewPriceBadge.textContent = 'Gratis';
        previewPriceBadge.className = 'px-3 py-1 rounded-full bg-emerald-600 text-white font-headline-sm text-headline-sm shadow-md';
      } else {
        previewPriceBadge.textContent = price.toFixed(0) + ' €';
        previewPriceBadge.className = 'px-3.5 py-1 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm shadow-md';
      }
  
      previewCapacityLabel.textContent = cap + ' plazas libres';
    }
  
    // Title & counter
    if (titleInput && previewTitle && titleCounter) {
      titleInput.addEventListener('input', (e) => {
        const val = e.target.value;
        titleCounter.textContent = val.length + '/80';
        previewTitle.textContent = val.trim() || 'Título de tu evento';
      });
    }
  
    // Category
    if (categorySelect && previewCategoryBadge) {
      categorySelect.addEventListener('change', (e) => {
        previewCategoryBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-primary"></span> ${e.target.value}`;
      });
    }
  
    // Description
    if (descInput && previewDesc) {
      descInput.addEventListener('input', (e) => {
        previewDesc.textContent = e.target.value.trim() || 'Describe aquí los detalles de la experiencia...';
      });
    }
  
    // Capacity sync
    if (capacitySlider && capacityNumber) {
      capacitySlider.addEventListener('input', (e) => {
        capacityNumber.value = e.target.value;
        updateCalculations();
      });
      capacityNumber.addEventListener('input', (e) => {
        capacitySlider.value = e.target.value;
        updateCalculations();
      });
    }
  
    // Price
    if (ticketPrice) {
      ticketPrice.addEventListener('input', updateCalculations);
    }
  
    // Date & Time formatting for preview
    function updateDatePreview() {
      if (!dateInput || !timeInput || !previewDateStr) return;
      const dVal = dateInput.value;
      const tVal = timeInput.value;
      if (dVal) {
        const dateObj = new Date(dVal);
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const dayName = days[dateObj.getUTCDay()] || 'Fecha';
        const dayNum = dateObj.getUTCDate() || '';
        const monthName = months[dateObj.getUTCMonth()] || '';
        previewDateStr.textContent = `${dayName}, ${dayNum} ${monthName} • ${tVal || '20:00'}`;
      }
    }
    if (dateInput) dateInput.addEventListener('change', updateDatePreview);
    if (timeInput) timeInput.addEventListener('change', updateDatePreview);
  
    // Venue preview
    function updateVenuePreview() {
      if (!venueNameInput || !previewVenueStr) return;
      const vName = venueNameInput.value.trim() || 'Lugar por definir';
      previewVenueStr.textContent = `${vName} • Madrid`;
    }
    if (venueNameInput) venueNameInput.addEventListener('input', updateVenuePreview);
  
    // Pricing type toggles (Gratis vs Pago)
    const btnPricingFree = document.getElementById('btnPricingFree');
    const btnPricingPaid = document.getElementById('btnPricingPaid');
    if (btnPricingFree && btnPricingPaid && ticketPrice) {
      btnPricingFree.addEventListener('click', () => {
        ticketPrice.value = '0.00';
        ticketPrice.disabled = true;
        btnPricingFree.className = 'py-3 px-4 rounded-xl font-label-lg text-label-lg bg-surface-container-lowest text-primary shadow-sm transition-all';
        btnPricingPaid.className = 'py-3 px-4 rounded-xl font-label-lg text-label-lg transition-all text-on-surface-variant hover:text-on-surface';
        updateCalculations();
      });
  
      btnPricingPaid.addEventListener('click', () => {
        ticketPrice.disabled = false;
        if (parseFloat(ticketPrice.value) === 0) ticketPrice.value = '20.00';
        btnPricingPaid.className = 'py-3 px-4 rounded-xl font-label-lg text-label-lg bg-surface-container-lowest text-primary shadow-sm transition-all';
        btnPricingFree.className = 'py-3 px-4 rounded-xl font-label-lg text-label-lg transition-all text-on-surface-variant hover:text-on-surface';
        updateCalculations();
      });
    }
  
    // Space Type Buttons
    const spaceBtns = document.querySelectorAll('.space-type-btn');
    spaceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        spaceBtns.forEach(b => {
          b.className = 'space-type-btn flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-all text-center';
        });
        btn.className = 'space-type-btn flex flex-col items-center justify-center p-3 rounded-2xl bg-primary text-on-primary shadow-sm transition-all text-center';
      });
    });
  
    // Tag Pill toggle
    const tagPills = document.querySelectorAll('.tag-pill');
    tagPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const isSelected = pill.classList.contains('bg-primary');
        if (isSelected) {
          pill.className = 'tag-pill px-3 py-1.5 rounded-full text-label-sm font-label-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all';
        } else {
          pill.className = 'tag-pill px-3 py-1.5 rounded-full text-label-sm font-label-sm bg-primary text-on-primary transition-all';
        }
      });
    });
  
    // Ticket Stepper
    const btnMinus = document.getElementById('btnMinusLimit');
    const btnPlus = document.getElementById('btnPlusLimit');
    const limitDisplay = document.getElementById('ticketLimitVal');
    if (btnMinus && btnPlus && limitDisplay) {
      btnMinus.addEventListener('click', () => {
        let val = parseInt(limitDisplay.textContent) || 1;
        if (val > 1) limitDisplay.textContent = val - 1;
      });
      btnPlus.addEventListener('click', () => {
        let val = parseInt(limitDisplay.textContent) || 1;
        if (val < 10) limitDisplay.textContent = val + 1;
      });
    }
  
    // Toast feedback function
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMsg');
    function showNotification(message) {
      if (!toast || !toastMsg) return;
      toastMsg.textContent = message;
      toast.classList.remove('translate-y-32', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
      setTimeout(() => {
        toast.classList.add('translate-y-32', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
      }, 3500);
    }
  
    // Buttons
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishBtn = document.getElementById('publishBtn');
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', () => {
        showNotification('Borrador guardado en tu cuenta.');
      });
    }
    if (publishBtn) {
      publishBtn.addEventListener('click', () => {
        showNotification('¡Tu velada ya está publicada y visible en la Cartelera!');
      });
    }
  
    // Initial triggers
    updateCalculations();
    updateDatePreview();
    updateVenuePreview();
  })();