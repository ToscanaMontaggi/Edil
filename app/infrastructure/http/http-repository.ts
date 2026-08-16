import type { CrudRepository } from '~/core/ports'
import type { Draft, Entity, EntityId, Patch } from '~/core/domain'

/**
 * Repository generico via HTTP.
 *
 * Stesso ruolo di InMemoryRepository lato client, ma parla con le rotte Nitro
 * invece che con una Map in memoria. Nessuna copia difensiva: ogni risposta di
 * $fetch e' gia' un oggetto nuovo, deserializzato dalla rete.
 */
export class HttpRepository<T extends Entity> implements CrudRepository<T> {
  constructor(protected readonly basePath: string) {}

  async list(): Promise<T[]> {
    return $fetch<T[]>(this.basePath)
  }

  async findById(id: EntityId): Promise<T | null> {
    try {
      return await $fetch<T>(`${this.basePath}/${id}`)
    }
    catch (cause) {
      if ((cause as { statusCode?: number })?.statusCode === 404) return null
      throw cause
    }
  }

  async create(draft: Draft<T>): Promise<T> {
    return $fetch<T>(this.basePath, { method: 'POST', body: draft })
  }

  async update(id: EntityId, patch: Patch<T>): Promise<T> {
    return $fetch<T>(`${this.basePath}/${id}`, { method: 'PATCH', body: patch })
  }

  async remove(id: EntityId): Promise<void> {
    await $fetch(`${this.basePath}/${id}`, { method: 'DELETE' })
  }
}
