(function () {
    let tickets = 2;
    const unitPrice = 18.00;
    const maxTickets = 10;
    const minTickets = 1;

    const countEl = document.getElementById('ticket-count');
    const labelTicketsCalc = document.getElementById('label-tickets-calc');
    const subtotalEl = document.getElementById('tickets-subtotal');
    const totalEl = document.getElementById('total-price');
    const submitBtnText = document.getElementById('btn-submit-text');
    const decBtn = document.getElementById('btn-decrement');
    const incBtn = document.getElementById('btn-increment');

    function updateUi() {
      countEl.textContent = tickets;
      const total = (tickets * unitPrice).toFixed(2).replace('.', ',');
      labelTicketsCalc.textContent = tickets + ' x Entrada Jazz Azotea (18,00 €)';
      subtotalEl.textContent = total + ' €';
      totalEl.textContent = total + ' €';
      submitBtnText.textContent = 'Confirmar reserva (' + total + ' €)';

      decBtn.disabled = tickets <= minTickets;
      incBtn.disabled = tickets >= maxTickets;
    }

    decBtn.addEventListener('click', function () {
      if (tickets > minTickets) {
        tickets--;
        updateUi();
      }
    });

    incBtn.addEventListener('click', function () {
      if (tickets < maxTickets) {
        tickets++;
        updateUi();
      }
    });

    window.handleBooking = function () {
      const submitBtn = document.getElementById('btn-submit');
      const successBox = document.getElementById('booking-success');

      submitBtn.classList.add('opacity-75', 'pointer-events-none');
      submitBtnText.textContent = 'Procesando reserva...';

      setTimeout(function () {
        submitBtn.classList.remove('opacity-75', 'pointer-events-none');
        successBox.classList.remove('hidden');
        submitBtn.textContent = 'Reserva Confirmada ✓';
        submitBtn.classList.remove('bg-primary');
        submitBtn.classList.add('bg-emerald-600');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 900);
    };

    updateUi();
  })();