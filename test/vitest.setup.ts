import 'reflect-metadata';
import { afterEach } from 'vitest';
import { vi } from 'vitest';

// Jest compatibility shim so existing specs using `jest.fn()` keep working.
(globalThis as Record<string, unknown>).jest = vi;

afterEach(() => {
  vi.restoreAllMocks();
});
