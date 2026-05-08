export const redirectTo = (url: string): void => {
  window.location.href = url;
};

export const currentLocation = () => {
  return window.location.href;
};

export const nextLocation = (path: string): string => {
  return `${currentLocation()}/${path}`;
};

export const previousLocation = (): string => {
  const current = currentLocation();

  if (current.endsWith('/')) {
    return current.slice(0, current.length - 1);
  }

  return current.slice(0, current.lastIndexOf('/'));
};

export const back = (): void => {
  window.history.back();
};
