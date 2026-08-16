import type { Cents } from '../value-objects/money'
import { Money } from '../value-objects/money'
import type { Minutes } from '../value-objects/duration'
import type { Site } from '../entities/site'
import type { Worklog } from '../entities/worklog'
import type { Expense, ExpenseCategory } from '../entities/expense'
import { EXPENSE_CATEGORY_OPTIONS } from '../entities/expense'
import type { Invoice } from '../entities/invoice'
import { invoiceSignedAmount, isInvoicePaid } from '../entities/invoice'
import { sumLaborCost, sumOvertimeMinutes, sumTotalMinutes } from './labor-cost'

/**
 * Consuntivo di un cantiere.
 *
 * E' la struttura che alimenta la scheda cantiere, la dashboard e i report.
 * Viene calcolata a partire dalle righe grezze: nella fase mock si fa tutto
 * qui in memoria, quando arrivera' Firestore la stessa struttura sara'
 * prodotta da una Cloud Function e salvata in `sites/{id}/totals`. Il resto
 * dell'applicazione non se ne accorgera', perche' consuma questo tipo e non
 * il modo in cui viene ottenuto.
 */
export interface SiteSummary {
  siteId: string

  /** Costi sostenuti */
  laborCents: Cents
  expensesByCategory: Record<ExpenseCategory, Cents>
  expensesTotalCents: Cents
  totalCostCents: Cents

  /** Ore */
  totalMinutes: Minutes
  overtimeMinutes: Minutes

  /** Preventivo */
  budgetCents: Cents
  /** Quanto resta del preventivo. Negativo se si e' sforato. */
  budgetRemainingCents: Cents
  budgetUsedPercent: number
  isOverBudget: boolean

  /** Ricavi */
  invoicedCents: Cents
  collectedCents: Cents
  pendingCents: Cents

  /**
   * Margine reale: fatturato meno costi sostenuti.
   * Ha senso solo a lavori conclusi o confrontato con l'avanzamento; a meta'
   * cantiere e' normale che sia negativo se non si e' ancora fatturato.
   */
  marginCents: Cents
  marginPercent: number
}

function emptyCategoryTotals(): Record<ExpenseCategory, Cents> {
  return Object.fromEntries(
    EXPENSE_CATEGORY_OPTIONS.map(option => [option.value, Money.zero]),
  ) as Record<ExpenseCategory, Cents>
}

/**
 * Raggruppa i costi per categoria.
 * Parte da tutte le categorie a zero cosi' i grafici hanno sempre le stesse
 * fette e la legenda non cambia forma quando una categoria non ha movimenti.
 */
export function groupExpensesByCategory(expenses: readonly Expense[]): Record<ExpenseCategory, Cents> {
  const totals = emptyCategoryTotals()
  for (const expense of expenses) {
    totals[expense.category] = Money.add(totals[expense.category], expense.amountCents)
  }
  return totals
}

export function calculateSiteSummary(input: {
  site: Site
  worklogs: readonly Worklog[]
  expenses: readonly Expense[]
  invoices: readonly Invoice[]
}): SiteSummary {
  const { site, worklogs, expenses, invoices } = input

  const laborCents = sumLaborCost(worklogs)
  const expensesByCategory = groupExpensesByCategory(expenses)
  const expensesTotalCents = Money.sum(expenses.map(expense => expense.amountCents))
  const totalCostCents = Money.add(laborCents, expensesTotalCents)

  const invoicedCents = Money.sum(invoices.map(invoiceSignedAmount))
  const collectedCents = Money.sum(invoices.filter(isInvoicePaid).map(invoiceSignedAmount))
  const pendingCents = Money.subtract(invoicedCents, collectedCents)

  const marginCents = Money.subtract(invoicedCents, totalCostCents)
  const budgetRemainingCents = Money.subtract(site.budgetCents, totalCostCents)

  return {
    siteId: site.id,

    laborCents,
    expensesByCategory,
    expensesTotalCents,
    totalCostCents,

    totalMinutes: sumTotalMinutes(worklogs),
    overtimeMinutes: sumOvertimeMinutes(worklogs),

    budgetCents: site.budgetCents,
    budgetRemainingCents,
    budgetUsedPercent: Money.percentOf(totalCostCents, site.budgetCents),
    isOverBudget: Money.isNegative(budgetRemainingCents),

    invoicedCents,
    collectedCents,
    pendingCents,

    marginCents,
    /** Percentuale sul fatturato: e' il margine come lo legge un imprenditore. */
    marginPercent: Money.percentOf(marginCents, invoicedCents),
  }
}

/** Summary vuoto, per i cantieri senza movimenti e come stato iniziale dei componenti. */
export function emptySiteSummary(site: Site): SiteSummary {
  return calculateSiteSummary({ site, worklogs: [], expenses: [], invoices: [] })
}
