export function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

export function buildCostWhatsappText(est: {
  commodity: string;
  variety: string;
  area_ha: number;
  scaled_cost: { seed: number; fertilizer: number; pesticide: number; labor: number; total: number };
  break_even: { target_yield_ton_per_ha: number; break_even_price_rp_per_kg: number } | null;
}): string {
  const lines = [
    "*Estimasi RAB Usaha Tani — TaniCerdas Cangkringan*",
    `Komoditas: *${est.commodity}* (${est.variety})`,
    `Luas Lahan: ${est.area_ha} ha`,
    "",
    `- Benih: ${formatRupiah(est.scaled_cost.seed)}`,
    `- Pupuk: ${formatRupiah(est.scaled_cost.fertilizer)}`,
    `- Pestisida: ${formatRupiah(est.scaled_cost.pesticide)}`,
    `- Tenaga Kerja: ${formatRupiah(est.scaled_cost.labor)}`,
    `*Total Estimasi Modal: ${formatRupiah(est.scaled_cost.total)}*`,
  ];

  if (est.break_even) {
    lines.push(
      "",
      `Simulasi Titik Impas (target panen ${est.break_even.target_yield_ton_per_ha} ton/ha): *${formatRupiah(est.break_even.break_even_price_rp_per_kg)}/kg*`
    );
  }

  lines.push("", "_Sumber: Cost_Data Smart Farming Cangkringan (2022-2026)._");
  return lines.join("\n");
}

export function openWhatsappShare(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
