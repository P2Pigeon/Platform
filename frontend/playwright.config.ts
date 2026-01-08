import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for P2Pigeon E2E tests
 * Supports multi-browser context testing for WebRTC video calls
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // WebRTC tests need sequential execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for WebRTC tests
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'on', // Record video for debugging
    
    // Grant permissions for media devices
    permissions: ['camera', 'microphone'],
    
    // Use fake media for testing
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--allow-file-access-from-files',
        '--disable-web-security',
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start dev server before tests
  webServer: [
    {
      command: 'pnpm dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../app && npm run start',
      url: 'http://localhost:3060/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
