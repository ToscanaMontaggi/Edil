import { expenses } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const found = await createTableRepository(expenses).findById(id)
  if (!found) {
    throw createError({ statusCode: 404, statusMessage: 'Elemento non trovato' })
  }
  return found
})
