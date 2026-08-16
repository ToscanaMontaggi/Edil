import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

/**
 * Tema dell'applicazione.
 *
 * Si parte dal preset Aura di PrimeVue e si ridefiniscono solo i token di
 * colore: in questo modo tutti i componenti della libreria restano coerenti fra
 * loro e si aggiornano da soli quando PrimeVue cambia versione, invece di
 * essere ridipinti a mano con CSS sparso per i componenti.
 *
 * L'ambra come colore primario e' una scelta di settore: e' il colore della
 * segnaletica di cantiere, si distingue bene dal blu di ogni altro gestionale e
 * resta leggibile sia in chiaro che in scuro.
 */
export const AppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{amber.50}',
      100: '{amber.100}',
      200: '{amber.200}',
      300: '{amber.300}',
      400: '{amber.400}',
      500: '{amber.500}',
      600: '{amber.600}',
      700: '{amber.700}',
      800: '{amber.800}',
      900: '{amber.900}',
      950: '{amber.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{amber.600}',
          contrastColor: '#ffffff',
          hoverColor: '{amber.700}',
          activeColor: '{amber.800}',
        },
        highlight: {
          background: '{amber.50}',
          focusBackground: '{amber.100}',
          color: '{amber.800}',
          focusColor: '{amber.900}',
        },
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
      },
      dark: {
        primary: {
          color: '{amber.400}',
          contrastColor: '{slate.950}',
          hoverColor: '{amber.300}',
          activeColor: '{amber.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {amber.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {amber.400}, transparent 76%)',
          color: '{amber.100}',
          focusColor: '{amber.50}',
        },
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
      },
    },
  },
  components: {
    card: {
      body: { padding: '1.25rem' },
    },
  },
})
