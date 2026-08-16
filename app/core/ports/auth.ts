/**
 * Porta di autenticazione.
 *
 * Modellata sulla forma di Firebase Authentication ma senza dipendere da essa,
 * cosi' l'implementazione finta di oggi e quella reale di domani sono
 * intercambiabili per middleware, layout e store.
 */

export interface AuthUser {
  id: string
  email: string
  displayName: string
}

export interface Credentials {
  email: string
  password: string
}

export interface AuthPort {
  /** Utente corrente in modo sincrono, per le guardie di navigazione. */
  currentUser(): AuthUser | null

  signIn(credentials: Credentials): Promise<AuthUser>

  signOut(): Promise<void>

  /**
   * Notifica i cambi di sessione e ritorna la funzione per disiscriversi.
   * Firebase espone esattamente questa forma con onAuthStateChanged.
   */
  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void
}

/** Errore di autenticazione con un messaggio gia' pronto per l'utente. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}
