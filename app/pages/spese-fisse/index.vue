<script setup lang="ts">
import type { Draft, FixedExpense, FixedExpenseCategory } from '~/core/domain'
import {
  DateKeys,
  FIXED_EXPENSE_CATEGORY_COLORS,
  FIXED_EXPENSE_CATEGORY_OPTIONS,
  Money,
  MonthKeys,
  fixedExpenseCategoryLabel,
  sumBy,
} from '~/core/domain'

useHead({ title: 'Spese fisse — Dinelli Srl' })

const format = useFormat()
const fixedExpenses = useFixedExpensesStore()

void fixedExpenses.load()

const today = DateKeys.today()

const categoryFilter = ref<FixedExpenseCategory[]>([])
const monthFilter = ref<string | null>(MonthKeys.current())

const monthOptions = computed(() =>
  MonthKeys.lastMonths(18).reverse().map(month => ({ label: MonthKeys.format(month), value: month })),
)

const filtered = computed(() =>
  fixedExpenses.items
    .filter(expense => categoryFilter.value.length === 0 || categoryFilter.value.includes(expense.category))
    .filter(expense => !monthFilter.value || DateKeys.month(expense.date) === monthFilter.value)
    .map(expense => ({
      expense,
      categoryLabel: fixedExpenseCategoryLabel(expense.category),
    }))
    .sort((a, b) => b.expense.date.localeCompare(a.expense.date)),
)

const total = computed(() => Money.sum(filtered.value.map(row => row.expense.amountCents)))

