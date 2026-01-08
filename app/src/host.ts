import Logs from './logs';
const log = new Logs('Host');

/**
 * @class Host
 * @description Manages a map of authorized IP addresses to track and verify client authorization.
 */
export default class Host {
  /**
   * @private
   * @property {Map<string, boolean>} auth - A map to store the authorization status of IP addresses.
   */
  private auth: Map<string, boolean>;

  /**
   * @constructor
   * @param {string} ip - The initial IP address to add to the authorization map.
   * @param {boolean} authorized - The authorization status for the initial IP.
   */
  constructor(ip: string, authorized: boolean) {
    this.auth = new Map<string, boolean>();
    this.auth.set(ip, authorized);
    // log.debug('AUTH ---> ', this.auth.get(ip));
  }

  /**
   * Checks if a given IP address is present in the authorization map.
   * @param {string} ip - The IP address to check.
   * @returns {boolean} - True if the IP is authorized, otherwise false.
   */
  isAuthorized(ip: string): boolean {
    return this.auth.has(ip);
  }

  /**
   * Removes a given IP address from the authorization map.
   * @param {string} ip - The IP address to remove.
   * @returns {boolean} - True if the IP was successfully removed, otherwise false.
   */
  deleteIP(ip: string): boolean {
    return this.auth.delete(ip);
  }
}
