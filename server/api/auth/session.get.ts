/**
 * Rotta pubblica: chiede "sono loggato?" senza gia' avere una sessione.
 * A differenza delle altre rotte non deve richiedere autenticazione.
 *
 * Risposta sempre avvolta in un oggetto: un `null` nudo farebbe rispondere h3
 * con 204 senza corpo, che $fetch decodifica come `undefined` e non `null`,
 * facendo risultare "autenticato" per errore (undefined !== null).
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  return { user: session.user ?? null }
})
