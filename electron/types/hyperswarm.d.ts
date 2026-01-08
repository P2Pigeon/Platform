declare module '@hyperswarm/dht' {
  import { EventEmitter } from 'events';

  interface KeyPair {
    publicKey: Buffer;
    secretKey: Buffer;
  }

  interface DHTOptions {
    bootstrap?: string[];
    keyPair?: KeyPair;
  }

  interface Server extends EventEmitter {
    listen(keyPair: KeyPair): Promise<void>;
    close(): Promise<void>;
    address(): { host: string; port: number; publicKey: Buffer };
  }

  interface Socket extends EventEmitter {
    remotePublicKey: Buffer;
    write(data: string | Buffer): boolean;
    destroy(): void;
    end(): void;
  }

  interface Lookup extends EventEmitter {
    destroy(): void;
  }

  class DHT extends EventEmitter {
    constructor(options?: DHTOptions);
    
    static keyPair(seed?: Buffer): KeyPair;
    
    ready(): Promise<void>;
    destroy(): Promise<void>;
    
    createServer(onconnection?: (socket: Socket) => void): Server;
    connect(remotePublicKey: Buffer, options?: any): Socket;
    
    lookup(topic: Buffer): Lookup;
    announce(topic: Buffer, keyPair: KeyPair): Promise<void>;
    unannounce(topic: Buffer, keyPair: KeyPair): Promise<void>;
  }

  export = DHT;
}
