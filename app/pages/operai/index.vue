<script setup lang="ts">
import type { Draft, Employee, EmployeeRate } from '~/core/domain'
import {
  CONTRACT_TYPE_OPTIONS,
  DateKeys,
  EMPLOYEE_LEVEL_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  Money,
  currentRate,
  employeeFullName,
  employeeInitials,
} from '~/core/domain'

useHead({ title: 'Operai — Dinelli Srl' })

const format = useFormat()
const employees = useEmployeesStore()
const { worklogs, loadAll, loading } = useAppData()

void loadAll()

const today = DateKeys.today()

function blankEmployee(): Draft<Employee> {
  return {
    firstName: '',
    lastName: '',
    taxCode: '',
    phone: '',
    email: '',
    hireDate: today,
    endDate: null,
    qualification: '',
    level: '2',
    contract: 'indeterminato',
    status: 'attivo',
    rates: [{
      validFrom: today,
      hourlyCostCents: Money.fromEuro(26),
      overtimeMultiplier: 1.3,
      travelAllowanceCents: Money.fromEuro(18),
    }],
    notes: '',
  }
}

const dialog = useCrudDialog<Employee>({
  store: employees,
  blank: blankEmployee,
  describe: employee => `l'operaio ${employeeFullName(employee)}`,
  entityLabel: 'operaio',
  deleteConsequence: () => 'Le ore gia\' registrate restano, ma perderanno il collegamento all\'anagrafica.',
})

/** Ore totali per operaio: dice a colpo d'occhio chi e' stato piu' in cantiere. */
const minutesByEmployee = computed(() => {
  const totals = new Map<string, number>()
  for (const worklog of worklogs.items) {
    totals.set(
      worklog.employeeId,
      (totals.get(worklog.employeeId) ?? 0) + worklog.ordinaryMinutes + worklog.overtimeMinutes,
    )
  }
  return totals
})

