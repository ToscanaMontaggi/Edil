<script setup lang="ts">
/**
 * Finestra di inserimento e modifica.
 *
 * Uniforma il comportamento di tutti i form del gestionale: larghezza che si
 * adatta allo schermo, chiusura solo esplicita (per non perdere quanto
 * digitato con un clic fuori), pulsanti sempre nello stesso ordine e stato di
 * salvataggio sul pulsante di conferma.
 */
withDefaults(defineProps<{
  title: string
  saving?: boolean
  saveLabel?: string
  /** Disabilita il salvataggio finche' il form non e' valido. */
  canSave?: boolean
  width?: string
}>(), {
  saveLabel: 'Salva',
  canSave: true,
  width: '540px',
})

const visible = defineModel<boolean>('visible', { required: true })

const emit = defineEmits<{ save: [] }>()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="title"
    :style="{ width }"
    :breakpoints="{ '768px': '95vw' }"
    :draggable="false"
    :close-on-escape="!saving"
    modal
  >
    <div class="u-stack">
      <slot />
    </div>

    <template #footer>
      <Button
        label="Annulla"
        severity="secondary"
        text
        :disabled="saving"
        @click="visible = false"
      />
      <Button
        :label="saveLabel"
        icon="pi pi-check"
        :loading="saving"
        :disabled="!canSave"
        @click="emit('save')"
      />
    </template>
  </Dialog>
</template>
