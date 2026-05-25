export const toISODate = (year: number, monthIndex: number, day: number) => {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getQuarterLabel = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3) + 1;

  return `Q${quarter} ${date.getFullYear()}`;
};

export const getMonthDateRange = (year: number, monthIndex: number) => {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  return {
    startDate: toISODate(year, monthIndex, 1),
    endDate: toISODate(year, monthIndex, lastDay),
  };
};

export const getRelativeDateLabel = (date: Date, today = new Date()) => {
  const dateValue = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const todayValue = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const differenceInDays = Math.round(
    (dateValue - todayValue) / (1000 * 60 * 60 * 24),
  );

  if (differenceInDays === 0) {
    return 'Today';
  }

  if (differenceInDays === 1) {
    return 'Tomorrow';
  }

  if (differenceInDays === -1) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  }).format(date);
};
