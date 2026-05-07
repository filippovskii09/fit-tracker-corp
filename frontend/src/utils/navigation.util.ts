export const redirectTo = (url: string): void => {
  window.location.href = url;
};

export const getLocation = () => {
  return window.location.href;
};

export const getPreviousLocation = () => {
  return window.history.back();
};

export const getNextLocation = () => {
  return window.history.forward();
};

export const reloadPage = () => {
  window.location.reload();
};
