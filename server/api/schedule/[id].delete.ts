import { scheduleEntries } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await createTableRepository(scheduleEntries).remove(id)
  return { success: true }
})
