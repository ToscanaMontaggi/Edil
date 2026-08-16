/**
 * Guardia server per tutte le rotte /api/**, tranne /api/auth/*.
 * `requireUserSession` risponde gia' da solo con 401 se la sessione manca.
 */
export default defineEventHandler(async (event) => {
  const isApi = event.path.startsWith('/api/')
  const isPublicAuthRoute = event.path.startsWith('/api/auth/') || event.path.startsWith('/api/_auth/')
  if (!isApi || isPublicAuthRoute) {
    return
  }
  await requireUserSession(event)
})
