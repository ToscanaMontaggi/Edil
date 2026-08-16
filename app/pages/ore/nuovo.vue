<script setup lang="ts">
import { DateKeys, employeeFullName, employeeInitials, siteLabel } from '~/core/domain'
import { useWorklogEntry } from '~/features/worklogs/useWorklogEntry'

useHead({ title: 'Registra ore — Dinelli Srl' })

const format = useFormat()
const notify = useNotify()

const {
  loading,
  saving,
  loadAll,
  date,
  siteId,
  phaseId,
  notes,
  selectableSites,
  sitePhases,
  rows,
  presentRows,
  entryFor,
  totalMinutes,
  totalCost,
  allPresent,
  duplicateEmployeeIds,
  canSubmit,
  toggleAll,
  resetHours,
  submit,
} = useWorklogEntry()

void loadAll()

/** Il calendario di PrimeVue lavora con Date, il dominio con stringhe: si converte qui. */
const dateModel = computed({
  get: () => DateKeys.toDate(date.value),
  set: (value: Date | null) => {
    if (value) date.value = DateKeys.fromDate(value)
  },
})

const showDetails = ref(false)

async function save(): Promise<void> {
  try {
    const count = await submit()
    notify.saved(`Registrate ${count} giornate su ${count === 1 ? 'un operaio' : `${count} operai`}.`)
    await navigateTo('/ore')
  }
  catch {
    notify.error('Non e\' stato possibile registrare le ore.')
  }
}
</script>

<template>
  <div class="u-stack">
    <AppPageHeader
      title="Registra ore"
      subtitle="Scegli il cantiere, togli gli assenti e salva tutta la squadra insieme."
      back-to="/ore"
    />

    <Card>
      <template #content>
        <div class="entry__filters">
          <div class="field">
            <label for="data">Giorno</label>
            <DatePicker
              v-model="dateModel"
              input-id="data"
              date-format="dd/mm/yy"
              :max-date="new Date()"
              show-icon
              icon-display="input"
              fluid
            />
          </div>

          <div class="field">
            <label for="cantiere">Cantiere</label>
            <Select
              v-model="siteId"
              input-id="cantiere"
              :options="selectableSites"
              option-label="name"
              option-value="id"
              placeholder="Seleziona il cantiere"
              :loading="loading"
              filter
              filter-placeholder="Cerca"
              fluid
            >
              <template #option="{ option }">
                <div class="option">
                  <strong>{{ option.code }}</strong>
                  <span class="u-muted">{{ option.name }}</span>
                </div>
              </template>
              <template #value="{ value }">
                <span v-if="value">{{ siteLabel(selectableSites.find(site => site.id === value)!) }}</span>
                <span v-else class="u-muted">Seleziona il cantiere</span>
              </template>
            </Select>
          </div>

          <div class="field">
            <label for="fase">Fase</label>
            <Select
              v-model="phaseId"
              input-id="fase"
              :options="sitePhases"
              option-label="name"
              option-value="id"
              placeholder="Nessuna fase"
              :disabled="!siteId || !sitePhases.length"
              show-clear
              fluid
            />
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div class="u-cluster u-cluster--between crew__head">
          <div>
            <strong>Squadra</strong>
            <p class="u-muted">
              {{ presentRows.length }} operai selezionati su {{ rows.length }}
            </p>
          </div>

          <div class="u-cluster" style="--cluster-gap: var(--space-2)">
            <Button
              :label="allPresent ? 'Deseleziona tutti' : 'Seleziona tutti'"
              severity="secondary"
              outlined
              size="small"
              @click="toggleAll"
            />
            <Button
              label="Azzera ore"
              icon="pi pi-refresh"
              severity="secondary"
              text
              size="small"
              @click="resetHours"
            />
            <ToggleButton
              v-model="showDetails"
              on-label="Dettagli"
              off-label="Dettagli"
              on-icon="pi pi-eye"
              off-icon="pi pi-eye-slash"
              size="small"
            />
          </div>
        </div>

        <div v-if="loading" class="u-stack">
          <Skeleton v-for="index in 6" :key="index" height="3.6rem" />
        </div>

        <AppEmptyState
          v-else-if="!rows.length"
          icon="pi pi-users"
          title="Nessun operaio disponibile"
          message="Non ci sono operai attivi in questa data. Controlla l'anagrafica."
        />

        <ul v-else class="crew">
          <li
            v-for="row in rows"
            :key="row.employee.id"
            class="crew__row"
            :class="{ 'crew__row--on': row.present }"
          >
            <label class="crew__person">
              <Checkbox
                :model-value="row.present"
                binary
                @update:model-value="entryFor(row.employee.id).present = $event"
              />
              <Avatar :label="employeeInitials(row.employee)" shape="circle" size="normal" />
              <span class="crew__name">
                <strong class="u-truncate">{{ employeeFullName(row.employee) }}</strong>
                <small class="u-muted">{{ row.employee.qualification }}</small>
              </span>
            </label>

            <div v-if="row.present" class="crew__inputs">
              <div class="field field--inline">
                <label :for="`ord-${row.employee.id}`">Ordinarie</label>
                <AppHoursInput
                  v-model="entryFor(row.employee.id).ordinaryMinutes"
                  :input-id="`ord-${row.employee.id}`"
                />
              </div>

              <template v-if="showDetails">
                <div class="field field--inline">
                  <label :for="`str-${row.employee.id}`">Straordinari</label>
                  <AppHoursInput
                    v-model="entryFor(row.employee.id).overtimeMinutes"
                    :input-id="`str-${row.employee.id}`"
                    :max="8"
                  />
                </div>

                <div class="field field--inline field--switch">
                  <label :for="`tra-${row.employee.id}`">Trasferta</label>
                  <ToggleSwitch
                    v-model="entryFor(row.employee.id).travelAllowance"
                    :input-id="`tra-${row.employee.id}`"
                  />
                </div>
              </template>

              <span class="crew__cost tabular">{{ format.money(row.costCents) }}</span>
            </div>

            <div class="crew__flags">
              <Tag
                v-if="duplicateEmployeeIds.has(row.employee.id)"
                value="Gia' registrato"
                severity="warn"
                icon="pi pi-exclamation-triangle"
                rounded
              />
              <Tag
                v-if="row.missingRate"
                value="Senza tariffa"
                severity="danger"
                icon="pi pi-euro"
                rounded
              />
            </div>
          </li>
        </ul>
      </template>
    </Card>

    <Card>
      <template #content>
        <div class="field">
          <label for="note">Note della giornata</label>
          <Textarea
            id="note"
            v-model="notes"
            rows="2"
            placeholder="Lavorazioni svolte, imprevisti, materiale mancante..."
            fluid
          />
        </div>
      </template>
    </Card>

    <!-- Riepilogo sempre visibile in fondo: e' il pulsante che si preme ogni sera. -->
    <div class="summary">
      <div class="summary__totals">
        <div>
          <small class="u-muted">Ore totali</small>
          <strong class="tabular">{{ format.decimalHours(totalMinutes) }} h</strong>
        </div>
        <div>
          <small class="u-muted">Costo giornata</small>
          <strong class="tabular">{{ format.money(totalCost) }}</strong>
        </div>
      </div>

      <Button
        label="Salva registrazione"
        icon="pi pi-check"
        :disabled="!canSubmit"
        :loading="saving"
        size="large"
        @click="save"
      />
    </div>
  </div>
