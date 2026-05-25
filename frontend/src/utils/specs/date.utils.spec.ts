import { getQuarterLabel, toISODate } from '../date.utils';

describe('toISODate', () => {
  it('should format the date correctly for single-digit month and day', () => {
    expect(toISODate(2023, 0, 5)).toBe('2023-01-05');
  });

  it('should format the date correctly for double-digit month and day', () => {
    expect(toISODate(2023, 10, 15)).toBe('2023-11-15');
  });

  it('should handle leap years correctly', () => {
    expect(toISODate(2024, 1, 29)).toBe('2024-02-29');
  });
});

describe('getQuarterLabel', () => {
  it('should return the first quarter label', () => {
    expect(getQuarterLabel(new Date(2024, 0, 15))).toBe('Q1 2024');
  });

  it('should return the fourth quarter label', () => {
    expect(getQuarterLabel(new Date(2024, 11, 1))).toBe('Q4 2024');
  });
});
