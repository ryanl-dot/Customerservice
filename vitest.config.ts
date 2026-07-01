import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
    // Run test files sequentially so DB integration tests (which truncate a shared
    // test database) never collide. The suite is small, so the cost is negligible.
    fileParallelism: false,
  },
});
