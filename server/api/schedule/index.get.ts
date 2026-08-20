import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '../../database/client'
import { scheduleEntries } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { siteId, from, to } = getQuery(event)

  if (typeof from === 'string' && typeof to === 'string') {
    return db.select().from(scheduleEntries)
      .where(and(gte(scheduleEntries.date, from), lte(scheduleEntries.date, to)))
  }

  if (typeof siteId === 'string') {
    return db.select().from(scheduleEntries).where(eq(scheduleEntries.siteId, siteId))
  }

  return createTableRepository(scheduleEntries).list()
})
