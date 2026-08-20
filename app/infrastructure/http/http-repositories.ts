import type {
  DateRange,
  Draft,
  EntityId,
  Expense,
  Invoice,
  ScheduleEntry,
  SitePhase,
  Worklog,
} from '~/core/domain'
import type {
  ExpenseRepository,
  InvoiceRepository,
  ScheduleRepository,
  SitePhaseRepository,
  WorklogRepository,
} from '~/core/ports'
import { HttpRepository } from './http-repository'

export class HttpSitePhaseRepository extends HttpRepository<SitePhase> implements SitePhaseRepository {
  async listBySite(siteId: EntityId): Promise<SitePhase[]> {
    return $fetch<SitePhase[]>(this.basePath, { query: { siteId } })
  }

  async reorder(siteId: EntityId, orderedIds: EntityId[]): Promise<void> {
    await $fetch(`${this.basePath}/reorder`, { method: 'POST', body: { siteId, orderedIds } })
  }
}

export class HttpWorklogRepository extends HttpRepository<Worklog> implements WorklogRepository {
  async listByRange(range: DateRange): Promise<Worklog[]> {
    return $fetch<Worklog[]>(this.basePath, { query: { from: range.from, to: range.to } })
  }

  async listBySite(siteId: EntityId): Promise<Worklog[]> {
    return $fetch<Worklog[]>(this.basePath, { query: { siteId } })
  }

  async listByEmployee(employeeId: EntityId): Promise<Worklog[]> {
    return $fetch<Worklog[]>(this.basePath, { query: { employeeId } })
  }

  async createMany(drafts: Draft<Worklog>[]): Promise<Worklog[]> {
    return $fetch<Worklog[]>(`${this.basePath}/batch`, { method: 'POST', body: { drafts } })
  }
}

export class HttpScheduleRepository extends HttpRepository<ScheduleEntry> implements ScheduleRepository {
  async listByRange(range: DateRange): Promise<ScheduleEntry[]> {
    return $fetch<ScheduleEntry[]>(this.basePath, { query: { from: range.from, to: range.to } })
  }
}

export class HttpExpenseRepository extends HttpRepository<Expense> implements ExpenseRepository {
  async listByRange(range: DateRange): Promise<Expense[]> {
    return $fetch<Expense[]>(this.basePath, { query: { from: range.from, to: range.to } })
  }

  async listBySite(siteId: EntityId): Promise<Expense[]> {
    return $fetch<Expense[]>(this.basePath, { query: { siteId } })
  }
}

export class HttpInvoiceRepository extends HttpRepository<Invoice> implements InvoiceRepository {
  async listBySite(siteId: EntityId): Promise<Invoice[]> {
    return $fetch<Invoice[]>(this.basePath, { query: { siteId } })
  }

  async listByClient(clientId: EntityId): Promise<Invoice[]> {
    return $fetch<Invoice[]>(this.basePath, { query: { clientId } })
  }
}
