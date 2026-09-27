// Kumpulan rumus murni (tanpa side-effect) untuk modul Utang/Piutang & Cicilan.
// Dipisah dari hook/komponen supaya gampang diuji dan dipakai ulang oleh
// halaman Ringkasan maupun Analitik.

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const A = new Date(a + "T00:00:00");
  const B = new Date(b + "T00:00:00");
  return Math.round((B - A) / 86400000);
}

/** Total yang sudah dibayar untuk satu debt tertentu. */
export function totalPaidForDebt(debtId, payments) {
  return payments.filter((p) => p.debt_id === debtId).reduce((s, p) => s + Number(p.amount), 0);
}

/** Sisa pokok = principal - total dibayar, tidak boleh minus. */
export function outstandingPrincipal(debt, payments) {
  const paid = totalPaidForDebt(debt.id, payments);
  return Math.max(0, Number(debt.principal) - paid);
}

/** Status efektif: field `status` dianggap sumber utama, tapi kalau masih
 * 'aktif' dan sudah lewat jatuh tempo, tampilkan sebagai 'overdue' di UI. */
export function effectiveStatus(debt) {
  if (debt.status === "lunas") return "lunas";
  if (debt.due_date && debt.due_date < todayStr()) return "overdue";
  return debt.status || "aktif";
}

export function isSettled(debt, payments) {
  return debt.status === "lunas" || outstandingPrincipal(debt, payments) <= 0;
}

/** Ringkasan lengkap (kartu-kartu + grafik) — dipakai tab Ringkasan & Analitik. */
export function buildAnalytics({ debts, installments, payments, monthlyIncome }) {
  const today = todayStr();
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  let totalUtang = 0;
  let totalPiutang = 0;
  const compositionMap = {}; // counterparty -> outstanding (utang saja, utk pie chart)

  debts.forEach((d) => {
    const outstanding = outstandingPrincipal(d, payments);
    const settled = isSettled(d, payments);
    if (settled) return;
    if (d.type === "utang") {
      totalUtang += outstanding;
      compositionMap[d.counterparty] = (compositionMap[d.counterparty] || 0) + outstanding;
    } else {
      totalPiutang += outstanding;
    }
  });

  const netDebt = totalUtang - totalPiutang;

  let upcoming7 = 0, upcoming30 = 0, overdueAmount = 0, overdueCount = 0;
  installments.forEach((i) => {
    if (i.status !== "pending") return;
    if (i.due_date < today) {
      overdueAmount += Number(i.amount);
      overdueCount += 1;
    } else if (i.due_date <= in7) {
      upcoming7 += Number(i.amount);
    } else if (i.due_date <= in30) {
      upcoming30 += Number(i.amount);
    }
  });
  // upcoming30 di atas cuma yang > 7 hari; jumlahkan supaya "30 hari" = kumulatif 0-30 hari
  upcoming30 += upcoming7;

  const thisMonthKey = today.slice(0, 7);
  const cicilanBulanIni = installments
    .filter((i) => i.due_date.slice(0, 7) === thisMonthKey)
    .reduce((s, i) => s + Number(i.amount), 0);

  const debtToIncome = monthlyIncome > 0 ? (totalUtang / monthlyIncome) * 100 : null;

  const totalPrincipalUtang = debts.filter((d) => d.type === "utang").reduce((s, d) => s + Number(d.principal), 0);
  const totalPaidUtang = debts
    .filter((d) => d.type === "utang")
    .reduce((s, d) => s + totalPaidForDebt(d.id, payments), 0);
  const progress = totalPrincipalUtang > 0 ? (totalPaidUtang / totalPrincipalUtang) * 100 : 0;

  const composition = Object.entries(compositionMap)
    .map(([counterparty, value]) => ({ counterparty, value }))
    .sort((a, b) => b.value - a.value);

  // Jatuh tempo per bulan, 6 bulan ke depan
  const dueByMonth = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    const key = d.toISOString().slice(0, 7);
    dueByMonth.push({ key, total: 0 });
  }
  installments.forEach((i) => {
    if (i.status !== "pending") return;
    const key = i.due_date.slice(0, 7);
    const row = dueByMonth.find((r) => r.key === key);
    if (row) row.total += Number(i.amount);
  });

  // Tren pembayaran per bulan, 6 bulan terakhir
  const paymentTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    paymentTrend.push({ key, total: 0 });
  }
  payments.forEach((p) => {
    const key = String(p.paid_at || p.created_at).slice(0, 7);
    const row = paymentTrend.find((r) => r.key === key);
    if (row) row.total += Number(p.amount);
  });

  // Aging piutang (outstanding piutang berdasarkan umur sejak start_date)
  const agingBuckets = { "0-30": 0, "31-60": 0, "61-90": 0, ">90": 0 };
  debts.forEach((d) => {
    if (d.type !== "piutang") return;
    if (isSettled(d, payments)) return;
    const age = daysBetween(d.start_date, today);
    const outstanding = outstandingPrincipal(d, payments);
    if (age <= 30) agingBuckets["0-30"] += outstanding;
    else if (age <= 60) agingBuckets["31-60"] += outstanding;
    else if (age <= 90) agingBuckets["61-90"] += outstanding;
    else agingBuckets[">90"] += outstanding;
  });

  return {
    today,
    totalUtang,
    totalPiutang,
    netDebt,
    upcoming7,
    upcoming30,
    overdueAmount,
    overdueCount,
    cicilanBulanIni,
    debtToIncome,
    progress,
    composition,
    dueByMonth,
    paymentTrend,
    agingBuckets,
  };
}

