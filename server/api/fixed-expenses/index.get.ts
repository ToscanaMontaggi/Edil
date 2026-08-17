import { fixedExpenses } from '../../database/schema'

export default defineEventHandler(async () => {
  return createTableRepository(fixedExpenses).list()
})
