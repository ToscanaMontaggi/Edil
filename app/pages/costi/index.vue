<script setup lang="ts">
import type { Draft, Expense, ExpenseCategory } from '~/core/domain'
import {
  DateKeys,
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_OPTIONS,
  Money,
  MonthKeys,
  expenseCategoryLabel,
  groupExpensesByCategory,
  isSiteSelectable,
  siteLabel,
} from '~/core/domain'

useHead({ title: 'Costi — Dinelli Srl' })

const format = useFormat()
const expenses = useExpensesStore()
const { sites, phases, loadAll, loading } = useAppData()

void loadAll()

const today = DateKeys.today()

const categoryFilter = ref<ExpenseCategory[]>([])
const siteFilter = ref<string | null>(null)
const monthFilter = ref<string | null>(MonthKeys.current())

const monthOptions = computed(() =>
  MonthKeys.lastMonths(18).reverse().map(month => ({ label: MonthKeys.format(month), value: month })),
)

const selectableSites = computed(() =>
  sites.items.filter(isSiteSelectable).sort((a, b) => b.code.localeCompare(a.code)),
)

const filtered = computed(() =>
  expenses.items
    .filter(expense => categoryFilter.value.length === 0 || categoryFilter.value.includes(expense.category))
    .filter(expense => !siteFilter.value || expense.siteId === siteFilter.value)
    .filter(expense => !monthFilter.value || DateKeys.month(expense.date) === monthFilter.value)
    .map(expense => ({
      expense,
      siteCode: sites.find(expense.siteId)?.code ?? '—',
      siteName: sites.find(expense.siteId)?.name ?? 'Cantiere rimosso',
      categoryLabel: expenseCategoryLabel(expense.category),
    }))
    .sort((a, b) => b.expense.date.localeCompare(a.expense.date)),
)

const total = computed(() => Money.sum(filtered.value.map(row => row.expense.amountCents)))

