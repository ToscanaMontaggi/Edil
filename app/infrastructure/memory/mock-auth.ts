import type { AuthPort, AuthUser, Credentials } from '~/core/ports'
import { AuthError } from '~/core/ports'

const STORAGE_KEY = 'dinelli.auth.user'

/**
 * Utente dimostrativo.
 * Quando si collega Firebase Authentication questo oggetto sparisce e i dati
 * arrivano dal token: nome e mail hanno gia' gli stessi campi.
 */
const DEMO_USER: AuthUser = {
  id: 'demo-user',
  email: 'alessandro@dinellisrl.it',
  displayName: 'Alessandro',
}

/**
 * Autenticazione finta.
 *
 * Accetta qualunque email valida con almeno sei caratteri di password: in
 * questa fase serve solo a far vivere il flusso di login, la guardia di rotta e
 * il logout. La sessione resta in localStorage cosi' un refresh non riporta
 * ogni volta alla schermata di accesso.
 *
 * Rispetta la stessa porta dell'implementazione Firebase, quindi il giorno del
 * collegamento nessun componente cambia.
 */
export class MockAuth implements AuthPort {
  private user: AuthUser | null = null
  private readonly listeners = new Set<(user: AuthUser | null) => void>()

  constructor() {
    this.user = this.readStoredUser()
  }

  private readStoredUser(): AuthUser | null {
    if (!import.meta.client) return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    }
    catch {
      // Storage non disponibile o dato corrotto: si riparte da non autenticati.
      return null
    }
  }

  private persist(user: AuthUser | null): void {
    if (!import.meta.client) return
    if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else window.localStorage.removeItem(STORAGE_KEY)
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.user)
  }

  currentUser(): AuthUser | null {
    return this.user
  }

  async signIn({ email, password }: Credentials): Promise<AuthUser> {
    await new Promise(resolve => setTimeout(resolve, 350))

    if (!email.includes('@')) {
      throw new AuthError('Indirizzo email non valido.')
    }
    if (password.length < 6) {
      throw new AuthError('La password deve avere almeno 6 caratteri.')
    }

    this.user = { ...DEMO_USER, email }
    this.persist(this.user)
    this.emit()
    return this.user
  }

  async signOut(): Promise<void> {
    this.user = null
    this.persist(null)
    this.emit()
  }

  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener)
    listener(this.user)
    return () => this.listeners.delete(listener)
  }
}