</template>

<style scoped>
.entry__filters {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 900px) {
  .entry__filters {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field > label {
  font-size: 0.82rem;
  font-weight: 550;
  color: var(--p-text-muted-color);
}

.field--inline {
  min-width: 150px;
}

.field--switch {
  min-width: 90px;
}

.option {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.option span {
  font-size: 0.8rem;
}

.crew__head {
  margin-bottom: var(--space-4);
}

.crew__head p {
  font-size: 0.82rem;
}

.crew {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.crew__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--p-surface-200);
  border-radius: 12px;
  transition: border-color 0.15s, background-color 0.15s;
}

.app-dark .crew__row {
  border-color: var(--p-surface-800);
}

.crew__row--on {
  border-color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color), transparent 95%);
}

.crew__person {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 200px;
  cursor: pointer;
}

.crew__name {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
}

.crew__name strong {
  font-size: 0.92rem;
  font-weight: 600;
}

.crew__name small {
  font-size: 0.76rem;
}

.crew__inputs {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
}

.crew__cost {
  font-weight: 640;
  font-size: 0.95rem;
  min-width: 90px;
  text-align: right;
  padding-bottom: 0.5rem;
}

.crew__flags {
  display: flex;
  gap: var(--space-2);
}

.crew__flags:empty {
  display: none;
}

/* Barra di conferma agganciata in basso: su telefono resta sopra la tab bar. */
.summary {
  position: sticky;
  bottom: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--app-radius);
  background: var(--p-surface-0);
  border: 1px solid var(--p-surface-200);
  box-shadow: 0 8px 28px rgb(15 23 42 / 12%);
}

.app-dark .summary {
  background: var(--p-surface-900);
  border-color: var(--p-surface-700);
}

.summary__totals {
  display: flex;
  gap: var(--space-6);
}

.summary__totals div {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.summary__totals small {
  font-size: 0.75rem;
}

.summary__totals strong {
  font-size: 1.2rem;
  font-weight: 660;
}

/* Sopra la barra di navigazione inferiore, che altrimenti la coprirebbe. */
@media (max-width: 1023px) {
  .summary {
    bottom: calc(var(--app-tabbar-height) + var(--space-2));
  }
}

@media (max-width: 640px) {
  .summary {
    flex-direction: column;
    align-items: stretch;
  }

  .summary__totals {
    justify-content: space-between;
  }

  .crew__inputs {
    width: 100%;
  }

  .crew__cost {
    flex: 1;
  }
}
</style>
