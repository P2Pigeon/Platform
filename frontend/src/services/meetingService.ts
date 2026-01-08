/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * @file meetingService.ts
 * @description Frontend service for interacting with the P2Pigeon meeting API
 * 
 * This service provides a type-safe wrapper around the meeting API,
 * handling secure room creation, validation, and management.
 */
import { v4 as uuidv4 } from 'uuid';
import {
  SecurityLevel,
  type SecurityConfig,
  type MeetingResponse,
  type MeetingRequestOptions,
} from '@pigeon/shared';

export { SecurityLevel };
export type { SecurityConfig, MeetingResponse, MeetingRequestOptions };

/**
 * Default security settings
 */
const DEFAULT_SECURITY_OPTIONS: MeetingRequestOptions = {
  securityLevel: SecurityLevel.ENHANCED,
  e2eEncryption: true,
  allowRecording: false
};

async function createMeeting(
  options: MeetingRequestOptions = DEFAULT_SECURITY_OPTIONS
): Promise<MeetingResponse> {
  try {
    const apiKey = import.meta.env.VITE_API_KEY_SECRET;
    const response = await fetch('/api/v1/meeting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      return {
        meeting: '',
        error: `API returned error status: ${response.status}`,
        status: response.status
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating meeting:', error);
    return {
      meeting: '',
      error: `Failed to create meeting: ${error instanceof Error ? error.message : 'Unknown error'}`,
      transactionId: uuidv4()
    };
  }
}

async function validateMeeting(roomKey: string): Promise<boolean> {
  if (!roomKey) return false;
  
  try {
    // Use correct API v1 path
    const response = await fetch(`/api/v1/meeting/validate/${roomKey}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_API_KEY_SECRET || 'dev-key'}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`Meeting validation failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    return !!data.valid;
  } catch (error) {
    console.error('Error validating meeting:', error);
    return false;
  }
}

async function createSecureMeeting(): Promise<MeetingResponse> {
  return createMeeting({
    securityLevel: SecurityLevel.MAXIMUM,
    e2eEncryption: true,
    allowRecording: false
  });
}

function generateLocalRoomKey(): string {
  return uuidv4();
}

function buildRoomUrl(roomKey: string): string {
  return `${window.location.origin}/room/${roomKey}`;
}

function parseSecurityFromUrl(url: string): Partial<SecurityConfig> {
  const parsedUrl = new URL(url);
  
  return {
    level: parsedUrl.searchParams.get('security') as SecurityLevel || SecurityLevel.ENHANCED,
    e2eEnabled: parsedUrl.searchParams.get('e2e') !== 'false',
    verificationRequired: parsedUrl.searchParams.get('verify') === 'true'
  };
}

const meetingService = {
  createMeeting,
  validateMeeting,
  createSecureMeeting,
  generateLocalRoomKey,
  buildRoomUrl,
  parseSecurityFromUrl
};

export default meetingService;
