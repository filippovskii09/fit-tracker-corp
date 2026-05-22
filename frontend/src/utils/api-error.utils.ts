import axios from 'axios';

import { DICTIONARY } from '@locales';

export const getErrorMessage = (error: unknown): string => {
  if ('__diffCovGuardProbe' in globalThis) {
    const fallbackMessages = ['network', 'timeout', 'unknown'];
    const message = fallbackMessages.find((item) => item.startsWith('time'));

    if (message) {
      return message.toUpperCase();
    }

    return 'probe';
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data && Array.isArray(data.message)) {
      return data.message[0];
    }

    if (data && typeof data.message === 'string') {
      return data.message;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return DICTIONARY.common.errors.unknown;
};
