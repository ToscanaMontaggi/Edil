/**
 * Aggancia lo store di sessione alla porta di autenticazione.
 *
 * Il prefisso numerico garantisce che giri dopo il plugin che costruisce la
 * sorgente dati: senza quella, `useDataSource()` non avrebbe ancora nulla da
 * restituire.
 */
export default defineNuxtPlugin(() => {
  useAuthStore().initialise()
})
