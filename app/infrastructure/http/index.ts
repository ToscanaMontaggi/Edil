import type { DataSource } from '~/core/ports'
import { HttpAuthPort } from './http-auth-port'
import { HttpRepository } from './http-repository'
import {
  HttpExpenseRepository,
  HttpInvoiceRepository,
  HttpScheduleRepository,
  HttpSitePhaseRepository,
  HttpWorklogRepository,
} from './http-repositories'

/**
 * Costruisce la sorgente dati reale, appoggiata alle rotte /api/** e a
 * Postgres. Stessa forma esatta di createMemoryDataSource, nessun dato seed:
 * l'applicazione parte vuota e cresce con quello che l'utente inserisce.
 */
export function createHttpDataSource(): DataSource {
  return {
    auth: new HttpAuthPort(),
    clients: new HttpRepository('/api/clients'),
    employees: new HttpRepository('/api/employees'),
    sites: new HttpRepository('/api/sites'),
    phases: new HttpSitePhaseRepository('/api/phases'),
    worklogs: new HttpWorklogRepository('/api/worklogs'),
    schedule: new HttpScheduleRepository('/api/schedule'),
    expenses: new HttpExpenseRepository('/api/expenses'),
    fixedExpenses: new HttpRepository('/api/fixed-expenses'),
    invoices: new HttpInvoiceRepository('/api/invoices'),
  }
}
