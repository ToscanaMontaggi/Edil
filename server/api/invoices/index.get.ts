import { eq } from 'drizzle-orm'
import { db } from '../../database/client'
import { invoices } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { siteId, clientId } = getQuery(event)

  if (typeof siteId === 'string') {
    return db.select().from(invoices).where(eq(invoices.siteId, siteId))
  }

  if (typeof clientId === 'string') {
    return db.select().from(invoices).where(eq(invoices.clientId, clientId))
  }

  return createTableRepository(invoices).list()
})
