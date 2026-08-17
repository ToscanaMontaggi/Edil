import type {
  Client,
  DateRange,
  Draft,
  Employee,
  Entity,
  EntityId,
  Expense,
  FixedExpense,
  Invoice,
  Patch,
  Site,
  SitePhase,
  Worklog,
} from '../domain'

/**
 * Porte del dominio verso la persistenza.
 *
 * Sono le uniche interfacce che le feature conoscono. Nessuno store, composable
 * o componente sa se i dati arrivano da un array in memoria o da Firestore:
 * dipendono da queste astrazioni e non dall'implementazione (inversione delle
 * dipendenze). E' quello che permette oggi di lavorare senza backend e domani
 * di collegare Firebase cambiando solo il file che costruisce il contenitore.
 *
 * Lettura e scrittura sono separate (segregazione delle interfacce): una vista
 * di sola consultazione dichiara `ReadableRepository` e non si porta dietro
 * metodi che non potra' mai chiamare.
 */

export interface ReadableRepository<T extends Entity> {
  list(): Promise<T[]>
  findById(id: EntityId): Promise<T | null>
}

export interface WritableRepository<T extends Entity> {
  create(draft: Draft<T>): Promise<T>
  update(id: EntityId, patch: Patch<T>): Promise<T>
  remove(id: EntityId): Promise<void>
}

export interface CrudRepository<T extends Entity>
  extends ReadableRepository<T>, WritableRepository<T> {}

export type ClientRepository = CrudRepository<Client>

export type EmployeeRepository = CrudRepository<Employee>

export type SiteRepository = CrudRepository<Site>

export interface SitePhaseRepository extends CrudRepository<SitePhase> {
  listBySite(siteId: EntityId): Promise<SitePhase[]>
  /** Salva l'ordine dopo un riordino manuale, in una sola operazione. */
  reorder(siteId: EntityId, orderedIds: EntityId[]): Promise<void>
}

export interface WorklogRepository extends CrudRepository<Worklog> {
  listByRange(range: DateRange): Promise<Worklog[]>
  listBySite(siteId: EntityId): Promise<Worklog[]>
  listByEmployee(employeeId: EntityId): Promise<Worklog[]>
  /**
   * Inserimento massivo: la schermata ore di fine giornata registra tutta la
   * squadra in un colpo solo. Un metodo dedicato permette all'implementazione
   * Firestore di usare un batch write invece di N chiamate separate.
   */
  createMany(drafts: Draft<Worklog>[]): Promise<Worklog[]>
}

export interface ExpenseRepository extends CrudRepository<Expense> {
  listByRange(range: DateRange): Promise<Expense[]>
  listBySite(siteId: EntityId): Promise<Expense[]>
}

export type FixedExpenseRepository = CrudRepository<FixedExpense>

export interface InvoiceRepository extends CrudRepository<Invoice> {
  listBySite(siteId: EntityId): Promise<Invoice[]>
  listByClient(clientId: EntityId): Promise<Invoice[]>
}
