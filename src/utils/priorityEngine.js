import { fromKey, today } from "./date.js";

// Bobot tiap kriteria (harus berjumlah 1.00)
export const WEIGHTS = {
  dampak: 0.2,
  urgensi: 0.15,
  konsekuensi_keterlambatan: 0.15,
  kesesuaian_strategis: 0.15,
  dependensi: 0.1,
  risiko_compliance: 0.1,
  effort_vs_value: 0.05,
  delegability: 0.05,
  stakeholder: 0.05,
};

export const CRITERIA_LABELS = {
  dampak: "Dampak / Impact",
  urgensi: "Urgensi / Deadline",
  konsekuensi_keterlambatan: "Konsekuensi Keterlambatan",
  kesesuaian_strategis: "Kesesuaian Strategis",
  dependensi: "Dependensi / Blocking",
  risiko_compliance: "Risiko / Compliance",
  effort_vs_value: "Effort vs Value",
  delegability: "Delegability",
  stakeholder: "Stakeholder / Visibility",
};

export const EFFORT_OPTIONS = [
  { value: "kecil", label: "Kecil (< 1 jam)", cost: 1 },
  { value: "sedang", label: "Sedang (1–4 jam)", cost: 2 },
  { value: "besar", label: "Besar (setengah–1 hari)", cost: 3 },
  { value: "sangat_besar", label: "Sangat besar (> 1 hari)", cost: 4 },
];

export const SCALE_LABELS = {
  1: "Sangat rendah",
  2: "Rendah",
  3: "Sedang",
  4: "Tinggi",
  5: "Sangat tinggi / kritis",
};

const LEVEL_ORDER = ["P0", "P1", "P2", "P3"];

const clamp = (n, min = 1, max = 5) => Math.min(max, Math.max(min, n));

function scoreDirect(value, fallback, fallbackNote) {
  if (value === null || value === undefined || value === "") {
    return { score: fallback, assumption: fallbackNote };
  }
  return { score: clamp(Number(value)), assumption: null };
}

