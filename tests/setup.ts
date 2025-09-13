/**
 * Jest Test Setup Configuration
 * Sistema Exames - Test Infrastructure
 */

import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Crypto polyfill for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Console suppression for cleaner test output
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

// Suppress logs during tests unless explicitly requested
if (process.env.TEST_VERBOSE !== 'true') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
  
  // Keep error logs for debugging test failures
  console.error = (...args: any[]) => {
    if (process.env.TEST_SHOW_ERRORS === 'true') {
      originalConsole.error(...args);
    }
  };
}

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeWithinTimeRange(expected: Date, toleranceMs?: number): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
      pass,
    };
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
      pass,
    };
  },

  toBeWithinTimeRange(received: Date, expected: Date, toleranceMs = 1000) {
    const pass = Math.abs(received.getTime() - expected.getTime()) <= toleranceMs;
    
    return {
      message: () => 
        pass 
          ? `Expected ${received.toISOString()} not to be within ${toleranceMs}ms of ${expected.toISOString()}`
          : `Expected ${received.toISOString()} to be within ${toleranceMs}ms of ${expected.toISOString()}`,
      pass,
    };
  },
});

// Global test timeout
jest.setTimeout(10000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Export test utilities
export { originalConsole };