<script setup lang="ts">
import { DateKeys, Money, MonthKeys, siteLabel } from '~/core/domain'
import { useDashboardMetrics } from '~/features/dashboard/useDashboardMetrics'

useHead({ title: 'Dashboard — Dinelli Srl' })

const auth = useAuthStore()
const format = useFormat()

const {
  loading,
  loadAll,
  today,
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
} = useDashboardMetrics()

/**
 * Avvio del caricamento senza attenderlo.
 * Con un await qui la pagina resterebbe sospesa e gli scheletri di caricamento
 * non comparirebbero mai: si vedrebbe una schermata bianca e poi tutto insieme.
 */
void loadAll()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buongiorno'
  if (hour < 18) return 'Buon pomeriggio'
  return 'Buonasera'
})

/** Etichetta della giornata mostrata: "oggi" oppure la data effettiva. */
const dayLabel = computed(() => {
  if (!dayShown.value) return '—'
  return isShowingToday.value ? 'oggi' : `il ${DateKeys.format(dayShown.value)}`
})

const hasAlerts = computed(() =>
  overdueInvoices.value.length > 0 || overBudgetSites.value.length > 0 || lateSites.value.length > 0,
)

// ------------------------------------------------------------------ grafici

const compactNumber = (value: number) =>
  new Intl.NumberFormat('it-IT', { notation: 'compact', maximumFractionDigits: 0 }).format(value)

const euroTooltip = { formatter: (value: number) => Money.format(Money.fromEuro(value)) }

const monthlyChart = computed(() => ({
  series: [
    { name: 'Manodopera', data: monthlySeries.value.map(entry => Money.toEuro(entry.laborCents)) },
    { name: 'Altri costi', data: monthlySeries.value.map(entry => Money.toEuro(entry.expensesCents)) },
    { name: 'Fatturato', data: monthlySeries.value.map(entry => Money.toEuro(entry.invoicedCents)) },
  ],
  options: {
    colors: ['#ef4444', '#f59e0b', '#10b981'],
    plotOptions: {
      bar: { columnWidth: '58%', borderRadius: 4, borderRadiusApplication: 'end' as const },
    },
    xaxis: {
      categories: monthlySeries.value.map(entry => MonthKeys.formatShort(entry.month)),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { formatter: compactNumber } },
    tooltip: { y: euroTooltip },
  },
}))

const compositionChart = computed(() => ({
  series: costComposition.value.map(entry => Money.toEuro(entry.value)),
  options: {
    labels: costComposition.value.map(entry => entry.label),
    colors: costComposition.value.map(entry => entry.color),
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Totale 12 mesi',
              fontSize: '12px',
              formatter: () => Money.formatCompact(Money.sum(costComposition.value.map(entry => entry.value))),
            },
          },
        },
      },
    },
    tooltip: { y: euroTooltip },
  },
}))

/** Preventivo contro consuntivo, un cantiere per riga. */
const budgetChart = computed(() => {
  const entries = openSiteSummaries.value.slice(0, 6)

  return {
    series: [
      { name: 'Preventivo', data: entries.map(entry => Money.toEuro(entry.summary.budgetCents)) },
      { name: 'Costo reale', data: entries.map(entry => Money.toEuro(entry.summary.totalCostCents)) },
    ],
    options: {
      colors: ['#94a3b8', '#f59e0b'],
      plotOptions: {
        bar: { horizontal: true, barHeight: '62%', borderRadius: 4, borderRadiusApplication: 'end' as const },
      },
      xaxis: {
        categories: entries.map(entry => entry.site.code),
        labels: { formatter: (value: string) => compactNumber(Number(value)) },
      },
      tooltip: { y: euroTooltip },
    },
  }
})
</script>

