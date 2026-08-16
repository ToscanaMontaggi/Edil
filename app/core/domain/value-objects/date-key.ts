/**
 * Chiavi di data.
 *
 * Le date si salvano come stringa "YYYY-MM-DD" e non come Date o Timestamp.
 * Motivi: sono ordinabili alfabeticamente, si filtrano con >= e <= senza
 * conversioni, e soprattutto non hanno fuso orario. Una giornata di lavoro in
 * cantiere e' un giorno di calendario, non un istante nel tempo.
 *
 * Attenzione: qui NON si usa mai toISOString(). Quel metodo converte in UTC,
 * quindi una registrazione fatta alle 00:30 italiane finirebbe salvata al
 * giorno prima. Si legge sempre il calendario locale.
 */
export type DateKey = string & { readonly __dateKey: unique symbol }

/** Chiave di mese "YYYY-MM", usata per gli aggregati e i riepiloghi mensili. */
export type MonthKey = string & { readonly __monthKey: unique symbol }

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/

const MONTH_NAMES = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export const DateKeys = {
  /** Costruisce la chiave leggendo il calendario locale della Date passata. */
  fromDate(date: Date): DateKey {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as DateKey
  },

  today(): DateKey {
    return DateKeys.fromDate(new Date())
  },

  /** Date locale a mezzanotte, per i componenti calendario di PrimeVue. */
  toDate(key: DateKey): Date {
    const [year, month, day] = key.split('-').map(Number)
    return new Date(year!, month! - 1, day!)
  },

  isValid(value: string): value is DateKey {
    return DATE_KEY_PATTERN.test(value) && !Number.isNaN(DateKeys.toDate(value as DateKey).getTime())
  },

  /** Estrae il mese di appartenenza: "2026-08-15" -> "2026-08". */
  month(key: DateKey): MonthKey {
    return key.slice(0, 7) as MonthKey
  },

  year(key: DateKey): number {
    return Number(key.slice(0, 4))
  },

  /** Sposta di N giorni, gestendo cambi di mese e anno. */
  addDays(key: DateKey, days: number): DateKey {
    const date = DateKeys.toDate(key)
    date.setDate(date.getDate() + days)
    return DateKeys.fromDate(date)
  },

  /** Vero se la data cade nell'intervallo, estremi inclusi. */
  isWithin(key: DateKey, from: DateKey, to: DateKey): boolean {
    return key >= from && key <= to
  },

  /** Formato italiano breve: "15/08/2026". */
  format(key: DateKey): string {
    const [year, month, day] = key.split('-')
    return `${day}/${month}/${year}`
  },

  /** Formato esteso: "15 agosto 2026". */
  formatLong(key: DateKey): string {
    const date = DateKeys.toDate(key)
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
  },

  /**
   * Giorni che mancano a una scadenza: negativo se gia' passata.
   * E' il numero che alimenta i semafori dei documenti in scadenza.
   */
  daysUntil(key: DateKey, from: DateKey = DateKeys.today()): number {
    const millisPerDay = 24 * 60 * 60 * 1000
    const diff = DateKeys.toDate(key).getTime() - DateKeys.toDate(from).getTime()
    return Math.round(diff / millisPerDay)
  },
}

export const MonthKeys = {
  fromDate(date: Date): MonthKey {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}` as MonthKey
  },

  current(): MonthKey {
    return MonthKeys.fromDate(new Date())
  },

  isValid(value: string): value is MonthKey {
    return MONTH_KEY_PATTERN.test(value)
  },

  /** Primo giorno del mese, come DateKey. */
  firstDay(key: MonthKey): DateKey {
    return `${key}-01` as DateKey
  },

  /** Ultimo giorno del mese, calcolato senza tabelle: giorno 0 del mese dopo. */
  lastDay(key: MonthKey): DateKey {
    const [year, month] = key.split('-').map(Number)
    return DateKeys.fromDate(new Date(year!, month!, 0))
  },

  addMonths(key: MonthKey, months: number): MonthKey {
    const [year, month] = key.split('-').map(Number)
    return MonthKeys.fromDate(new Date(year!, month! - 1 + months, 1))
  },

  /** Etichetta per grafici e filtri: "agosto 2026". */
  format(key: MonthKey): string {
    const [year, month] = key.split('-').map(Number)
    return `${MONTH_NAMES[month! - 1]} ${year}`
  },

  /** Etichetta compatta per gli assi dei grafici: "ago 26". */
  formatShort(key: MonthKey): string {
    const [year, month] = key.split('-').map(Number)
    return `${MONTH_NAMES[month! - 1]!.slice(0, 3)} ${String(year).slice(2)}`
  },

  /** Gli ultimi N mesi in ordine cronologico, incluso quello indicato. */
  lastMonths(count: number, until: MonthKey = MonthKeys.current()): MonthKey[] {
    return Array.from({ length: count }, (_, index) =>
      MonthKeys.addMonths(until, index - count + 1),
    )
  },
}
