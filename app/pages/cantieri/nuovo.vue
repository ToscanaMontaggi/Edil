<script setup lang="ts">
import type { Draft, Site } from '~/core/domain'
import { DEFAULT_SITE_PHASES, DateKeys, Money, SITE_STATUS_OPTIONS } from '~/core/domain'

useHead({ title: 'Nuovo cantiere — Dinelli Srl' })

const format = useFormat()
const notify = useNotify()
const sites = useSitesStore()
const phases = usePhasesStore()
const { clients, loadAll, loading } = useAppData()

void loadAll()

const today = DateKeys.today()

const draft = ref<Draft<Site>>({
  clientId: '',
  code: '',
  name: '',
  address: '',
  city: '',
  province: 'BS',
  budgetCents: Money.zero,
  startDate: today,
  expectedEndDate: null,
  actualEndDate: null,
  status: 'preventivo',
  notes: '',
})

/**
 * Fasi proposte alla creazione.
 * Si possono togliere o aggiungere prima di salvare: quasi tutti i cantieri
 * seguono lo stesso schema, ma non tutti hanno impianti o copertura.
 */
const selectedPhases = ref<string[]>([...DEFAULT_SITE_PHASES])
const newPhase = ref('')

const startModel = computed({
  get: () => DateKeys.toDate(draft.value.startDate),
  set: (value: Date | null) => {
    if (value) draft.value.startDate = DateKeys.fromDate(value)
  },
})

const endModel = computed({
  get: () => (draft.value.expectedEndDate ? DateKeys.toDate(draft.value.expectedEndDate) : null),
  set: (value: Date | null) => {
    draft.value.expectedEndDate = value ? DateKeys.fromDate(value) : null
  },
})

/** Codice commessa proposto: progressivo sull'anno corrente. */
const suggestedCode = computed(() => {
  const year = new Date().getFullYear()
  const used = sites.items
    .map(site => site.code)
    .filter(code => code.startsWith(`C-${year}-`))
    .map(code => Number(code.split('-')[2]))
    .filter(value => !Number.isNaN(value))

  const next = (used.length ? Math.max(...used) : 0) + 1
  return `C-${year}-${String(next).padStart(3, '0')}`
})

watchEffect(() => {
  if (!draft.value.code) draft.value.code = suggestedCode.value
})

const canSave = computed(() =>
  draft.value.name.trim().length > 0
  && draft.value.code.trim().length > 0
  && draft.value.clientId !== '',
)

function addPhase(): void {
  const name = newPhase.value.trim()
  if (!name || selectedPhases.value.includes(name)) return
  selectedPhases.value.push(name)
  newPhase.value = ''
}

function removePhase(name: string): void {
  selectedPhases.value = selectedPhases.value.filter(phase => phase !== name)
}

const saving = ref(false)

