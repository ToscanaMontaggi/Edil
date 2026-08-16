import { sites } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await createTableRepository(sites).remove(id)
  return { success: true }
})
