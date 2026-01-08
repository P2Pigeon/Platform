export interface Identity {
    id: string;
    publicKey: string;
    privateKey: string;
    createdAt: number;
    displayName?: string;
    avatar?: string;
}
export interface PublicIdentity {
    id: string;
    publicKey: string;
    displayName?: string;
    avatar?: string;
}
export interface StoredItem<T> {
    data: T;
    createdAt: number;
    updatedAt: number;
    expiresAt?: number;
    version: string;
}
export interface StorageOptions {
    ttl?: number;
    encryptionKey?: string;
}
export declare function getItem<T>(key: string, getCurrentIdentity: () => Identity, options?: StorageOptions): T | null;
export declare function setItem<T>(key: string, data: T, getCurrentIdentity: () => Identity, options?: StorageOptions): void;
export declare function removeItem(key: string): void;
export declare function clearSecureStorage(): void;
export declare function createNamespace(namespace: string): {
    getItem: <T>(key: string, getCurrentIdentity: () => Identity, options?: StorageOptions) => T | null;
    setItem: <T>(key: string, data: T, getCurrentIdentity: () => Identity, options?: StorageOptions) => void;
    removeItem: (key: string) => void;
};
export declare function signData(data: string, privateKey: string): string;
export declare function verifySignature(data: string, signature: string, publicKey: string): boolean;
export declare function signInWithPrivateKey(privateKey: string): Identity;
//# sourceMappingURL=crypto.d.ts.map