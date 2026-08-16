<script setup lang="ts">
import {
  DateKeys,
  Money,
  MonthKeys,
  calculateSiteSummary,
  employeeFullName,
  isSiteSelectable,
  sumBy,
  withinRange,
} from '~/core/domain'

useHead({ title: 'Report — Dinelli Srl' })

const format = useFormat()
const { sites, clients, employees, worklogs, expenses, invoices, loadAll, loading } = useAppData()

void loadAll()

type ReportKind = 'commesse' | 'ore' | 'costi'

const kind = ref<ReportKind>('commesse')
const fromMonth = ref(MonthKeys.addMonths(MonthKeys.current(), -5))
const toMonth = ref(MonthKeys.current())
const clientFilter = ref<string | null>(null)

const monthOptions = computed(() =>
  MonthKeys.lastMonths(24).reverse().map(month => ({ label: MonthKeys.format(month), value: month })),
)

const range = computed(() => ({
  from: MonthKeys.firstDay(fromMonth.value <= toMonth.value ? fromMonth.value : toMonth.value),
  to: MonthKeys.lastDay(toMonth.value >= fromMonth.value ? toMonth.value : fromMonth.value),
}))

const periodWorklogs = computed(() => withinRange(worklogs.items, range.value))
const periodExpenses = computed(() => withinRange(expenses.items, range.value))
const periodInvoices = computed(() => withinRange(invoices.items, range.value))

/** Consuntivo per commessa nel periodo scelto. */
const commesse = computed(() =>
  sites.items
    .filter(isSiteSelectable)
    .filter(site => !clientFilter.value || site.clientId === clientFilter.value)
    .map(site => ({
      site,
      clientName: clients.find(site.clientId)?.name ?? '—',
      summary: calculateSiteSummary({
        site,
        worklogs: periodWorklogs.value.filter(worklog => worklog.siteId === site.id),
        expenses: periodExpenses.value.filter(expense => expense.siteId === site.id),
        invoices: periodInvoices.value.filter(invoice => invoice.siteId === site.id),
      }),
    }))
    .filter(row => !Money.isZero(row.summary.totalCostCents) || !Money.isZero(row.summary.invoicedCents))
    .sort((a, b) => Money.compare(b.summary.totalCostCents, a.summary.totalCostCents)),
)

const oreReport = computed(() => {
  const costs = sumBy(periodWorklogs.value, worklog => worklog.employeeId, worklog => worklog.laborCostCents)
  const minutes = new Map<string, number>()
  const overtime = new Map<string, number>()

  for (const worklog of periodWorklogs.value) {
    const id = worklog.employeeId
    minutes.set(id, (minutes.get(id) ?? 0) + worklog.ordinaryMinutes + worklog.overtimeMinutes)
    overtime.set(id, (overtime.get(id) ?? 0) + worklog.overtimeMinutes)
  }

  return [...costs.entries()]
    .map(([employeeId, cost]) => {
      const employee = employees.find(employeeId)
      return {
        id: employeeId,
        name: employee ? employeeFullName(employee) : 'Operaio rimosso',
        qualification: employee?.qualification ?? '—',
        minutes: minutes.get(employeeId) ?? 0,
        overtime: overtime.get(employeeId) ?? 0,
        cost,
      }
    })
    .sort((a, b) => Money.compare(b.cost, a.cost))
})

const costiReport = computed(() =>
  periodExpenses.value
    .map(expense => ({
      expense,
      siteCode: sites.find(expense.siteId)?.code ?? '—',
    }))
    .sort((a, b) => b.expense.date.localeCompare(a.expense.date)),
)

const totals = computed(() => ({
  cost: Money.add(
    Money.sum(periodWorklogs.value.map(worklog => worklog.laborCostCents)),
    Money.sum(periodExpenses.value.map(expense => expense.amountCents)),
  ),
  invoiced: Money.sum(periodInvoices.value.map(invoice => invoice.amountCents)),
}))

const periodLabel = computed(() =>
  `${MonthKeys.format(fromMonth.value)} — ${MonthKeys.format(toMonth.value)}`,
)
</script>

