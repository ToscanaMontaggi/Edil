/**
 * Durate di lavoro.
 *
 * Stesso principio dei soldi: le ore si memorizzano in minuti interi, mai in
 * ore decimali. "7 ore e 20" e' 440 minuti, non 7.333333.
 */
export type Minutes = number & { readonly __brand: unique symbol }

const MINUTES_PER_HOUR = 60

function fromMinutes(value: number): Minutes {
  return Math.round(value) as Minutes
}

export const Duration = {
  zero: fromMinutes(0),

  fromMinutes,

  /** Costruisce da ore decimali (8.5 -> 510 minuti). */
  fromHours(hours: number): Minutes {
    return fromMinutes(hours * MINUTES_PER_HOUR)
  },

  /**
   * Ore decimali. Serve per moltiplicare per il costo orario: e' l'unico punto
   * in cui e' corretto avere un decimale, e il risultato viene subito
   * riarrotondato a centesimi da Money.multiply.
   */
  toHours(value: Minutes): number {
    return value / MINUTES_PER_HOUR
  },

  add(a: Minutes, b: Minutes): Minutes {
    return fromMinutes(a + b)
  },

  sum(values: readonly Minutes[]): Minutes {
    return fromMinutes(values.reduce<number>((total, value) => total + value, 0))
  },

  isZero(value: Minutes): boolean {
    return value === 0
  },

  /** Formato leggibile: "8h", "7h 30m", "45m". */
  format(value: Minutes): string {
    const hours = Math.floor(value / MINUTES_PER_HOUR)
    const minutes = value % MINUTES_PER_HOUR
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  },

  /** Ore decimali arrotondate a due cifre, per le tabelle e gli export. */
  formatHours(value: Minutes): string {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Duration.toHours(value))
  },
}
