/**
 * Type declarations for Hyperstack modules
 * These modules don't have official @types packages
 */

declare module 'hyperswarm' {
  import { EventEmitter } from 'events';
  
  interface HyperswarmOptions {
    keyPair?: { publicKey: Buffer; secretKey: Buffer };
    seed?: Buffer;
    maxPeers?: number;
    firewall?: (remotePublicKey: Buffer) => boolean;
  }
  
  interface PeerInfo {
    publicKey: Buffer;
    topics: Buffer[];
    prioritized: boolean;
  }
  
  class Hyperswarm extends EventEmitter {
    constructor(options?: HyperswarmOptions);
    join(topic: Buffer, options?: { server?: boolean; client?: boolean }): void;
    leave(topic: Buffer): Promise<void>;
    destroy(): Promise<void>;
    on(event: 'connection', listener: (socket: any, peerInfo: PeerInfo) => void): this;
    on(event: 'update', listener: () => void): this;
  }
  
  export = Hyperswarm;
}

declare module 'hypercore' {
  import { EventEmitter } from 'events';
  
  interface HypercoreOptions {
    key?: Buffer;
    keyPair?: { publicKey: Buffer; secretKey: Buffer };
    encryptionKey?: Buffer;
    sparse?: boolean;
    valueEncoding?: string;
  }
  
  class Hypercore extends EventEmitter {
    key: Buffer;
    discoveryKey: Buffer;
    writable: boolean;
    readable: boolean;
    length: number;
    
    constructor(storage: any, key?: Buffer | string, options?: HypercoreOptions);
    ready(): Promise<void>;
    append(data: any): Promise<number>;
    get(index: number): Promise<any>;
    close(): Promise<void>;
    replicate(isInitiator: boolean, options?: any): any;
  }
  
  export = Hypercore;
}

declare module 'hyperdrive' {
  import { EventEmitter } from 'events';
  
  interface HyperdriveOptions {
    key?: Buffer;
  }
  
  class Hyperdrive extends EventEmitter {
    key: Buffer;
    discoveryKey: Buffer;
    writable: boolean;
    version: number;
    
    constructor(store: any, key?: Buffer, options?: HyperdriveOptions);
    ready(): Promise<void>;
    put(path: string, data: Buffer): Promise<void>;
    get(path: string): Promise<Buffer | null>;
    del(path: string): Promise<void>;
    list(path?: string): AsyncIterable<{ key: string; value: any }>;
    entry(path: string): Promise<{ key: string; value: any } | null>;
    close(): Promise<void>;
    replicate(isInitiator: boolean, options?: any): any;
  }
  
  export = Hyperdrive;
}

declare module 'corestore' {
  import { EventEmitter } from 'events';
  
  class Corestore extends EventEmitter {
    constructor(storage: string | any, options?: any);
    get(options?: { key?: Buffer; name?: string }): any;
    close(): Promise<void>;
    ready(): Promise<void>;
  }
  
  export = Corestore;
}

declare module 'localdrive' {
  class Localdrive {
    constructor(path: string, options?: any);
    put(path: string, data: Buffer): Promise<void>;
    get(path: string): Promise<Buffer | null>;
    del(path: string): Promise<void>;
    list(path?: string): AsyncIterable<{ key: string }>;
    entry(path: string): Promise<{ key: string; value: any } | null>;
  }
  
  export = Localdrive;
}

declare module 'b4a' {
  export function from(data: string | Buffer | ArrayBuffer, encoding?: string): Buffer;
  export function toString(buf: Buffer, encoding?: string): string;
  export function alloc(size: number, fill?: number): Buffer;
  export function allocUnsafe(size: number): Buffer;
  export function concat(buffers: Buffer[]): Buffer;
  export function isBuffer(obj: any): obj is Buffer;
  export function equals(a: Buffer, b: Buffer): boolean;
  export function compare(a: Buffer, b: Buffer): number;
}
