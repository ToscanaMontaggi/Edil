import { db } from '../../database/client'
import { worklogs } from '../../database/schema'

/** Inserimento massivo: la schermata ore registra tutta la squadra in un colpo solo. */
export default defineEventHandler(async (event) => {
  const { drafts } = await readBody<{ drafts: Record<string, unknown>[] }>(event)
  const now = new Date()

  return db.insert(worklogs).values(
    drafts.map(draft => ({
      ...draft,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })),
  ).returning()
})
