import { createMemoryDataSource } from '~/infrastructure/memory'

/**
 * Composizione delle dipendenze dell'applicazione.
 *
 * Questo e' l'unico punto che sa quale implementazione concreta viene usata.
 * Per passare a Firebase si sostituisce la sola riga qui sotto con
 * `createFirebaseDataSource()`: store, composable e componenti non cambiano,
 * perche' conoscono soltanto l'interfaccia DataSource.
 */
export default defineNuxtPlugin(() => {
  const dataSource = createMemoryDataSource()

  return {
    provide: { dataSource },
  }
})
