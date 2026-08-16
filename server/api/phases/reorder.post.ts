import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { sitePhases } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { siteId, orderedIds } = await readBody<{ siteId: string, orderedIds: string[] }>(event)

  await Promise.all(orderedIds.map((id, index) =>
    db.update(sitePhases)
      .set({ order: index, updatedAt: new Date() })
      .where(and(eq(sitePhases.id, id), eq(sitePhases.siteId, siteId))),
  ))

  return { success: true }
})
