import VueApexCharts from 'vue3-apexcharts'

/**
 * Registra il componente dei grafici.
 * Solo lato client: ApexCharts disegna su DOM reale e non ha nulla da fare in
 * fase di build.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueApexCharts)
})
