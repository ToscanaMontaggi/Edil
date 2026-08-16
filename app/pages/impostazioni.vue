<script setup lang="ts">
import { EXPENSE_CATEGORY_COLORS, EXPENSE_CATEGORY_OPTIONS } from '~/core/domain'

useHead({ title: 'Impostazioni — Dinelli Srl' })

const auth = useAuthStore()
const { isDark, toggle: toggleDark } = useDarkMode()
const { clients, employees, sites, worklogs, expenses, invoices, loadAll, loading } = useAppData()

void loadAll()

const counts = computed(() => [
  { label: 'Clienti', value: clients.count, icon: 'pi pi-id-card' },
  { label: 'Cantieri', value: sites.count, icon: 'pi pi-building-columns' },
  { label: 'Operai', value: employees.count, icon: 'pi pi-users' },
  { label: 'Registrazioni ore', value: worklogs.count, icon: 'pi pi-clock' },
  { label: 'Costi', value: expenses.count, icon: 'pi pi-euro' },
  { label: 'Fatture', value: invoices.count, icon: 'pi pi-file-check' },
])
</script>

<template>
  <div class="u-stack" style="--stack-gap: var(--space-5)">
    <AppPageHeader title="Impostazioni" subtitle="Configurazione, aspetto e stato dei dati." />

    <Card>
      <template #title>
        Account
      </template>
      <template #content>
        <div class="u-cluster u-cluster--between">
          <div class="u-cluster">
            <Avatar :label="auth.displayName.charAt(0) || '?'" shape="circle" size="large" />
            <div class="cell-stack">
              <strong>{{ auth.displayName }}</strong>
              <small class="u-muted">{{ auth.user?.email }}</small>
            </div>
          </div>

          <Button label="Esci" icon="pi pi-sign-out" severity="secondary" outlined @click="auth.signOut()" />
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        Aspetto
      </template>
      <template #content>
        <div class="u-cluster u-cluster--between">
          <div class="cell-stack">
            <strong>Tema scuro</strong>
            <small class="u-muted">La scelta resta memorizzata su questo dispositivo.</small>
          </div>
          <ToggleSwitch :model-value="isDark" @update:model-value="toggleDark()" />
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        Categorie di costo
      </template>
      <template #subtitle>
        I colori sono usati in tutti i grafici del gestionale.
      </template>
      <template #content>
        <div class="categories">
          <div v-for="option in EXPENSE_CATEGORY_OPTIONS" :key="option.value" class="category">
            <span class="dot" :style="{ background: EXPENSE_CATEGORY_COLORS[option.value] }" />
            <i :class="option.icon" aria-hidden="true" />
            <span>{{ option.label }}</span>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        Dati caricati
      </template>
      <template #content>
        <div class="u-grid" style="--grid-min: 160px">
          <div v-for="entry in counts" :key="entry.label" class="count">
            <i :class="entry.icon" aria-hidden="true" />
            <div class="cell-stack">
              <strong class="tabular">{{ loading ? '—' : entry.value }}</strong>
              <small class="u-muted">{{ entry.label }}</small>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Message severity="warn">
      <div class="u-stack" style="--stack-gap: var(--space-2)">
        <strong>Nessun server collegato</strong>
        <span>
          I dati che vedi sono generati in locale a ogni avvio e le modifiche si
          perdono ricaricando la pagina. Il collegamento a Firebase riguarda un
          solo file di configurazione: l'interfaccia non cambiera'.
        </span>
      </div>
    </Message>
  </div>
</template>

<style scoped>
.cell-stack {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.cell-stack small {
  font-size: 0.8rem;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.category {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--p-surface-200);
  border-radius: 999px;
  font-size: 0.85rem;
}

.app-dark .category {
  border-color: var(--p-surface-700);
}

.category i {
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.count {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--p-surface-200);
  border-radius: var(--app-radius);
}

.app-dark .count {
  border-color: var(--p-surface-800);
}

.count i {
  font-size: 1.1rem;
  color: var(--p-primary-color);
}

.count strong {
  font-size: 1.3rem;
  font-weight: 660;
}
</style>
