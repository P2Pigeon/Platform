"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItem = getItem;
exports.setItem = setItem;
exports.removeItem = removeItem;
exports.clearSecureStorage = clearSecureStorage;
exports.createNamespace = createNamespace;
exports.signData = signData;
exports.verifySignature = verifySignature;
exports.signInWithPrivateKey = signInWithPrivateKey;
/**
 * Cryptographic Identity & Secure Storage Utilities (Shared)
 * Extracted from frontend/src/services/identity.ts and frontend/src/utils/secureStorage.ts
 */
const CryptoJS = __importStar(require("crypto-js"));
// ---- Secure Storage Helpers ----
function getItem(key, getCurrentIdentity, options) {
    try {
        const encryptedData = localStorage.getItem(`secure_${key}`);
        if (!encryptedData)
            return null;
        const encryptionKey = options?.encryptionKey || getCurrentIdentity().privateKey;
        const decryptedString = CryptoJS.AES.decrypt(encryptedData, encryptionKey).toString(CryptoJS.enc.Utf8);
        if (!decryptedString)
            return null;
        const storedItem = JSON.parse(decryptedString);
        if (storedItem.expiresAt && storedItem.expiresAt < Date.now()) {
            removeItem(key);
            return null;
        }
        return storedItem.data;
    }
    catch (error) {
        console.error(`Error retrieving secure storage item: ${key}`, error);
        return null;
    }
}
function setItem(key, data, getCurrentIdentity, options) {
    try {
        const encryptionKey = options?.encryptionKey || getCurrentIdentity().privateKey;
        const storedItem = {
            data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
            version: '1.0.0',
        };
        const stringified = JSON.stringify(storedItem);
        const encrypted = CryptoJS.AES.encrypt(stringified, encryptionKey).toString();
        localStorage.setItem(`secure_${key}`, encrypted);
    }
    catch (error) {
        console.error(`Error setting secure storage item: ${key}`, error);
    }
}
function removeItem(key) {
    try {
        localStorage.removeItem(`secure_${key}`);
    }
    catch (error) {
        console.error(`Error removing secure storage item: ${key}`, error);
    }
}
function clearSecureStorage() {
    try {
        Object.keys(localStorage)
            .filter((key) => key.startsWith('secure_'))
            .forEach((key) => localStorage.removeItem(key));
    }
    catch (error) {
        console.error('Error clearing secure storage', error);
    }
}
function createNamespace(namespace) {
    return {
        getItem: (key, getCurrentIdentity, options) => getItem(`${namespace}:${key}`, getCurrentIdentity, options),
        setItem: (key, data, getCurrentIdentity, options) => setItem(`${namespace}:${key}`, data, getCurrentIdentity, options),
        removeItem: (key) => removeItem(`${namespace}:${key}`),
    };
}
// ---- Crypto Helpers ----
function signData(data, privateKey) {
    // Simple HMAC-SHA256 signature for demonstration
    return CryptoJS.HmacSHA256(data, privateKey).toString();
}
function verifySignature(data, signature, publicKey) {
    // In a real implementation, use asymmetric crypto for verification
    // Here, we just hash the data+publicKey and compare for demonstration
    const expected = CryptoJS.HmacSHA256(data, publicKey).toString();
    return expected === signature;
}
function signInWithPrivateKey(privateKey) {
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    const id = publicKey;
    const identity = {
        id,
        publicKey,
        privateKey,
        createdAt: Date.now(),
    };
    localStorage.setItem('pigeon_secure_identity', JSON.stringify(identity));
    return identity;
}
