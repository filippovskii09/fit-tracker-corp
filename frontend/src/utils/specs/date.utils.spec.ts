import { toISODate } from '../date.utils';

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
