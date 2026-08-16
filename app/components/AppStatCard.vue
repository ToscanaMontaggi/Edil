<script setup lang="ts">
/**
 * Riquadro con un numero.
 *
 * Il mattone della dashboard: un valore grande, l'etichetta di cosa rappresenta
 * e, quando ha senso, una nota di confronto sotto. Il componente non calcola
 * nulla e non conosce il dominio, riceve gia' tutto formattato: e' quello che
 * lo rende riutilizzabile per ore, soldi, conteggi e percentuali.
 */
withDefaults(defineProps<{
  label: string
  value: string
  icon?: string
  /** Nota sotto il valore: confronto, dettaglio, avvertimento. */
  hint?: string
  /** Colora la nota quando indica un andamento. */
  hintTone?: 'neutral' | 'positive' | 'negative'
  /** Mostra lo scheletro al posto del valore durante il caricamento. */
  loading?: boolean
  to?: string
}>(), {
  hintTone: 'neutral',
})
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    class="stat"
    :class="{ 'stat--link': to }"
  >
    <div class="stat__top">
      <span class="stat__label">{{ label }}</span>
      <i v-if="icon" :class="icon" class="stat__icon" aria-hidden="true" />
    </div>

    <Skeleton v-if="loading" width="60%" height="2rem" />
    <strong v-else class="stat__value tabular">{{ value }}</strong>

    <span
      v-if="hint && !loading"
      class="stat__hint"
      :class="{
        'u-positive': hintTone === 'positive',
        'u-negative': hintTone === 'negative',
        'u-muted': hintTone === 'neutral',
      }"
    >{{ hint }}</span>
  </component>
</template>

<style scoped>
.stat {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: var(--space-4);
  border-radius: var(--app-radius);
  background: var(--p-surface-0);
  border: 1px solid var(--p-surface-200);
}

.app-dark .stat {
  background: var(--p-surface-900);
  border-color: var(--p-surface-800);
}

.stat--link {
  transition: border-color 0.15s, transform 0.15s;
}

.stat--link:hover {
  border-color: var(--p-primary-color);
  transform: translateY(-2px);
}

.stat__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.stat__label {
  font-size: 0.8rem;
  font-weight: 550;
  color: var(--p-text-muted-color);
}

.stat__icon {
  color: var(--p-primary-color);
  font-size: 0.95rem;
}

.stat__value {
  font-size: 1.6rem;
  font-weight: 680;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.stat__hint {
  font-size: 0.78rem;
  font-weight: 500;
}

@media (max-width: 640px) {
  .stat {
    padding: var(--space-3);
  }

  .stat__value {
    font-size: 1.35rem;
  }
}
</style>
