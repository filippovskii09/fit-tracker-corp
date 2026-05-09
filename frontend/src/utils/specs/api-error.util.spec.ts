import axios from 'axios';

import { DICTIONARY } from '@locales';
import { getErrorMessage } from '../api-error.utils';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const createAxiosErrorMock = (message: unknown) => ({
  response: {
    data: {
      message,
    },
  },
});

describe('getErrorMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Standard Errors', () => {
    it('should return message from a standard Error object', () => {
      mockedAxios.isAxiosError.mockReturnValue(false);
      const errorMessage = 'Something went wrong';
      const error = new Error(errorMessage);

      const result = getErrorMessage(error);

      expect(result).toBe(errorMessage);
    });
  });

  describe('Axios Errors', () => {
    it('should extract the FIRST message if backend returns an array', () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const errorMock = createAxiosErrorMock([
        DICTIONARY.common.validation.email,
        DICTIONARY.common.validation.minLength(6),
      ]);

      const result = getErrorMessage(errorMock);

      expect(result).toBe(DICTIONARY.common.validation.email);
    });

    it('should return the message if backend returns a string', () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const errorMock = createAxiosErrorMock(
        DICTIONARY.common.validation.email,
      );

      const result = getErrorMessage(errorMock);

      expect(result).toBe(DICTIONARY.common.validation.email);
    });

    it('should return a generic message if backend returns an unknown structure', () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const errorMock = {
        message: DICTIONARY.common.errors.unknown,
        response: {
          data: {
            unknown: 'structure',
          },
        },
      };

      const result = getErrorMessage(errorMock);

      expect(result).toBe(DICTIONARY.common.errors.unknown);
    });

    it('should return "unknown error" constant for non-standard error objects', () => {
      mockedAxios.isAxiosError.mockReturnValue(false);
      const weirdErrors = [
        null,
        undefined,
        { some: 'custom object' },
        'Just a string string',
      ];

      weirdErrors.forEach((err) => {
        const result = getErrorMessage(err);
        expect(result).toBe(DICTIONARY.common.errors.unknown);
      });
    });
  });
});