async function save(): Promise<void> {
  if (!canSave.value) return

  saving.value = true
  try {
    const site = await sites.create(draft.value)

    // Le fasi si creano dopo, perche' hanno bisogno dell'id del cantiere.
    await Promise.all(
      selectedPhases.value.map((name, index) =>
        phases.create({
          siteId: site.id,
          name,
          order: index,
          budgetCents: null,
          completed: false,
        }),
      ),
    )

    notify.saved(`Cantiere ${site.code} creato.`)
    await navigateTo(`/cantieri/${site.id}`)
  }
  catch {
    notify.error('Non e\' stato possibile creare il cantiere.')
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="u-stack">
    <AppPageHeader
      title="Nuovo cantiere"
      subtitle="Dati della commessa, preventivo e fasi di lavorazione."
      back-to="/cantieri"
    />

    <Card>
      <template #content>
        <div class="u-stack">
          <div class="form-grid">
            <AppFormField label="Codice commessa" for-id="codice" required hint="Proposto in automatico.">
              <InputText id="codice" v-model="draft.code" fluid />
            </AppFormField>

            <AppFormField label="Stato" for-id="stato">
              <Select
                v-model="draft.status"
                input-id="stato"
                :options="SITE_STATUS_OPTIONS"
                option-label="label"
                option-value="value"
                fluid
              />
            </AppFormField>
          </div>

          <AppFormField label="Nome del cantiere" for-id="nome" required>
            <InputText id="nome" v-model="draft.name" placeholder="Ristrutturazione Villa Rossi" fluid />
          </AppFormField>

          <AppFormField label="Cliente" for-id="cliente" required>
            <Select
              v-model="draft.clientId"
              input-id="cliente"
              :options="clients.items"
              option-label="name"
              option-value="id"
              placeholder="Seleziona il cliente"
              :loading="loading"
              filter
              fluid
            />
          </AppFormField>

          <div class="form-grid">
            <AppFormField label="Indirizzo" for-id="via">
              <InputText id="via" v-model="draft.address" fluid />
            </AppFormField>

            <AppFormField label="Citta'" for-id="citta">
              <InputText id="citta" v-model="draft.city" fluid />
            </AppFormField>

            <AppFormField label="Provincia" for-id="prov">
              <InputText id="prov" v-model="draft.province" maxlength="2" fluid />
            </AppFormField>
          </div>

          <div class="form-grid">
            <AppFormField
              label="Preventivo"
              for-id="budget"
              hint="Costo previsto: e' il valore su cui si misura lo scostamento."
            >
              <AppMoneyInput v-model="draft.budgetCents" input-id="budget" />
            </AppFormField>

            <AppFormField label="Data inizio" for-id="inizio">
              <DatePicker v-model="startModel" input-id="inizio" date-format="dd/mm/yy" show-icon icon-display="input" fluid />
            </AppFormField>

            <AppFormField label="Fine prevista" for-id="fine">
              <DatePicker v-model="endModel" input-id="fine" date-format="dd/mm/yy" show-icon icon-display="input" show-button-bar fluid />
            </AppFormField>
          </div>

          <AppFormField label="Note" for-id="note">
            <Textarea id="note" v-model="draft.notes" rows="2" fluid />
          </AppFormField>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div class="u-stack">
          <div>
            <strong>Fasi di lavorazione</strong>
            <p class="u-muted phases__hint">
              Ogni costo e ogni ora potranno essere attribuiti a una fase, per
              capire dove sono finiti i soldi dentro la commessa.
            </p>
          </div>

          <div class="phases">
            <Chip
              v-for="phase in selectedPhases"
              :key="phase"
              :label="phase"
              removable
              @remove="removePhase(phase)"
            />
            <span v-if="!selectedPhases.length" class="u-muted">Nessuna fase: la puoi aggiungere anche dopo.</span>
          </div>

          <div class="u-cluster" style="--cluster-gap: var(--space-2)">
            <InputText
              v-model="newPhase"
              placeholder="Aggiungi una fase"
              class="phases__input"
              @keydown.enter="addPhase"
            />
            <Button
              label="Aggiungi"
              icon="pi pi-plus"
              severity="secondary"
              outlined
              :disabled="!newPhase.trim()"
              @click="addPhase"
            />
          </div>
        </div>
      </template>
    </Card>

    <div class="actions">
      <div class="actions__summary">
        <small class="u-muted">Preventivo</small>
        <strong class="tabular">{{ format.money(draft.budgetCents) }}</strong>
      </div>

      <div class="u-cluster" style="--cluster-gap: var(--space-2)">
        <Button label="Annulla" severity="secondary" text @click="navigateTo('/cantieri')" />
        <Button
          label="Crea cantiere"
          icon="pi pi-check"
          :disabled="!canSave"
          :loading="saving"
          @click="save"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.phases {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.phases__hint {
  font-size: 0.84rem;
  line-height: 1.5;
  margin-top: 0.2rem;
}

.phases__input {
  min-width: 220px;
}

.actions {
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

.app-dark .actions {
  background: var(--p-surface-900);
  border-color: var(--p-surface-700);
}

.actions__summary {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.actions__summary small {
  font-size: 0.75rem;
}

.actions__summary strong {
  font-size: 1.2rem;
  font-weight: 660;
}

/* Sopra la barra di navigazione inferiore, che altrimenti la coprirebbe. */
@media (max-width: 1023px) {
  .actions {
    bottom: calc(var(--app-tabbar-height) + var(--space-2));
  }
}

@media (max-width: 640px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
