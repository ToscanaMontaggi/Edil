import type { Cents, DateKey, Draft, Employee, EntityId, Minutes, Worklog } from '~/core/domain'
import {
  DateKeys,
  Duration,
  Money,
  calculateLaborCost,
  isSiteSelectable,
  resolveRateFor,
} from '~/core/domain'

/** Giornata piena predefinita: e' il valore giusto nella grande maggioranza dei casi. */
const DEFAULT_DAY_MINUTES = Duration.fromHours(8)

export interface WorklogEntryRow {
  employee: Employee
  present: boolean
  ordinaryMinutes: Minutes
  overtimeMinutes: Minutes
  travelAllowance: boolean
  /** Costo della riga, ricalcolato mentre si compila. */
  costCents: Cents
  /** Vero se l'operaio non ha una tariffa valida a quella data. */
  missingRate: boolean
}

/**
 * Registrazione delle ore di una giornata.
 *
 * E' l'operazione piu' frequente del gestionale, quindi e' costruita per essere
 * veloce: si sceglie il cantiere, la squadra assegnata compare gia' selezionata
 * con otto ore a testa, si tolgono gli assenti e si salva tutto insieme.
 * Il costo si aggiorna mentre si compila, cosi' si vede subito quanto pesa la
 * giornata prima ancora di confermare.
 */
export function useWorklogEntry() {
  const { employees, sites, phases, worklogs, loadAll, loading } = useAppData()

  const date = ref<DateKey>(DateKeys.today())
  const siteId = ref<EntityId | null>(null)
  const phaseId = ref<EntityId | null>(null)
  const notes = ref('')

  /** Stato di ogni operaio, indicizzato per id. */
  const entries = ref<Record<EntityId, Omit<WorklogEntryRow, 'employee' | 'costCents' | 'missingRate'>>>({})

  const selectableSites = computed(() =>
    sites.items
      .filter(isSiteSelectable)
      .filter(site => site.status !== 'chiuso')
      .sort((a, b) => a.code.localeCompare(b.code)),
  )

  const sitePhases = computed(() => (siteId.value ? phases.listBySite(siteId.value) : []))

  /**
   * Operai selezionabili per quella data.
   * Esclude i cessati e chi non era ancora assunto: registrare ore per qualcuno
   * che quel giorno non era in azienda e' un errore che conviene rendere
   * impossibile invece che correggere dopo.
   */
  const availableEmployees = computed(() =>
    employees.items
      .filter(employee => employee.status === 'attivo')
      .filter(employee => employee.hireDate <= date.value)
      .filter(employee => !employee.endDate || employee.endDate >= date.value)
      .sort((a, b) => a.lastName.localeCompare(b.lastName)),
  )

  function entryFor(employeeId: EntityId) {
    return entries.value[employeeId] ??= {
      present: false,
      ordinaryMinutes: DEFAULT_DAY_MINUTES,
      overtimeMinutes: Duration.zero,
      travelAllowance: false,
    }
  }

  const rows = computed<WorklogEntryRow[]>(() =>
    availableEmployees.value.map((employee) => {
      const entry = entryFor(employee.id)
      const rate = resolveRateFor(employee, date.value)
      const cost = calculateLaborCost({
        ordinaryMinutes: entry.ordinaryMinutes,
        overtimeMinutes: entry.overtimeMinutes,
        travelAllowance: entry.travelAllowance,
        rate,
      })

      return {
        employee,
        ...entry,
        costCents: cost.totalCents,
        missingRate: Money.isZero(rate.hourlyCostCents),
      }
    }),
  )

  const presentRows = computed(() => rows.value.filter(row => row.present))

  const totalMinutes = computed(() =>
    Duration.sum(presentRows.value.map(row => (row.ordinaryMinutes + row.overtimeMinutes) as Minutes)),
  )

  const totalCost = computed(() => Money.sum(presentRows.value.map(row => row.costCents)))

  const allPresent = computed(() =>
    rows.value.length > 0 && rows.value.every(row => row.present),
  )

  /** Righe gia' registrate per quella coppia data/cantiere: evita i doppioni. */
  const alreadyRegistered = computed(() => {
    if (!siteId.value) return []
    return worklogs.items.filter(
      worklog => worklog.date === date.value && worklog.siteId === siteId.value,
    )
  })

  const duplicateEmployeeIds = computed(() => new Set(alreadyRegistered.value.map(worklog => worklog.employeeId)))

  const canSubmit = computed(() => siteId.value !== null && presentRows.value.length > 0)

  // ------------------------------------------------------------------ azioni

  function setPresent(employeeId: EntityId, present: boolean): void {
    entryFor(employeeId).present = present
  }

  function toggleAll(): void {
    const next = !allPresent.value
    for (const employee of availableEmployees.value) {
      entryFor(employee.id).present = next
    }
  }

  /** Rimette tutti a otto ore, senza straordinari ne' trasferta. */
  function resetHours(): void {
    for (const employee of availableEmployees.value) {
      const entry = entryFor(employee.id)
      entry.ordinaryMinutes = DEFAULT_DAY_MINUTES
      entry.overtimeMinutes = Duration.zero
      entry.travelAllowance = false
    }
  }

  function clear(): void {
    entries.value = {}
    notes.value = ''
  }

  /**
   * Cambiando cantiere si azzera la fase: quelle del cantiere precedente non
   * esistono qui, e lasciare un id orfano produrrebbe costi attribuiti a una
   * fase di un altro cantiere.
   */
  watch(siteId, () => {
    phaseId.value = null
  })

  async function submit(): Promise<number> {
    if (!canSubmit.value || !siteId.value) return 0

    const drafts: Draft<Worklog>[] = presentRows.value.map(row => ({
      date: date.value,
      employeeId: row.employee.id,
      siteId: siteId.value!,
      phaseId: phaseId.value,
      ordinaryMinutes: row.ordinaryMinutes,
      overtimeMinutes: row.overtimeMinutes,
      travelAllowance: row.travelAllowance,
      notes: notes.value,
      rate: resolveRateFor(row.employee, date.value),
      laborCostCents: row.costCents,
    }))

    const created = await worklogs.createMany(drafts)
    clear()
    return created.length
  }

  return {
    loading,
    saving: computed(() => worklogs.saving),
    loadAll,

    date,
    siteId,
    phaseId,
    notes,

    selectableSites,
    sitePhases,
    availableEmployees,
    rows,
    presentRows,
    entryFor,

    totalMinutes,
    totalCost,
    allPresent,
    duplicateEmployeeIds,
    canSubmit,

    setPresent,
    toggleAll,
    resetHours,
    clear,
    submit,
  }
}
