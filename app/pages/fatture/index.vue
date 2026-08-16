<script setup lang="ts">
import type { Draft, Invoice, InvoiceStatus } from '~/core/domain'
import {
  DateKeys,
  INVOICE_STATUS_OPTIONS,
  INVOICE_TYPE_OPTIONS,
  Money,
  VAT_RATE_OPTIONS,
  invoiceSignedAmount,
  invoiceStatus,
  invoiceTotalCents,
  isSiteSelectable,
} from '~/core/domain'

useHead({ title: 'Fatture — Dinelli Srl' })

const format = useFormat()
const notify = useNotify()
const invoices = useInvoicesStore()
const { clients, sites, loadAll, loading } = useAppData()

void loadAll()

const today = DateKeys.today()
const statusFilter = ref<InvoiceStatus[]>([])

const selectableSites = computed(() =>
  sites.items.filter(isSiteSelectable).sort((a, b) => b.code.localeCompare(a.code)),
)

const rows = computed(() =>
  invoices.items
    .map(invoice => ({
      invoice,
      status: invoiceStatus(invoice, today),
      clientName: clients.find(invoice.clientId)?.name ?? '—',
      siteCode: invoice.siteId ? (sites.find(invoice.siteId)?.code ?? '—') : '—',
      total: invoiceTotalCents(invoice),
    }))
    .filter(row => statusFilter.value.length === 0 || statusFilter.value.includes(row.status))
    .sort((a, b) => b.invoice.date.localeCompare(a.invoice.date)),
)

const totals = computed(() => {
  const invoiced = Money.sum(rows.value.map(row => invoiceSignedAmount(row.invoice)))
  const collected = Money.sum(
    rows.value.filter(row => row.status === 'incassata').map(row => invoiceSignedAmount(row.invoice)),
  )
  const overdue = Money.sum(
    rows.value.filter(row => row.status === 'scaduta').map(row => invoiceSignedAmount(row.invoice)),
  )
  return { invoiced, collected, pending: Money.subtract(invoiced, collected), overdue }
})

function blankInvoice(): Draft<Invoice> {
  return {
    clientId: clients.items[0]?.id ?? '',
    siteId: null,
    number: '',
    date: today,
    dueDate: DateKeys.addDays(today, 60),
    type: 'sal',
    description: '',
    amountCents: Money.zero,
    vatRate: 22,
    paidDate: null,
    notes: '',
  }
}

const dialog = useCrudDialog<Invoice>({
  store: invoices,
  blank: blankInvoice,
  describe: invoice => `la fattura ${invoice.number}`,
  entityLabel: 'documento',
})

const canSave = computed(() =>
  dialog.draft.value.clientId !== ''
  && dialog.draft.value.number.trim().length > 0
  && dialog.draft.value.amountCents !== 0,
)

const dateModel = computed({
  get: () => DateKeys.toDate(dialog.draft.value.date),
  set: (value: Date | null) => {
    if (value) dialog.draft.value.date = DateKeys.fromDate(value)
  },
})

const dueDateModel = computed({
  get: () => (dialog.draft.value.dueDate ? DateKeys.toDate(dialog.draft.value.dueDate) : null),
  set: (value: Date | null) => {
    dialog.draft.value.dueDate = value ? DateKeys.fromDate(value) : null
  },
})

const paidDateModel = computed({
  get: () => (dialog.draft.value.paidDate ? DateKeys.toDate(dialog.draft.value.paidDate) : null),
  set: (value: Date | null) => {
    dialog.draft.value.paidDate = value ? DateKeys.fromDate(value) : null
  },
})

/** Segna incassata con la data di oggi, senza aprire il form. */
async function markPaid(invoice: Invoice): Promise<void> {
  try {
    await invoices.update(invoice.id, { paidDate: today })
    notify.saved(`Fattura ${invoice.number} segnata come incassata.`)
  }
  catch {
    notify.error()
  }
}
</script>

