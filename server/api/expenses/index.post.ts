import { expenses } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const draft = await readBody(event)
  return createTableRepository(expenses).create(draft)
})
