<script setup lang="ts">
import type { Minutes } from '~/core/domain'
import { Duration } from '~/core/domain'

/**
 * Campo per le ore.
 *
 * Verso l'esterno espone minuti interi, all'utente mostra ore con mezz'ore.
 * Il passo di 0,5 e' voluto: in cantiere si segnano mezze giornate e mezz'ore,
 * non i minuti singoli, e i pulsanti piu' e meno rendono la compilazione da
 * telefono molto piu' rapida della tastiera numerica.
 */
const model = defineModel<Minutes>({ required: true })

withDefaults(defineProps<{
  inputId?: string
  max?: number
  disabled?: boolean
}>(), {
  max: 24,
})

const hours = computed({
  get: () => Duration.toHours(model.value),
  set: (value: number | null) => {
    model.value = Duration.fromHours(value ?? 0)
  },
})
</script>

<template>
  <InputNumber
    v-model="hours"
    :input-id="inputId"
    :min="0"
    :max="max"
    :step="0.5"
    :max-fraction-digits="2"
    show-buttons
    button-layout="horizontal"
    increment-button-icon="pi pi-plus"
    decrement-button-icon="pi pi-minus"
    suffix=" h"
    :disabled="disabled"
    fluid
  />
</template>
