/**
 * @file meeting.ts
 * @description Secure API client for P2Pigeon meeting creation and management
 */
import fetch from 'node-fetch';
import type { Response as NodeFetchResponse } from 'node-fetch';

// Ensure we have proper typing for Response.json()
interface TypedResponse extends NodeFetchResponse {
  json<T>(): Promise<T>;
}
import { v4 as uuidv4 } from 'uuid';
import {
  SecurityLevel,
  SecurityConfig,
  MeetingResponse,
  MeetingRequestOptions
} from '../../types/meeting';

/**
 * API configuration
 */
const API_CONFIG = {
  /** Timeout in milliseconds for API requests */
  timeoutMs: 10000,
  /** Maximum retry attempts for failed requests */
  maxRetries: 3,
  /** Base delay in milliseconds for exponential backoff */
  retryDelayMs: 500
};

/**
 * Base URL configuration for different environments
 * @private
 */
const API_URLS = {
  development: 'http://localhost:3000/api/v1/meeting',
  staging: 'https://p2p.pigeon.com/api/v1/meeting',
  railway: 'https://pigeon.up.railway.app/api/v1/meeting',
  production: 'https://pigeon.herokuapp.com/api/v1/meeting'
};

/**
 * Gets the current API environment
 * @returns The current API environment name
 */
function getApiEnvironment(): string {
  return process.env.PIGEON_ENVIRONMENT || 'development';
}

/**
 * Gets the API URL for the current environment
 * @returns The API URL
 */
function getApiUrl(): string {
  const environment = getApiEnvironment();
  return API_URLS[environment as keyof typeof API_URLS] || API_URLS.production;
}

/**
 * Gets the API key from environment or fallback
 * @returns The API key to use
 */
function getApiKey(): string {
  return process.env.PIGEON_API_KEY || 'pigeon_default_secret';
}

/**
 * Makes a secure request to the meeting API with retry logic
 * @param options - Options for the meeting request
 * @returns Promise<Response> API response
 * @throws Error if all retry attempts fail
 */
async function makeApiRequest(options?: MeetingRequestOptions): Promise<TypedResponse> {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  
  let retries = 0;
  let lastError: Error | null = null;
  
  // Prepare request body with options
  const requestBody = options ? JSON.stringify({
    securityLevel: options.securityLevel || SecurityLevel.ENHANCED,
    e2eEncryption: options.e2eEncryption ?? true,
    allowRecording: options.allowRecording ?? false,
    metadata: options.metadata || {},
    roomName: options.roomName || ''
  }) : '{}';

  // Retry logic with exponential backoff
  while (retries <= API_CONFIG.maxRetries) {
    try {
      return await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'X-Request-ID': uuidv4(),
          'X-Client-Version': '2.0.0'
        },
        body: requestBody,
        timeout: API_CONFIG.timeoutMs
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;
      
      if (retries <= API_CONFIG.maxRetries) {
        // Calculate exponential backoff delay
        const delayMs = API_CONFIG.retryDelayMs * Math.pow(2, retries - 1);
        console.warn(`API request failed, retrying (${retries}/${API_CONFIG.maxRetries}) after ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // All retries failed
  console.error('Failed to connect to meeting API after multiple attempts:', lastError);
  throw new Error(`Meeting API connection failure after ${API_CONFIG.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Creates a new meeting room with specified security options
 * @param options - Meeting configuration options
 * @returns Promise<MeetingResponse> Detailed meeting information
 */
export async function createMeeting(options?: MeetingRequestOptions): Promise<MeetingResponse> {
  const transactionId = uuidv4();
  const startTime = Date.now();
  
  try {
    // Make API request with retry logic
    const response = await makeApiRequest(options);
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API response time: ${responseTimeMs}ms`);
    }
    
    // Handle unsuccessful response
    if (!response.ok) {
      let errorMessage = `API returned error status: ${response.status}`;
      
      try {
        // Try to parse error details from response
        const errorData = await response.json<{ error?: string }>();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        // Failed to parse error response, use default message
      }
      
      return {
        meeting: '',
        error: errorMessage,
        status: response.status,
        transactionId
      };
    }
    
    // Parse successful response
    const data = await response.json<Partial<MeetingResponse>>();
    
    // Ensure all required fields are present
    const result: MeetingResponse = {
      meeting: data.meeting || '',
      encryptionKey: data.encryptionKey,
      security: data.security || {
        level: options?.securityLevel || SecurityLevel.ENHANCED,
        e2eEnabled: options?.e2eEncryption ?? true,
        verificationRequired: options?.securityLevel === SecurityLevel.MAXIMUM
      },
      status: response.status,
      createdAt: data.createdAt || new Date().toISOString(),
      expiresAt: data.expiresAt,
      transactionId: data.transactionId || transactionId
    };
    
    return result;
  } catch (error) {
    console.error('Error creating meeting:', error);
    return {
      meeting: '',
      error: `Failed to create meeting: ${error instanceof Error ? error.message : 'Unknown error'}`,
      transactionId
    };
  }
}

/**
 * Validates an existing meeting room
 * @param meetingId - ID of the meeting to validate
 * @returns Promise<boolean> Whether the meeting exists and is valid
 */
export async function validateMeeting(meetingId: string): Promise<boolean> {
  if (!meetingId) return false;
  
  try {
    const apiUrl = `${getApiUrl()}/validate/${meetingId}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': getApiKey(),
        'Content-Type': 'application/json'
      },
      timeout: API_CONFIG.timeoutMs
    }) as TypedResponse;
    
    if (!response.ok) return false;
    
    const data = await response.json<{ valid: boolean }>();
    return !!data.valid;
  } catch (error) {
    console.error('Error validating meeting:', error);
    return false;
  }
}

/**
 * Creates a meeting with enhanced security settings
 * Convenience method for creating maximum security rooms
 * @returns Promise<MeetingResponse>
 */
export async function createSecureMeeting(): Promise<MeetingResponse> {
  return createMeeting({
    securityLevel: SecurityLevel.MAXIMUM,
    e2eEncryption: true,
    allowRecording: false
  });
}

// Execute if this file is run directly
if (require.main === module) {
  createMeeting({
    securityLevel: SecurityLevel.ENHANCED,
    e2eEncryption: true
  }).then((result) => {
    if (result.error) {
      console.error('Meeting creation failed:', result.error);
      process.exit(1);
    } else {
      console.log('Meeting created successfully:', result.meeting);
      if (result.encryptionKey) {
        console.log('Encryption key:', result.encryptionKey);
      }
    }
  });
}
