import { asc, eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { sitePhases } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { siteId } = getQuery(event)

  if (typeof siteId === 'string') {
    return db.select().from(sitePhases)
      .where(eq(sitePhases.siteId, siteId))
      .orderBy(asc(sitePhases.order))
  }

  return createTableRepository(sitePhases).list()
})
