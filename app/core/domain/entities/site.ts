import type { Cents } from '../value-objects/money'
import type { DateKey } from '../value-objects/date-key'
import type { ClientId } from './client'
import type { Entity, EntityId, SelectOption } from './common'

export type SiteStatus = 'preventivo' | 'attivo' | 'sospeso' | 'chiuso' | 'archiviato'

export interface Site extends Entity {
  clientId: ClientId
  /** Codice commessa interno, quello che si scrive sui documenti: "C-2026-014". */
  code: string
  name: string
  address: string
  city: string
  province: string
  /**
   * Importo di preventivo, cioe' quanto ci si aspetta di spendere.
   * Il confronto preventivo/consuntivo si fa su questo numero.
   */
  budgetCents: Cents
  startDate: DateKey
  expectedEndDate: DateKey | null
  actualEndDate: DateKey | null
  status: SiteStatus
  notes: string
}

/**
 * Sottofase di un cantiere (fondazioni, murature, copertura...).
 *
 * Vive in una collection separata e non annidata dentro Site: le fasi si
 * aggiungono e riordinano spesso a cantiere aperto, e tenerle fuori evita di
 * riscrivere il documento del cantiere a ogni modifica.
 */
export interface SitePhase extends Entity {
  siteId: EntityId
  name: string
  /** Posizione nell'elenco, per il riordino manuale. */
  order: number
  /**
   * Budget di fase, opzionale.
   * Nasce null: si parte con il preventivo unico sul cantiere e si dettaglia
   * per fase solo dove serve davvero, senza dover compilare tutto.
   */
  budgetCents: Cents | null
  completed: boolean
}

export type SiteId = EntityId

/** Gli stati in cui un cantiere assorbe ancora costi e ore. */
export const OPEN_SITE_STATUSES: readonly SiteStatus[] = ['attivo', 'sospeso']

export function isSiteOpen(site: Site): boolean {
  return OPEN_SITE_STATUSES.includes(site.status)
}

/** Un cantiere archiviato sparisce dalle select ma resta nei report storici. */
export function isSiteSelectable(site: Site): boolean {
  return site.status !== 'archiviato'
}

export function siteLabel(site: Site): string {
  return `${site.code} — ${site.name}`
}

export const SITE_STATUS_OPTIONS: SelectOption<SiteStatus>[] = [
  { label: 'Preventivo', value: 'preventivo', severity: 'secondary', icon: 'pi pi-file-edit' },
  { label: 'Attivo', value: 'attivo', severity: 'success', icon: 'pi pi-play-circle' },
  { label: 'Sospeso', value: 'sospeso', severity: 'warn', icon: 'pi pi-pause-circle' },
  { label: 'Chiuso', value: 'chiuso', severity: 'info', icon: 'pi pi-check-circle' },
  { label: 'Archiviato', value: 'archiviato', severity: 'contrast', icon: 'pi pi-inbox' },
]

/** Fasi proposte alla creazione di un cantiere nuovo, poi modificabili. */
export const DEFAULT_SITE_PHASES: readonly string[] = [
  'Scavi e fondazioni',
  'Murature',
  'Copertura',
  'Impianti',
  'Intonaci',
  'Finiture',
]
