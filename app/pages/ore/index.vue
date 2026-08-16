<script setup lang="ts">
import type { DateRange, Minutes, Worklog } from '~/core/domain'
import {
  DateKeys,
  Duration,
  Money,
  MonthKeys,
  employeeFullName,
  sumBy,
  withinRange,
} from '~/core/domain'

useHead({ title: 'Ore — Dinelli Srl' })

const format = useFormat()
const notify = useNotify()
const confirmDelete = useConfirmDelete()
const worklogs = useWorklogsStore()
const { employees, sites, phases, loadAll, loading } = useAppData()

void loadAll()

const currentMonth = MonthKeys.current()

const monthFilter = ref(currentMonth)
const siteFilter = ref<string | null>(null)
const employeeFilter = ref<string | null>(null)

const monthOptions = computed(() =>
  MonthKeys.lastMonths(18).reverse().map(month => ({ label: MonthKeys.format(month), value: month })),
)

const range = computed<DateRange>(() => ({
  from: MonthKeys.firstDay(monthFilter.value),
  to: MonthKeys.lastDay(monthFilter.value),
}))

const rows = computed(() =>
  withinRange(worklogs.items, range.value)
    .filter(worklog => !siteFilter.value || worklog.siteId === siteFilter.value)
    .filter(worklog => !employeeFilter.value || worklog.employeeId === employeeFilter.value)
    .map((worklog) => {
      const employee = employees.find(worklog.employeeId)
      return {
        worklog,
        employeeName: employee ? employeeFullName(employee) : 'Operaio rimosso',
        siteCode: sites.find(worklog.siteId)?.code ?? '—',
        phaseName: worklog.phaseId ? (phases.find(worklog.phaseId)?.name ?? '—') : '—',
        totalMinutes: (worklog.ordinaryMinutes + worklog.overtimeMinutes) as Minutes,
      }
    })
    .sort((a, b) => b.worklog.date.localeCompare(a.worklog.date)),
)

const totals = computed(() => ({
  minutes: Duration.sum(rows.value.map(row => row.totalMinutes)),
  overtime: Duration.sum(rows.value.map(row => row.worklog.overtimeMinutes)),
  cost: Money.sum(rows.value.map(row => row.worklog.laborCostCents)),
  days: new Set(rows.value.map(row => row.worklog.date)).size,
}))

/** Ore per operaio nel periodo filtrato: la base del riepilogo mensile. */
const byEmployee = computed(() => {
  const costs = sumBy(rows.value, row => row.worklog.employeeId, row => row.worklog.laborCostCents)
  const minutes = new Map<string, number>()
  for (const row of rows.value) {
    minutes.set(row.worklog.employeeId, (minutes.get(row.worklog.employeeId) ?? 0) + row.totalMinutes)
  }

  return [...costs.entries()]
    .map(([employeeId, cost]) => {
      const employee = employees.find(employeeId)
      return {
        id: employeeId,
        name: employee ? employeeFullName(employee) : 'Operaio rimosso',
        minutes: minutes.get(employeeId) ?? 0,
        cost,
      }
    })
    .sort((a, b) => Money.compare(b.cost, a.cost))
})

async function removeWorklog(worklog: Worklog, employeeName: string): Promise<void> {
  const confirmed = await confirmDelete({
    what: `la giornata di ${employeeName} del ${DateKeys.format(worklog.date)}`,
  })
  if (!confirmed) return

  try {
    await worklogs.remove(worklog.id)
    notify.deleted('Registrazione eliminata.')
  }
  catch {
    notify.error()
  }
}
</script>

