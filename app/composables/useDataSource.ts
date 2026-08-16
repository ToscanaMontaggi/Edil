import type { DataSource } from '~/core/ports'

/**
 * Accesso alla sorgente dati.
 *
 * Unico modo consentito per raggiungere i repository dal codice applicativo:
 * nessun file importa direttamente `~/infrastructure/...` a parte il plugin che
 * costruisce il contenitore. Cosi' la dipendenza verso l'infrastruttura resta
 * concentrata in un punto solo e verificabile.
 */
export function useDataSource(): DataSource {
  return useNuxtApp().$dataSource as DataSource
}
