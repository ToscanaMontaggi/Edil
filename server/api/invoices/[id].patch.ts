import { invoices } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const patch = await readBody(event)
  return createTableRepository(invoices).update(id, patch)
})
