<script setup lang="ts">
import type { Cents } from '~/core/domain'
import { Money } from '~/core/domain'

/**
 * Campo per gli importi.
 *
 * Verso l'esterno lavora sempre in centesimi interi, come tutto il resto del
 * dominio; all'utente mostra gli euro con la virgola. La conversione avviene
 * solo qui, quindi nessun form deve piu' ricordarsi di moltiplicare o dividere
 * per cento, che e' esattamente il punto in cui nascono gli errori sui totali.
 */
const model = defineModel<Cents>({ required: true })

withDefaults(defineProps<{
  inputId?: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  min?: number
}>(), {
  min: 0,
})

const euro = computed({
  get: () => Money.toEuro(model.value),
  set: (value: number | null) => {
    model.value = Money.fromEuro(value ?? 0)
  },
})
</script>

<template>
  <InputNumber
    v-model="euro"
    :input-id="inputId"
    mode="currency"
    currency="EUR"
    locale="it-IT"
    :min="min"
    :max-fraction-digits="2"
    :placeholder="placeholder"
    :invalid="invalid"
    :disabled="disabled"
    fluid
  />
</template>
