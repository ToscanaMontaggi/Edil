export default defineNuxtConfig({
  compatibilityDate: '2026-08-15',

  /**
   * Applicazione a pagina singola, senza render lato server.
   *
   * E' un gestionale interno dietro login: nessuna pagina deve essere indicizzata
   * e non c'e' nulla da mostrare a un utente non autenticato. Rinunciando all'SSR
   * si evita di dover gestire la sessione sul server, il deploy resta un
   * caricamento di file statici su Firebase Hosting e la PWA con modalita'
   * offline diventa molto piu' semplice da realizzare.
   */
  ssr: false,

  devtools: { enabled: true },

  modules: [
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  css: [
    'primeicons/primeicons.css',
    '~/assets/css/main.css',
  ],

  primevue: {
    importTheme: { from: '@/theme/index.ts' },
    options: {
      ripple: true,
      locale: {
        dayNames: ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
        dayNamesMin: ['D', 'L', 'M', 'M', 'G', 'V', 'S'],
        monthNames: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
        monthNamesShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
        today: 'Oggi',
        clear: 'Svuota',
        weekHeader: 'Sett',
        firstDayOfWeek: 1,
        dateFormat: 'dd/mm/yy',
        emptyMessage: 'Nessun risultato',
        emptySearchMessage: 'Nessun risultato trovato',
        emptySelectionMessage: 'Nessun elemento selezionato',
        fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      },
    },
    components: {
      // I componenti si importano da soli quando vengono usati nei template.
      prefix: '',
    },
  },

  app: {
    head: {
      title: 'Dinelli Srl — Gestionale',
      htmlAttrs: { lang: 'it' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Gestionale interno per la gestione di cantieri, operai, ore e costi.' },
        { name: 'theme-color', content: '#d97706' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
