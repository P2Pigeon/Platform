/**
 * PM2 Ecosystem Configuration
 * 
 * Manages the P2Pigeon backend service with auto-restart,
 * health monitoring, and log management.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 logs pigeon-backend
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'pigeon-backend',
      script: './app/dist/src/server.js',
      cwd: __dirname,
      
      // Instances and execution mode
      instances: 1,  // Single instance for WebSocket compatibility
      exec_mode: 'fork',
      
      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // Restart strategies
      restart_delay: 1000,           // Wait 1s before restart
      max_restarts: 10,              // Max restarts within min_uptime
      min_uptime: 5000,              // Min uptime to consider "started"
      
      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3060,
        DHT_RELAY_PORT: 3051
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3060,
        DHT_RELAY_PORT: 3051
      },
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pigeon-backend-error.log',
      out_file: './logs/pigeon-backend-out.log',
      merge_logs: true,
      
      // Health check (PM2 Plus feature, works without subscription for basic monitoring)
      // For self-hosted health checks, we'll add a cron job below
    },
    
    // Health check daemon - pings the backend every 30s
    {
      name: 'pigeon-healthcheck',
      script: './scripts/healthcheck.js',
      cwd: __dirname,
      
      instances: 1,
      autorestart: true,
      watch: false,
      
      // Run every 30 seconds via cron
      cron_restart: '*/1 * * * *',  // Restart every minute to keep alive
      
      env: {
        HEALTH_CHECK_URL: 'http://localhost:3060/health',
        HEALTH_CHECK_INTERVAL: 30000,  // 30 seconds
        MAX_FAILURES: 3,
        RESTART_TARGET: 'pigeon-backend'
      },
      
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/healthcheck-error.log',
      out_file: './logs/healthcheck-out.log',
      merge_logs: true,
    }
  ]
};
