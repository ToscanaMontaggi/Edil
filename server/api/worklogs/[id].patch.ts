import { worklogs } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const patch = await readBody(event)
  return createTableRepository(worklogs).update(id, patch)
})
