import type { AuthPort } from './auth'
import type {
  ClientRepository,
  EmployeeRepository,
  ExpenseRepository,
  FixedExpenseRepository,
  InvoiceRepository,
  SitePhaseRepository,
  SiteRepository,
  WorklogRepository,
} from './repositories'

export * from './auth'
export * from './repositories'

/**
 * Contenitore delle dipendenze dell'applicazione.
 *
 * Esiste una sola implementazione attiva alla volta, scelta all'avvio dal
 * plugin Nuxt. Oggi e' quella in memoria, domani sara' quella Firebase: e'
 * l'unico punto del progetto che dovra' cambiare per fare quel passaggio.
 */
export interface DataSource {
  auth: AuthPort
  clients: ClientRepository
  employees: EmployeeRepository
  sites: SiteRepository
  phases: SitePhaseRepository
  worklogs: WorklogRepository
  expenses: ExpenseRepository
  fixedExpenses: FixedExpenseRepository
  invoices: InvoiceRepository
}
