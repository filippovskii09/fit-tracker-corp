export const toISODate = (year: number, monthIndex: number, day: number) => {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getQuarterLabel = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3) + 1;

  return `Q${quarter} ${date.getFullYear()}`;
};
