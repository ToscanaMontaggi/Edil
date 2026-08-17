import { fixedExpenses } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await createTableRepository(fixedExpenses).remove(id)
  return { success: true }
})
