<script setup lang="ts">
/**
 * Tabella dati.
 *
 * Involucro sottile attorno alla DataTable di PrimeVue che fissa una volta sola
 * le scelte valide per tutte le liste del gestionale: impaginazione, righe
 * alternate, ordinamento, ricerca globale, scorrimento orizzontale su schermi
 * stretti e stato vuoto coerente.
 *
 * Le colonne restano nello slot del chiamante: incapsularle avrebbe voluto dire
 * inventare un linguaggio di descrizione delle colonne meno espressivo di
 * quello che PrimeVue offre gia'.
 */
withDefaults(defineProps<{
  value: unknown[]
  loading?: boolean
  /** Campi su cui agisce la ricerca in alto a destra. */
  filterFields?: string[]
  emptyTitle?: string
  emptyMessage?: string
  emptyIcon?: string
  rows?: number
  /** Nasconde la barra di ricerca sulle liste corte. */
  searchable?: boolean
  dataKey?: string
}>(), {
  rows: 25,
  searchable: true,
  dataKey: 'id',
  emptyTitle: 'Nessun risultato',
  emptyIcon: 'pi pi-inbox',
})

const search = ref('')

/**
 * La ricerca globale di PrimeVue si configura con questo oggetto.
 * Il valore 'contains' senza distinzione di maiuscole e' quello che si aspetta
 * chi digita: cercare "verdi" deve trovare "Palazzo Verdi".
 */
const filters = computed(() => ({
  global: { value: search.value || null, matchMode: 'contains' as const },
}))
</script>

<template>
  <DataTable
    :value="value"
    :loading="loading"
    :data-key="dataKey"
    :filters="filters"
    :global-filter-fields="filterFields"
    :rows="rows"
    :paginator="value.length > rows"
    :rows-per-page-options="[25, 50, 100]"
    paginator-template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
    current-page-report-template="{first}–{last} di {totalRecords}"
    striped-rows
    removable-sort
    scrollable
    size="small"
  >
    <template v-if="searchable || $slots.toolbar" #header>
      <div class="table__header">
        <slot name="toolbar" />

        <IconField v-if="searchable" class="table__search">
          <InputIcon class="pi pi-search" />
          <InputText v-model="search" placeholder="Cerca..." />
        </IconField>
      </div>
    </template>

    <slot />

    <template #empty>
      <AppEmptyState :icon="emptyIcon" :title="emptyTitle" :message="emptyMessage">
        <slot name="emptyAction" />
      </AppEmptyState>
    </template>

    <template #loading>
      <div class="u-stack" style="width: 100%">
        <Skeleton v-for="index in 5" :key="index" height="2.2rem" />
      </div>
    </template>
  </DataTable>
</template>

<style scoped>
.table__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.table__search {
  margin-left: auto;
}

@media (max-width: 640px) {
  .table__search {
    width: 100%;
  }

  .table__search :deep(input) {
    width: 100%;
  }
}
</style>
