<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'

/**
 * Contenitore dei grafici.
 *
 * Applica una volta sola le impostazioni comuni a tutti i grafici del
 * gestionale: tipografia, griglia discreta, niente barra degli strumenti,
 * importi formattati in euro e colori che seguono il tema chiaro o scuro.
 * Chi lo usa passa solo i dati e le poche opzioni che riguardano quel grafico,
 * senza ripetere trenta righe di configurazione ogni volta.
 */
const props = withDefaults(defineProps<{
  type: 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'radialBar'
  series: unknown[]
  options?: ApexOptions
  height?: number | string
  /** Titolo mostrato sopra il grafico. */
  title?: string
  loading?: boolean
}>(), {
  height: 300,
})

const { isDark } = useDarkMode()

/** Unisce due livelli di profondita': basta per le opzioni di ApexCharts. */
function merge(base: ApexOptions, override: ApexOptions): ApexOptions {
  const result: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    const current = result[key]
    const bothPlainObjects
      = value !== null && typeof value === 'object' && !Array.isArray(value)
        && current !== null && typeof current === 'object' && !Array.isArray(current)

    result[key] = bothPlainObjects
      ? { ...(current as object), ...(value as object) }
      : value
  }

  return result as ApexOptions
}

const baseOptions = computed<ApexOptions>(() => ({
  chart: {
    fontFamily: 'inherit',
    toolbar: { show: false },
    zoom: { enabled: false },
    background: 'transparent',
    animations: { speed: 260 },
  },
  theme: { mode: isDark.value ? 'dark' : 'light' },
  grid: {
    borderColor: isDark.value ? '#1e293b' : '#e2e8f0',
    strokeDashArray: 4,
    padding: { left: 4, right: 4 },
  },
  dataLabels: { enabled: false },
  legend: {
    position: 'bottom',
    horizontalAlign: 'left',
    fontSize: '12px',
    markers: { size: 5 },
    itemMargin: { horizontal: 8, vertical: 4 },
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
  },
  stroke: { curve: 'smooth', width: props.type === 'line' ? 2.5 : 0 },
  states: { hover: { filter: { type: 'lighten' } } },
}))

const mergedOptions = computed(() => merge(baseOptions.value, props.options ?? {}))
</script>

<template>
  <div class="chart">
    <div v-if="title" class="chart__title">
      {{ title }}
    </div>

    <Skeleton v-if="loading" :height="`${typeof height === 'number' ? height : 300}px`" />

    <!--
      Il grafico scorre dentro il proprio riquadro invece di allargare la
      pagina: ApexCharts non scende sotto una certa larghezza, e su un telefono
      stretto trascinerebbe con se' tutta l'interfaccia. Meglio far scorrere il
      grafico, che e' quello che ci si aspetta da una serie di dodici mesi.
    -->
    <div v-else class="chart__viewport">
      <ClientOnly>
        <apexchart
          :type="type"
          :height="height"
          :series="series"
          :options="mergedOptions"
        />
        <template #fallback>
          <Skeleton :height="`${typeof height === 'number' ? height : 300}px`" />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.chart {
  min-width: 0;
}

.chart__title {
  font-size: 0.9rem;
  font-weight: 620;
  margin-bottom: var(--space-3);
}

.chart__viewport {
  overflow-x: auto;
  overflow-y: hidden;
  /* Lo scorrimento su iOS resta fluido e non trascina la pagina sottostante. */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}

/* ApexCharts inietta stili propri: qui si allineano al resto dell'interfaccia. */
.chart :deep(.apexcharts-tooltip) {
  border: 1px solid var(--p-surface-200) !important;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%) !important;
  border-radius: 8px !important;
}

.app-dark .chart :deep(.apexcharts-tooltip) {
  border-color: var(--p-surface-700) !important;
}

.chart :deep(.apexcharts-legend-text) {
  color: var(--p-text-muted-color) !important;
  font-size: 12px !important;
}
</style>
