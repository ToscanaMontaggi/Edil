import type { DateKey } from '../value-objects/date-key'

export type EntityId = string

/**
 * Campi comuni a tutto cio' che viene persistito.
 * `createdAt`/`updatedAt` sono ISO string e non Date: sopravvivono alla
 * serializzazione dello store e al passaggio da/verso Firestore senza
 * conversioni sparse per il codice.
 */
export interface Entity {
  id: EntityId
  createdAt: string
  updatedAt: string
}

/**
 * La forma con cui un'entita' arriva dai form: senza i campi che genera
 * l'infrastruttura. Evita di dover scrivere a mano una interface "NuovoOperaio"
 * per ogni entita' e di doverla tenere allineata.
 */
export type Draft<T extends Entity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

/** Patch parziale per gli update. L'id viaggia separato, non nel corpo. */
export type Patch<T extends Entity> = Partial<Draft<T>>

/** Intervallo di date usato da filtri, report e query sui periodi. */
export interface DateRange {
  from: DateKey
  to: DateKey
}

/**
 * Stato di una scadenza documentale.
 * Il semaforo della dashboard mappa direttamente su questi tre valori.
 */
export type ExpiryStatus = 'valid' | 'expiring' | 'expired'

/** Opzione per select e filtri: la usano tutti i componenti condivisi. */
export interface SelectOption<T = string> {
  label: string
  value: T
  /** Classe/severita' PrimeVue opzionale, per le opzioni colorate come gli stati. */
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'
  icon?: string
}
