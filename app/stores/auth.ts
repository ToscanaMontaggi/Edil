import { defineStore } from 'pinia'
import type { AuthUser, Credentials } from '~/core/ports'

/**
 * Sessione dell'utente.
 *
 * Parla solo con la porta AuthPort, quindi funziona identico con
 * l'autenticazione finta di oggi e con Firebase Authentication domani.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  /** Vero finche' non si sa ancora se c'e' una sessione: evita di far lampeggiare il login. */
  const initialising = ref(true)

  const isAuthenticated = computed(() => user.value !== null)
  const displayName = computed(() => user.value?.displayName ?? '')

  let unsubscribe: (() => void) | null = null

  /**
   * Si aggancia ai cambi di sessione. Chiamata una volta sola dal plugin di avvio.
   *
   * Attende anche l'eventuale verifica asincrona della sessione (proprieta'
   * duck-typed `ready`, esposta da HttpAuthPort perche' un cookie di sessione
   * non e' noto in modo sincrono come lo era il localStorage della demo): senza
   * questa attesa, un refresh a pagina protetta lampeggerebbe sul login prima
   * di scoprire che l'utente era gia' loggato.
   */
  async function initialise(): Promise<void> {
    if (unsubscribe) return

    const { auth } = useDataSource()
    unsubscribe = auth.onAuthStateChanged((nextUser) => {
      user.value = nextUser
      initialising.value = false
    })

    if ('ready' in auth) {
      await (auth as { ready: Promise<void> }).ready
    }
  }

  async function signIn(credentials: Credentials): Promise<void> {
    loading.value = true
    error.value = null
    try {
      user.value = await useDataSource().auth.signIn(credentials)
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Accesso non riuscito.'
      throw cause
    }
    finally {
      loading.value = false
    }
  }

  async function signOut(): Promise<void> {
    await useDataSource().auth.signOut()
    user.value = null
    resetDataStores()
    await navigateTo('/login')
  }

  /**
   * Svuota i dati caricati.
   * Con un solo utente cambia poco, ma evita che al prossimo accesso si vedano
   * per un istante i dati della sessione precedente.
   */
  function resetDataStores(): void {
    useClientsStore().reset()
    useEmployeesStore().reset()
    useSitesStore().reset()
    usePhasesStore().reset()
    useWorklogsStore().reset()
    useExpensesStore().reset()
    useInvoicesStore().reset()
  }

  return {
    user,
    loading,
    error,
    initialising,
    isAuthenticated,
    displayName,
    initialise,
    signIn,
    signOut,
  }
})
