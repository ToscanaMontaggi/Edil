<script setup lang="ts">
import type { Client, Draft } from '~/core/domain'
import { Money, clientFiscalId, invoiceSignedAmount } from '~/core/domain'

useHead({ title: 'Clienti — Dinelli Srl' })

const format = useFormat()
const clients = useClientsStore()
const { sites, invoices, loadAll, loading } = useAppData()

void loadAll()

const CLIENT_TYPE_OPTIONS = [
  { label: 'Azienda', value: 'azienda' as const },
  { label: 'Privato', value: 'privato' as const },
  { label: 'Ente pubblico', value: 'pubblico' as const },
]

function blankClient(): Draft<Client> {
  return {
    name: '',
    type: 'azienda',
    vatNumber: '',
    taxCode: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    email: '',
    phone: '',
    contactName: '',
    notes: '',
    active: true,
  }
}

const dialog = useCrudDialog<Client>({
  store: clients,
  blank: blankClient,
  describe: client => `il cliente ${client.name}`,
  entityLabel: 'cliente',
  deleteConsequence: () => 'I cantieri collegati resteranno senza cliente.',
})

const rows = computed(() =>
  clients.items
    .map(client => ({
      client,
      siteCount: sites.items.filter(site => site.clientId === client.id).length,
      invoiced: Money.sum(
        invoices.items.filter(invoice => invoice.clientId === client.id).map(invoiceSignedAmount),
      ),
      fiscalId: clientFiscalId(client),
    }))
    .sort((a, b) => a.client.name.localeCompare(b.client.name)),
)

const canSave = computed(() => dialog.draft.value.name.trim().length > 0)
</script>

<template>
  <div class="u-stack">
    <AppPageHeader title="Clienti" subtitle="Committenti, dati fiscali e lavori collegati.">
      <template #actions>
        <Button label="Nuovo cliente" icon="pi pi-plus" @click="dialog.openCreate()" />
      </template>
    </AppPageHeader>

    <Card>
      <template #content>
        <AppDataTable
          :value="rows"
          :loading="loading"
          :filter-fields="['client.name', 'client.city', 'fiscalId', 'client.contactName']"
          data-key="client.id"
          empty-icon="pi pi-id-card"
          empty-title="Nessun cliente"
          empty-message="Aggiungi il primo cliente per collegarci i cantieri."
        >
          <template #emptyAction>
            <Button label="Nuovo cliente" icon="pi pi-plus" @click="dialog.openCreate()" />
          </template>

          <Column field="client.name" header="Cliente" sortable style="min-width: 220px">
            <template #body="{ data }">
              <div class="cell-stack">
                <strong>{{ data.client.name }}</strong>
                <small class="u-muted">{{ data.client.contactName || '—' }}</small>
              </div>
            </template>
          </Column>

          <Column field="client.type" header="Tipo" sortable style="min-width: 120px">
            <template #body="{ data }">
              <Tag
                :value="CLIENT_TYPE_OPTIONS.find(o => o.value === data.client.type)?.label"
                severity="secondary"
                rounded
              />
            </template>
          </Column>

          <Column field="fiscalId" header="P.IVA / CF" style="min-width: 160px">
            <template #body="{ data }">
              <span class="tabular u-muted">{{ data.fiscalId }}</span>
            </template>
          </Column>

          <Column field="client.city" header="Citta'" sortable style="min-width: 140px" />

          <Column field="siteCount" header="Cantieri" sortable style="min-width: 100px">
            <template #body="{ data }">
              <span class="tabular">{{ data.siteCount }}</span>
            </template>
          </Column>

          <Column field="invoiced" header="Fatturato" sortable style="min-width: 140px">
            <template #body="{ data }">
              <strong class="tabular">{{ format.money(data.invoiced) }}</strong>
            </template>
          </Column>

          <Column header="" style="width: 100px">
            <template #body="{ data }">
              <div class="row-actions">
                <Button
                  icon="pi pi-pencil" severity="secondary" text rounded
                  aria-label="Modifica" @click="dialog.openEdit(data.client)"
                />
                <Button
                  icon="pi pi-trash" severity="danger" text rounded
                  aria-label="Elimina" @click="dialog.remove(data.client)"
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
      <AppFormField label="Ragione sociale o nominativo" for-id="nome" required>
        <InputText id="nome" v-model="dialog.draft.value.name" fluid />
      </AppFormField>

      <div class="form-grid">
        <AppFormField label="Tipo" for-id="tipo">
          <Select
            v-model="dialog.draft.value.type"
            input-id="tipo"
            :options="CLIENT_TYPE_OPTIONS"
            option-label="label"
            option-value="value"
            fluid
          />
        </AppFormField>

        <AppFormField label="Partita IVA" for-id="piva">
          <InputText id="piva" v-model="dialog.draft.value.vatNumber" fluid />
        </AppFormField>

        <AppFormField label="Codice fiscale" for-id="cf">
          <InputText id="cf" v-model="dialog.draft.value.taxCode" fluid />
        </AppFormField>
      </div>

      <AppFormField label="Indirizzo" for-id="via">
        <InputText id="via" v-model="dialog.draft.value.address" fluid />
      </AppFormField>

      <div class="form-grid">
        <AppFormField label="CAP" for-id="cap">
          <InputText id="cap" v-model="dialog.draft.value.postalCode" fluid />
        </AppFormField>

        <AppFormField label="Citta'" for-id="citta">
          <InputText id="citta" v-model="dialog.draft.value.city" fluid />
        </AppFormField>

        <AppFormField label="Provincia" for-id="prov">
          <InputText id="prov" v-model="dialog.draft.value.province" maxlength="2" fluid />
        </AppFormField>
      </div>

      <div class="form-grid">
        <AppFormField label="Referente" for-id="ref">
          <InputText id="ref" v-model="dialog.draft.value.contactName" fluid />
        </AppFormField>

        <AppFormField label="Telefono" for-id="tel">
          <InputText id="tel" v-model="dialog.draft.value.phone" fluid />
        </AppFormField>

        <AppFormField label="Email" for-id="mail">
          <InputText id="mail" v-model="dialog.draft.value.email" type="email" fluid />
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
</style>
