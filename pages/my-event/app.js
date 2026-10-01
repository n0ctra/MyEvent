function openModal(title, code) {
    const modal = document.getElementById('ticketModal');
    const card = document.getElementById('modalCard');
    document.getElementById('modalEventTitle').innerText = title;
    document.getElementById('modalEventCode').innerText = code;

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100');
    card.classList.remove('scale-95');
    card.classList.add('scale-100');
  }

  function closeModal() {
    const modal = document.getElementById('ticketModal');
    const card = document.getElementById('modalCard');

    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.classList.remove('opacity-100');
    card.classList.add('scale-95');
    card.classList.remove('scale-100');
  }

  function triggerToast(text) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMessage');
    msg.innerText = text;

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0');
      toast.classList.remove('translate-y-0', 'opacity-100');
    }, 2600);
  }

  function copyReferral(link) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    triggerToast('Enlace copiado al portapapeles: ' + link);
  }

  function setActiveTab(button, tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('bg-surface-container-lowest', 'text-primary', 'shadow-sm');
      btn.classList.add('text-on-surface-variant');
    });
    button.classList.add('bg-surface-container-lowest', 'text-primary', 'shadow-sm');
    button.classList.remove('text-on-surface-variant');

    if (tabName !== 'upcoming') {
      triggerToast('Mostrando vista simulada para: ' + tabName);
    }
  }