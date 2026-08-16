import { defineStore } from 'pinia'
import type { Ref, ShallowRef } from 'vue'
import type { Draft, Entity, EntityId, Patch } from '~/core/domain'
import type { CrudRepository, DataSource } from '~/core/ports'

/** Ricava il tipo di entita' gestito da un repository. */
type EntityOf<R> = R extends CrudRepository<infer T> ? T : never

/**
 * Assenza di estensioni.
 * Un tipo senza chiavi: distribuito nell'oggetto di ritorno non aggiunge nulla.
 * Usare Record<string, unknown> introdurrebbe una firma di indice che renderebbe
 * incerto il tipo di ogni proprieta' dello store.
 */
type NoExtras = Record<never, never>

/**
 * Strumenti che il costruttore mette a disposizione delle estensioni.
 * Sono gli stessi identici riferimenti usati internamente: chi estende lavora
 * sullo stato vero dello store, non su una copia.
 */
export interface CrudStoreContext<R extends CrudRepository<Entity>> {
  items: ShallowRef<EntityOf<R>[]>
  saving: Ref<boolean>
  error: Ref<string | null>
  repository: () => R
}

/**
 * Costruttore di store CRUD.
 *
 * Ogni entita' del gestionale ha bisogno delle stesse identiche cose: caricare
 * la lista una volta, tenere traccia di caricamento ed errore, creare,
 * modificare, eliminare, ritrovare un elemento per id. Scrivere sette volte lo
 * stesso store significherebbe avere sette volte lo stesso bug da correggere.
 *
 * Il terzo parametro permette di aggiungere le azioni specifiche di una singola
 * entita' (l'inserimento massivo delle ore, il riordino delle fasi) senza
 * toccare questo file: lo store base resta chiuso alle modifiche e aperto
 * all'estensione.
 *
 * Il tipo dell'entita' si ricava dal repository e non si passa a mano: fornendo
 * anche un solo argomento di tipo esplicito, TypeScript smette di inferire i
 * restanti e ripiega sui valori predefiniti, il che qui azzererebbe il tipo
 * delle estensioni e renderebbe l'intero store non tipizzato.
 */
export function defineCrudStore<
  R extends CrudRepository<Entity>,
  Extra extends object = NoExtras,
>(
  storeId: string,
  selectRepository: (dataSource: DataSource) => R,
  extend?: (context: CrudStoreContext<R>) => Extra,
) {
  type T = EntityOf<R>

  return defineStore(storeId, () => {
    /**
     * shallowRef e non ref: le collezioni possono arrivare a migliaia di righe
     * (le ore di un anno intero) e rendere reattiva ogni proprieta' di ogni
     * oggetto costerebbe parecchio senza dare nulla, dato che gli elementi si
     * sostituiscono interi e non si modificano campo per campo.
     */
    const items = shallowRef<T[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const loaded = ref(false)

    const byId = computed(() => new Map(items.value.map(item => [item.id, item])))
    const count = computed(() => items.value.length)

    function repository(): R {
      return selectRepository(useDataSource())
    }

    /**
     * Lo stesso repository visto come CRUD dell'entita' concreta.
     *
     * Il compilatore non riesce a dedurre da solo che R, vincolato a
     * CrudRepository<Entity>, sia anche CrudRepository<EntityOf<R>>: la
     * relazione e' vera per costruzione, perche' EntityOf estrae proprio quel
     * parametro, ma non e' dimostrabile a partire dal solo vincolo. E' l'unico
     * punto del progetto in cui serve forzare la mano al sistema di tipi, e
     * resta confinato qui dentro: verso l'esterno le firme sono esatte.
     */
    function crud(): CrudRepository<T> {
      return repository() as unknown as CrudRepository<T>
    }

    function fail(cause: unknown, fallback: string): never {
      error.value = cause instanceof Error ? cause.message : fallback
      throw cause
    }

    /**
     * Carica la lista.
     * Di default non ricarica se i dati ci sono gia', cosi' ogni pagina puo'
     * chiamarla senza preoccuparsi di chi l'ha gia' chiamata prima.
     */
    async function load(options: { force?: boolean } = {}): Promise<void> {
      if (loaded.value && !options.force) return

      loading.value = true
      error.value = null
      try {
        items.value = await crud().list()
        loaded.value = true
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Caricamento non riuscito.'
      }
      finally {
        loading.value = false
      }
    }

    async function create(draft: Draft<T>): Promise<T> {
      saving.value = true
      error.value = null
      try {
        const created = await crud().create(draft)
        items.value = [...items.value, created]
        return created
      }
      catch (cause) {
        return fail(cause, 'Salvataggio non riuscito.')
      }
      finally {
        saving.value = false
      }
    }

    async function update(id: EntityId, patch: Patch<T>): Promise<T> {
      saving.value = true
      error.value = null
      try {
        const updated = await crud().update(id, patch)
        items.value = items.value.map(item => (item.id === id ? updated : item))
        return updated
      }
      catch (cause) {
        return fail(cause, 'Modifica non riuscita.')
      }
      finally {
        saving.value = false
      }
    }

    async function remove(id: EntityId): Promise<void> {
      saving.value = true
      error.value = null
      try {
        await crud().remove(id)
        items.value = items.value.filter(item => item.id !== id)
      }
      catch (cause) {
        fail(cause, 'Eliminazione non riuscita.')
      }
      finally {
        saving.value = false
      }
    }

    function find(id: EntityId | null | undefined): T | null {
      if (!id) return null
      return byId.value.get(id) ?? null
    }

    /** Svuota lo store: serve al logout, per non lasciare in giro dati della sessione precedente. */
    function reset(): void {
      items.value = []
      loaded.value = false
      loading.value = false
      saving.value = false
      error.value = null
    }

    const extras = extend?.({ items, saving, error, repository }) ?? ({} as Extra)

    return {
      items,
      loading,
      saving,
      error,
      loaded,
      byId,
      count,
      load,
      create,
      update,
      remove,
      find,
      reset,
      ...extras,
    }
  })
}
