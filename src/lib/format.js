export function idr(n) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

export function idrShort(n) {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "jt";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + "rb";
  return String(n);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthKey(iso) {
  return iso.slice(0, 7);
}
