"use strict";
/**
 * @file shared/src/types/meeting.ts
 * @description Shared TypeScript types and interfaces for P2Pigeon meetings.
 * This file serves as the single source of truth for meeting-related data structures,
 * used by both the frontend and backend services to ensure consistency and type safety
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLevel = void 0;
var SecurityLevel;
(function (SecurityLevel) {
    SecurityLevel["STANDARD"] = "standard";
    SecurityLevel["ENHANCED"] = "enhanced";
    SecurityLevel["MAXIMUM"] = "maximum";
})(SecurityLevel || (exports.SecurityLevel = SecurityLevel = {}));
