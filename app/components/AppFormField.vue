<script setup lang="ts">
/**
 * Riga di un form: etichetta, campo, eventuale errore o nota.
 * Tiene allineati spaziature e dimensioni del testo in tutti i form senza che
 * ogni pagina rifaccia la sua versione leggermente diversa.
 */
defineProps<{
  label: string
  forId?: string
  error?: string | null
  hint?: string
  required?: boolean
}>()
</script>

<template>
  <div class="form-field">
    <label :for="forId">
      {{ label }}
      <span v-if="required" class="form-field__required" aria-hidden="true">*</span>
    </label>

    <slot />

    <small v-if="error" class="form-field__error">{{ error }}</small>
    <small v-else-if="hint" class="u-muted">{{ hint }}</small>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.form-field > label {
  font-size: 0.82rem;
  font-weight: 550;
  color: var(--p-text-muted-color);
}

.form-field__required {
  color: var(--p-red-500);
}

.form-field__error {
  font-size: 0.78rem;
  color: var(--p-red-500);
}

.form-field small {
  font-size: 0.76rem;
  line-height: 1.4;
}
</style>
