/**
 * Importi monetari.
 *
 * Regola invariabile del progetto: i soldi si rappresentano SEMPRE in centesimi
 * interi, mai in euro con la virgola. I float binari non sanno rappresentare
 * 0.10 in modo esatto, quindi sommare centinaia di costi in euro produce
 * scostamenti di qualche centesimo che poi non fanno quadrare i consuntivi.
 *
 * Il tipo e' "branded": un numero qualsiasi non e' assegnabile a Cents senza
 * passare da una delle funzioni di costruzione, cosi' il compilatore impedisce
 * di mescolare per sbaglio euro e centesimi.
 */
export type Cents = number & { readonly __brand: unique symbol }

const EURO_FRACTION = 100

/** Costruisce dei Cents a partire da un intero gia' in centesimi. */
function fromCents(value: number): Cents {
  return Math.round(value) as Cents
}

export const Money = {
  zero: fromCents(0),

  fromCents,

  /** Converte euro (es. 12.5) in centesimi (1250). */
  fromEuro(value: number): Cents {
    return fromCents(value * EURO_FRACTION)
  },

  /** Converte centesimi in euro. Da usare solo per input/output, mai per i calcoli. */
  toEuro(value: Cents): number {
    return value / EURO_FRACTION
  },

  add(a: Cents, b: Cents): Cents {
    return fromCents(a + b)
  },

  subtract(a: Cents, b: Cents): Cents {
    return fromCents(a - b)
  },

  /**
   * Moltiplica per un fattore non monetario (ore, quantita', maggiorazioni).
   * L'arrotondamento avviene qui una volta sola, non a catena.
   */
  multiply(amount: Cents, factor: number): Cents {
    return fromCents(amount * factor)
  },

  sum(amounts: readonly Cents[]): Cents {
    return fromCents(amounts.reduce<number>((total, amount) => total + amount, 0))
  },

  negate(value: Cents): Cents {
    return fromCents(-value)
  },

  isZero(value: Cents): boolean {
    return value === 0
  },

  isNegative(value: Cents): boolean {
    return value < 0
  },

  compare(a: Cents, b: Cents): number {
    return a - b
  },

  /**
   * Percentuale di `part` su `total`, arrotondata a un decimale.
   * Se il totale e' zero ritorna 0 invece di NaN o Infinity: nella dashboard
   * un cantiere senza budget deve mostrare 0%, non "NaN%".
   */
  percentOf(part: Cents, total: Cents): number {
    if (total === 0) return 0
    return Math.round((part / total) * 1000) / 10
  },

  /** Formato italiano con simbolo: "1.234,50 €". */
  format(value: Cents): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(Money.toEuro(value))
  },

  /** Formato compatto per i widget stretti della dashboard: "12,3k €". */
  formatCompact(value: Cents): string {
    const euro = Money.toEuro(value)
    if (Math.abs(euro) < 10_000) return Money.format(value)
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(euro)
  },
}
