import '@testing-library/jest-dom';

// @ts-expect-error: TextEncoder and TextDecoder are not available in JSDOM but needed for some tests
import { TextEncoder, TextDecoder } from 'util';

Object.assign(globalThis, { TextEncoder, TextDecoder });
