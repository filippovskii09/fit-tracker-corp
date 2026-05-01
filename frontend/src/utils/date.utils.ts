export const toISODate = (year: number, monthIndex: number, day: number) => {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getDateStatusLabel = (date: Date, today = new Date()) => {
  const dateTime = date.setHours(0, 0, 0, 0);
  const todayTime = today.setHours(0, 0, 0, 0);

  if (dateTime < todayTime) {
    return 'past';
  }

  if (dateTime > todayTime) {
    return 'future';
  }

  return 'today';
};
