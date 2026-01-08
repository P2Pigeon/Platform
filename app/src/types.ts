// --- Type Definitions ---

/**
 * @interface Logger
 * @description Defines a simple logger interface for dependency injection.
 */
export interface Logger {
  debug: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

/**
 * @interface RTCIceServer
 * @description Defines the structure for an ICE server configuration, used by WebRTC.
 */
export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * @interface AppConfig
 * @description Defines the entire application configuration structure.
 */
export interface AppConfig {
  server: {
    domain: string;
    isHttps: boolean;
    port: number;
    host: string;
  };
  host: {
    protected: boolean;
    username?: string;
    password?: string;
  };
  api: {
    basePath: string;
    docs: string;
    apiKeySecret: string;
    swaggerDocument: any;
  };
  ngrok: {
    enabled: boolean;
    authToken?: string;
  };
  stun: {
    url: string;
  };
  turn: {
    enabled: boolean;
    urls?: string;
    username?: string;
    password?: string;
    secret?: string;
  };
  hypernat: {
    bootstrap: string[];
  };
  sentry: {
    enabled: boolean;
    dsn?: string;
    tracesSampleRate: number;
  };
  chatGPT: {
    enabled: boolean;
    apiKey?: string;
    model: string;
    max_tokens: number;
    temperature: number;
  };
  paths: {
    public: string;
    views: {
      [key: string]: string;
    };
  };
  iceServers: RTCIceServer[];
  utils: {
    setupSentry: (config: AppConfig) => void;
    startNgrok: (config: AppConfig, port: number, log: Logger) => Promise<string | null>;
  };
}
