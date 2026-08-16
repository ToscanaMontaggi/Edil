import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../../database/client'
import { expenses } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { siteId, from, to } = getQuery(event)

  if (typeof from === 'string' && typeof to === 'string') {
    return db.select().from(expenses)
      .where(and(gte(expenses.date, from), lte(expenses.date, to)))
      .orderBy(desc(expenses.date))
  }

  if (typeof siteId === 'string') {
    return db.select().from(expenses).where(eq(expenses.siteId, siteId))
  }

  return createTableRepository(expenses).list()
})
