/**
 * Guardia di navigazione.
 *
 * Vale su tutte le rotte: quelle pubbliche si dichiarano qui sotto, tutto il
 * resto richiede una sessione. Elencare le eccezioni invece dei permessi
 * significa che una pagina nuova nasce protetta per default, e non ci si
 * dimentica di metterci il controllo.
 */
const PUBLIC_ROUTES = new Set(['/login'])

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const isPublic = PUBLIC_ROUTES.has(to.path)

  if (!auth.isAuthenticated && !isPublic) {
    // Si tiene da parte la destinazione per tornarci dopo l'accesso.
    return navigateTo({ path: '/login', query: to.fullPath === '/' ? undefined : { redirect: to.fullPath } })
  }

  if (auth.isAuthenticated && isPublic) {
    return navigateTo('/')
  }
})