<template>
  <div class="u-stack">
    <AppPageHeader title="Fatture" subtitle="SAL, acconti e saldi emessi ai clienti.">
      <template #actions>
        <Button label="Nuovo documento" icon="pi pi-plus" @click="dialog.openCreate()" />
      </template>
    </AppPageHeader>

    <section class="u-grid" style="--grid-min: 200px">
      <AppStatCard
        label="Fatturato"
        :value="format.money(totals.invoiced)"
        icon="pi pi-file-check"
        :loading="loading"
      />
      <AppStatCard
        label="Incassato"
        :value="format.money(totals.collected)"
        icon="pi pi-wallet"
        hint-tone="positive"
        :loading="loading"
      />
      <AppStatCard
        label="Da incassare"
        :value="format.money(totals.pending)"
        icon="pi pi-hourglass"
        :loading="loading"
      />
      <AppStatCard
        label="Scaduto"
        :value="format.money(totals.overdue)"
        icon="pi pi-exclamation-triangle"
        :hint-tone="Money.isZero(totals.overdue) ? 'positive' : 'negative'"
        :hint="Money.isZero(totals.overdue) ? 'Nessuna scadenza superata' : 'Da sollecitare'"
        :loading="loading"
      />
    </section>

    <Card>
      <template #content>
        <AppDataTable
          :value="rows"
          :loading="loading"
          :filter-fields="['invoice.number', 'clientName', 'siteCode', 'invoice.description']"
          data-key="invoice.id"
          empty-icon="pi pi-file"
          empty-title="Nessun documento"
          empty-message="Nessuna fattura corrisponde ai filtri selezionati."
        >
          <template #toolbar>
            <MultiSelect
              v-model="statusFilter"
              :options="INVOICE_STATUS_OPTIONS"
              option-label="label"
              option-value="value"
              placeholder="Tutti gli stati"
              display="chip"
              class="filter"
            />
          </template>

          <Column field="invoice.number" header="Numero" sortable style="min-width: 110px">
            <template #body="{ data }">
              <strong>{{ data.invoice.number }}</strong>
            </template>
          </Column>

          <Column field="invoice.date" header="Data" sortable style="min-width: 105px">
            <template #body="{ data }">
              <span class="tabular">{{ DateKeys.format(data.invoice.date) }}</span>
            </template>
          </Column>

          <Column field="clientName" header="Cliente" sortable style="min-width: 190px" />

          <Column field="siteCode" header="Cantiere" sortable style="min-width: 120px">
            <template #body="{ data }">
              <NuxtLink v-if="data.invoice.siteId" :to="`/cantieri/${data.invoice.siteId}`" class="link">
                {{ data.siteCode }}
              </NuxtLink>
              <span v-else class="u-muted">—</span>
            </template>
          </Column>

          <Column field="invoice.type" header="Tipo" sortable style="min-width: 110px">
            <template #body="{ data }">
              <Tag
                :value="INVOICE_TYPE_OPTIONS.find(o => o.value === data.invoice.type)?.label"
                severity="secondary"
                rounded
              />
            </template>
          </Column>

          <Column field="status" header="Stato" sortable style="min-width: 120px">
            <template #body="{ data }">
              <AppStatusTag :value="data.status" :options="INVOICE_STATUS_OPTIONS" />
            </template>
          </Column>

          <Column field="invoice.dueDate" header="Scadenza" sortable style="min-width: 115px">
            <template #body="{ data }">
              <span
                v-if="data.invoice.dueDate"
                class="tabular"
                :class="{ 'u-negative': data.status === 'scaduta' }"
              >{{ DateKeys.format(data.invoice.dueDate) }}</span>
              <span v-else class="u-muted">—</span>
            </template>
          </Column>

          <Column field="invoice.amountCents" header="Imponibile" sortable style="min-width: 130px">
            <template #body="{ data }">
              <strong class="tabular">{{ format.money(data.invoice.amountCents) }}</strong>
            </template>
          </Column>

          <Column header="" style="width: 140px">
            <template #body="{ data }">
              <div class="row-actions">
                <Button
                  v-if="data.status !== 'incassata'"
                  icon="pi pi-check-circle"
                  severity="success"
                  text
                  rounded
                  aria-label="Segna incassata"
                  v-tooltip.top="'Segna incassata'"
                  @click="markPaid(data.invoice)"
                />
                <Button
                  icon="pi pi-pencil" severity="secondary" text rounded
                  aria-label="Modifica" @click="dialog.openEdit(data.invoice)"
                />
                <Button
                  icon="pi pi-trash" severity="danger" text rounded
                  aria-label="Elimina" @click="dialog.remove(data.invoice)"
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
      @save="dialog.save()"
    >
      <div class="form-grid">
        <AppFormField label="Numero" for-id="numero" required>
          <InputText id="numero" v-model="dialog.draft.value.number" placeholder="12/2026" fluid />
        </AppFormField>

        <AppFormField label="Tipo" for-id="tipo">
          <Select
            v-model="dialog.draft.value.type"
            input-id="tipo"
            :options="INVOICE_TYPE_OPTIONS"
            option-label="label"
            option-value="value"
            fluid
          />
        </AppFormField>
      </div>

      <AppFormField label="Cliente" for-id="cliente" required>
        <Select
          v-model="dialog.draft.value.clientId"
          input-id="cliente"
          :options="clients.items"
          option-label="name"
          option-value="id"
          placeholder="Seleziona il cliente"
          filter
          fluid
        />
      </AppFormField>

      <AppFormField label="Cantiere" for-id="cantiere" hint="Serve per calcolare il margine di commessa.">
        <Select
          v-model="dialog.draft.value.siteId"
          input-id="cantiere"
          :options="selectableSites"
          option-label="code"
          option-value="id"
          placeholder="Nessun cantiere"
          show-clear
          filter
          fluid
        >
          <template #option="{ option }">
            <div class="cell-stack">
              <strong>{{ option.code }}</strong>
              <small class="u-muted">{{ option.name }}</small>
            </div>
          </template>
        </Select>
      </AppFormField>

      <AppFormField label="Descrizione" for-id="descr">
        <InputText id="descr" v-model="dialog.draft.value.description" fluid />
      </AppFormField>

      <div class="form-grid">
        <AppFormField label="Imponibile" for-id="imponibile" required>
          <AppMoneyInput v-model="dialog.draft.value.amountCents" input-id="imponibile" />
        </AppFormField>

        <AppFormField label="IVA" for-id="iva">
          <Select
            v-model="dialog.draft.value.vatRate"
            input-id="iva"
            :options="VAT_RATE_OPTIONS"
            option-label="label"
            option-value="value"
            fluid
          />
        </AppFormField>
      </div>

      <Message severity="secondary" variant="simple" size="small">
        Totale documento: <strong>{{ format.money(invoiceTotalCents(dialog.draft.value)) }}</strong>
      </Message>

      <div class="form-grid">
        <AppFormField label="Data emissione" for-id="data">
          <DatePicker v-model="dateModel" input-id="data" date-format="dd/mm/yy" show-icon icon-display="input" fluid />
        </AppFormField>

        <AppFormField label="Scadenza" for-id="scad">
          <DatePicker v-model="dueDateModel" input-id="scad" date-format="dd/mm/yy" show-icon icon-display="input" show-button-bar fluid />
        </AppFormField>

        <AppFormField label="Data incasso" for-id="inc" hint="Vuota se non ancora incassata.">
          <DatePicker v-model="paidDateModel" input-id="inc" date-format="dd/mm/yy" show-icon icon-display="input" show-button-bar fluid />
        </AppFormField>
      </div>
    </AppFormDialog>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.filter {
  min-width: 200px;
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
</style>