function scoreUrgensi(deadlineKey) {
  if (!deadlineKey) {
    return {
      score: 1,
      assumption: "Tidak ada deadline yang diisi — urgensi diasumsikan rendah (skor 1).",
      note: null,
    };
  }
  const deadline = fromKey(deadlineKey);
  deadline.setHours(0, 0, 0, 0);
  const diffDays = Math.round((deadline.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { score: 5, assumption: null, note: "Deadline sudah lewat." };
  if (diffDays === 0) return { score: 5, assumption: null, note: "Deadline hari ini." };
  if (diffDays <= 2) return { score: 4, assumption: null, note: null };
  if (diffDays <= 7) return { score: 3, assumption: null, note: null };
  if (diffDays <= 14) return { score: 2, assumption: null, note: null };
  return { score: 1, assumption: null, note: null };
}

function scoreDependensi(blocksOthers) {
  if (blocksOthers === true) return { score: 4, assumption: null };
  if (blocksOthers === false) return { score: 1, assumption: null };
  return {
    score: 2,
    assumption: "Tidak ada informasi apakah tugas ini menghambat orang lain — diasumsikan skor rendah-sedang (2).",
  };
}

function scoreRisiko(complianceRisk) {
  if (complianceRisk === true) return { score: 4, assumption: null };
  if (complianceRisk === false) return { score: 1, assumption: null };
  return {
    score: 2,
    assumption: "Tidak ada informasi risiko legal/keamanan/audit — diasumsikan skor rendah-sedang (2).",
  };
}

function scoreDelegability(delegable) {
  // Skor tinggi = tugas ini SULIT/tidak bisa didelegasikan (hanya bisa dikerjakan sendiri).
  if (delegable === false) return { score: 4, assumption: null };
  if (delegable === true) return { score: 1, assumption: null };
  return {
    score: 3,
    assumption: "Tidak ada informasi apakah tugas bisa didelegasikan — diasumsikan skor sedang (3).",
  };
}

function scoreEffortVsValue(effortEstimate, dampakScore) {
  const opt = EFFORT_OPTIONS.find((o) => o.value === effortEstimate);
  const assumption = opt
    ? null
    : "Estimasi effort tidak diisi — diasumsikan effort sedang.";
  const cost = opt ? opt.cost : 2;
  return { score: clamp(dampakScore - (cost - 1)), assumption };
}

function scoreStakeholder(stakeholders) {
  if (!stakeholders || !stakeholders.trim()) {
    return {
      score: 1,
      assumption: "Tidak ada stakeholder yang disebutkan — diasumsikan visibilitas rendah (skor 1).",
    };
  }
  const s = stakeholders.toLowerCase();
  const high = ["direktur", "ceo", "direksi", "pimpinan", "board", "komisaris", "owner"];
  const mid = ["atasan", "manajer", "manager", "klien", "customer", "kepala", "supervisor"];
  if (high.some((k) => s.includes(k))) return { score: 5, assumption: null };
  if (mid.some((k) => s.includes(k))) return { score: 4, assumption: null };
  return { score: 3, assumption: null };
}

function buildAlasan({ kriteria_scores, urgensiNote, blocksOthers, blocksWho, complianceRisk, priority_level }) {
  const contributions = Object.entries(kriteria_scores)
    .map(([k, v]) => ({ k, v, w: v * WEIGHTS[k] }))
    .sort((a, b) => b.w - a.w);
  const top = contributions
    .slice(0, 3)
    .map((c) => `${CRITERIA_LABELS[c.k].toLowerCase()} (skor ${c.v}/5)`)
    .join(", ");
  let extra = "";
  if (urgensiNote) extra += ` ${urgensiNote}`;
  if (blocksOthers) extra += ` Tugas ini menghambat pekerjaan orang lain${blocksWho ? ` (${blocksWho})` : ""}.`;
  if (complianceRisk) extra += " Ada risiko legal/keamanan/audit yang perlu diperhatikan.";
  return `Tugas ini dikategorikan sebagai ${priority_level} terutama karena ${top} menjadi faktor pendorong skor tertinggi.${extra}`;
}

function buildRekomendasi(level, concurrentTasks) {
  const base = {
    P0: "Kerjakan segera — jadikan prioritas utama hari ini, alokasikan waktu fokus tanpa gangguan, dan informasikan pemberi tugas bila ada kendala.",
    P1: "Jadwalkan untuk diselesaikan dalam 1–2 hari ke depan; alokasikan slot waktu khusus sebelum tugas berprioritas lebih rendah.",
    P2: "Sisipkan dalam rencana kerja minggu ini di antara tugas-tugas berprioritas lebih tinggi.",
    P3: "Kerjakan saat ada waktu luang; dapat dijadwalkan ulang tanpa dampak signifikan bila perlu.",
  }[level];
  if (concurrentTasks && concurrentTasks.trim()) {
    return `${base} Perhatikan beban kerja Anda saat ini (${concurrentTasks.trim()}) saat menjadwalkan ulang.`;
  }
  return base;
}

function buildSaranDelegasi(delegable, blocksWho, priorityLevel) {
  if (delegable === true) {
    return `Tugas ini berpotensi didelegasikan${blocksWho ? `, koordinasikan dengan ${blocksWho}` : ""} agar Anda bisa fokus ke tugas berprioritas lebih tinggi.`;
  }
  if (delegable === false) {
    return "Tidak disarankan didelegasikan — kemungkinan hanya Anda yang memiliki wewenang/kompetensi untuk tugas ini.";
  }
  if (priorityLevel === "P0" || priorityLevel === "P1") {
    return "Belum ada informasi mengenai kemungkinan delegasi. Karena prioritasnya tinggi, pertimbangkan segera apakah sebagian tugas ini bisa dibagi ke anggota tim.";
  }
  return "Belum ada informasi mengenai kemungkinan delegasi — pertimbangkan apakah tugas ini bisa dibagi ke anggota tim lain.";
}

export function levelFromScore(score) {
  if (score >= 4.5) return "P0";
  if (score >= 3.5) return "P1";
  if (score >= 2.5) return "P2";
  return "P3";
}

export function isMoreUrgent(levelA, levelB) {
  return LEVEL_ORDER.indexOf(levelA) - LEVEL_ORDER.indexOf(levelB);
}

/**
 * Menilai satu tugas berdasarkan 9 kriteria prioritas.
 * Tidak pernah "mengarang" data: field yang kosong akan dicatat sebagai asumsi eksplisit.
 */
export function assessPriority(input) {
  const {
    description = "",
    assigner = "",
    deadline = null,
    effortEstimate = null,
    impactDone = null,
    impactLate = null,
    strategicFit = null,
    blocksOthers = null,
    blocksWho = "",
    complianceRisk = null,
    delegable = null,
    stakeholders = "",
    concurrentTasks = "",
  } = input;

  const asumsi = [];
  const pushAssumption = (a) => {
    if (a) asumsi.push(a);
  };

  const dampak = scoreDirect(impactDone, 3, "Dampak jika tugas selesai tidak diisi — diasumsikan sedang (skor 3).");
  const urgensi = scoreUrgensi(deadline);
  const konsekuensi = scoreDirect(
    impactLate,
    3,
    "Konsekuensi keterlambatan tidak diisi — diasumsikan sedang (skor 3)."
  );
  const strategis = scoreDirect(
    strategicFit,
    3,
    "Kesesuaian strategis tidak diisi — diasumsikan sedang (skor 3)."
  );
  const dependensi = scoreDependensi(blocksOthers);
  const risiko = scoreRisiko(complianceRisk);
  const effortValue = scoreEffortVsValue(effortEstimate, dampak.score);
  const delegability = scoreDelegability(delegable);
  const stakeholder = scoreStakeholder(stakeholders);

  [dampak, urgensi, konsekuensi, strategis, dependensi, risiko, effortValue, delegability, stakeholder].forEach(
    (r) => pushAssumption(r.assumption)
  );

  const kriteria_scores = {
    dampak: dampak.score,
    urgensi: urgensi.score,
    konsekuensi_keterlambatan: konsekuensi.score,
    kesesuaian_strategis: strategis.score,
    dependensi: dependensi.score,
    risiko_compliance: risiko.score,
    effort_vs_value: effortValue.score,
    delegability: delegability.score,
    stakeholder: stakeholder.score,
  };

  const rawScore = Object.entries(kriteria_scores).reduce((sum, [key, val]) => sum + val * WEIGHTS[key], 0);
  const priority_score = Math.round(rawScore * 100) / 100;
  const priority_level = levelFromScore(priority_score);

  const optionalFields = [
    deadline,
    effortEstimate,
    impactDone,
    impactLate,
    strategicFit,
    blocksOthers,
    complianceRisk,
    delegable,
    stakeholders,
  ];
  const filled = optionalFields.filter((v) => v !== null && v !== undefined && v !== "").length;
  let confidence = "rendah";
  if (filled >= 7) confidence = "tinggi";
  else if (filled >= 4) confidence = "sedang";

  const alasan = buildAlasan({
    kriteria_scores,
    urgensiNote: urgensi.note,
    blocksOthers,
    blocksWho,
    complianceRisk,
    priority_level,
  });
  const rekomendasi_aksi = buildRekomendasi(priority_level, concurrentTasks);
  const saran_delegasi = buildSaranDelegasi(delegable, blocksWho, priority_level);

  return {
    nama_tugas: description,
    diberikan_oleh: assigner || "Diri Sendiri",
    priority_score,
    priority_level,
    kriteria_scores,
    alasan,
    asumsi,
    rekomendasi_aksi,
    saran_delegasi,
    confidence,
  };
}
