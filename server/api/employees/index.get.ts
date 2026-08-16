import { employees } from '../../database/schema'

export default defineEventHandler(async () => {
  return createTableRepository(employees).list()
})
