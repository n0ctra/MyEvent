(function initCarteleraFilters() {
  const searchInput = document.getElementById('event-search-input');
  const categoryDropdown = document.getElementById('category-dropdown');
  const chips = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('.event-card');

  function filterCards() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const activeChip = document.querySelector('.filter-chip.active-chip');
    const chipCat = activeChip ? activeChip.getAttribute('data-filter') : 'all';
    const dropCat = categoryDropdown ? categoryDropdown.value : 'all';

    // Prefer explicit chip selection, or harmonize with dropdown
    const selectedCat = chipCat !== 'all' ? chipCat : dropCat;

    cards.forEach(card => {
      const cardCat = card.getAttribute('data-category');
      const cardText = card.textContent.toLowerCase();

      const matchesQuery = !query || cardText.includes(query);
      const matchesCat = (selectedCat === 'all') || (cardCat === selectedCat);

      if (matchesQuery && matchesCat) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Chip click handlers
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => {
        c.classList.remove('active-chip', 'bg-inverse-surface', 'text-inverse-on-surface');
        c.classList.add('bg-surface-container', 'text-on-surface-variant');
      });
      chip.classList.remove('bg-surface-container', 'text-on-surface-variant');
      chip.classList.add('active-chip', 'bg-inverse-surface', 'text-inverse-on-surface');

      // Sync dropdown if matched
      const cat = chip.getAttribute('data-filter');
      if (categoryDropdown && [...categoryDropdown.options].some(o => o.value === cat)) {
        categoryDropdown.value = cat;
      } else if (categoryDropdown && cat === 'all') {
        categoryDropdown.value = 'all';
      }

      filterCards();
    });
  });

  // Dropdown changes
  if (categoryDropdown) {
    categoryDropdown.addEventListener('change', (e) => {
      const val = e.target.value;
      chips.forEach(chip => {
        const chipVal = chip.getAttribute('data-filter');
        if (chipVal === val) {
          chip.classList.remove('bg-surface-container', 'text-on-surface-variant');
          chip.classList.add('active-chip', 'bg-inverse-surface', 'text-inverse-on-surface');
        } else {
          chip.classList.remove('active-chip', 'bg-inverse-surface', 'text-inverse-on-surface');
          chip.classList.add('bg-surface-container', 'text-on-surface-variant');
        }
      });
      filterCards();
    });
  }

  // Input changes
  if (searchInput) {
    searchInput.addEventListener('input', filterCards);
  }
})();