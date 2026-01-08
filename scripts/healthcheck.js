#!/usr/bin/env node
/**
 * Health Check Script for P2Pigeon Backend
 * 
 * Monitors the backend health endpoint and triggers PM2 restart
 * if consecutive failures exceed the threshold.
 * 
 * Environment variables:
 *   HEALTH_CHECK_URL - URL to check (default: http://localhost:3060/health)
 *   HEALTH_CHECK_INTERVAL - Check interval in ms (default: 30000)
 *   MAX_FAILURES - Max consecutive failures before restart (default: 3)
 *   RESTART_TARGET - PM2 app name to restart (default: pigeon-backend)
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');

const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:3060/health';
const HEALTH_CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000;
const MAX_FAILURES = parseInt(process.env.MAX_FAILURES) || 3;
const RESTART_TARGET = process.env.RESTART_TARGET || 'pigeon-backend';

let consecutiveFailures = 0;
let isRestarting = false;

function log(level, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

function checkHealth() {
  if (isRestarting) {
    log('info', 'Restart in progress, skipping health check');
    return;
  }

  const url = new URL(HEALTH_CHECK_URL);
  const client = url.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'GET',
    timeout: 5000
  };

  const req = client.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        if (consecutiveFailures > 0) {
          log('info', `Backend recovered after ${consecutiveFailures} failure(s)`);
        }
        consecutiveFailures = 0;
        log('debug', `Health check OK: ${data.trim()}`);
      } else {
        handleFailure(`HTTP ${res.statusCode}: ${data.trim()}`);
      }
    });
  });

  req.on('error', (err) => {
    handleFailure(`Connection error: ${err.message}`);
  });

  req.on('timeout', () => {
    req.destroy();
    handleFailure('Request timeout');
  });

  req.end();
}

function handleFailure(reason) {
  consecutiveFailures++;
  log('warn', `Health check failed (${consecutiveFailures}/${MAX_FAILURES}): ${reason}`);

  if (consecutiveFailures >= MAX_FAILURES) {
    restartBackend();
  }
}

function restartBackend() {
  if (isRestarting) return;
  
  isRestarting = true;
  log('error', `Max failures reached. Restarting ${RESTART_TARGET}...`);

  exec(`pm2 restart ${RESTART_TARGET}`, (error, stdout, stderr) => {
    if (error) {
      log('error', `Failed to restart: ${error.message}`);
    } else {
      log('info', `Restart triggered successfully`);
    }
    
    // Wait before resuming health checks
    setTimeout(() => {
      consecutiveFailures = 0;
      isRestarting = false;
      log('info', 'Resuming health checks');
    }, 10000);
  });
}

// Initial startup
log('info', `Health check daemon started`);
log('info', `Target: ${HEALTH_CHECK_URL}`);
log('info', `Interval: ${HEALTH_CHECK_INTERVAL}ms`);
log('info', `Max failures: ${MAX_FAILURES}`);

// Run health check on interval
setInterval(checkHealth, HEALTH_CHECK_INTERVAL);

// Initial check after 5 seconds
setTimeout(checkHealth, 5000);

// Keep process alive
process.on('SIGINT', () => {
  log('info', 'Health check daemon shutting down');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Health check daemon shutting down');
  process.exit(0);
});
