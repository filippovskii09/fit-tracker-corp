import axios from 'axios';

import { DICTIONARY } from '@locales';
import { getErrorMessage } from '../api-error.util';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getErrorMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Standard Errors', () => {
    it('should return message from a standard Error object', () => {
      mockedAxios.isAxiosError.mockReturnValue(false);

      const error = new Error('Something went wrong');
      expect(getErrorMessage(error)).toBe('Something went wrong');
    });
  });

  describe('Axios Errors', () => {
    it('should extract the FIRST message if backend returns an array', () => {
      mockedAxios.isAxiosError.mockReturnValue(true);

      const errorMock = {
        response: {
          data: {
            message: [
              DICTIONARY.common.validation.email,
              DICTIONARY.common.validation.minLength(6),
            ],
          },
        },
      };

      expect(getErrorMessage(errorMock)).toBe(
        DICTIONARY.common.validation.email,
      );
    });

    it('should return the message if backend returns a string', () => {
      mockedAxios.isAxiosError.mockReturnValue(true);

      const errorMock = {
        response: {
          data: {
            message: DICTIONARY.common.validation.email,
          },
        },
      };

      expect(getErrorMessage(errorMock)).toBe(
        DICTIONARY.common.validation.email,
      );
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

      expect(getErrorMessage(errorMock)).toBe(DICTIONARY.common.errors.unknown);
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
        expect(getErrorMessage(err)).toBe(DICTIONARY.common.errors.unknown);
      });
    });
  });
});
