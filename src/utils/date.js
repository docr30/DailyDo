export const pad = (n) => String(n).padStart(2, "0");

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const startOfDay = (d) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export const addDays = (d, n) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

export const isSameDay = (a, b) => toKey(a) === toKey(b);

export const DAY_LABELS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const MONTH_LABELS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export const MONTH_LABELS_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const formatLong = (d) =>
  `${d.getDate()} ${MONTH_LABELS_FULL[d.getMonth()]} ${d.getFullYear()}`;

export const today = startOfDay(new Date());
