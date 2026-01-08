/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * @file cypress.config.ts
 * @description Cypress configuration for end-to-end testing. */

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
      });

      // Add environment variables for different test environments
      const environment = process.env.TEST_ENV || 'development';
      
      // Configure environment-specific settings
      const environmentConfig = {
        development: {
          apiUrl: 'http://localhost:8080',
          networkConditions: 'normal',
          securityLevel: 'standard',
        },
        staging: {
          apiUrl: 'https://staging-api.p2pigeon.com',
          networkConditions: 'normal',
          securityLevel: 'enhanced',
        },
        production: {
          apiUrl: 'https://api.p2pigeon.com',
          networkConditions: 'strict',
          securityLevel: 'maximum',
        },
      };
      
      // Merge environment config with base config
      config.env = {
        ...config.env,
        ...environmentConfig[environment as keyof typeof environmentConfig],
      };
      
      return config;
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false, // Required for testing P2P connections
    defaultCommandTimeout: 10000, // Increased timeout for P2P operations
    experimentalStudio: true,
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