<template>
  <div class="u-stack">
    <AppPageHeader title="Report" :subtitle="`Consuntivi del periodo ${periodLabel}.`" />

    <Card>
      <template #content>
        <div class="filters">
          <AppFormField label="Tipo di report" for-id="tipo">
            <SelectButton
              v-model="kind"
              :options="[
                { label: 'Commesse', value: 'commesse' },
                { label: 'Ore', value: 'ore' },
                { label: 'Costi', value: 'costi' },
              ]"
              option-label="label"
              option-value="value"
              :allow-empty="false"
            />
          </AppFormField>

          <AppFormField label="Da" for-id="da">
            <Select v-model="fromMonth" input-id="da" :options="monthOptions" option-label="label" option-value="value" fluid />
          </AppFormField>

          <AppFormField label="A" for-id="a">
            <Select v-model="toMonth" input-id="a" :options="monthOptions" option-label="label" option-value="value" fluid />
          </AppFormField>

          <AppFormField label="Cliente" for-id="cli">
            <Select
              v-model="clientFilter"
              input-id="cli"
              :options="clients.items"
              option-label="name"
              option-value="id"
              placeholder="Tutti"
              show-clear
              filter
              fluid
            />
          </AppFormField>
        </div>
      </template>
    </Card>

    <section class="u-grid" style="--grid-min: 220px">
      <AppStatCard
        label="Costi del periodo"
        :value="format.money(totals.cost)"
        icon="pi pi-euro"
        :loading="loading"
      />
      <AppStatCard
        label="Fatturato del periodo"
        :value="format.money(totals.invoiced)"
        icon="pi pi-file-check"
        :loading="loading"
      />
      <AppStatCard
        label="Margine"
        :value="format.money(Money.subtract(totals.invoiced, totals.cost))"
        icon="pi pi-percentage"
        :hint-tone="totals.invoiced >= totals.cost ? 'positive' : 'negative'"
        :hint="format.percent(Money.percentOf(Money.subtract(totals.invoiced, totals.cost), totals.invoiced))"
        :loading="loading"
      />
    </section>

    <Card>
      <template #content>
        <AppDataTable
          v-if="kind === 'commesse'"
          :value="commesse"
          :loading="loading"
          :filter-fields="['site.code', 'site.name', 'clientName']"
          data-key="site.id"
          empty-title="Nessun movimento"
          empty-message="Nel periodo selezionato non risultano costi o fatture."
        >
          <Column field="site.code" header="Codice" sortable style="min-width: 120px" />
          <Column field="site.name" header="Cantiere" sortable style="min-width: 210px" />
          <Column field="clientName" header="Cliente" sortable style="min-width: 180px" />
          <Column field="summary.laborCents" header="Manodopera" sortable style="min-width: 130px">
            <template #body="{ data }">
              <span class="tabular">{{ format.money(data.summary.laborCents) }}</span>
            </template>
          </Column>
          <Column field="summary.expensesTotalCents" header="Altri costi" sortable style="min-width: 130px">
            <template #body="{ data }">
              <span class="tabular">{{ format.money(data.summary.expensesTotalCents) }}</span>
            </template>
          </Column>
          <Column field="summary.totalCostCents" header="Totale costi" sortable style="min-width: 140px">
            <template #body="{ data }">
              <strong class="tabular">{{ format.money(data.summary.totalCostCents) }}</strong>
            </template>
          </Column>
          <Column field="summary.invoicedCents" header="Fatturato" sortable style="min-width: 130px">
            <template #body="{ data }">
              <span class="tabular">{{ format.money(data.summary.invoicedCents) }}</span>
            </template>
          </Column>
          <Column field="summary.marginCents" header="Margine" sortable style="min-width: 130px">
            <template #body="{ data }">
              <strong
                class="tabular"
                :class="data.summary.marginCents >= 0 ? 'u-positive' : 'u-negative'"
              >{{ format.money(data.summary.marginCents) }}</strong>
            </template>
          </Column>
        </AppDataTable>

        <AppDataTable
          v-else-if="kind === 'ore'"
          :value="oreReport"
          :loading="loading"
          :filter-fields="['name', 'qualification']"
          empty-title="Nessuna ora"
          empty-message="Nel periodo selezionato non risultano ore registrate."
        >
          <Column field="name" header="Operaio" sortable style="min-width: 210px" />
          <Column field="qualification" header="Mansione" sortable style="min-width: 180px" />
          <Column field="minutes" header="Ore totali" sortable style="min-width: 120px">
            <template #body="{ data }">
              <span class="tabular">{{ format.decimalHours(data.minutes) }}</span>
            </template>
          </Column>
          <Column field="overtime" header="Straordinari" sortable style="min-width: 120px">
            <template #body="{ data }">
              <span class="tabular">{{ format.decimalHours(data.overtime) }}</span>
            </template>
          </Column>
          <Column field="cost" header="Costo" sortable style="min-width: 140px">
            <template #body="{ data }">
              <strong class="tabular">{{ format.money(data.cost) }}</strong>
            </template>
          </Column>
        </AppDataTable>

        <AppDataTable
          v-else
          :value="costiReport"
          :loading="loading"
          :filter-fields="['expense.description', 'expense.supplier', 'siteCode']"
          data-key="expense.id"
          empty-title="Nessun costo"
          empty-message="Nel periodo selezionato non risultano costi."
        >
          <Column field="expense.date" header="Data" sortable style="min-width: 105px">
            <template #body="{ data }">
              <span class="tabular">{{ DateKeys.format(data.expense.date) }}</span>
            </template>
          </Column>
          <Column field="siteCode" header="Cantiere" sortable style="min-width: 120px" />
          <Column field="expense.description" header="Descrizione" sortable style="min-width: 200px" />
          <Column field="expense.supplier" header="Fornitore" sortable style="min-width: 170px" />
          <Column field="expense.amountCents" header="Importo" sortable style="min-width: 130px">
            <template #body="{ data }">
              <strong class="tabular">{{ format.money(data.expense.amountCents) }}</strong>
            </template>
          </Column>
        </AppDataTable>
      </template>
    </Card>

    <Message severity="info" variant="simple" size="small" class="note">
      <i class="pi pi-info-circle" />
      L'esportazione in PDF ed Excel arrivera' subito dopo il collegamento a
      Firebase. Farla adesso su dati finti vorrebbe dire rifarla quando i campi
      definitivi saranno chiari: conviene prima usare l'applicazione per un mese
      vero e capire quali colonne servono davvero.
    </Message>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: auto repeat(3, minmax(150px, 1fr));
  align-items: end;
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr 1fr;
  }
}

.note {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  line-height: 1.5;
  font-size: 0.84rem;
}

.note i {
  margin-top: 2px;
}
</style>
