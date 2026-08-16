import type { CrudRepository } from '~/core/ports'
import type { Draft, Entity, EntityId, Patch } from '~/core/domain'

/**
 * Ritardo artificiale delle operazioni finte.
 *
 * Serve a far comparire davvero gli stati di caricamento durante lo sviluppo:
 * se i dati tornassero in modo sincrono, spinner e scheletri non verrebbero mai
 * esercitati e i problemi salterebbero fuori solo il giorno del collegamento a
 * Firestore. Alzarlo a 800 per provare l'app con una connessione lenta.
 */
const SIMULATED_LATENCY_MS = 90

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function nowIso(): string {
  return new Date().toISOString()
}

function newId(): EntityId {
  return crypto.randomUUID()
}

/**
 * Repository generico in memoria.
 *
 * Implementa il contratto CRUD una volta sola per tutte le entita'. I
 * repository specifici estendono questa classe e aggiungono soltanto le query
 * che li riguardano, senza riscrivere create/update/remove: e' il motivo per
 * cui aggiungere una nuova entita' al gestionale costa poche righe.
 */
export class InMemoryRepository<T extends Entity> implements CrudRepository<T> {
  protected readonly items = new Map<EntityId, T>()

  constructor(seed: readonly T[] = []) {
    for (const item of seed) {
      this.items.set(item.id, item)
    }
  }

  /**
   * Copia difensiva su ogni lettura.
   *
   * Senza questa, un componente che modifica l'oggetto ricevuto cambierebbe di
   * nascosto il dato "sul server", e le modifiche annullate resterebbero.
   * Firestore restituisce sempre oggetti nuovi, quindi la copia riproduce il
   * comportamento reale invece di nasconderlo.
   */
  protected clone<V>(value: V): V {
    return structuredClone(value)
  }

  async list(): Promise<T[]> {
    await delay(SIMULATED_LATENCY_MS)
    return this.clone([...this.items.values()])
  }

  async findById(id: EntityId): Promise<T | null> {
    await delay(SIMULATED_LATENCY_MS)
    const found = this.items.get(id)
    return found ? this.clone(found) : null
  }

  async create(draft: Draft<T>): Promise<T> {
    await delay(SIMULATED_LATENCY_MS)
    const timestamp = nowIso()
    const created = {
      ...this.clone(draft),
      id: newId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    } as T
    this.items.set(created.id, created)
    return this.clone(created)
  }

  async update(id: EntityId, patch: Patch<T>): Promise<T> {
    await delay(SIMULATED_LATENCY_MS)
    const existing = this.items.get(id)
    if (!existing) {
      throw new Error(`Elemento non trovato: ${id}`)
    }
    const updated = {
      ...existing,
      ...this.clone(patch),
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowIso(),
    } as T
    this.items.set(id, updated)
    return this.clone(updated)
  }

  async remove(id: EntityId): Promise<void> {
    await delay(SIMULATED_LATENCY_MS)
    if (!this.items.delete(id)) {
      throw new Error(`Elemento non trovato: ${id}`)
    }
  }

  /** Lettura sincrona senza latenza, riservata alle sottoclassi per le query filtrate. */
  protected all(): T[] {
    return [...this.items.values()]
  }

  /** Inserimento massivo condiviso da chi implementa createMany. */
  protected async createBatch(drafts: readonly Draft<T>[]): Promise<T[]> {
    await delay(SIMULATED_LATENCY_MS)
    const timestamp = nowIso()
    return drafts.map((draft) => {
      const created = {
        ...this.clone(draft),
        id: newId(),
        createdAt: timestamp,
        updatedAt: timestamp,
      } as T
      this.items.set(created.id, created)
      return this.clone(created)
    })
  }
}
