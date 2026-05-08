import { getLocation, redirectTo } from '../navigation.util';

describe('redirectTo', () => {
  it('should change window.location.href', () => {
    const targetUrl = window.location.href + '#test';

    redirectTo(targetUrl);

    expect(window.location.href).toBe(targetUrl);
  });

  it('should get current location', () => {
    const currentLocation = window.location.href;

    expect(getLocation()).toBe(currentLocation);
  });
});
