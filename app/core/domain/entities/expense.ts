import type { Cents } from '../value-objects/money'
import type { DateKey } from '../value-objects/date-key'
import type { Entity, EntityId, SelectOption } from './common'

export type ExpenseCategory =
  | 'materiali'
  | 'carburante'
  | 'smaltimenti'
  | 'noleggi'
  | 'attrezzature'
  | 'subappalti'
  | 'varie'

/**
 * Allegato di un costo: fattura, scontrino, foto del DDT.
 *
 * Finche' non c'e' Firebase Storage il file non esiste davvero, ma il modello
 * lo prevede gia' cosi' l'interfaccia non va rifatta quando si collega.
 */
export interface Attachment {
  id: EntityId
  fileName: string
  /** Path nel bucket. Vuoto nella fase mock. */
  storagePath: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
}

export interface Expense extends Entity {
  date: DateKey
  siteId: EntityId
  phaseId: EntityId | null
  category: ExpenseCategory
  description: string
  /** Imponibile, IVA esclusa: e' il costo vero per l'azienda. */
  amountCents: Cents
  supplier: string
  /** Numero della fattura passiva o dello scontrino, per ritrovare il documento. */
  documentRef: string
  attachments: Attachment[]
  notes: string
}

export type ExpenseId = EntityId

export const EXPENSE_CATEGORY_OPTIONS: SelectOption<ExpenseCategory>[] = [
  { label: 'Materiali', value: 'materiali', icon: 'pi pi-box' },
  { label: 'Carburante', value: 'carburante', icon: 'pi pi-bolt' },
  { label: 'Smaltimenti', value: 'smaltimenti', icon: 'pi pi-trash' },
  { label: 'Noleggi', value: 'noleggi', icon: 'pi pi-truck' },
  { label: 'Attrezzature', value: 'attrezzature', icon: 'pi pi-wrench' },
  { label: 'Subappalti', value: 'subappalti', icon: 'pi pi-users' },
  { label: 'Spese varie', value: 'varie', icon: 'pi pi-ellipsis-h' },
]

/**
 * Colore fisso per categoria, condiviso da grafici e tag.
 * Sta qui e non nei componenti perche' la stessa categoria deve avere lo stesso
 * colore nella torta, nella tabella e nella legenda.
 */
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  materiali: '#3b82f6',
  carburante: '#f59e0b',
  smaltimenti: '#84cc16',
  noleggi: '#8b5cf6',
  attrezzature: '#06b6d4',
  subappalti: '#ec4899',
  varie: '#94a3b8',
}

/** Colore della manodopera: non e' una categoria di spesa ma entra negli stessi grafici. */
export const LABOR_COLOR = '#ef4444'

export function expenseCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_OPTIONS.find(option => option.value === category)?.label ?? category
}

export function expenseCategoryIcon(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_OPTIONS.find(option => option.value === category)?.icon ?? 'pi pi-tag'
}
