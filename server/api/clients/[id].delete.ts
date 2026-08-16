import { clients } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await createTableRepository(clients).remove(id)
  return { success: true }
})
