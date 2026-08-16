import { expenses } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await createTableRepository(expenses).remove(id)
  return { success: true }
})