<template>
  <div class="u-stack" style="--stack-gap: var(--space-5)">
    <AppPageHeader
      :title="`${greeting}, ${auth.displayName}`"
      :subtitle="`Situazione aggiornata al ${DateKeys.formatLong(today)}`"
    >
      <template #actions>
        <Button label="Registra ore" icon="pi pi-plus" @click="navigateTo('/ore/nuovo')" />
      </template>
    </AppPageHeader>

    <section class="u-grid" style="--grid-min: 190px">
      <AppStatCard
        label="Cantieri aperti"
        :value="format.number(openSites.length)"
        icon="pi pi-building-columns"
        :hint="lateSites.length ? `${format.count(lateSites.length, 'cantiere', 'cantieri')} oltre la data prevista` : 'Tutti nei tempi'"
        :hint-tone="lateSites.length ? 'negative' : 'positive'"
        :loading="loading"
        to="/cantieri"
      />

      <AppStatCard
        label="Operai in forza"
        :value="format.number(activeEmployees.length)"
        icon="pi pi-users"
        :hint="`${format.count(presentCount, 'presente', 'presenti')} ${dayLabel}`"
        :loading="loading"
        to="/operai"
      />

      <AppStatCard
        :label="`Ore lavorate ${dayLabel}`"
        :value="format.decimalHours(dayMinutes)"
        icon="pi pi-clock"
        :hint="`${format.decimalHours(hoursThisMonth)} ore nel mese`"
        :loading="loading"
        to="/ore"
      />

      <AppStatCard
        :label="`Costo giornata ${dayLabel}`"
        :value="format.money(dayCost)"
        icon="pi pi-euro"
        hint="Sola manodopera"
        :loading="loading"
      />

      <AppStatCard
        label="Costi del mese"
        :value="format.money(monthTotals.totalCostCents)"
        icon="pi pi-chart-line"
        :hint="monthCostChange === null
          ? 'Nessun confronto disponibile'
          : `${monthCostChange > 0 ? '+' : ''}${format.percent(monthCostChange)} sul mese scorso`"
        :hint-tone="monthCostChange === null ? 'neutral' : (monthCostChange > 0 ? 'negative' : 'positive')"
        :loading="loading"
        to="/costi"
      />

      <AppStatCard
        label="Margine del mese"
        :value="format.money(monthTotals.marginCents)"
        icon="pi pi-percentage"
        :hint="`Fatturato ${format.money(monthTotals.invoicedCents)}`"
        :hint-tone="monthTotals.marginCents >= 0 ? 'positive' : 'negative'"
        :loading="loading"
        to="/fatture"
      />
    </section>

    <section v-if="hasAlerts" class="u-grid" style="--grid-min: 300px">
      <Message v-if="overdueInvoices.length" severity="error">
        <div class="alert">
          <strong>{{ format.count(overdueInvoices.length, 'fattura scaduta', 'fatture scadute') }}</strong>
          <span>{{ format.money(overdueTotal) }} ancora da incassare.</span>
          <NuxtLink to="/fatture" class="alert__link">Vai alle fatture</NuxtLink>
        </div>
      </Message>

      <Message v-if="overBudgetSites.length" severity="warn">
        <div class="alert">
          <strong>{{ format.count(overBudgetSites.length, 'cantiere oltre preventivo', 'cantieri oltre preventivo') }}</strong>
          <span>{{ overBudgetSites.map(entry => entry.site.code).join(', ') }}</span>
          <NuxtLink to="/cantieri" class="alert__link">Vai ai cantieri</NuxtLink>
        </div>
      </Message>

      <Message v-if="lateSites.length" severity="warn">
        <div class="alert">
          <strong>{{ format.count(lateSites.length, 'cantiere in ritardo', 'cantieri in ritardo') }}</strong>
          <span>Data di fine prevista gia' superata.</span>
          <NuxtLink to="/cantieri" class="alert__link">Controlla le scadenze</NuxtLink>
        </div>
      </Message>
    </section>

    <section class="dashboard__charts">
      <Card class="dashboard__chart-wide">
        <template #content>
          <AppChart
            title="Costi e fatturato negli ultimi 12 mesi"
            type="bar"
            :series="monthlyChart.series"
            :options="monthlyChart.options"
            :height="320"
            :loading="loading"
          />
        </template>
      </Card>

      <Card>
        <template #content>
          <AppChart
            title="Composizione dei costi"
            type="donut"
            :series="compositionChart.series"
            :options="compositionChart.options"
            :height="320"
            :loading="loading"
          />
        </template>
      </Card>

      <Card class="dashboard__chart-wide">
        <template #content>
          <AppChart
            title="Preventivo contro costo reale"
            type="bar"
            :series="budgetChart.series"
            :options="budgetChart.options"
            :height="300"
            :loading="loading"
          />
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="chart__title">
            Cantieri per costo sostenuto
          </div>

          <div v-if="loading" class="u-stack">
            <Skeleton v-for="index in 5" :key="index" height="2.6rem" />
          </div>

          <AppEmptyState
            v-else-if="!openSiteSummaries.length"
            icon="pi pi-building-columns"
            title="Nessun cantiere aperto"
            message="Apri un cantiere per vedere qui l'andamento dei costi."
          />

          <ul v-else class="site-list">
            <li v-for="entry in openSiteSummaries.slice(0, 6)" :key="entry.site.id">
              <NuxtLink :to="`/cantieri/${entry.site.id}`" class="site-list__row">
                <div class="site-list__head">
                  <span class="u-truncate">{{ siteLabel(entry.site) }}</span>
                  <strong class="tabular">{{ format.moneyCompact(entry.summary.totalCostCents) }}</strong>
                </div>

                <ProgressBar
                  :value="Math.min(100, entry.summary.budgetUsedPercent)"
                  :show-value="false"
                  :pt="{ value: { style: { background: entry.summary.isOverBudget ? 'var(--p-red-500)' : undefined } } }"
                  style="height: 6px"
                />

                <small class="u-muted" :class="{ 'u-negative': entry.summary.isOverBudget }">
                  {{ format.percent(entry.summary.budgetUsedPercent) }} del preventivo
                  ({{ format.moneyCompact(entry.summary.budgetCents) }})
                </small>
              </NuxtLink>
            </li>
          </ul>
        </template>
      </Card>
    </section>
  </div>
</template>

<style scoped>
.dashboard__charts {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(3, 1fr);
}

/* Le schede devono poter rimpicciolirsi: il grafico scorre al loro interno. */
.dashboard__charts > * {
  min-width: 0;
}

.dashboard__chart-wide {
  grid-column: span 2;
}

@media (max-width: 1200px) {
  .dashboard__charts {
    grid-template-columns: 1fr;
  }

  .dashboard__chart-wide {
    grid-column: span 1;
  }
}

.alert {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.875rem;
}

.alert strong {
  font-weight: 620;
}

.alert__link {
  margin-top: 0.3rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.chart__title {
  font-size: 0.9rem;
  font-weight: 620;
  margin-bottom: var(--space-3);
}

.site-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.site-list__row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.4rem;
  margin: -0.4rem;
  border-radius: 8px;
}

.site-list__row:hover {
  background: var(--p-surface-100);
}

.app-dark .site-list__row:hover {
  background: var(--p-surface-800);
}

.site-list__head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: 0.875rem;
}

.site-list__head strong {
  font-weight: 620;
  white-space: nowrap;
}

.site-list small {
  font-size: 0.75rem;
}
</style>
