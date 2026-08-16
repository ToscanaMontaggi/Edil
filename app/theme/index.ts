import { AppPreset } from './preset'

/**
 * Configurazione del tema passata a PrimeVue.
 *
 * Sta in un file a parte e viene collegata con `importTheme` nella
 * configurazione Nuxt: cosi' il preset viene importato direttamente dal bundle
 * invece di attraversare il runtime config, che lo serializzerebbe in JSON.
 */
export default {
  preset: AppPreset,
  options: {
    /** Il tema scuro si attiva aggiungendo questa classe all'elemento html. */
    darkModeSelector: '.app-dark',
    cssLayer: {
      name: 'primevue',
      order: 'base, primevue, utilities',
    },
  },
}
