<script setup lang="ts">
import type { DateKey, MonthKey, Minutes, ScheduleEntry, Site } from '~/core/domain'
import { DateKeys, Duration, MonthKeys, isSiteSelectable, siteLabel } from '~/core/domain'

useHead({ title: 'Programmazione — Dinelli Srl' })

const format = useFormat()
const notify = useNotify()
const confirmDelete = useConfirmDelete()
const schedule = useScheduleStore()
const { sites, loadAll, loading } = useAppData()

void loadAll()

const GIORNI = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM']

/**
 * Colori dei cantieri nel calendario.
 *
 * Il cantiere non ha un colore proprio nel dominio: qui basta una tinta
 * stabile per riconoscerlo a colpo d'occhio, non un attributo persistito.
 * L'hash sull'id garantisce che lo stesso cantiere tenga sempre lo stesso
 * colore, indipendentemente dall'ordine con cui arrivano dallo store.
 */
const SITE_COLORS = ['#d97706', '#2563eb', '#059669', '#be185d', '#7c3aed', '#0891b2', '#b45309', '#4338ca']

function siteColor(siteId: string): string {
  let hash = 0
  for (let i = 0; i < siteId.length; i += 1) hash = (hash * 31 + siteId.charCodeAt(i)) >>> 0
  return SITE_COLORS[hash % SITE_COLORS.length]!
}

const today = DateKeys.today()
const cursor = ref<MonthKey>(MonthKeys.current())
const selectedDate = ref<DateKey | null>(null)

function changeMonth(delta: number): void {
  cursor.value = MonthKeys.addMonths(cursor.value, delta)
  selectedDate.value = null
}

function goToday(): void {
  cursor.value = MonthKeys.current()
  selectedDate.value = null
}

interface Cell {
  date: DateKey
  day: number
  inMonth: boolean
}

/** Griglia di 42 celle (6 settimane), a partire dal lunedi' prima del primo del mese. */
const cells = computed<Cell[]>(() => {
  const first = DateKeys.toDate(MonthKeys.firstDay(cursor.value))
  const startOffset = (first.getDay() + 6) % 7

  const gridStart = DateKeys.addDays(MonthKeys.firstDay(cursor.value), -startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = DateKeys.addDays(gridStart, index)
    return {
      date,
      day: DateKeys.toDate(date).getDate(),
      inMonth: DateKeys.month(date) === cursor.value,
    }
  })
})

const availableSites = computed(() => sites.items.filter(isSiteSelectable))

function siteById(id: string): Site | undefined {
  return sites.find(id) ?? undefined
}

const entriesByDate = computed(() => {
  const map = new Map<DateKey, ScheduleEntry[]>()
  for (const entry of schedule.items) {
    const list = map.get(entry.date) ?? []
    list.push(entry)
    map.set(entry.date, list)
  }
  return map
})

function entriesFor(date: DateKey): ScheduleEntry[] {
  return entriesByDate.value.get(date) ?? []
}

const selectedEntries = computed(() => (selectedDate.value ? entriesFor(selectedDate.value) : []))

/** Totali del mese mostrato, per cantiere. */
const monthTotals = computed(() => {
  const totals = new Map<string, Minutes>()
  for (const entry of schedule.items) {
    if (DateKeys.month(entry.date) !== cursor.value) continue
    totals.set(entry.siteId, Duration.add(totals.get(entry.siteId) ?? Duration.zero, entry.plannedMinutes))
  }
  return [...totals.entries()]
    .map(([siteId, minutes]) => ({ siteId, site: siteById(siteId), minutes }))
    .sort((a, b) => b.minutes - a.minutes)
})

const monthTotalMinutes = computed(() => Duration.sum(monthTotals.value.map(row => row.minutes)))
const monthPlannedDays = computed(() => new Set(
  schedule.items.filter(entry => DateKeys.month(entry.date) === cursor.value).map(entry => entry.date),
).size)

const formSiteId = ref<string>('')
const formPlannedMinutes = ref(Duration.fromHours(8))

watchEffect(() => {
  if (!formSiteId.value && availableSites.value.length) {
    formSiteId.value = availableSites.value[0]!.id
  }
})

function selectDay(cell: Cell): void {
  if (!cell.inMonth) return
  selectedDate.value = cell.date
}

async function addEntry(): Promise<void> {
  if (!selectedDate.value || !formSiteId.value) return

  try {
    await schedule.create({
      date: selectedDate.value,
      siteId: formSiteId.value,
      plannedMinutes: formPlannedMinutes.value,
      notes: '',
    })
    notify.saved('Programmazione aggiornata.')
  }
  catch {
    notify.error()
  }
}

