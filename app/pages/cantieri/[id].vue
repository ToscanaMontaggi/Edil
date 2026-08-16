<script setup lang="ts">
import type { ExpenseCategory } from '~/core/domain'
import {
  DateKeys,
  EXPENSE_CATEGORY_COLORS,
  INVOICE_STATUS_OPTIONS,
  LABOR_COLOR,
  Money,
  SITE_STATUS_OPTIONS,
  calculateSiteSummary,
  employeeFullName,
  expenseCategoryLabel,
  invoiceStatus,
  sumBy,
} from '~/core/domain'

const route = useRoute()
const format = useFormat()
const siteId = computed(() => String(route.params.id))

const { sites, clients, phases, employees, worklogs, expenses, invoices, loading, loadAll } = useAppData()

void loadAll()

const site = computed(() => sites.find(siteId.value))
const client = computed(() => (site.value ? clients.find(site.value.clientId) : null))

useHead({ title: () => `${site.value?.name ?? 'Cantiere'} — Dinelli Srl` })

const siteWorklogs = computed(() => worklogs.items.filter(worklog => worklog.siteId === siteId.value))
const siteExpenses = computed(() => expenses.items.filter(expense => expense.siteId === siteId.value))
const siteInvoices = computed(() => invoices.items.filter(invoice => invoice.siteId === siteId.value))
const sitePhases = computed(() => phases.listBySite(siteId.value))

const summary = computed(() =>
  site.value
    ? calculateSiteSummary({
        site: site.value,
        worklogs: siteWorklogs.value,
        expenses: siteExpenses.value,
        invoices: siteInvoices.value,
      })
    : null,
)

/** Ore e costo per operaio, per capire chi ha lavorato di piu' sulla commessa. */
const byEmployee = computed(() => {
  const minutes = new Map<string, number>()
  for (const worklog of siteWorklogs.value) {
    const total = worklog.ordinaryMinutes + worklog.overtimeMinutes
    minutes.set(worklog.employeeId, (minutes.get(worklog.employeeId) ?? 0) + total)
  }

  const costs = sumBy(siteWorklogs.value, worklog => worklog.employeeId, worklog => worklog.laborCostCents)

  return [...costs.entries()]
    .map(([employeeId, cost]) => ({
      employee: employees.find(employeeId),
      minutes: minutes.get(employeeId) ?? 0,
      cost,
    }))
    .sort((a, b) => Money.compare(b.cost, a.cost))
})

/** Costi per fase: dove sono finiti i soldi dentro il cantiere. */
const byPhase = computed(() => {
  const laborByPhase = sumBy(
    siteWorklogs.value.filter(worklog => worklog.phaseId),
    worklog => worklog.phaseId!,
    worklog => worklog.laborCostCents,
  )
  const expensesByPhase = sumBy(
    siteExpenses.value.filter(expense => expense.phaseId),
    expense => expense.phaseId!,
    expense => expense.amountCents,
  )

  return sitePhases.value.map(phase => ({
    phase,
    labor: laborByPhase.get(phase.id) ?? Money.zero,
    expenses: expensesByPhase.get(phase.id) ?? Money.zero,
    total: Money.add(laborByPhase.get(phase.id) ?? Money.zero, expensesByPhase.get(phase.id) ?? Money.zero),
  }))
})

const costChart = computed(() => {
  if (!summary.value) return { series: [], options: {} }

  const entries = [
    { label: 'Manodopera', value: summary.value.laborCents, color: LABOR_COLOR },
    ...Object.entries(summary.value.expensesByCategory)
      .map(([category, value]) => ({
        label: expenseCategoryLabel(category as ExpenseCategory),
        value,
        color: EXPENSE_CATEGORY_COLORS[category as ExpenseCategory],
      })),
  ].filter(entry => !Money.isZero(entry.value))

  return {
    series: entries.map(entry => Money.toEuro(entry.value)),
    options: {
      labels: entries.map(entry => entry.label),
      colors: entries.map(entry => entry.color),
      plotOptions: { pie: { donut: { size: '66%' } } },
      tooltip: { y: { formatter: (value: number) => Money.format(Money.fromEuro(value)) } },
    },
  }
})
</script>