<template>
  <div class="u-stack">
    <AppPageHeader title="Ore" subtitle="Registrazioni di cantiere per giornata e operaio.">
      <template #actions>
        <Button label="Registra ore" icon="pi pi-plus" @click="navigateTo('/ore/nuovo')" />
      </template>
    </AppPageHeader>

    <section class="u-grid" style="--grid-min: 190px">
      <AppStatCard
        label="Ore nel periodo"
        :value="format.decimalHours(totals.minutes)"
        icon="pi pi-clock"
        :hint="format.count(totals.days, 'giornata registrata', 'giornate registrate')"
        :loading="loading"
      />
      <AppStatCard
        label="Di cui straordinari"
        :value="format.decimalHours(totals.overtime)"
        icon="pi pi-forward"
        :loading="loading"
      />
      <AppStatCard
        label="Costo manodopera"
        :value="format.money(totals.cost)"
        icon="pi pi-euro"
        :loading="loading"
      />
      <AppStatCard
        label="Registrazioni"
        :value="format.number(rows.length)"
        icon="pi pi-list"
        :loading="loading"
      />
    </section>

    <Tabs value="elenco">
      <TabList>
        <Tab value="elenco">Elenco</Tab>
        <Tab value="operai">Riepilogo per operaio</Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="elenco">
          <AppDataTable
            :value="rows"
            :loading="loading"
            :filter-fields="['employeeName', 'siteCode', 'phaseName', 'worklog.notes']"
            data-key="worklog.id"
            empty-icon="pi pi-clock"
            empty-title="Nessuna registrazione"
            empty-message="Non ci sono ore registrate nel periodo selezionato."
          >
            <template #emptyAction>
              <Button label="Registra ore" icon="pi pi-plus" @click="navigateTo('/ore/nuovo')" />
            </template>

            <template #toolbar>
              <div class="u-cluster" style="--cluster-gap: var(--space-2)">
                <Select
                  v-model="monthFilter"
                  :options="monthOptions"
                  option-label="label"
                  option-value="value"
                  class="filter"
                />
                <Select
                  v-model="siteFilter"
                  :options="sites.items"
                  option-label="code"
                  option-value="id"
                  placeholder="Tutti i cantieri"
                  show-clear
                  filter
                  class="filter"
                />
                <Select
                  v-model="employeeFilter"
                  :options="employees.items"
                  :option-label="employeeFullName"
                  option-value="id"
                  placeholder="Tutti gli operai"
                  show-clear
                  filter
                  class="filter"
                />
              </div>
            </template>

            <Column field="worklog.date" header="Data" sortable style="min-width: 105px">
              <template #body="{ data }">
                <span class="tabular">{{ DateKeys.format(data.worklog.date) }}</span>
              </template>
            </Column>

            <Column field="employeeName" header="Operaio" sortable style="min-width: 190px" />

            <Column field="siteCode" header="Cantiere" sortable style="min-width: 130px">
              <template #body="{ data }">
                <NuxtLink :to="`/cantieri/${data.worklog.siteId}`" class="link">
                  {{ data.siteCode }}
                </NuxtLink>
              </template>
            </Column>

            <Column field="phaseName" header="Fase" sortable style="min-width: 160px">
              <template #body="{ data }">
                <span class="u-muted">{{ data.phaseName }}</span>
              </template>
            </Column>

            <Column field="worklog.ordinaryMinutes" header="Ordinarie" sortable style="min-width: 105px">
              <template #body="{ data }">
                <span class="tabular">{{ format.decimalHours(data.worklog.ordinaryMinutes) }}</span>
              </template>
            </Column>

            <Column field="worklog.overtimeMinutes" header="Straord." sortable style="min-width: 100px">
              <template #body="{ data }">
                <span v-if="data.worklog.overtimeMinutes" class="tabular u-negative">
                  {{ format.decimalHours(data.worklog.overtimeMinutes) }}
                </span>
                <span v-else class="u-muted">—</span>
              </template>
            </Column>

            <Column header="Trasf." style="min-width: 80px">
              <template #body="{ data }">
                <i
                  v-if="data.worklog.travelAllowance"
                  class="pi pi-check u-positive"
                  aria-label="Con trasferta"
                />
                <span v-else class="u-muted">—</span>
              </template>
            </Column>

            <Column field="worklog.laborCostCents" header="Costo" sortable style="min-width: 120px">
              <template #body="{ data }">
                <strong class="tabular">{{ format.money(data.worklog.laborCostCents) }}</strong>
              </template>
            </Column>

            <Column header="" style="width: 60px">
              <template #body="{ data }">
                <Button
                  icon="pi pi-trash" severity="danger" text rounded
                  aria-label="Elimina" @click="removeWorklog(data.worklog, data.employeeName)"
                />
              </template>
            </Column>
          </AppDataTable>
        </TabPanel>

        <TabPanel value="operai">
          <AppDataTable
            :value="byEmployee"
            :loading="loading"
            :filter-fields="['name']"
            empty-icon="pi pi-users"
            empty-title="Nessun dato"
            empty-message="Non ci sono ore registrate nel periodo selezionato."
          >
            <Column field="name" header="Operaio" sortable style="min-width: 220px" />
            <Column field="minutes" header="Ore" sortable style="min-width: 120px">
              <template #body="{ data }">
                <span class="tabular">{{ format.decimalHours(data.minutes) }}</span>
              </template>
            </Column>
            <Column field="cost" header="Costo" sortable style="min-width: 140px">
              <template #body="{ data }">
                <strong class="tabular">{{ format.money(data.cost) }}</strong>
              </template>
            </Column>
          </AppDataTable>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.filter {
  min-width: 170px;
}

.link {
  font-weight: 600;
  color: var(--p-primary-color);
}
</style>
