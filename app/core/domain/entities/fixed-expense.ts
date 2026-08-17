import type { Cents } from '../value-objects/money'
import type { DateKey } from '../value-objects/date-key'
import type { Entity, EntityId, SelectOption } from './common'

export type FixedExpenseCategory =
  | 'affitto'
  | 'utenze'
  | 'assicurazioni'
  | 'leasing'
  | 'personale'
  | 'varie'

/**
 * Spesa fissa aziendale: affitto, utenze, assicurazioni, leasing...
 *
 * A differenza di Expense non e' legata a un cantiere: e' un costo generale
 * dell'impresa che va ammortizzato sul complesso delle commesse, non su una
 * sola. Vive percio' in una collection separata invece che con siteId nullo,
 * cosi' i report per cantiere restano query dirette senza dover escludere
 * righe "generali" ogni volta.
 */
export interface FixedExpense extends Entity {
  date: DateKey
  category: FixedExpenseCategory
  description: string
  amountCents: Cents
  supplier: string
  documentRef: string
  notes: string
}

export type FixedExpenseId = EntityId

export const FIXED_EXPENSE_CATEGORY_OPTIONS: SelectOption<FixedExpenseCategory>[] = [
  { label: 'Affitto', value: 'affitto', icon: 'pi pi-building' },
  { label: 'Utenze', value: 'utenze', icon: 'pi pi-bolt' },
  { label: 'Assicurazioni', value: 'assicurazioni', icon: 'pi pi-shield' },
  { label: 'Leasing e finanziamenti', value: 'leasing', icon: 'pi pi-credit-card' },
  { label: 'Personale amministrativo', value: 'personale', icon: 'pi pi-users' },
  { label: 'Varie', value: 'varie', icon: 'pi pi-ellipsis-h' },
]

/** Colore fisso per categoria, stesso ruolo di EXPENSE_CATEGORY_COLORS. */
export const FIXED_EXPENSE_CATEGORY_COLORS: Record<FixedExpenseCategory, string> = {
  affitto: '#3b82f6',
  utenze: '#f59e0b',
  assicurazioni: '#14b8a6',
  leasing: '#8b5cf6',
  personale: '#ec4899',
  varie: '#94a3b8',
}

export function fixedExpenseCategoryLabel(category: FixedExpenseCategory): string {
  return FIXED_EXPENSE_CATEGORY_OPTIONS.find(option => option.value === category)?.label ?? category
}

/** Colore per il totale spese fisse nei grafici che le mostrano come un'unica voce, non per categoria. */
export const FIXED_EXPENSE_LEDGER_COLOR = '#0ea5e9'
