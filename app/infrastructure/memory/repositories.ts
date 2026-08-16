import type {
  DateRange,
  Draft,
  EntityId,
  Expense,
  Invoice,
  SitePhase,
  Worklog,
} from '~/core/domain'
import { DateKeys } from '~/core/domain'
import type {
  ExpenseRepository,
  InvoiceRepository,
  SitePhaseRepository,
  WorklogRepository,
} from '~/core/ports'
import { InMemoryRepository } from './in-memory-repository'

/**
 * Repository specifici in memoria.
 *
 * Ereditano tutto il CRUD e aggiungono solo le query dichiarate nelle porte.
 * Ogni filtro qui e' scritto in modo da corrispondere a una query Firestore
 * realmente eseguibile (uguaglianza su un campo, oppure range sul campo data),
 * cosi' non si costruisce l'interfaccia su ricerche che poi il database non
 * saprebbe fare senza scaricare tutta la collection.
 */

export class InMemorySitePhaseRepository
  extends InMemoryRepository<SitePhase>
  implements SitePhaseRepository {
  async listBySite(siteId: EntityId): Promise<SitePhase[]> {
    const phases = this.all()
      .filter(phase => phase.siteId === siteId)
      .sort((a, b) => a.order - b.order)
    return this.clone(phases)
  }

  async reorder(siteId: EntityId, orderedIds: EntityId[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const phase = this.items.get(id)
      if (phase && phase.siteId === siteId) {
        this.items.set(id, { ...phase, order: index, updatedAt: new Date().toISOString() })
      }
    })
  }
}

export class InMemoryWorklogRepository
  extends InMemoryRepository<Worklog>
  implements WorklogRepository {
  async listByRange(range: DateRange): Promise<Worklog[]> {
    const worklogs = this.all()
      .filter(worklog => DateKeys.isWithin(worklog.date, range.from, range.to))
      .sort((a, b) => b.date.localeCompare(a.date))
    return this.clone(worklogs)
  }

  async listBySite(siteId: EntityId): Promise<Worklog[]> {
    return this.clone(this.all().filter(worklog => worklog.siteId === siteId))
  }

  async listByEmployee(employeeId: EntityId): Promise<Worklog[]> {
    return this.clone(this.all().filter(worklog => worklog.employeeId === employeeId))
  }

  async createMany(drafts: Draft<Worklog>[]): Promise<Worklog[]> {
    return this.createBatch(drafts)
  }
}

export class InMemoryExpenseRepository
  extends InMemoryRepository<Expense>
  implements ExpenseRepository {
  async listByRange(range: DateRange): Promise<Expense[]> {
    const expenses = this.all()
      .filter(expense => DateKeys.isWithin(expense.date, range.from, range.to))
      .sort((a, b) => b.date.localeCompare(a.date))
    return this.clone(expenses)
  }

  async listBySite(siteId: EntityId): Promise<Expense[]> {
    return this.clone(this.all().filter(expense => expense.siteId === siteId))
  }
}

export class InMemoryInvoiceRepository
  extends InMemoryRepository<Invoice>
  implements InvoiceRepository {
  async listBySite(siteId: EntityId): Promise<Invoice[]> {
    return this.clone(this.all().filter(invoice => invoice.siteId === siteId))
  }

  async listByClient(clientId: EntityId): Promise<Invoice[]> {
    return this.clone(this.all().filter(invoice => invoice.clientId === clientId))
  }
}
