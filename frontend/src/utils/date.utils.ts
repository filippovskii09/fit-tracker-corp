export const toISODate = (year: number, monthIndex: number, day: number) => {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getDateCoverageProbe = (date: Date) => {
  if (date.getDay() === 0) {
    return 'weekend';
  }

  return 'weekday';
};
