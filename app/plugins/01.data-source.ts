import { createHttpDataSource } from '~/infrastructure/http'

/**
 * Composizione delle dipendenze dell'applicazione.
 *
 * Questo e' l'unico punto che sa quale implementazione concreta viene usata.
 * Store, composable e componenti non cambiano, perche' conoscono soltanto
 * l'interfaccia DataSource.
 */
export default defineNuxtPlugin(() => {
  const dataSource = createHttpDataSource()

  return {
    provide: { dataSource },
  }
})
