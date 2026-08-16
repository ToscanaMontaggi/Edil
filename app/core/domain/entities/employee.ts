import type { Cents } from '../value-objects/money'
import type { DateKey } from '../value-objects/date-key'
import type { Entity, SelectOption } from './common'

/** Livelli operai del CCNL Edilizia. Gli impiegati tecnici stanno dal 5 in su. */
export type EmployeeLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7'

export type ContractType = 'indeterminato' | 'determinato' | 'apprendistato' | 'stagionale' | 'occasionale'

export type EmployeeStatus = 'attivo' | 'sospeso' | 'cessato'

/**
 * Tariffa di un operaio valida a partire da una certa data.
 *
 * Le tariffe non si sovrascrivono mai: si aggiunge una riga nuova con la nuova
 * decorrenza. Questo permette di ricostruire quanto costava un operaio in un
 * qualsiasi giorno passato, cosa indispensabile perche' i consuntivi degli anni
 * scorsi restino stabili anche dopo un aumento di paga.
 */
export interface EmployeeRate {
  validFrom: DateKey
  /**
   * Costo orario pieno per l'azienda: retribuzione + contributi + accantonamenti.
   * Non e' il lordo in busta paga, e' quanto esce davvero dalla cassa.
   */
  hourlyCostCents: Cents
  /** Maggiorazione straordinario: 1.25 significa +25% sull'ordinario. */
  overtimeMultiplier: number
  /** Indennita' di trasferta giornaliera, riconosciuta a giornata intera. */
  travelAllowanceCents: Cents
}

export interface Employee extends Entity {
  firstName: string
  lastName: string
  taxCode: string
  phone: string
  email: string
  hireDate: DateKey
  /** Valorizzata solo per i cessati. */
  endDate: DateKey | null
  /** Mansione descrittiva: "muratore", "carpentiere", "gruista". */
  qualification: string
  level: EmployeeLevel
  contract: ContractType
  status: EmployeeStatus
  /** Storico tariffe, ordinato per decorrenza decrescente (la piu' recente in testa). */
  rates: EmployeeRate[]
  notes: string
}

/** Nome completo nel formato usato ovunque nelle liste: "Rossi Mario". */
export function employeeFullName(employee: Pick<Employee, 'firstName' | 'lastName'>): string {
  return `${employee.lastName} ${employee.firstName}`.trim()
}

export function employeeInitials(employee: Pick<Employee, 'firstName' | 'lastName'>): string {
  return `${employee.lastName.charAt(0)}${employee.firstName.charAt(0)}`.toUpperCase()
}

/**
 * Tariffa in vigore a una certa data.
 *
 * Scorre lo storico dalla piu' recente e prende la prima che era gia' valida.
 * Ritorna null se l'operaio non aveva ancora una tariffa a quella data: chi
 * chiama deve decidere cosa fare, non si inventa uno zero silenzioso che
 * finirebbe per far sparire dei costi dal consuntivo.
 */
export function rateAt(employee: Employee, date: DateKey): EmployeeRate | null {
  const sorted = [...employee.rates].sort((a, b) => b.validFrom.localeCompare(a.validFrom))
  return sorted.find(rate => rate.validFrom <= date) ?? null
}

/** Tariffa corrente, quella che propone il form di inserimento ore. */
export function currentRate(employee: Employee, today: DateKey): EmployeeRate | null {
  return rateAt(employee, today)
}

export const EMPLOYEE_STATUS_OPTIONS: SelectOption<EmployeeStatus>[] = [
  { label: 'Attivo', value: 'attivo', severity: 'success' },
  { label: 'Sospeso', value: 'sospeso', severity: 'warn' },
  { label: 'Cessato', value: 'cessato', severity: 'danger' },
]

export const CONTRACT_TYPE_OPTIONS: SelectOption<ContractType>[] = [
  { label: 'Tempo indeterminato', value: 'indeterminato' },
  { label: 'Tempo determinato', value: 'determinato' },
  { label: 'Apprendistato', value: 'apprendistato' },
  { label: 'Stagionale', value: 'stagionale' },
  { label: 'Occasionale', value: 'occasionale' },
]

export const EMPLOYEE_LEVEL_OPTIONS: SelectOption<EmployeeLevel>[] = [
  { label: '1 - Operaio comune', value: '1' },
  { label: '2 - Operaio qualificato', value: '2' },
  { label: '3 - Operaio specializzato', value: '3' },
  { label: '4 - Operaio IV livello', value: '4' },
  { label: '5 - Impiegato', value: '5' },
  { label: '6 - Impiegato direttivo', value: '6' },
  { label: '7 - Quadro', value: '7' },
]