async function removeEntry(entry: ScheduleEntry): Promise<void> {
  const site = siteById(entry.siteId)
  const confirmed = await confirmDelete({
    what: `la programmazione di ${site ? siteLabel(site) : 'questo cantiere'} del ${DateKeys.format(entry.date)}`,
  })
  if (!confirmed) return

  try {
    await schedule.remove(entry.id)
    notify.deleted('Programmazione rimossa.')
  }
  catch {
    notify.error()
  }
}
</script>

<template>
  <div class="u-stack">
    <AppPageHeader title="Programmazione" subtitle="Pianifica in anticipo le ore di lavoro sui cantieri, giorno per giorno." />

    <section class="u-grid" style="--grid-min: 190px">
      <AppStatCard
        label="Ore programmate nel mese"
        :value="format.decimalHours(monthTotalMinutes)"
        icon="pi pi-clock"
        :loading="loading"
      />
      <AppStatCard
        label="Giorni pianificati"
        :value="format.number(monthPlannedDays)"
        icon="pi pi-calendar"
        :loading="loading"
      />
      <AppStatCard
        label="Cantieri coinvolti"
        :value="format.number(monthTotals.length)"
        icon="pi pi-building-columns"
        :loading="loading"
      />
    </section>

    <div class="layout">
      <div class="u-stack" style="--stack-gap: var(--space-4)">
        <div class="u-cluster u-cluster--between">
          <h3 class="month-title">
            {{ format.month(cursor) }}
          </h3>
          <div class="u-cluster" style="--cluster-gap: var(--space-2)">
            <Button icon="pi pi-chevron-left" severity="secondary" outlined rounded aria-label="Mese precedente" @click="changeMonth(-1)" />
            <Button label="Oggi" severity="secondary" outlined @click="goToday" />
            <Button icon="pi pi-chevron-right" severity="secondary" outlined rounded aria-label="Mese successivo" @click="changeMonth(1)" />
          </div>
        </div>

        <div v-if="availableSites.length" class="u-cluster legend">
          <div v-for="site in availableSites" :key="site.id" class="legend__item">
            <span class="legend__dot" :style="{ background: siteColor(site.id) }" />
            {{ siteLabel(site) }}
          </div>
        </div>

        <div class="calendar">
          <div class="calendar__weekdays">
            <div v-for="giorno in GIORNI" :key="giorno" class="calendar__weekday">
              {{ giorno }}
            </div>
          </div>
          <div class="calendar__grid">
            <div
              v-for="cell in cells"
              :key="cell.date"
              class="calendar__cell"
              :class="{
                'calendar__cell--outside': !cell.inMonth,
                'calendar__cell--selected': selectedDate === cell.date,
                'calendar__cell--today': cell.date === today,
              }"
              @click="selectDay(cell)"
            >
              <div class="calendar__cell-top">
                <span class="calendar__day tabular">{{ cell.day }}</span>
                <span v-if="entriesFor(cell.date).length" class="calendar__day-total tabular">
                  {{ format.decimalHours(Duration.sum(entriesFor(cell.date).map(e => e.plannedMinutes))) }}h
                </span>
              </div>
              <div v-if="cell.inMonth" class="calendar__chips">
                <span
                  v-for="entry in entriesFor(cell.date).slice(0, 3)"
                  :key="entry.id"
                  class="calendar__chip"
                  :style="{ background: siteColor(entry.siteId) }"
                  :title="siteById(entry.siteId) ? siteLabel(siteById(entry.siteId)!) : ''"
                >
                  {{ siteById(entry.siteId)?.name ?? '—' }}
                </span>
                <span v-if="entriesFor(cell.date).length > 3" class="calendar__chip calendar__chip--more">
                  +{{ entriesFor(cell.date).length - 3 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="monthTotals.length" class="u-stack" style="--stack-gap: var(--space-2)">
          <strong class="totals-title">Ore pianificate per cantiere questo mese</strong>
          <div v-for="row in monthTotals" :key="row.siteId" class="totals-row">
            <span class="legend__dot" :style="{ background: siteColor(row.siteId) }" />
            <span class="totals-row__name">{{ row.site ? siteLabel(row.site) : 'Cantiere rimosso' }}</span>
            <strong class="tabular">{{ format.decimalHours(row.minutes) }}</strong>
          </div>
        </div>
      </div>

      <Card class="side-panel">
        <template #content>
          <AppEmptyState
            v-if="!selectedDate"
            icon="pi pi-calendar"
            title="Nessun giorno selezionato"
            message="Seleziona un giorno nel calendario per programmare ore e cantieri."
          />
          <div v-else class="u-stack" style="--stack-gap: var(--space-4)">
            <div>
              <span class="side-panel__label">Giorno selezionato</span>
              <h4 class="side-panel__date">
                {{ DateKeys.formatLong(selectedDate) }}
              </h4>
            </div>

            <div class="u-stack" style="--stack-gap: var(--space-2)">
              <div v-if="!selectedEntries.length" class="u-muted entry-empty">
                Nessun cantiere pianificato.
              </div>
              <div v-for="entry in selectedEntries" :key="entry.id" class="entry-row">
                <span class="legend__dot" :style="{ background: siteColor(entry.siteId) }" />
                <span class="entry-row__name">{{ siteById(entry.siteId)?.name ?? 'Cantiere rimosso' }}</span>
                <span class="entry-row__hours tabular">
                  <i class="pi pi-clock" aria-hidden="true" />
                  {{ format.decimalHours(entry.plannedMinutes) }}h
                </span>
                <Button icon="pi pi-times" severity="secondary" text rounded aria-label="Rimuovi" @click="removeEntry(entry)" />
              </div>
            </div>

            <div class="add-form">
              <span class="side-panel__label">Aggiungi</span>
              <Select
                v-model="formSiteId"
                :options="availableSites"
                :option-label="siteLabel"
                option-value="id"
                placeholder="Seleziona cantiere"
                filter
                fluid
              />
              <div class="u-cluster" style="--cluster-gap: var(--space-2)">
                <AppHoursInput v-model="formPlannedMinutes" class="add-form__hours" />
                <Button label="Aggiungi" icon="pi pi-plus" :disabled="!formSiteId" @click="addEntry" />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  align-items: flex-start;
  gap: var(--space-5);
}

.month-title {
  font-size: 1.3rem;
}

.legend {
  --cluster-gap: var(--space-4);
}

.legend__item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--p-text-muted-color);
}

