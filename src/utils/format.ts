const zar = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 });

/** Formats a rand amount as R12,500 (comma thousands, as used in the brief). */
export function formatZAR(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '−' : '';
  // en-ZA uses non-breaking spaces as group separators; normalise to commas.
  const digits = zar.format(Math.abs(rounded)).replace(/[\s  ]/g, ',');
  return `${sign}R${digits}`;
}

/** Compact form for tight spaces: R94.3k */
export function formatZARCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}R${(abs / 1_000_000).toFixed(1)}m`;
  if (abs >= 10_000) return `${sign}R${(abs / 1000).toFixed(0)}k`;
  if (abs >= 1000) return `${sign}R${(abs / 1000).toFixed(1)}k`;
  return formatZAR(value);
}

/** Parses a user-typed money string ("R 12 500", "12,500") into a number. */
export function parseMoney(input: string): number {
  const cleaned = input.replace(/[^\d.]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function percent(ratio: number): string {
  return `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
}
