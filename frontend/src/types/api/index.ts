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
 * @file API type definitions
 * @description Type definitions for API responses and requests. */

/**
 * Meeting API response structure
 */
export interface MeetingApiResponse {
  meeting: string;
  status: 'success' | 'error';
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Meeting creation request parameters
 */
export interface CreateMeetingRequest {
  roomName?: string;
  participantLimit?: number;
  enableEncryption?: boolean;
  encryptionAlgorithm?: string;
  enableP2P?: boolean;
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  status: 'error';
  error: {
    code: number;
    message: string;
    details?: Record<string, unknown>;
  };
}
