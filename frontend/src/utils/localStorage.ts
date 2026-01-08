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

export type MediaType = 'audio' | 'video' | 'speaker';

export interface DeviceSettings {
  count: number;
  index: number;
  select: MediaDeviceInfo | null;
}

export interface LocalStorageDevices {
  audio: DeviceSettings;
  video: DeviceSettings;
  speaker: DeviceSettings;
}

const STORAGE_KEY = 'PIGEON_DEVICES';

const getDefaultSettings = (): LocalStorageDevices => ({
  audio: { count: 0, index: 0, select: null },
  video: { count: 0, index: 0, select: null },
  speaker: { count: 0, index: 0, select: null },
});

/**
 * Retrieves all device settings from localStorage.
 * @returns The stored device settings, or a default structure if not present.
 */
export function getLocalStorageDevices(): LocalStorageDevices {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return getDefaultSettings();
  }
  try {
    const parsed = JSON.parse(data);
    // Basic validation to ensure the object has the expected structure
    if (parsed && typeof parsed === 'object' && 'audio' in parsed && 'video' in parsed) {
      return parsed as LocalStorageDevices;
    }
    return getDefaultSettings();
  } catch (e) {
    console.error('Failed to parse localStorage device settings:', e);
    return getDefaultSettings();
  }
}

/**
 * Saves the settings for a specific device type to localStorage.
 * @param type The type of the device ('audio', 'video', 'speaker').
 * @param index The selected index of the device.
 * @param select The MediaDeviceInfo object of the selected device.
 * @param deviceCount The total number of devices of this type.
 */
export function setLocalStorageDevice(
  type: MediaType,
  index: number,
  select: MediaDeviceInfo | null,
  deviceCount: number
): void {
  const settings = getLocalStorageDevices();

  settings[type] = {
    count: deviceCount,
    index: index,
    select: select,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

