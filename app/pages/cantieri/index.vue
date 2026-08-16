<script setup lang="ts">
import type { Site, SiteStatus } from '~/core/domain'
import { DateKeys, Money, SITE_STATUS_OPTIONS, calculateSiteSummary } from '~/core/domain'

useHead({ title: 'Cantieri — Dinelli Srl' })

const format = useFormat()
const { sites, clients, worklogs, expenses, invoices, loading, loadAll } = useAppData()

void loadAll()

const statusFilter = ref<SiteStatus[]>(['preventivo', 'attivo', 'sospeso'])

/**
 * Ogni cantiere arriva alla tabella gia' con il suo consuntivo calcolato.
 * Serve per poter ordinare e filtrare su costo, margine e percentuale di
 * preventivo consumato, che sono le colonne che si guardano davvero.
 */
const rows = computed(() =>
  sites.items
    .filter(site => statusFilter.value.length === 0 || statusFilter.value.includes(site.status))
    .map(site => ({
      site,
      clientName: clients.find(site.clientId)?.name ?? '—',
      summary: calculateSiteSummary({
        site,
        worklogs: worklogs.items.filter(worklog => worklog.siteId === site.id),
        expenses: expenses.items.filter(expense => expense.siteId === site.id),
        invoices: invoices.items.filter(invoice => invoice.siteId === site.id),
      }),
    }))
    .sort((a, b) => b.site.code.localeCompare(a.site.code)),
)

const totals = computed(() => ({
  budget: Money.sum(rows.value.map(row => row.summary.budgetCents)),
  cost: Money.sum(rows.value.map(row => row.summary.totalCostCents)),
  invoiced: Money.sum(rows.value.map(row => row.summary.invoicedCents)),
}))

function openSite(site: Site): void {
  navigateTo(`/cantieri/${site.id}`)
}
</script>

<template>
  <div class="u-stack">
    <AppPageHeader
      title="Cantieri"
      subtitle="Commesse aperte, preventivi e costi sostenuti."
    >
      <template #actions>
        <Button label="Nuovo cantiere" icon="pi pi-plus" @click="navigateTo('/cantieri/nuovo')" />
      </template>
    </AppPageHeader>

    <section class="u-grid" style="--grid-min: 220px">
      <AppStatCard
        label="Preventivi in essere"
        :value="format.money(totals.budget)"
        icon="pi pi-file-edit"
        :loading="loading"
      />
      <AppStatCard
        label="Costi sostenuti"
        :value="format.money(totals.cost)"
        icon="pi pi-euro"
        :hint="`${format.percent(Money.percentOf(totals.cost, totals.budget))} dei preventivi`"
        :loading="loading"
      />
      <AppStatCard
        label="Fatturato"
        :value="format.money(totals.invoiced)"
        icon="pi pi-file-check"
        :loading="loading"
      />
    </section>

    <Card>
      <template #content>
        <AppDataTable
          :value="rows"
          :loading="loading"
          :filter-fields="['site.code', 'site.name', 'clientName', 'site.city']"
          data-key="site.id"
          empty-icon="pi pi-building-columns"
          empty-title="Nessun cantiere"
          empty-message="Nessun cantiere corrisponde ai filtri selezionati."
        >
          <template #toolbar>
            <MultiSelect
              v-model="statusFilter"
              :options="SITE_STATUS_OPTIONS"
              option-label="label"
              option-value="value"
              placeholder="Tutti gli stati"
              display="chip"
              :max-selected-labels="3"
              selected-items-label="{0} stati"
              class="filter"
            />
          </template>

          <Column field="site.code" header="Codice" sortable style="min-width: 130px">
            <template #body="{ data }">
              <NuxtLink :to="`/cantieri/${data.site.id}`" class="link">
                {{ data.site.code }}
              </NuxtLink>
            </template>
          </Column>

          <Column field="site.name" header="Cantiere" sortable style="min-width: 220px">
            <template #body="{ data }">
              <div class="cell-stack" @click="openSite(data.site)">
                <strong>{{ data.site.name }}</strong>
                <small class="u-muted">{{ data.site.city }}</small>
              </div>
            </template>
          </Column>

          <Column field="clientName" header="Cliente" sortable style="min-width: 180px" />

          <Column field="site.status" header="Stato" sortable style="min-width: 130px">
            <template #body="{ data }">
              <AppStatusTag :value="data.site.status" :options="SITE_STATUS_OPTIONS" />
            </template>
          </Column>

          <Column field="summary.budgetCents" header="Preventivo" sortable style="min-width: 130px">
            <template #body="{ data }">
              <span class="tabular">{{ format.money(data.summary.budgetCents) }}</span>
            </template>
          </Column>

          <Column field="summary.totalCostCents" header="Costo reale" sortable style="min-width: 130px">
            <template #body="{ data }">
              <span class="tabular">{{ format.money(data.summary.totalCostCents) }}</span>
            </template>
          </Column>

          <Column field="summary.budgetUsedPercent" header="Consumo" sortable style="min-width: 170px">
            <template #body="{ data }">
              <div class="usage">
                <ProgressBar
                  :value="Math.min(100, data.summary.budgetUsedPercent)"
                  :show-value="false"
                  :pt="{ value: { style: { background: data.summary.isOverBudget ? 'var(--p-red-500)' : undefined } } }"
                  style="height: 6px"
                />
                <small class="tabular" :class="{ 'u-negative': data.summary.isOverBudget }">
                  {{ format.percent(data.summary.budgetUsedPercent) }}
                </small>
              </div>
            </template>
          </Column>

          <Column field="site.startDate" header="Inizio" sortable style="min-width: 110px">
            <template #body="{ data }">
              <span class="tabular">{{ DateKeys.format(data.site.startDate) }}</span>
            </template>
          </Column>
        </AppDataTable>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.link {
  font-weight: 600;
  color: var(--p-primary-color);
}

.cell-stack {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  cursor: pointer;
}

.cell-stack strong {
  font-weight: 570;
}

.cell-stack small {
  font-size: 0.75rem;
}

.usage {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.usage :deep(.p-progressbar) {
  flex: 1;
  min-width: 60px;
}

.usage small {
  font-size: 0.78rem;
  font-weight: 550;
  min-width: 46px;
  text-align: right;
}

.filter {
  min-width: 220px;
}
</style>
