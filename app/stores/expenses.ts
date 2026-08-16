export const useExpensesStore = defineCrudStore('expenses', dataSource => dataSource.expenses)
