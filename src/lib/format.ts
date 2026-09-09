const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const formatDateTime = (ms: number): string => {
  const d = new Date(ms);
  const hour = d.getHours();
  const minute = d.getMinutes();
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}, ${d.getFullYear()} - ${h12}:${
    minute < 10 ? `0${minute}` : minute
  } ${ampm}`;
};

export const formatDate = (ms: number): string => {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
};

export const formatDateRange = (startMs: number, endMs: number): string => {
  const a = new Date(startMs);
  const b = new Date(endMs);
  if (a.toDateString() === b.toDateString()) return formatDate(startMs);
  if (a.getFullYear() === b.getFullYear()) {
    return `${MONTHS[a.getMonth()]} ${ordinal(a.getDate())} – ${MONTHS[b.getMonth()]} ${ordinal(b.getDate())}, ${b.getFullYear()}`;
  }
  return `${formatDate(startMs)} – ${formatDate(endMs)}`;
};

export const relativeTime = (ms: number): string => {
  const diff = Date.now() - ms;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function parseCubeInput(input: string): string {
  const trimmed = input.trim();
  const m = trimmed.match(/cubecobra\.com\/cube\/[a-z]+\/([^/?#]+)/i);
  if (m) return decodeURIComponent(m[1]);
  return trimmed.replace(/^\/+|\/+$/g, '');
}
