import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Automatic JSX runtime so component tests don't need an explicit React import.
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: false,
    // Run test files sequentially so DB integration tests (which truncate a shared
    // test database) never collide. The suite is small, so the cost is negligible.
    fileParallelism: false,
  },
});
