import { sites } from '../../database/schema'

export default defineEventHandler(async () => {
  return createTableRepository(sites).list()
})
