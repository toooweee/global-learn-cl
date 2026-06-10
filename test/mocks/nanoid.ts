// Lightweight stub for the ESM-only `nanoid` package used in unit tests.
// The real implementation is not needed: the only importer (ContextInterceptor)
// is never executed in the test environment.
export const nanoid = (size = 6): string => 'x'.repeat(size);
