import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../../database/client'
import { worklogs } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { siteId, employeeId, from, to } = getQuery(event)

  if (typeof from === 'string' && typeof to === 'string') {
    return db.select().from(worklogs)
      .where(and(gte(worklogs.date, from), lte(worklogs.date, to)))
      .orderBy(desc(worklogs.date))
  }

  if (typeof siteId === 'string') {
    return db.select().from(worklogs).where(eq(worklogs.siteId, siteId))
  }

  if (typeof employeeId === 'string') {
    return db.select().from(worklogs).where(eq(worklogs.employeeId, employeeId))
  }

  return createTableRepository(worklogs).list()
})
