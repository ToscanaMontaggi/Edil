import type { Draft, Entity, EntityId, Patch } from '~/core/domain'

/**
 * Forma minima di store richiesta.
 * Dichiarata per struttura e non importando il tipo dello store Pinia: cosi'
 * questo composable funziona con qualunque store creato da defineCrudStore
 * senza conoscerne nessuno in particolare.
 */
interface CrudStoreLike<T extends Entity> {
  saving: boolean
  create: (draft: Draft<T>) => Promise<T>
  update: (id: EntityId, patch: Patch<T>) => Promise<T>
  remove: (id: EntityId) => Promise<void>
}

export interface CrudDialogOptions<T extends Entity> {
  store: CrudStoreLike<T>
  /** Valori di partenza di un elemento nuovo. */
  blank: () => Draft<T>
  /** Come chiamare l'elemento nei messaggi di conferma ed errore. */
  describe: (item: T) => string
  /** Nome dell'entita' al singolare, per i titoli delle finestre. */
  entityLabel: string
  /** Avviso aggiuntivo nella conferma di eliminazione. */
  deleteConsequence?: (item: T) => string | undefined
}

/**
 * Apertura, salvataggio ed eliminazione dei form di anagrafica.
 *
 * Clienti, operai, costi e fatture hanno tutti lo stesso ciclo: apri la
 * finestra vuota o con i dati di una riga, modifichi, salvi, oppure elimini
 * dopo conferma. Questo composable lo tiene in un punto solo, comprese le
 * notifiche, cosi' le pagine contengono soltanto i campi del loro form.
 */
export function useCrudDialog<T extends Entity>(options: CrudDialogOptions<T>) {
  const notify = useNotify()
  const confirmDelete = useConfirmDelete()

  const visible = ref(false)
  const editingId = ref<EntityId | null>(null)
  const draft = ref(options.blank()) as Ref<Draft<T>>

  const isEditing = computed(() => editingId.value !== null)

  const title = computed(() =>
    isEditing.value ? `Modifica ${options.entityLabel}` : `Nuovo ${options.entityLabel}`,
  )

  function openCreate(): void {
    draft.value = options.blank()
    editingId.value = null
    visible.value = true
  }

  function openEdit(item: T): void {
    // Copia profonda: modificare il form non deve toccare la riga in elenco
    // finche' non si salva davvero.
    const { id, createdAt, updatedAt, ...rest } = structuredClone(toRaw(item))
    draft.value = rest as Draft<T>
    editingId.value = id
    visible.value = true
  }

  async function save(): Promise<boolean> {
    try {
      if (editingId.value) {
        await options.store.update(editingId.value, draft.value as Patch<T>)
      }
      else {
        await options.store.create(draft.value)
      }
      visible.value = false
      notify.saved()
      return true
    }
    catch {
      notify.error('Salvataggio non riuscito. Controlla i dati e riprova.')
      return false
    }
  }

  async function remove(item: T): Promise<boolean> {
    const confirmed = await confirmDelete({
      what: options.describe(item),
      consequence: options.deleteConsequence?.(item),
    })
    if (!confirmed) return false

    try {
      await options.store.remove(item.id)
      notify.deleted()
      return true
    }
    catch {
      notify.error('Eliminazione non riuscita.')
      return false
    }
  }

  return {
    visible,
    draft,
    editingId,
    isEditing,
    title,
    saving: computed(() => options.store.saving),
    openCreate,
    openEdit,
    save,
    remove,
  }
}