const breakdown = computed(() => {
  const totals = sumBy(filtered.value, row => row.expense.category, row => row.expense.amountCents)

  const entries = [...totals.entries()]
    .map(([category, value]) => ({
      label: fixedExpenseCategoryLabel(category as FixedExpenseCategory),
      value,
      color: FIXED_EXPENSE_CATEGORY_COLORS[category as FixedExpenseCategory],
    }))
    .filter(entry => !Money.isZero(entry.value))

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

function blankFixedExpense(): Draft<FixedExpense> {
  return {
    date: today,
    category: 'affitto',
    description: '',
    amountCents: Money.zero,
    supplier: '',
    documentRef: '',
    notes: '',
  }
}

const dialog = useCrudDialog<FixedExpense>({
  store: fixedExpenses,
  blank: blankFixedExpense,
  describe: expense => `la spesa fissa "${expense.description}"`,
  entityLabel: 'spesa fissa',
})

const canSave = computed(() =>
  dialog.draft.value.description.trim().length > 0 && dialog.draft.value.amountCents > 0,
)

const dateModel = computed({
  get: () => DateKeys.toDate(dialog.draft.value.date),
  set: (value: Date | null) => {
    if (value) dialog.draft.value.date = DateKeys.fromDate(value)
  },
})

function resetFilters(): void {
  categoryFilter.value = []
  monthFilter.value = null
}
</script>

<template>
  <div class="u-stack">
    <AppPageHeader
      title="Spese fisse"
      subtitle="Costi generali dell'impresa, da ammortizzare sul complesso dei cantieri: affitto, utenze, assicurazioni, leasing."
    >
      <template #actions>
        <Button label="Nuova spesa fissa" icon="pi pi-plus" @click="dialog.openCreate()" />
      </template>
    </AppPageHeader>

    <div class="costs__top">
      <div class="u-stack">
        <AppStatCard
          label="Totale filtrato"
          :value="format.money(total)"
          icon="pi pi-euro"
          :hint="format.count(filtered.length, 'movimento', 'movimenti')"
          :loading="fixedExpenses.loading"
        />

        <Card>
          <template #content>
            <AppChart
              title="Per categoria"
              type="donut"
              :series="breakdown.series"
              :options="breakdown.options"
              :height="260"
              :loading="fixedExpenses.loading"
            />
          </template>
        </Card>
      </div>

      <Card class="costs__table">
        <template #content>
          <AppDataTable
            :value="filtered"
            :loading="fixedExpenses.loading"
            :filter-fields="['expense.description', 'expense.supplier', 'expense.documentRef']"
            data-key="expense.id"
            empty-icon="pi pi-building"
            empty-title="Nessuna spesa fissa"
            empty-message="Nessuna spesa fissa corrisponde ai filtri selezionati."
          >
            <template #toolbar>
              <div class="u-cluster" style="--cluster-gap: var(--space-2)">
                <Select
                  v-model="monthFilter"
                  :options="monthOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Tutti i mesi"
                  show-clear
                  class="filter"
                />
                <MultiSelect
                  v-model="categoryFilter"
                  :options="FIXED_EXPENSE_CATEGORY_OPTIONS"
                  option-label="label"
                  option-value="value"
                  placeholder="Tutte le categorie"
                  :max-selected-labels="1"
                  selected-items-label="{0} categorie"
                  class="filter"
                />
                <Button
                  v-if="categoryFilter.length || monthFilter"
                  label="Azzera"
                  icon="pi pi-filter-slash"
                  severity="secondary"
                  text
                  size="small"
                  @click="resetFilters"
                />
              </div>
            </template>

            <Column field="expense.date" header="Data" sortable style="min-width: 105px">
              <template #body="{ data }">
                <span class="tabular">{{ DateKeys.format(data.expense.date) }}</span>
              </template>
            </Column>

            <Column field="categoryLabel" header="Categoria" sortable style="min-width: 170px">
              <template #body="{ data }">
                <span class="u-cluster" style="--cluster-gap: 0.4rem">
                  <span
                    class="dot"
                    :style="{ background: FIXED_EXPENSE_CATEGORY_COLORS[data.expense.category as FixedExpenseCategory] }"
                  />
                  {{ data.categoryLabel }}
                </span>
              </template>
            </Column>

            <Column field="expense.description" header="Descrizione" sortable style="min-width: 200px" />

            <Column field="expense.supplier" header="Fornitore" sortable style="min-width: 170px" />

            <Column field="expense.amountCents" header="Importo" sortable style="min-width: 130px">
              <template #body="{ data }">
                <strong class="tabular">{{ format.money(data.expense.amountCents) }}</strong>
              </template>
            </Column>

            <Column header="" style="width: 100px">
              <template #body="{ data }">
                <div class="row-actions">
                  <Button
                    icon="pi pi-pencil" severity="secondary" text rounded
                    aria-label="Modifica" @click="dialog.openEdit(data.expense)"
                  />
                  <Button
                    icon="pi pi-trash" severity="danger" text rounded
                    aria-label="Elimina" @click="dialog.remove(data.expense)"
                  />
                </div>
              </template>
            </Column>
          </AppDataTable>
        </template>
      </Card>
    </div>

    <AppFormDialog
      v-model:visible="dialog.visible.value"
      :title="dialog.title.value"
      :saving="dialog.saving.value"
      :can-save="canSave"
      @save="dialog.save()"
    >
      <div class="form-grid">
        <AppFormField label="Data" for-id="data" required>
          <DatePicker
            v-model="dateModel"
            input-id="data"
            date-format="dd/mm/yy"
            show-icon
            icon-display="input"
            fluid
          />
        </AppFormField>

        <AppFormField label="Importo" for-id="importo" required>
          <AppMoneyInput v-model="dialog.draft.value.amountCents" input-id="importo" />
        </AppFormField>
      </div>

      <AppFormField label="Categoria" for-id="categoria" required>
        <Select
          v-model="dialog.draft.value.category"
          input-id="categoria"
          :options="FIXED_EXPENSE_CATEGORY_OPTIONS"
          option-label="label"
          option-value="value"
          fluid
        />
      </AppFormField>

      <AppFormField label="Descrizione" for-id="descr" required>
        <InputText id="descr" v-model="dialog.draft.value.description" fluid />
      </AppFormField>

      <div class="form-grid">
        <AppFormField label="Fornitore" for-id="forn">
          <InputText id="forn" v-model="dialog.draft.value.supplier" fluid />
        </AppFormField>

        <AppFormField label="Riferimento documento" for-id="doc" hint="Numero fattura o scontrino.">
          <InputText id="doc" v-model="dialog.draft.value.documentRef" fluid />
        </AppFormField>
      </div>

      <AppFormField label="Note" for-id="note">
        <Textarea id="note" v-model="dialog.draft.value.notes" rows="2" fluid />
      </AppFormField>
    </AppFormDialog>
  </div>
</template>

<style scoped>
.costs__top {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 300px 1fr;
  align-items: start;
}

.costs__top > * {
  min-width: 0;
}

@media (max-width: 1100px) {
  .costs__top {
    grid-template-columns: 1fr;
  }
}

.form-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.filter {
  min-width: 165px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.row-actions {
  display: flex;
  gap: 2px;
}
</style>
