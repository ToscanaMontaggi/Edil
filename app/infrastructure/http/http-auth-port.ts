import type { AuthPort, AuthUser, Credentials } from '~/core/ports'
import { AuthError } from '~/core/ports'

/**
 * Autenticazione reale via cookie di sessione lato server.
 *
 * Rispetta la stessa porta di MockAuth, quindi store, middleware e pagine non
 * cambiano. La differenza e' che la sessione non e' nota in modo sincrono al
 * boot: la si verifica con una chiamata a /api/auth/session, esposta qui come
 * la promise `ready` che il plugin di avvio attende prima di far girare la
 * guardia di navigazione (altrimenti un refresh a pagina protetta
 * lampeggerebbe sul login prima di scoprire che la sessione c'e' davvero).
 */
export class HttpAuthPort implements AuthPort {
  private user: AuthUser | null = null
  private readonly listeners = new Set<(user: AuthUser | null) => void>()
  readonly ready: Promise<void>

  constructor() {
    this.ready = this.hydrate()
  }

  private async hydrate(): Promise<void> {
    try {
      const response = await $fetch<{ user: AuthUser | null }>('/api/auth/session')
      this.user = response.user
    }
    catch {
      this.user = null
    }
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.user)
  }

  currentUser(): AuthUser | null {
    return this.user
  }

  async signIn(credentials: Credentials): Promise<AuthUser> {
    try {
      this.user = await $fetch<AuthUser>('/api/auth/login', { method: 'POST', body: credentials })
    }
    catch (cause) {
      const message = (cause as { data?: { statusMessage?: string } })?.data?.statusMessage
        ?? 'Accesso non riuscito.'
      throw new AuthError(message)
    }
    this.emit()
    return this.user
  }

  async signOut(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' })
    this.user = null
    this.emit()
  }

  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener)
    listener(this.user)
    return () => this.listeners.delete(listener)
  }
}