<template>
  <div v-if="loading && !site" class="u-stack">
    <Skeleton height="3rem" width="40%" />
    <Skeleton height="12rem" />
  </div>

  <AppEmptyState
    v-else-if="!site"
    icon="pi pi-exclamation-circle"
    title="Cantiere non trovato"
    message="Il cantiere richiesto non esiste o e' stato eliminato."
  >
    <Button label="Torna ai cantieri" icon="pi pi-arrow-left" @click="navigateTo('/cantieri')" />
  </AppEmptyState>

  <div v-else-if="summary" class="u-stack" style="--stack-gap: var(--space-5)">
    <AppPageHeader
      :title="site.name"
      :subtitle="`${site.code} · ${client?.name ?? 'Cliente non indicato'} · ${site.city}`"
      back-to="/cantieri"
    >
      <template #actions>
        <AppStatusTag :value="site.status" :options="SITE_STATUS_OPTIONS" show-icon />
      </template>
    </AppPageHeader>

    <!-- Preventivo contro consuntivo: il confronto che conta -->
    <Card>
      <template #content>
        <div class="balance">
          <div class="balance__item">
            <small class="u-muted">Preventivo</small>
            <strong class="tabular">{{ format.money(summary.budgetCents) }}</strong>
          </div>

          <i class="pi pi-arrow-right balance__arrow u-hide-mobile" aria-hidden="true" />

          <div class="balance__item">
            <small class="u-muted">Costo reale</small>
            <strong class="tabular" :class="{ 'u-negative': summary.isOverBudget }">
              {{ format.money(summary.totalCostCents) }}
            </strong>
          </div>

          <i class="pi pi-arrow-right balance__arrow u-hide-mobile" aria-hidden="true" />

          <div class="balance__item">
            <small class="u-muted">{{ summary.isOverBudget ? 'Sforamento' : 'Residuo' }}</small>
            <strong
              class="tabular"
              :class="summary.isOverBudget ? 'u-negative' : 'u-positive'"
            >
              {{ format.money(summary.isOverBudget
                ? Money.negate(summary.budgetRemainingCents)
                : summary.budgetRemainingCents) }}
            </strong>
          </div>
        </div>

        <ProgressBar
          :value="Math.min(100, summary.budgetUsedPercent)"
          :show-value="false"
          :pt="{ value: { style: { background: summary.isOverBudget ? 'var(--p-red-500)' : undefined } } }"
          style="height: 10px; margin-top: var(--space-4)"
        />
        <small class="u-muted balance__caption">
          {{ format.percent(summary.budgetUsedPercent) }} del preventivo utilizzato
        </small>
      </template>
    </Card>

    <section class="u-grid" style="--grid-min: 190px">
      <AppStatCard
        label="Manodopera"
        :value="format.money(summary.laborCents)"
        icon="pi pi-users"
        :hint="`${format.decimalHours(summary.totalMinutes)} ore lavorate`"
      />
      <AppStatCard
        label="Altri costi"
        :value="format.money(summary.expensesTotalCents)"
        icon="pi pi-box"
        :hint="`${format.count(siteExpenses.length, 'movimento', 'movimenti')}`"
      />
      <AppStatCard
        label="Fatturato"
        :value="format.money(summary.invoicedCents)"
        icon="pi pi-file-check"
        :hint="`${format.money(summary.pendingCents)} da incassare`"
      />
      <AppStatCard
        label="Margine"
        :value="format.money(summary.marginCents)"
        icon="pi pi-percentage"
        :hint="summary.invoicedCents > 0 ? format.percent(summary.marginPercent) + ' sul fatturato' : 'Non ancora fatturato'"
        :hint-tone="summary.marginCents >= 0 ? 'positive' : 'negative'"
      />
    </section>

    <Tabs value="fasi">
      <TabList>
        <Tab value="fasi">Fasi</Tab>
        <Tab value="composizione">Composizione</Tab>
        <Tab value="operai">Operai</Tab>
        <Tab value="costi">Costi</Tab>
        <Tab value="fatture">Fatture</Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="fasi">
          <AppDataTable
            :value="byPhase"
            :loading="loading"
            :searchable="false"
            data-key="phase.id"
            empty-title="Nessuna fase"
            empty-message="Questo cantiere non ha sottofasi definite."
          >
            <Column field="phase.name" header="Fase" style="min-width: 200px">
              <template #body="{ data }">
                <div class="u-cluster" style="--cluster-gap: var(--space-2)">
                  <i
                    :class="data.phase.completed ? 'pi pi-check-circle u-positive' : 'pi pi-circle u-muted'"
                    aria-hidden="true"
                  />
                  <span>{{ data.phase.name }}</span>
                </div>
              </template>
            </Column>
            <Column header="Manodopera" style="min-width: 130px">
              <template #body="{ data }">
                <span class="tabular">{{ format.money(data.labor) }}</span>
              </template>
            </Column>
            <Column header="Altri costi" style="min-width: 130px">
              <template #body="{ data }">
                <span class="tabular">{{ format.money(data.expenses) }}</span>
              </template>
            </Column>
            <Column header="Totale" style="min-width: 130px">
              <template #body="{ data }">
                <strong class="tabular">{{ format.money(data.total) }}</strong>
              </template>
            </Column>
          </AppDataTable>
        </TabPanel>

        <TabPanel value="composizione">
          <div class="composition">
            <AppChart
              type="donut"
              :series="costChart.series"
              :options="costChart.options"
              :height="340"
              :loading="loading"
            />
          </div>
        </TabPanel>

        <TabPanel value="operai">
          <AppDataTable
            :value="byEmployee"
            :loading="loading"
            :searchable="false"
            data-key="employee.id"
            empty-title="Nessuna ora registrata"
            empty-message="Non risultano ore su questo cantiere."
          >
            <Column header="Operaio" style="min-width: 200px">
              <template #body="{ data }">
                <NuxtLink v-if="data.employee" :to="`/operai/${data.employee.id}`" class="link">
                  {{ employeeFullName(data.employee) }}
                </NuxtLink>
                <span v-else class="u-muted">Operaio rimosso</span>
              </template>
            </Column>
            <Column header="Ore" style="min-width: 110px">
              <template #body="{ data }">
                <span class="tabular">{{ format.decimalHours(data.minutes) }}</span>
              </template>
            </Column>
            <Column header="Costo" style="min-width: 130px">
              <template #body="{ data }">
                <strong class="tabular">{{ format.money(data.cost) }}</strong>
              </template>
            </Column>
          </AppDataTable>
        </TabPanel>

        <TabPanel value="costi">
          <AppDataTable
            :value="siteExpenses"
            :loading="loading"
            :filter-fields="['description', 'supplier', 'documentRef']"
            empty-title="Nessun costo"
            empty-message="Non ci sono costi registrati su questo cantiere."
          >
            <Column field="date" header="Data" sortable style="min-width: 110px">
              <template #body="{ data }">
                <span class="tabular">{{ DateKeys.format(data.date) }}</span>
              </template>
            </Column>
            <Column field="category" header="Categoria" sortable style="min-width: 140px">
              <template #body="{ data }">
                <Tag :value="expenseCategoryLabel(data.category)" severity="secondary" rounded />
              </template>
            </Column>
            <Column field="description" header="Descrizione" sortable style="min-width: 200px" />
            <Column field="supplier" header="Fornitore" sortable style="min-width: 180px" />
            <Column field="amountCents" header="Importo" sortable style="min-width: 130px">
              <template #body="{ data }">
                <strong class="tabular">{{ format.money(data.amountCents) }}</strong>
              </template>
            </Column>
          </AppDataTable>
        </TabPanel>

        <TabPanel value="fatture">
          <AppDataTable
            :value="siteInvoices"
            :loading="loading"
            :filter-fields="['number', 'description']"
            empty-title="Nessuna fattura"
            empty-message="Non e' ancora stato emesso nulla per questo cantiere."
          >
            <Column field="number" header="Numero" sortable style="min-width: 110px" />
            <Column field="date" header="Data" sortable style="min-width: 110px">
              <template #body="{ data }">
                <span class="tabular">{{ DateKeys.format(data.date) }}</span>
              </template>
            </Column>
            <Column field="description" header="Descrizione" style="min-width: 220px" />
            <Column header="Stato" style="min-width: 130px">
              <template #body="{ data }">
                <AppStatusTag :value="invoiceStatus(data)" :options="INVOICE_STATUS_OPTIONS" />
              </template>
            </Column>
            <Column field="amountCents" header="Imponibile" sortable style="min-width: 130px">
              <template #body="{ data }">
                <strong class="tabular">{{ format.money(data.amountCents) }}</strong>
              </template>
            </Column>
          </AppDataTable>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.balance {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-5);
}

.balance__item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 130px;
}

.balance__item small {
  font-size: 0.78rem;
}

.balance__item strong {
  font-size: 1.5rem;
  font-weight: 660;
  letter-spacing: -0.02em;
}

.balance__arrow {
  color: var(--p-text-muted-color);
  opacity: 0.5;
}

.balance__caption {
  display: block;
  margin-top: var(--space-2);
  font-size: 0.78rem;
}

.link {
  font-weight: 570;
  color: var(--p-primary-color);
}

.composition {
  max-width: 460px;
  margin: 0 auto;
  padding: var(--space-4) 0;
}
</style>
