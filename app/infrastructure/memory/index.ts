import type { DataSource } from '~/core/ports'
import { InMemoryRepository } from './in-memory-repository'
import {
  InMemoryExpenseRepository,
  InMemoryInvoiceRepository,
  InMemorySitePhaseRepository,
  InMemoryWorklogRepository,
} from './repositories'
import { MockAuth } from './mock-auth'
import { buildDemoData } from './seed/demo-data'

/**
 * Costruisce la sorgente dati in memoria con i dati dimostrativi.
 *
 * E' una delle due implementazioni possibili di DataSource. L'altra, quella
 * Firebase, andra' in `~/infrastructure/firebase` ed esportera' una funzione
 * con questa identica firma: a quel punto si cambia una riga nel plugin e
 * l'applicazione passa al backend reale senza altre modifiche.
 */
export function createMemoryDataSource(): DataSource {
  const data = buildDemoData()

  return {
    auth: new MockAuth(),
    clients: new InMemoryRepository(data.clients),
    employees: new InMemoryRepository(data.employees),
    sites: new InMemoryRepository(data.sites),
    phases: new InMemorySitePhaseRepository(data.phases),
    worklogs: new InMemoryWorklogRepository(data.worklogs),
    expenses: new InMemoryExpenseRepository(data.expenses),
    fixedExpenses: new InMemoryRepository(data.fixedExpenses),
    invoices: new InMemoryInvoiceRepository(data.invoices),
  }
}
