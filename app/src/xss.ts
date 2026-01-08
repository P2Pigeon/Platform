import xss from 'xss';

/**
 * Prevents Cross-Site Scripting (XSS) attacks by sanitizing input data.
 * If the input is an object, it is stringified, sanitized, and then parsed back into an object.
 * Otherwise, the input is treated as a string and sanitized directly.
 * This function uses generics to preserve the type of the input data.
 *
 * @template T
 * @param {T} data - The data to be sanitized. Can be of any type.
 * @returns {T} The sanitized data, maintaining the original type.
 */
const checkXSS = <T>(data: T): T => {
  if (typeof data === 'object' && data !== null) {
    const sanitizedString = xss(JSON.stringify(data));
    return JSON.parse(sanitizedString) as T;
  }

  // The xss library expects a string, but we handle other primitives by casting.
  // The result is cast back to T to maintain type integrity.
  return xss(data as any) as unknown as T;
};

export default checkXSS;
