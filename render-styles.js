/* ============================================================
   MyEvent Tech — Registries de estilo + formateadores.
   ============================================================ */

export const CATEGORY_STYLES = {
  cafe: { label: 'Cata & Café', badge: 'bg-primary-fixed text-on-primary-fixed', accent: 'from-primary to-primary-container' },
  musica: { label: 'Música', badge: 'bg-tertiary-fixed text-on-tertiary-fixed', accent: 'from-tertiary to-tertiary-container' },
  gastronomia: { label: 'Gastronomía', badge: 'bg-error-container text-on-error-container', accent: 'from-error to-secondary' },
  talleres: { label: 'Taller', badge: 'bg-tertiary-fixed text-on-tertiary-fixed', accent: 'from-primary to-tertiary' },
  tech: { label: 'Tech & Agro', badge: 'bg-secondary-fixed text-on-secondary-fixed', accent: 'from-secondary to-primary' }
};

export const DOT_STYLES = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary-container',
  muted: 'bg-outline-variant'
};

export function categoryStyle(key) {
  return CATEGORY_STYLES[key] || {
    label: key || 'Evento',
    badge: 'bg-surface-container-highest text-on-surface-variant',
    accent: 'from-outline to-outline-variant'
  };
}

export function formatCOP(amount, currency) {
  const n = Number(amount) || 0;
  if (n === 0) return 'Gratis';
  return '$ ' + n.toLocaleString('es-CO') + ' ' + (currency || 'COP');
}

export function formatDateLong(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const datePart = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(d);
  const timePart = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
  return datePart.charAt(0).toUpperCase() + datePart.slice(1) + ' · ' + timePart + ' h';
}

export function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const datePart = new Intl.DateTimeFormat('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short'
  }).format(d);
  const timePart = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
  const clean = datePart.charAt(0).toUpperCase() + datePart.slice(1).replace(/\./g, '');
  return clean + ' · ' + timePart;
}

export function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return h + 'h ' + m + 'm';
  if (h) return h + 'h';
  return m + 'm';
}

export function computeUrgency(event) {
  if (event.urgencyLabel) return { label: event.urgencyLabel, tone: 'urgent' };
  if (!Number.isFinite(event.spotsLeft)) return null;
  if (event.spotsLeft <= 0) return { label: 'Agotado', tone: 'soldout' };
  if (event.spotsLeft <= 5) return { label: 'Últimos ' + event.spotsLeft + ' cupos', tone: 'urgent' };
  if (event.spotsLeft <= 15) return { label: event.spotsLeft + ' cupos libres', tone: 'limited' };
  return { label: event.spotsLeft + ' cupos disponibles', tone: 'ok' };
}

export function urgencyClasses(tone) {
  switch (tone) {
    case 'urgent': return 'bg-rose-500/20 text-rose-300';
    case 'limited': return 'bg-amber-500/20 text-amber-200';
    case 'soldout': return 'bg-white/10 text-white/70';
    default: return 'bg-emerald-500/20 text-emerald-300';
  }
}

export function urgencyTextClasses(tone) {
  switch (tone) {
    case 'urgent': return 'text-rose-700 bg-rose-50 font-bold';
    case 'limited': return 'text-amber-700 bg-amber-50';
    case 'soldout': return 'text-on-surface-variant bg-surface-container font-medium';
    default: return 'text-emerald-600 bg-emerald-50';
  }
}