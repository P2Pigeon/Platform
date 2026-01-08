import 'dotenv/config';
import path from 'path';
import ngrok from 'ngrok';
import * as Sentry from '@sentry/node';
import { CaptureConsole } from '@sentry/integrations';
import crypto from 'crypto';
import yamlJS from 'yamljs';
import { getEnvBoolean } from '../utils/env';
import { AppConfig, Logger } from '../types';

// --- Helper Functions ---

/**
 * Initializes Sentry for error tracking if enabled in the config.
 * @param {AppConfig} config The application configuration.
 */
function setupSentry(config: AppConfig): void {
  if (config.sentry.enabled && config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      integrations: [
        new CaptureConsole({
          levels: ['warn', 'error'],
        }),
      ],
      tracesSampleRate: config.sentry.tracesSampleRate,
    });
  }
}

/**
 * Starts an ngrok tunnel for exposing the local server if enabled.
 * @param {AppConfig} config The application configuration.
 * @param {number} port The port to tunnel.
 * @param {Logger} log A logger instance.
 * @returns {Promise<string | null>} The public ngrok URL or null.
 */
async function startNgrok(config: AppConfig, port: number, log: Logger): Promise<string | null> {
  if (config.ngrok.enabled && config.ngrok.authToken && !config.server.isHttps) {
    try {
      await ngrok.authtoken(config.ngrok.authToken);
      const url = await ngrok.connect(port);
      log.debug('Ngrok tunnel running at:', url);
      return url;
    } catch (err: any) {
      log.error('[Error] ngrokStart', err.body || err.message);
      process.exit(1);
    }
  }
  return null;
}

/**
 * Generates a random hex string to be used as an API key.
 * @returns {string} A random 20-character hex string.
 */
function genAPIKey(): string {
  return crypto.randomBytes(10).toString('hex');
}

// --- Configuration Initialization ---

const domain = process.env.HOST || 'localhost';
const isHttps = getEnvBoolean(process.env.HTTPS);
const port = parseInt(process.env.PORT || '3060', 10);
const host = `http${isHttps ? 's' : ''}://${domain}:${port}`;

const hostCfg = {
  protected: getEnvBoolean(process.env.HOST_PROTECTED),
  username: process.env.HOST_USERNAME,
  password: process.env.HOST_PASSWORD,
};

const apiBasePath = '/api/v1';
const swaggerDocument = yamlJS.load(path.join(__dirname, '../../api/swagger.yaml'));

const config: AppConfig = {
  server: {
    domain,
    isHttps,
    port,
    host,
  },
  host: hostCfg,
  api: {
    basePath: apiBasePath,
    docs: `${host}${apiBasePath}/docs`,
    apiKeySecret: process.env.API_KEY_SECRET || genAPIKey(),
    swaggerDocument,
  },
  ngrok: {
    enabled: getEnvBoolean(process.env.NGROK_ENABLED),
    authToken: process.env.NGROK_AUTH_TOKEN,
  },
  stun: {
    url: process.env.STUN || 'stun:stun.l.google.com:19302',
  },
  turn: {
    enabled: getEnvBoolean(process.env.TURN_ENABLED),
    urls: process.env.TURN_URLS,
    username: process.env.TURN_USERNAME,
    password: process.env.TURN_PASSWORD,
    secret: process.env.TURN_SECRET,
  },
  sentry: {
    enabled: getEnvBoolean(process.env.SENTRY_ENABLED),
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),
  },
  chatGPT: {
    enabled: getEnvBoolean(process.env.CHATGPT_ENABLED),
    apiKey: process.env.CHATGTP_APIKEY,
    model: process.env.CHATGTP_MODEL || 'gpt-3.5-turbo',
    max_tokens: parseInt(process.env.CHATGPT_MAX_TOKENS || '2048', 10),
    temperature: parseFloat(process.env.CHATGPT_TEMPERATURE || '0.5'),
  },
  hypernat: {
    bootstrap: process.env.HYPERNAT_BOOTSTRAP
      ? process.env.HYPERNAT_BOOTSTRAP.split(',')
      : [],
  },
  paths: {
    public: path.join(__dirname, '../../../', 'frontend/build'),
    views: {
      main: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      client: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      landing: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      login: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      newCall: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      notFound: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      permission: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      privacy: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      terms: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      stunTurn: path.join(__dirname, '../../../', 'frontend/build/index.html'),
      password: path.join(__dirname, '../../../', 'frontend/build/index.html'),
    },
  },
  iceServers: [
    { urls: process.env.STUN || 'stun:stun.l.google.com:19302' },
  ],
  utils: {
    setupSentry,
    startNgrok,
  },
};

if (config.turn.enabled && config.turn.urls) {
  config.iceServers.push({
    urls: config.turn.urls,
    username: config.turn.username,
    credential: config.turn.password,
  });
} else if (!config.turn.enabled) {
  // Use default TURN server if not specified and TURN is not explicitly enabled with other settings
  config.iceServers.push({
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  });
}

export default config;
