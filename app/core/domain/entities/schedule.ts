import type { Minutes } from '../value-objects/duration'
import type { DateKey } from '../value-objects/date-key'
import type { Entity, EntityId } from './common'

/**
 * Programmazione di un cantiere per una giornata.
 *
 * E' una previsione, non un consuntivo: dice quante ore si contano di fare su
 * un cantiere in un giorno futuro, per organizzare le squadre in anticipo. Non
 * ha alcun legame con Worklog, che registra le ore effettivamente lavorate: un
 * giorno puo' avere una programmazione senza ore registrate (deve ancora
 * succedere) o ore registrate diverse da quelle programmate (e' andata
 * diversamente dal previsto), e va bene cosi'.
 */
export interface ScheduleEntry extends Entity {
  date: DateKey
  siteId: EntityId
  plannedMinutes: Minutes
  notes: string
}

export type ScheduleEntryId = EntityId
