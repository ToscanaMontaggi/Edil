import type { Cents } from '../value-objects/money'
import type { Minutes } from '../value-objects/duration'
import type { DateKey } from '../value-objects/date-key'
import type { Entity, EntityId } from './common'

/**
 * Fotografia della tariffa al momento della registrazione.
 *
 * E' il pezzo piu' importante del modello. La riga ore NON punta alla tariffa
 * dell'operaio: se la copia. Se domani aumenti la paga a un operaio, i
 * consuntivi dei cantieri gia' chiusi devono restare identici a ieri, perche'
 * quel lavoro e' costato quello che e' costato. Un riferimento vivo alla
 * tariffa corrente farebbe cambiare la storia a ogni aumento.
 */
export interface WorklogRateSnapshot {
  hourlyCostCents: Cents
  overtimeMultiplier: number
  travelAllowanceCents: Cents
}

export interface Worklog extends Entity {
  date: DateKey
  employeeId: EntityId
  siteId: EntityId
  /** Null quando il cantiere non ha fasi o non e' stata indicata. */
  phaseId: EntityId | null
  ordinaryMinutes: Minutes
  overtimeMinutes: Minutes
  /** La trasferta si riconosce a giornata, non in proporzione alle ore. */
  travelAllowance: boolean
  notes: string
  rate: WorklogRateSnapshot
  /**
   * Costo totale della riga, gia' calcolato e salvato.
   * Ridondante rispetto a rate + minuti, ma permette di sommare i costi senza
   * ricalcolare nulla e senza rileggere gli operai.
   */
  laborCostCents: Cents
}

export type WorklogId = EntityId

export function totalMinutes(worklog: Pick<Worklog, 'ordinaryMinutes' | 'overtimeMinutes'>): Minutes {
  return (worklog.ordinaryMinutes + worklog.overtimeMinutes) as Minutes
}

export function hasOvertime(worklog: Pick<Worklog, 'overtimeMinutes'>): boolean {
  return worklog.overtimeMinutes > 0
}
