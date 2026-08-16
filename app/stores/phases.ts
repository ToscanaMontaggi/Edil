import type { EntityId, SitePhase } from '~/core/domain'

export const usePhasesStore = defineCrudStore(
  'phases',
  dataSource => dataSource.phases,
  ({ items, saving, repository }) => ({
    /** Fasi di un cantiere, gia' nell'ordine di esecuzione. */
    listBySite(siteId: EntityId): SitePhase[] {
      return items.value
        .filter(phase => phase.siteId === siteId)
        .sort((a, b) => a.order - b.order)
    },

    async reorder(siteId: EntityId, orderedIds: EntityId[]): Promise<void> {
      saving.value = true
      try {
        await repository().reorder(siteId, orderedIds)
        const position = new Map(orderedIds.map((id, index) => [id, index]))
        items.value = items.value.map(phase =>
          position.has(phase.id) ? { ...phase, order: position.get(phase.id)! } : phase,
        )
      }
      finally {
        saving.value = false
      }
    },
  }),
)
