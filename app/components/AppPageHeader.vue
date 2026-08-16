<script setup lang="ts">
/**
 * Intestazione di pagina.
 *
 * Titolo, sottotitolo ed eventuale pulsante di azione, con lo stesso ritmo
 * verticale in tutte le schermate. Le azioni arrivano da uno slot, cosi' il
 * componente non deve sapere nulla di cosa fanno.
 */
defineProps<{
  title: string
  subtitle?: string
  /** Rotta a cui torna la freccia indietro. Se assente la freccia non compare. */
  backTo?: string
}>()
</script>

<template>
  <header class="page-header">
    <div class="page-header__text">
      <NuxtLink v-if="backTo" :to="backTo" class="page-header__back">
        <i class="pi pi-arrow-left" aria-hidden="true" />
        <span>Indietro</span>
      </NuxtLink>

      <h2>{{ title }}</h2>

      <p v-if="subtitle" class="u-muted">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.page-header__text {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.page-header__back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.15rem;
  font-size: 0.82rem;
  font-weight: 550;
  color: var(--p-text-muted-color);
}

.page-header__back:hover {
  color: var(--p-primary-color);
}

.page-header h2 {
  font-size: 1.55rem;
}

.page-header p {
  font-size: 0.9rem;
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@media (max-width: 640px) {
  .page-header {
    align-items: stretch;
  }

  .page-header h2 {
    font-size: 1.3rem;
  }

  .page-header__actions {
    width: 100%;
  }

  .page-header__actions > * {
    flex: 1;
  }
}
</style>
