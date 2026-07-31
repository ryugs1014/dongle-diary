import { Routine } from '@/store/useChecklistStore';

export const isRoutineActiveOnDate = (routine: Routine, dateStr: string) => {
  if (!routine.isActive) return false;
  if (dateStr < routine.startDate) return false;
  if (routine.endDate && dateStr > routine.endDate) return false;

  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getDay(); // 0(일) ~ 6(토)
  const dayOfMonth = dateObj.getDate(); // 1 ~ 31
  const month = dateObj.getMonth() + 1; // 1 ~ 12

  switch (routine.repeatType) {
    case 'daily':
      return true;
    case 'weekly':
      return routine.repeatDaysOfWeek?.includes(dayOfWeek) ?? false;
    case 'monthly':
      return routine.repeatDaysOfMonth?.includes(dayOfMonth) ?? false;
    case 'yearly':
      return (
        routine.repeatDatesOfYear?.some(
          (item) => item.month === month && item.day === dayOfMonth,
        ) ?? false
      );
    default:
      return false;
  }
};