const rows = computed(() =>
  employees.items
    .map(employee => ({
      employee,
      fullName: employeeFullName(employee),
      rate: currentRate(employee, today),
      minutes: minutesByEmployee.value.get(employee.id) ?? 0,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName)),
)

const activeCount = computed(() => employees.items.filter(employee => employee.status === 'attivo').length)

/** Costo orario medio della squadra attiva: utile per i preventivi al volo. */
const averageHourly = computed(() => {
  const rates = rows.value
    .filter(row => row.employee.status === 'attivo' && row.rate)
    .map(row => row.rate!.hourlyCostCents)
  if (rates.length === 0) return Money.zero
  return Money.fromCents(Money.sum(rates) / rates.length)
})

const canSave = computed(() =>
  dialog.draft.value.firstName.trim().length > 0 && dialog.draft.value.lastName.trim().length > 0,
)

/** Il form modifica sempre la tariffa piu' recente, che e' quella in testa. */
const editingRate = computed(() => dialog.draft.value.rates[0]!)

function ratesDiffer(a: EmployeeRate, b: EmployeeRate): boolean {
  return a.hourlyCostCents !== b.hourlyCostCents
    || a.overtimeMultiplier !== b.overtimeMultiplier
    || a.travelAllowanceCents !== b.travelAllowanceCents
}

/**
 * Salvataggio con storicizzazione della tariffa.
 *
 * Se durante una modifica cambiano i costi, non si sovrascrive la riga
 * esistente: se ne aggiunge una nuova con decorrenza da oggi e si conserva la
 * precedente. Sovrascrivendo si perderebbe la possibilita' di sapere quanto
 * costava l'operaio l'anno scorso, che e' proprio cio' che tiene stabili i
 * consuntivi chiusi.
 */
async function saveEmployee(): Promise<void> {
  const original = dialog.editingId.value ? employees.find(dialog.editingId.value) : null
  const previous = original?.rates[0]

  if (previous && ratesDiffer(previous, editingRate.value)) {
    dialog.draft.value.rates = [
      { ...editingRate.value, validFrom: today },
      ...original!.rates.filter(rate => rate.validFrom !== today),
    ].sort((a, b) => b.validFrom.localeCompare(a.validFrom))
  }

  await dialog.save()
}
</script>

<template>
  <div class="u-stack">
    <AppPageHeader title="Operai" subtitle="Anagrafica, inquadramento e costi orari.">
      <template #actions>
        <Button label="Nuovo operaio" icon="pi pi-plus" @click="dialog.openCreate()" />
      </template>
    </AppPageHeader>

    <section class="u-grid" style="--grid-min: 210px">
      <AppStatCard
        label="Operai in forza"
        :value="format.number(activeCount)"
        icon="pi pi-users"
        :hint="`${employees.count} in anagrafica`"
        :loading="loading"
      />
      <AppStatCard
        label="Costo orario medio"
        :value="format.money(averageHourly)"
        icon="pi pi-euro"
        hint="Solo operai attivi"
        :loading="loading"
      />
    </section>

    <Card>
      <template #content>
        <AppDataTable
          :value="rows"
          :loading="loading"
          :filter-fields="['fullName', 'employee.qualification', 'employee.taxCode']"
          data-key="employee.id"
          empty-icon="pi pi-users"
          empty-title="Nessun operaio"
          empty-message="Aggiungi il primo operaio per iniziare a registrare le ore."
        >
          <template #emptyAction>
            <Button label="Nuovo operaio" icon="pi pi-plus" @click="dialog.openCreate()" />
          </template>

          <Column field="fullName" header="Operaio" sortable style="min-width: 230px">
            <template #body="{ data }">
              <div class="person">
                <Avatar :label="employeeInitials(data.employee)" shape="circle" />
                <div class="cell-stack">
                  <strong>{{ data.fullName }}</strong>
                  <small class="u-muted">{{ data.employee.qualification || '—' }}</small>
                </div>
              </div>
            </template>
          </Column>

          <Column field="employee.level" header="Livello" sortable style="min-width: 100px" />

          <Column field="employee.contract" header="Contratto" sortable style="min-width: 150px">
            <template #body="{ data }">
              <span class="u-muted">
                {{ CONTRACT_TYPE_OPTIONS.find(o => o.value === data.employee.contract)?.label }}
              </span>
            </template>
          </Column>

          <Column field="employee.status" header="Stato" sortable style="min-width: 110px">
            <template #body="{ data }">
              <AppStatusTag :value="data.employee.status" :options="EMPLOYEE_STATUS_OPTIONS" />
            </template>
          </Column>

          <Column header="Costo orario" style="min-width: 130px">
            <template #body="{ data }">
              <span v-if="data.rate" class="tabular">{{ format.money(data.rate.hourlyCostCents) }}</span>
              <Tag v-else value="Non impostato" severity="danger" rounded />
            </template>
          </Column>

          <Column field="minutes" header="Ore totali" sortable style="min-width: 110px">
            <template #body="{ data }">
              <span class="tabular">{{ format.decimalHours(data.minutes) }}</span>
            </template>
          </Column>

          <Column header="" style="width: 100px">
            <template #body="{ data }">
              <div class="row-actions">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  aria-label="Modifica"
                  @click="dialog.openEdit(data.employee)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  aria-label="Elimina"
                  @click="dialog.remove(data.employee)"
                />
              </div>
            </template>
          </Column>
        </AppDataTable>
      </template>
    </Card>

    <AppFormDialog
      v-model:visible="dialog.visible.value"
      :title="dialog.title.value"
      :saving="dialog.saving.value"
      :can-save="canSave"
      width="620px"
      @save="saveEmployee"
    >
      <div class="form-grid">
        <AppFormField label="Nome" for-id="nome" required>
          <InputText id="nome" v-model="dialog.draft.value.firstName" fluid />
        </AppFormField>

        <AppFormField label="Cognome" for-id="cognome" required>
          <InputText id="cognome" v-model="dialog.draft.value.lastName" fluid />
        </AppFormField>

        <AppFormField label="Codice fiscale" for-id="cf">
          <InputText id="cf" v-model="dialog.draft.value.taxCode" fluid />
        </AppFormField>

        <AppFormField label="Telefono" for-id="tel">
          <InputText id="tel" v-model="dialog.draft.value.phone" fluid />
        </AppFormField>

        <AppFormField label="Email" for-id="mail">
          <InputText id="mail" v-model="dialog.draft.value.email" type="email" fluid />
        </AppFormField>

        <AppFormField label="Mansione" for-id="mansione" hint="Muratore, carpentiere, gruista...">
          <InputText id="mansione" v-model="dialog.draft.value.qualification" fluid />
        </AppFormField>

        <AppFormField label="Livello" for-id="livello">
          <Select
            v-model="dialog.draft.value.level"
            input-id="livello"
            :options="EMPLOYEE_LEVEL_OPTIONS"
            option-label="label"
            option-value="value"
            fluid
          />
        </AppFormField>

        <AppFormField label="Contratto" for-id="contratto">
          <Select
            v-model="dialog.draft.value.contract"
            input-id="contratto"
            :options="CONTRACT_TYPE_OPTIONS"
            option-label="label"
            option-value="value"
            fluid
          />
        </AppFormField>

        <AppFormField label="Stato" for-id="stato">
          <Select
            v-model="dialog.draft.value.status"
            input-id="stato"
            :options="EMPLOYEE_STATUS_OPTIONS"
            option-label="label"
            option-value="value"
            fluid
          />
        </AppFormField>
      </div>

      <Divider align="left">
        <span class="divider-label">Costi</span>
      </Divider>

      <Message severity="secondary" variant="simple" size="small" class="rate-note">
        <i class="pi pi-info-circle" />
        Modificando questi valori cambiano solo le ore registrate d'ora in poi.
        Le registrazioni gia' salvate mantengono il costo del giorno in cui sono
        state inserite, quindi i consuntivi passati non si muovono.
      </Message>

      <div class="form-grid">
        <AppFormField label="Costo orario" for-id="costo" hint="Costo pieno per l'azienda, contributi inclusi.">
          <AppMoneyInput v-model="editingRate.hourlyCostCents" input-id="costo" />
        </AppFormField>

        <AppFormField label="Maggiorazione straordinario" for-id="magg" hint="1,3 significa piu' 30%.">
          <InputNumber
            v-model="editingRate.overtimeMultiplier"
            input-id="magg"
            :min="1"
            :max="3"
            :step="0.05"
            :max-fraction-digits="2"
            show-buttons
            button-layout="horizontal"
            increment-button-icon="pi pi-plus"
            decrement-button-icon="pi pi-minus"
            fluid
          />
        </AppFormField>

        <AppFormField label="Trasferta giornaliera" for-id="trasferta">
          <AppMoneyInput v-model="editingRate.travelAllowanceCents" input-id="trasferta" />
        </AppFormField>
      </div>

      <AppFormField label="Note" for-id="note">
        <Textarea id="note" v-model="dialog.draft.value.notes" rows="2" fluid />
      </AppFormField>
    </AppFormDialog>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.person {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.cell-stack {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.cell-stack strong {
  font-weight: 570;
}

.cell-stack small {
  font-size: 0.75rem;
}

.row-actions {
  display: flex;
  gap: 2px;
}

.divider-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
}

.rate-note {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  line-height: 1.5;
  font-size: 0.8rem;
}

.rate-note i {
  margin-top: 2px;
}
</style>
