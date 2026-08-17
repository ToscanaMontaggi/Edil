/**
 * Caricamento coordinato dei dati.
 *
 * Dashboard, report e schede cantiere incrociano piu' collezioni insieme, e
 * ognuna aveva bisogno delle stesse quattro o cinque righe di caricamento.
 * Questo composable le raccoglie in un punto solo: la pagina chiede i dati che
 * le servono e riceve un unico stato di caricamento da mostrare.
 *
 * Gli store non ricaricano se hanno gia' i dati, quindi chiamarlo da piu' pagine
 * non produce richieste ripetute.
 */
export function useAppData() {
  const clients = useClientsStore()
  const employees = useEmployeesStore()
  const sites = useSitesStore()
  const phases = usePhasesStore()
  const worklogs = useWorklogsStore()
  const expenses = useExpensesStore()
  const fixedExpenses = useFixedExpensesStore()
  const invoices = useInvoicesStore()

  const stores = [clients, employees, sites, phases, worklogs, expenses, fixedExpenses, invoices]

  const loading = computed(() => stores.some(store => store.loading))
  const error = computed(() => stores.find(store => store.error)?.error ?? null)

  /** Carica tutto in parallelo. E' quello che serve a dashboard e report. */
  async function loadAll(): Promise<void> {
    await Promise.all(stores.map(store => store.load()))
  }

  return {
    clients,
    employees,
    sites,
    phases,
    worklogs,
    expenses,
    fixedExpenses,
    invoices,
    loading,
    error,
    loadAll,
  }
}
