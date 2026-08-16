<script setup lang="ts">
/**
 * Stato vuoto.
 *
 * Una lista senza righe non deve essere una pagina bianca: spiega cosa manca e
 * offre l'azione per rimediare. Usato da tutte le tabelle e le liste.
 */
withDefaults(defineProps<{
  icon?: string
  title: string
  message?: string
}>(), {
  icon: 'pi pi-inbox',
})
</script>

<template>
  <div class="empty">
    <i :class="icon" class="empty__icon" aria-hidden="true" />
    <strong>{{ title }}</strong>
    <p v-if="message" class="u-muted">
      {{ message }}
    </p>
    <div v-if="$slots.default" class="empty__action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: var(--space-7) var(--space-4);
  text-align: center;
}

.empty__icon {
  font-size: 2rem;
  color: var(--p-text-muted-color);
  opacity: 0.5;
  margin-bottom: 0.25rem;
}

.empty strong {
  font-size: 1rem;
  font-weight: 600;
}

.empty p {
  font-size: 0.875rem;
  max-width: 42ch;
  line-height: 1.5;
}

.empty__action {
  margin-top: var(--space-3);
}
</style>
