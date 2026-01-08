import util from 'util';
import colors from 'colors';

colors.enable();

const options = {
  depth: null,
  colors: true,
};

/**
 * @class Logs
 * @description Provides a comprehensive, color-coded logging utility for the application.
 */
export default class Logs {
  private appName: string;
  private debugOn: boolean;
  private timeStart: number;

  constructor(appName = 'P2Pigeon', debugOn = true) {
    this.appName = colors.yellow(appName);
    this.debugOn = debugOn;
    this.timeStart = Date.now();
  }

  /**
   * Logs a debug message to the console if debugging is enabled.
   * @param {string} msg - The message to log.
   * @param {unknown} [op=''] - Optional parameters to include in the log.
   */
  debug(msg: string, op: unknown = ''): void {
    if (this.debugOn) {
      const timeEnd = Date.now();
      const timeElapsedMs = this.getFormatTime(timeEnd - this.timeStart);
            const logArgs = [`[${this.getDataTime()}] [${this.appName}] ${msg}`];
      if (op !== '') {
        logArgs.push(util.inspect(op, options));
      }
      logArgs.push(timeElapsedMs);
      console.debug(...logArgs);
      this.timeStart = Date.now();
    }
  }

  /**
   * Logs a standard message to the console.
   * @param {string} msg - The message to log.
   * @param {unknown} [op=''] - Optional parameters to include in the log.
   */
  log(msg: string, op: unknown = ''): void {
        const logArgs = [`[${this.getDataTime()}] [${this.appName}] ${msg}`];
    if (op !== '') {
      logArgs.push(util.inspect(op, options));
    }
    console.log(...logArgs);
  }

  /**
   * Logs an info message to the console.
   * @param {string} msg - The message to log.
   * @param {unknown} [op=''] - Optional parameters to include in the log.
   */
  info(msg: string, op: unknown = ''): void {
        const logArgs = [`[${this.getDataTime()}] [${this.appName}] ${colors.green(msg)}`];
    if (op !== '') {
      logArgs.push(util.inspect(op, options));
    }
    console.info(...logArgs);
  }

  /**
   * Logs a warning message to the console.
   * @param {string} msg - The message to log.
   * @param {unknown} [op=''] - Optional parameters to include in the log.
   */
  warn(msg: string, op: unknown = ''): void {
        const logArgs = [`[${this.getDataTime()}] [${this.appName}] ${colors.yellow(msg)}`];
    if (op !== '') {
      logArgs.push(util.inspect(op, options));
    }
    console.warn(...logArgs);
  }

  /**
   * Logs an error message to the console.
   * @param {string} msg - The message to log.
   * @param {unknown} [op=''] - Optional parameters to include in the log.
   */
  error(msg: string, op: unknown = ''): void {
        const logArgs = [`[${this.getDataTime()}] [${this.appName}] ${colors.red(msg)}`];
    if (op !== '') {
      logArgs.push(util.inspect(op, options));
    }
    console.error(...logArgs);
  }

  /**
   * Gets the current date and time formatted as a string.
   * @returns {string} The formatted date and time.
   */
  private getDataTime(): string {
    return colors.cyan(new Date().toISOString().replace(/T/, ' ').replace(/Z/, ''));
  }

  /**
   * Formats a duration in milliseconds into a human-readable string.
   * @param {number} ms - The duration in milliseconds.
   * @returns {string} The formatted time string (e.g., '+5s', '+10m').
   */
  private getFormatTime(ms: number): string {
    let time = Math.floor(ms);
    let type = 'ms';

    if (ms >= 1000) {
      time = Math.floor((ms / 1000) % 60);
      type = 's';
    }
    if (ms >= 60000) {
      time = Math.floor((ms / 1000 / 60) % 60);
      type = 'm';
    }
    if (ms >= 3.6e6) { // 3,600,000 ms = 1 hour
      time = Math.floor((ms / (1000 * 60 * 60)) % 24);
      type = 'h';
    }
    return colors.magenta(`+${time}${type}`);
  }
}
