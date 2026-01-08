/**
 * @file shared/src/types/meeting.ts
 * @description Shared TypeScript types and interfaces for P2Pigeon meetings.
 * This file serves as the single source of truth for meeting-related data structures,
 * used by both the frontend and backend services to ensure consistency and type safety
 */
export declare enum SecurityLevel {
    STANDARD = "standard",
    ENHANCED = "enhanced",
    MAXIMUM = "maximum"
}
export interface SecurityConfig {
    level: SecurityLevel;
    e2eEnabled: boolean;
    verificationRequired: boolean;
    customSettings?: Record<string, unknown>;
}
export interface MeetingResponse {
    meeting: string;
    error?: string;
    status?: number;
    encryptionKey?: string;
    security?: SecurityConfig;
    createdAt?: string;
    expiresAt?: string;
    transactionId?: string;
}
export interface MeetingRequestOptions {
}
//# sourceMappingURL=meeting.d.ts.map