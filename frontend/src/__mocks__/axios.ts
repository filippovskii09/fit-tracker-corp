import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAxios: any = jest.fn(() => Promise.resolve({ data: {} }));

mockAxios.get = jest.fn(() => Promise.resolve({ data: {} }));
mockAxios.post = jest.fn(() => Promise.resolve({ data: {} }));
mockAxios.put = jest.fn(() => Promise.resolve({ data: {} }));
mockAxios.delete = jest.fn(() => Promise.resolve({ data: {} }));
mockAxios.patch = jest.fn(() => Promise.resolve({ data: {} }));

mockAxios.create = jest.fn(() => mockAxios);

mockAxios.interceptors = {
  request: {
    use: jest.fn(),
    eject: jest.fn(),
  },
  response: {
    use: jest.fn(),
    eject: jest.fn(),
  },
  requestIds: [],
};

mockAxios.isAxiosError = jest.fn();
mockAxios.AxiosError = jest.fn();

export default mockAxios;