const breakdown = computed(() => {
  const grouped = groupExpensesByCategory(filtered.value.map(row => row.expense))
  const entries = Object.entries(grouped)
    .map(([category, value]) => ({
      label: expenseCategoryLabel(category as ExpenseCategory),
      value,
      color: EXPENSE_CATEGORY_COLORS[category as ExpenseCategory],
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

function blankExpense(): Draft<Expense> {
  return {
    date: today,
    siteId: selectableSites.value[0]?.id ?? '',
    phaseId: null,
    category: 'materiali',
    description: '',
    amountCents: Money.zero,
    supplier: '',
    documentRef: '',
    attachments: [],
    notes: '',
  }
}

const dialog = useCrudDialog<Expense>({
  store: expenses,
  blank: blankExpense,
  describe: expense => `il costo "${expense.description}"`,
  entityLabel: 'costo',
})

const draftPhases = computed(() =>
  dialog.draft.value.siteId ? phases.listBySite(dialog.draft.value.siteId) : [],
)

const canSave = computed(() =>
  dialog.draft.value.siteId !== ''
  && dialog.draft.value.description.trim().length > 0
  && dialog.draft.value.amountCents > 0,
)

const dateModel = computed({
  get: () => DateKeys.toDate(dialog.draft.value.date),
  set: (value: Date | null) => {
    if (value) dialog.draft.value.date = DateKeys.fromDate(value)
  },
})

function resetFilters(): void {
  categoryFilter.value = []
  siteFilter.value = null
  monthFilter.value = null
}
</script>

<template>
  <div class="u-stack">
    <AppPageHeader title="Costi" subtitle="Materiali, noleggi, subappalti e spese di cantiere.">
      <template #actions>
        <Button label="Nuovo costo" icon="pi pi-plus" @click="dialog.openCreate()" />
      </template>
    </AppPageHeader>

    <div class="costs__top">
      <div class="u-stack">
        <AppStatCard
          label="Totale filtrato"
          :value="format.money(total)"
          icon="pi pi-euro"
          :hint="format.count(filtered.length, 'movimento', 'movimenti')"
          :loading="loading"
        />

        <Card>
          <template #content>
            <AppChart
              title="Per categoria"
              type="donut"
              :series="breakdown.series"
              :options="breakdown.options"
              :height="260"
              :loading="loading"
            />
          </template>
        </Card>
      </div>

      <Card class="costs__table">
        <template #content>
          <AppDataTable
            :value="filtered"
            :loading="loading"
            :filter-fields="['expense.description', 'expense.supplier', 'siteCode', 'siteName', 'expense.documentRef']"
            data-key="expense.id"
            empty-icon="pi pi-euro"
            empty-title="Nessun costo"
            empty-message="Nessun costo corrisponde ai filtri selezionati."
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
                <Select
                  v-model="siteFilter"
                  :options="selectableSites"
                  option-label="code"
                  option-value="id"
                  placeholder="Tutti i cantieri"
                  show-clear
                  filter
                  class="filter"
                />
                <MultiSelect
                  v-model="categoryFilter"
                  :options="EXPENSE_CATEGORY_OPTIONS"
                  option-label="label"
                  option-value="value"
                  placeholder="Tutte le categorie"
                  :max-selected-labels="1"
                  selected-items-label="{0} categorie"
                  class="filter"
                />
                <Button
                  v-if="categoryFilter.length || siteFilter || monthFilter"
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

            <Column field="siteCode" header="Cantiere" sortable style="min-width: 130px">
              <template #body="{ data }">
                <NuxtLink :to="`/cantieri/${data.expense.siteId}`" class="link">
                  {{ data.siteCode }}
                </NuxtLink>
              </template>
            </Column>

            <Column field="categoryLabel" header="Categoria" sortable style="min-width: 140px">
              <template #body="{ data }">
                <span class="u-cluster" style="--cluster-gap: 0.4rem">
                  <span
                    class="dot"
                    :style="{ background: EXPENSE_CATEGORY_COLORS[data.expense.category as ExpenseCategory] }"
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

        <AppFormField label="Importo imponibile" for-id="importo" required>
          <AppMoneyInput v-model="dialog.draft.value.amountCents" input-id="importo" />
        </AppFormField>
      </div>

      <AppFormField label="Cantiere" for-id="cantiere" required>
        <Select
          v-model="dialog.draft.value.siteId"
          input-id="cantiere"
          :options="selectableSites"
          option-label="name"
          option-value="id"
          placeholder="Seleziona il cantiere"
          filter
          fluid
        >
          <template #option="{ option }">
            <div class="cell-stack">
              <strong>{{ option.code }}</strong>
              <small class="u-muted">{{ option.name }}</small>
            </div>
          </template>
          <template #value="{ value }">
            <span v-if="value && sites.find(value)">{{ siteLabel(sites.find(value)!) }}</span>
            <span v-else class="u-muted">Seleziona il cantiere</span>
          </template>
        </Select>
      </AppFormField>

      <div class="form-grid">
        <AppFormField label="Fase" for-id="fase">
          <Select
            v-model="dialog.draft.value.phaseId"
            input-id="fase"
            :options="draftPhases"
            option-label="name"
            option-value="id"
            placeholder="Nessuna fase"
            :disabled="!draftPhases.length"
            show-clear
            fluid
          />
        </AppFormField>

        <AppFormField label="Categoria" for-id="categoria" required>
          <Select
            v-model="dialog.draft.value.category"
            input-id="categoria"
            :options="EXPENSE_CATEGORY_OPTIONS"
            option-label="label"
            option-value="value"
            fluid
          />
        </AppFormField>
      </div>

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

      <Message severity="secondary" variant="simple" size="small" class="note">
        <i class="pi pi-paperclip" />
        Gli allegati (fatture, foto, DDT) arriveranno con il collegamento a
        Firebase Storage: il modello dati li prevede gia'.
      </Message>
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

/* La tabella deve scorrere dentro la sua colonna, non allargare la pagina. */
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

.link {
  font-weight: 600;
  color: var(--p-primary-color);
}

.cell-stack {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.cell-stack small {
  font-size: 0.75rem;
}

.row-actions {
  display: flex;
  gap: 2px;
}

.note {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  line-height: 1.5;
  font-size: 0.8rem;
}

.note i {
  margin-top: 2px;
}
</style>
