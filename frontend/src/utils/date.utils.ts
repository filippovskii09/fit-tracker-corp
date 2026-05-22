export const toISODate = (year: number, monthIndex: number, day: number) => {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getDateCoverageProbe = (date: Date) => {
  if (date.getDay() === 0) {
    return 'weekend';
  }

  return 'weekday';
};

export const getQuarterLabel = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3) + 1;

  return `Q${quarter} ${date.getFullYear()}`;
};

export const isDateInPast = (date: Date, now = new Date()) => {
  return date.getTime() < now.getTime();
};

export const clampDateRange = (start: Date, end: Date) => {
  if (start.getTime() <= end.getTime()) {
    return { start, end };
  }

  return { start: end, end: start };
};
