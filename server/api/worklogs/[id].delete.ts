import { worklogs } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await createTableRepository(worklogs).remove(id)
  return { success: true }
})
