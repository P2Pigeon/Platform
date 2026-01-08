/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

import { ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * Sends a message to the main process via a specified channel.
 * @param channel The channel to send the message on.
 * @param data The data to send.
 */
export function sendMessage(channel: string, ...data: unknown[]): void {
  ipcRenderer.send(channel, ...data);
}

/**
 * Subscribes to messages from the main process on a specified channel.
 * @param channel The channel to listen on.
 * @param listener The callback function to execute when a message is received.
 */
export function onMessage(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void {
  ipcRenderer.on(channel, listener);
}

// Example usage:
console.log('Hello from the ipcRenderer module!');
sendMessage('messageFromRenderer', 'Hello from the new ipcRenderer module!');
onMessage('messageFromMain', (event, message) => {
  console.log('Received message from main process:', message);
});

