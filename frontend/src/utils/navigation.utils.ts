export const redirectTo = (url: string): void => {
  window.location.href = url;
};

export const getCurrentRoute = (): string => {
  return window.location.pathname;
};

export const getCurrentRouteWithoutParam = (): string => {
  return window.location.pathname.split('/')[1];
};
