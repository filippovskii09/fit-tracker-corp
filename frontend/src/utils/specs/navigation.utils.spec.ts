import { redirectTo } from '../navigation.utils';

describe('redirectTo', () => {
  it('should change window.location.href', () => {
    const targetUrl = window.location.href + '#test';

    redirectTo(targetUrl);

    expect(window.location.href).toBe(targetUrl);
  });
});
