<script setup lang="ts">
import type { SelectOption } from '~/core/domain'

/**
 * Etichetta di stato.
 *
 * Riceve il valore e l'elenco di opzioni che lo descrive (gli stessi elenchi
 * che il dominio usa per i menu a tendina) e ne ricava testo, colore e icona.
 * In questo modo aggiungere uno stato nuovo si fa nel dominio, e tabelle,
 * filtri e schede si aggiornano da sole.
 */
const props = defineProps<{
  value: string
  options: readonly SelectOption<string>[]
  showIcon?: boolean
}>()

const option = computed(() => props.options.find(item => item.value === props.value))
</script>

<template>
  <Tag
    :value="option?.label ?? value"
    :severity="option?.severity ?? 'secondary'"
    :icon="showIcon ? option?.icon : undefined"
    rounded
  />
</template>
