import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  reporter: [['list']],
});