/** Insight teks otomatis, versi ringkas (lihat catatan scope di README). */
export function buildInsights(analytics, debts, payments) {
  const insights = [];

  if (analytics.composition.length > 0) {
    const top = analytics.composition[0];
    insights.push(`Utang terbesar ke ${top.counterparty} sebesar ${formatIdrPlain(top.value)}.`);
  }

  const overdueReceivables = debts
    .filter((d) => d.type === "piutang" && !isSettled(d, payments) && d.due_date && d.due_date < analytics.today)
    .sort((a, b) => outstandingPrincipal(b, payments) - outstandingPrincipal(a, payments));
  if (overdueReceivables.length > 0) {
    const d = overdueReceivables[0];
    insights.push(`Piutang jatuh tempo dari ${d.counterparty} sebesar ${formatIdrPlain(outstandingPrincipal(d, payments))} sudah lewat tanggal.`);
  }

  if (analytics.debtToIncome !== null) {
    const pct = Math.round(analytics.debtToIncome);
    let label = "sehat";
    if (pct >= 50) label = "berbahaya";
    else if (pct >= 30) label = "perlu diwaspadai";
    insights.push(`Rasio utang terhadap pendapatan Anda sekitar ${pct}%, tergolong ${label}.`);
  }

  const thisMonth = analytics.dueByMonth[0]?.total || 0;
  const trendLastMonth = analytics.paymentTrend[analytics.paymentTrend.length - 2]?.total || 0;
  const trendThisMonth = analytics.paymentTrend[analytics.paymentTrend.length - 1]?.total || 0;
  if (trendLastMonth > 0) {
    const diffPct = Math.round(((trendThisMonth - trendLastMonth) / trendLastMonth) * 100);
    if (Math.abs(diffPct) >= 5) {
      insights.push(`Pembayaran cicilan bulan ini ${diffPct > 0 ? "naik" : "turun"} ${Math.abs(diffPct)}% dibanding bulan lalu.`);
    }
  }

  if (insights.length === 0) {
    insights.push("Belum ada cukup data untuk membuat insight otomatis.");
  }
  return insights;
}

function formatIdrPlain(n) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

/** Generate jadwal cicilan flat (bunga dihitung dari pokok awal, rata setiap periode). */
export function generateInstallmentSchedule({ principal, interestRate, tenor, period, startDate }) {
  const periodsPerYear = period === "mingguan" ? 52 : 12;
  const rate = (Number(interestRate) || 0) / 100 / periodsPerYear;
  const principalPortion = Number(principal) / tenor;
  const interestPortion = Number(principal) * rate;
  const amount = principalPortion + interestPortion;

  const rows = [];
  for (let i = 1; i <= tenor; i++) {
    const due = addPeriod(startDate, period, i);
    rows.push({
      installment_number: i,
      due_date: due,
      amount: Math.round(amount),
      principal_portion: Math.round(principalPortion),
      interest_portion: Math.round(interestPortion),
      status: "pending",
    });
  }
  return rows;
}

function addPeriod(startDate, period, count) {
  const d = new Date(startDate + "T00:00:00");
  if (period === "mingguan") {
    d.setDate(d.getDate() + count * 7);
  } else {
    d.setMonth(d.getMonth() + count);
  }
  return d.toISOString().slice(0, 10);
}
