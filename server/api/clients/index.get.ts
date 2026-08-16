import { clients } from '../../database/schema'

export default defineEventHandler(async () => {
  return createTableRepository(clients).list()
})
