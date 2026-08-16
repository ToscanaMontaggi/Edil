import type { Cents, DateKey, Minutes, MonthKey } from '~/core/domain'
import { DateKeys, Duration, Money, MonthKeys } from '~/core/domain'

/**
 * Formattatori pronti per i template.
 *
 * La logica vera sta nei value object del dominio: qui c'e' solo la comodita' di
 * averli tutti disponibili senza import nei componenti. Avere un punto unico
 * evita che spuntino in giro dieci modi diversi di scrivere un importo.
 */
export function useFormat() {
  return {
    money: (value: Cents) => Money.format(value),
    moneyCompact: (value: Cents) => Money.formatCompact(value),
    euro: (value: Cents) => Money.toEuro(value),

    hours: (value: Minutes) => Duration.format(value),
    decimalHours: (value: Minutes) => Duration.formatHours(value),

    date: (value: DateKey) => DateKeys.format(value),
    dateLong: (value: DateKey) => DateKeys.formatLong(value),
    month: (value: MonthKey) => MonthKeys.format(value),
    monthShort: (value: MonthKey) => MonthKeys.formatShort(value),

    /** Percentuale con un decimale al massimo: "84,2%". */
    percent: (value: number) => `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(value)}%`,

    /** Numero semplice, per i conteggi. */
    number: (value: number) => new Intl.NumberFormat('it-IT').format(value),

    /** Importo col segno esplicito davanti, per margini e scostamenti. */
    signedMoney: (value: Cents) => (value > 0 ? `+${Money.format(value)}` : Money.format(value)),

    /**
     * Conteggio con il sostantivo concordato: "1 fattura", "3 fatture".
     * Serve perche' gli avvisi mostrano un numero variabile e scrivere sempre
     * il plurale fa sembrare l'applicazione tradotta male.
     */
    count: (value: number, singular: string, plural: string) =>
      `${new Intl.NumberFormat('it-IT').format(value)} ${value === 1 ? singular : plural}`,
  }
}
