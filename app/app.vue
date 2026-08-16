<script setup lang="ts">
/**
 * Radice dell'applicazione.
 *
 * Contiene solo cio' che deve esistere una volta sola per tutta la sessione:
 * il layout corrente, il contenitore delle notifiche e quello delle richieste
 * di conferma. Nessuna logica di dominio.
 */
useDarkMode()
</script>

<template>
  <div class="app-root">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <Toast position="bottom-right" />
    <ConfirmDialog :draggable="false" />
  </div>
</template>

<style>
.app-root {
  min-height: 100dvh;
}
</style>