.legend__dot {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex-shrink: 0;
}

.calendar {
  border: 1px solid var(--p-surface-200);
  border-radius: var(--app-radius);
  overflow: hidden;
  background: var(--p-surface-0);
}

.app-dark .calendar {
  background: var(--p-surface-900);
  border-color: var(--p-surface-800);
}

.calendar__weekdays,
.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar__weekdays {
  border-bottom: 1px solid var(--p-surface-200);
}

.app-dark .calendar__weekdays {
  border-color: var(--p-surface-800);
}

.calendar__weekday {
  padding: 0.55rem 0;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--p-text-muted-color);
}

.calendar__cell {
  min-height: 92px;
  padding: 0.4rem 0.45rem;
  border-right: 1px solid var(--p-surface-200);
  border-bottom: 1px solid var(--p-surface-200);
  cursor: pointer;
  transition: background-color 0.15s;
}

.app-dark .calendar__cell {
  border-color: var(--p-surface-800);
}

.calendar__cell:hover {
  background: var(--p-surface-50);
}

.app-dark .calendar__cell:hover {
  background: var(--p-surface-800);
}

.calendar__cell--outside {
  opacity: 0.4;
  cursor: default;
}

.calendar__cell--outside:hover {
  background: transparent;
}

.calendar__cell--selected {
  background: var(--p-primary-50);
  box-shadow: inset 0 0 0 1.5px var(--p-primary-color);
}

.app-dark .calendar__cell--selected {
  background: color-mix(in srgb, var(--p-primary-color), transparent 88%);
}

.calendar__cell-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.calendar__day {
  font-size: 0.8rem;
}

.calendar__cell--today .calendar__day {
  color: var(--p-primary-color);
  font-weight: 700;
}

.calendar__day-total {
  font-size: 0.68rem;
  color: var(--p-text-muted-color);
}

.calendar__chips {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 0.3rem;
}

.calendar__chip {
  font-size: 0.65rem;
  padding: 2px 5px;
  border-radius: 3px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar__chip--more {
  background: var(--p-surface-200);
  color: var(--p-text-muted-color);
}

.app-dark .calendar__chip--more {
  background: var(--p-surface-700);
}

.totals-title {
  font-size: 0.82rem;
}

.totals-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.86rem;
}

.totals-row__name {
  flex: 1;
}

.side-panel {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: calc(var(--app-header-height) + var(--space-4));
}

.side-panel__label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--p-text-muted-color);
}

.side-panel__date {
  font-size: 1.05rem;
  margin-top: 0.2rem;
}

.entry-empty {
  font-size: 0.85rem;
}

.entry-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  background: var(--p-surface-50);
  font-size: 0.85rem;
}

.app-dark .entry-row {
  background: var(--p-surface-800);
}

.entry-row__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-row__hours {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--p-text-muted-color);
  flex-shrink: 0;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: var(--space-3);
  border-top: 1px solid var(--p-surface-200);
}

.app-dark .add-form {
  border-color: var(--p-surface-800);
}

.add-form__hours {
  flex: 1;
}

@media (max-width: 900px) {
  .layout {
    flex-direction: column;
  }

  .side-panel {
    width: 100%;
    position: static;
  }
}
</style>
