import type { Cents, DateKey, ExpenseCategory, Invoice, Site } from '~/core/domain'
import {
  DateKeys,
  EXPENSE_CATEGORY_COLORS,
  LABOR_COLOR,
  Money,
  MonthKeys,
  calculateMonthlySeries,
  calculatePeriodTotals,
  calculateSiteSummary,
  expenseCategoryLabel,
  groupExpensesByCategory,
  inMonth,
  invoiceStatus,
  isSiteOpen,
  onDate,
  sumTotalMinutes,
  withinRange,
} from '~/core/domain'

/**
 * Numeri della dashboard.
 *
 * Tutta la lettura dei dati sta qui e la pagina si limita a disporre i
 * riquadri: la schermata resta leggibile e queste stesse grandezze possono
 * essere riusate dai report senza duplicare i conti.
 *
 * I calcoli usano i servizi di dominio, che sono gli stessi che un domani
 * gireranno dentro una Cloud Function per produrre gli aggregati salvati.
 */
export function useDashboardMetrics() {
  const { sites, employees, worklogs, expenses, invoices, loading, loadAll } = useAppData()

  const today = DateKeys.today()
  const currentMonth = MonthKeys.current()

  const openSites = computed(() => sites.items.filter(isSiteOpen))
  const activeEmployees = computed(() => employees.items.filter(employee => employee.status === 'attivo'))

  /**
   * Ultimo giorno con ore registrate.
   * Nel fine settimana o dopo un giorno di fermo il dato di oggi sarebbe zero e
   * la schermata sembrerebbe spenta: si mostra allora l'ultima giornata vera,
   * dicendo chiaramente di quale giorno si tratta.
   */
  const lastRecordedDay = computed<DateKey | null>(() => {
    let latest: DateKey | null = null
    for (const worklog of worklogs.items) {
      if (!latest || worklog.date > latest) latest = worklog.date
    }
    return latest
  })

  const dayShown = computed<DateKey | null>(() => {
    const hasToday = worklogs.items.some(worklog => worklog.date === today)
    return hasToday ? today : lastRecordedDay.value
  })

  const isShowingToday = computed(() => dayShown.value === today)

  const dayWorklogs = computed(() =>
    dayShown.value ? onDate(worklogs.items, dayShown.value) : [],
  )

  const dayMinutes = computed(() => sumTotalMinutes(dayWorklogs.value))

  const dayCost = computed(() => Money.sum(dayWorklogs.value.map(worklog => worklog.laborCostCents)))

  /** Quanti operai diversi hanno lavorato nella giornata mostrata. */
  const presentCount = computed(() => new Set(dayWorklogs.value.map(worklog => worklog.employeeId)).size)

  const monthTotals = computed(() => calculatePeriodTotals({
    worklogs: inMonth(worklogs.items, currentMonth),
    expenses: inMonth(expenses.items, currentMonth),
    invoices: inMonth(invoices.items, currentMonth),
  }))

  /**
   * Stesso periodo del mese scorso, non il mese scorso intero.
   *
   * A meta' mese il confronto fra quindici giorni e trenta darebbe sempre un
   * crollo inventato del cinquanta per cento. Si confrontano quindi i primi N
   * giorni di questo mese con i primi N del precedente, dove N e' il giorno di
   * oggi (limitato all'ultimo giorno del mese scorso, per i mesi corti).
   */
  const previousPeriodTotals = computed(() => {
    const previousMonth = MonthKeys.addMonths(currentMonth, -1)
    const dayOfMonth = Number(today.slice(8, 10))
    const previousLastDay = MonthKeys.lastDay(previousMonth)
    const cappedDay = Math.min(dayOfMonth, Number(previousLastDay.slice(8, 10)))

    const from = MonthKeys.firstDay(previousMonth)
    const to = `${previousMonth}-${String(cappedDay).padStart(2, '0')}` as DateKey

    const range = { from, to }
    return calculatePeriodTotals({
      worklogs: withinRange(worklogs.items, range),
      expenses: withinRange(expenses.items, range),
      invoices: withinRange(invoices.items, range),
    })
  })

  /** Variazione dei costi rispetto allo stesso periodo del mese scorso. */
  const monthCostChange = computed(() => {
    const previous = previousPeriodTotals.value.totalCostCents
    if (previous === 0) return null
    const delta = Money.subtract(monthTotals.value.totalCostCents, previous)
    return Math.round((delta / previous) * 1000) / 10
  })

  const monthlySeries = computed(() => calculateMonthlySeries({
    worklogs: worklogs.items,
    expenses: expenses.items,
    invoices: invoices.items,
    months: 12,
  }))

  /**
   * Consuntivo di ogni cantiere aperto.
   * Ordinati per costo decrescente: in cima quelli su cui vale la pena guardare.
   */
  const openSiteSummaries = computed(() =>
    openSites.value
      .map(site => ({
        site,
        summary: calculateSiteSummary({
          site,
          worklogs: worklogs.items.filter(worklog => worklog.siteId === site.id),
          expenses: expenses.items.filter(expense => expense.siteId === site.id),
          invoices: invoices.items.filter(invoice => invoice.siteId === site.id),
        }),
      }))
      .sort((a, b) => Money.compare(b.summary.totalCostCents, a.summary.totalCostCents)),
  )

  /** Cantieri che hanno superato il preventivo: sono l'allarme principale. */
  const overBudgetSites = computed(() => openSiteSummaries.value.filter(entry => entry.summary.isOverBudget))

  /**
   * Composizione dei costi degli ultimi dodici mesi.
   * La manodopera entra insieme alle categorie di spesa, altrimenti il grafico
   * racconterebbe solo meta' della storia.
   */
  const costComposition = computed(() => {
    const from = MonthKeys.firstDay(MonthKeys.addMonths(currentMonth, -11))

    const periodExpenses = expenses.items.filter(expense => expense.date >= from)
    const periodWorklogs = worklogs.items.filter(worklog => worklog.date >= from)

    const byCategory = groupExpensesByCategory(periodExpenses)
    const labor = Money.sum(periodWorklogs.map(worklog => worklog.laborCostCents))

    const entries: Array<{ label: string, value: Cents, color: string }> = [
      { label: 'Manodopera', value: labor, color: LABOR_COLOR },
      ...Object.entries(byCategory)
        .map(([category, value]) => ({
          label: expenseCategoryLabel(category as ExpenseCategory),
          value,
          color: EXPENSE_CATEGORY_COLORS[category as ExpenseCategory],
        })),
    ]

    return entries.filter(entry => !Money.isZero(entry.value))
  })

  /** Fatture scadute e non incassate. */
  const overdueInvoices = computed<Invoice[]>(() =>
    invoices.items
      .filter(invoice => invoiceStatus(invoice, today) === 'scaduta')
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
  )

  const overdueTotal = computed(() => Money.sum(overdueInvoices.value.map(invoice => invoice.amountCents)))

  /** Cantieri la cui data di fine prevista e' passata senza chiusura. */
  const lateSites = computed<Site[]>(() =>
    openSites.value.filter(site => site.expectedEndDate !== null && site.expectedEndDate < today),
  )

  const hoursThisMonth = computed(() => sumTotalMinutes(inMonth(worklogs.items, currentMonth)))

  return {
    loading,
    loadAll,

    today,
    currentMonth,
    dayShown,
    isShowingToday,

    openSites,
    activeEmployees,
    presentCount,
    dayMinutes,
    dayCost,
    hoursThisMonth,

    monthTotals,
    monthCostChange,
    monthlySeries,

    openSiteSummaries,
    overBudgetSites,
    costComposition,

    overdueInvoices,
    overdueTotal,
    lateSites,
  }
}
