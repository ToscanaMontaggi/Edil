import { invoices } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await createTableRepository(invoices).remove(id)
  return { success: true }
})
