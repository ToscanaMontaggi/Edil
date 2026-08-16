import { employees } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await createTableRepository(employees).remove(id)
  return { success: true }
})
