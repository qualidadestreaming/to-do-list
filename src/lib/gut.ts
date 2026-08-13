export type GutBandKey = "low" | "medium" | "high";

export interface GutBand {
  key: GutBandKey;
  min: number;
  max: number;
}

// Faixas de criticidade da Matriz GUT (produto gravidade × urgência × tendência, 1–125).
// Sem rótulo aqui de propósito — é lib pura (sem acesso a hooks de i18n); os
// componentes traduzem `key` via useTranslations("activities.gutBands").
export const GUT_BANDS: GutBand[] = [
  { key: "low", min: 1, max: 20 },
  { key: "medium", min: 21, max: 60 },
  { key: "high", min: 61, max: 125 },
];

export function computeGutPriority(gravidade: number, urgencia: number, tendencia: number): number {
  return gravidade * urgencia * tendencia;
}

export function getGutBand(priority: number): GutBand {
  return GUT_BANDS.find((b) => priority >= b.min && priority <= b.max) ?? GUT_BANDS[0];
}

export const GUT_SCALE_OPTIONS = [1, 2, 3, 4, 5] as const;
