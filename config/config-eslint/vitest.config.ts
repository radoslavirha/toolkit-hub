import { defineConfig } from 'vitest/config';

// Plain config: @radoslavirha/config-vitest depends on this package, so it cannot be used here.
export default defineConfig({
    test: {
        include: ['src/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/nullable.mjs'],
            thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 }
        }
    }
});
