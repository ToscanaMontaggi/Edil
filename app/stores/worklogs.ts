import type { Draft, Worklog } from '~/core/domain'

export const useWorklogsStore = defineCrudStore(
  'worklogs',
  dataSource => dataSource.worklogs,
  ({ items, saving, error, repository }) => ({
    /**
     * Registra in un colpo solo le ore di tutta la squadra.
     *
     * E' l'operazione piu' frequente dell'intero gestionale: la sera si apre il
     * cantiere, si segnano gli operai presenti e si salva. Passa da un metodo
     * dedicato del repository invece che da N chiamate a create, cosi' con
     * Firestore diventera' una sola scrittura in batch.
     */
    async createMany(drafts: Draft<Worklog>[]): Promise<Worklog[]> {
      if (drafts.length === 0) return []

      saving.value = true
      error.value = null
      try {
        const created = await repository().createMany(drafts)
        items.value = [...items.value, ...created]
        return created
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Registrazione non riuscita.'
        throw cause
      }
      finally {
        saving.value = false
      }
    },
  }),
)
