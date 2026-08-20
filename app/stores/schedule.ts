export const useScheduleStore = defineCrudStore(
  'schedule',
  dataSource => dataSource.schedule,
)
