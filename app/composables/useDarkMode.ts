/**
 * Tema chiaro/scuro.
 *
 * Aggiunge o toglie la classe `app-dark` dall'elemento html, che e' il selettore
 * dichiarato nella configurazione del tema PrimeVue: cambiando quella classe si
 * ridipinge tutta l'interfaccia, componenti della libreria compresi.
 * La scelta resta memorizzata nel browser.
 */
export function useDarkMode() {
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'app-dark',
    valueLight: '',
    storageKey: 'dinelli.theme',
  })

  return {
    isDark,
    toggle: useToggle(isDark),
  }
}
