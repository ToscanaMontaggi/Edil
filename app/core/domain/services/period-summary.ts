import type { Cents } from '../value-objects/money'
import { Money } from '../value-objects/money'
import type { Minutes } from '../value-objects/duration'
import type { DateKey, MonthKey } from '../value-objects/date-key'
import { DateKeys, MonthKeys } from '../value-objects/date-key'
import type { Worklog } from '../entities/worklog'
import type { Expense } from '../entities/expense'
import type { FixedExpense } from '../entities/fixed-expense'
import type { Invoice } from '../entities/invoice'
import { invoiceSignedAmount } from '../entities/invoice'
import type { DateRange } from '../entities/common'
import { sumLaborCost, sumTotalMinutes } from './labor-cost'

/**
 * Aggregazioni per periodo: alimentano la dashboard e i grafici temporali.
 * Anche qui solo funzioni pure sugli array grezzi.
 */

export interface PeriodTotals {
  laborCents: Cents
  expensesCents: Cents
  /** Spese fisse (affitto, utenze, assicurazioni...) cadute nel periodo: non sono di cantiere ma pesano sui costi dell'impresa. */
  fixedExpensesCents: Cents
  totalCostCents: Cents
  invoicedCents: Cents
  marginCents: Cents
  minutes: Minutes
}

export interface MonthlyTotals extends PeriodTotals {
  month: MonthKey
}

/** Filtra per intervallo di date qualunque cosa abbia un campo `date`. */
export function withinRange<T extends { date: DateKey }>(items: readonly T[], range: DateRange): T[] {
  return items.filter(item => DateKeys.isWithin(item.date, range.from, range.to))
}

export function onDate<T extends { date: DateKey }>(items: readonly T[], date: DateKey): T[] {
  return items.filter(item => item.date === date)
}

export function inMonth<T extends { date: DateKey }>(items: readonly T[], month: MonthKey): T[] {
  return items.filter(item => DateKeys.month(item.date) === month)
}

export function calculatePeriodTotals(input: {
  worklogs: readonly Worklog[]
  expenses: readonly Expense[]
  fixedExpenses: readonly FixedExpense[]
  invoices: readonly Invoice[]
}): PeriodTotals {
  const laborCents = sumLaborCost(input.worklogs)
  const expensesCents = Money.sum(input.expenses.map(expense => expense.amountCents))
  const fixedExpensesCents = Money.sum(input.fixedExpenses.map(expense => expense.amountCents))
  const totalCostCents = Money.add(Money.add(laborCents, expensesCents), fixedExpensesCents)
  const invoicedCents = Money.sum(input.invoices.map(invoiceSignedAmount))

  return {
    laborCents,
    expensesCents,
    fixedExpensesCents,
    totalCostCents,
    invoicedCents,
    marginCents: Money.subtract(invoicedCents, totalCostCents),
    minutes: sumTotalMinutes(input.worklogs),
  }
}

/**
 * Serie mensile continua sugli ultimi N mesi.
 * I mesi senza movimenti restano presenti con valori a zero: un grafico a barre
 * con i buchi saltati mentirebbe sull'andamento.
 */
export function calculateMonthlySeries(input: {
  worklogs: readonly Worklog[]
  expenses: readonly Expense[]
  fixedExpenses: readonly FixedExpense[]
  invoices: readonly Invoice[]
  months: number
  until?: MonthKey
}): MonthlyTotals[] {
  const { worklogs, expenses, fixedExpenses, invoices, months, until } = input

  return MonthKeys.lastMonths(months, until).map(month => ({
    month,
    ...calculatePeriodTotals({
      worklogs: inMonth(worklogs, month),
      expenses: inMonth(expenses, month),
      fixedExpenses: inMonth(fixedExpenses, month),
      invoices: inMonth(invoices, month),
    }),
  }))
}

/** Raggruppa un totale per chiave arbitraria: per cantiere, per operaio, per categoria. */
export function sumBy<T>(items: readonly T[], key: (item: T) => string, amount: (item: T) => Cents): Map<string, Cents> {
  const totals = new Map<string, Cents>()
  for (const item of items) {
    const group = key(item)
    totals.set(group, Money.add(totals.get(group) ?? Money.zero, amount(item)))
  }
  return totals
}

/** Le prime N voci di un raggruppamento, ordinate per importo decrescente. */
export function topEntries(totals: Map<string, Cents>, limit: number): Array<{ key: string, value: Cents }> {
  return [...totals.entries()]
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => Money.compare(b.value, a.value))
    .slice(0, limit)
}
