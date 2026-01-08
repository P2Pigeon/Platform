"use strict";
// Example shared utility
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUsername = isValidUsername;
function isValidUsername(username) {
    return /^[a-zA-Z0-9_]{3,32}$/.test(username);
}
