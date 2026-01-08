/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

'use strict';

/**
 * Generates a random numeric string of a given length.
 * @param length The desired length of the number string.
 * @returns A string of random digits.
 */
export function getRandomNumericString(length: number): string {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Animates the setting of an input element's value with a typewriter effect.
 * @param element The HTMLInputElement to animate.
 * @param text The text to type into the element.
 * @param speed The delay between characters in milliseconds (default: 100).
 */
export function startTypewriter(
  element: HTMLInputElement | null,
  text: string,
  speed: number = 100,
): void {
  if (!element) {
    console.error('Typewriter target element not found.');
    return;
  }

  element.value = ''; // Clear the input first

  // The inner `type` function is defined to ensure type safety across
  // the asynchronous `setTimeout` calls by passing the element and index directly.
  const type = (el: HTMLInputElement, charIndex: number) => {
    if (charIndex < text.length) {
      el.value += text.charAt(charIndex);
      setTimeout(() => type(el, charIndex + 1), speed);
    }
  };

  type(element, 0);
}

