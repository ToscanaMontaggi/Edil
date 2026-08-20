/**
 * Punto di ingresso unico del dominio.
 *
 * Il resto dell'applicazione importa da qui e mai dai singoli file interni:
 * cosi' la struttura del dominio si puo' riorganizzare senza toccare le
 * feature, e le dipendenze restano tutte in una direzione sola.
 */

export * from './value-objects/money'
export * from './value-objects/duration'
export * from './value-objects/date-key'

export * from './entities/common'
export * from './entities/client'
export * from './entities/employee'
export * from './entities/site'
export * from './entities/worklog'
export * from './entities/schedule'
export * from './entities/expense'
export * from './entities/fixed-expense'
export * from './entities/invoice'

export * from './services/labor-cost'
export * from './services/site-summary'
export * from './services/period-summary'
