#!/usr/bin/env node

import 'dotenv/config';
import crypto from 'crypto';
import Keychain from 'keypear';
import DHT, { KeyPair } from '@hyperswarm/dht';
import pump from 'pump';
import net from 'net';
import udp from 'dgram';
import { binary_to_base58 } from 'base58-js';
import * as configModule from '../config';
const config = (configModule as any).default;

// --- Type Definitions ---

/**
 * @interface ForwarderSchema
 * @description Defines the structure for a server-side port forwarding configuration.
 */
interface ForwarderSchema {
  mode: 'server';
  proto: 'tcp' | 'udp';
  port: string;
  host: string;
  secret: string;
}

/**
 * @interface Relay
 * @description Defines the structure of the relay object with protocol-specific servers.
 */
interface Relay {
  tcp: { server: (keyPair: any, port: number, host: string) => Promise<void> };
  udp: { server: (keyPair: any, port: number, host: string) => Promise<void> };
}

// --- Helper Functions ---

/**
 * Generates a random 32-byte hex string to be used as a secret.
 * @returns {string} A random 64-character hex string.
 */
function generateKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// --- Main Logic ---

const options: { schema: ForwarderSchema[] } = {
  schema: [
    {
      mode: 'server',
      proto: (process.env.PROTO as 'tcp' | 'udp') || 'tcp',
      port: process.env.PORT || '3000',
      host: process.env.HOST || '0.0.0.0',
      secret: process.env.SECRET || generateKey(),
    },
  ],
};

/**
 * Creates and returns a relay object for handling TCP and UDP server connections.
 * @returns {Promise<Relay>} A promise that resolves to the relay object.
 */
const relay = async (): Promise<Relay> => {
  const node = new DHT({ bootstrap: config.hypernat.bootstrap });
  await node.ready();

  return {
    tcp: {
      server: async (keyPair: any, port: number, host: string): Promise<void> => {
        const server = node.createServer({ reusableSocket: true });
        server.on('connection', (servsock: any) => {
          console.log(`New TCP connection, relaying to ${host}:${port}`);
          const socket = net.connect({ port, host, allowHalfOpen: true });
          pump(servsock, socket, servsock);
        });
        await server.listen(keyPair);
        console.log(`HyperNAT TCP server listening on port ${port}`);
      },
    },
    udp: {
      server: async (keyPair: any, port: number, host: string): Promise<void> => {
        const server = node.createServer();
        server.on('connection', (conn: any) => {
          console.log(`New UDP connection, relaying to ${host}:${port}`);
          const client = udp.createSocket('udp4');
          client.connect(port, host);
          client.on('message', (buf) => {
            conn.rawStream.send(buf);
          });
          conn.rawStream.on('message', (buf: Buffer) => {
            client.send(buf);
          });
        });
        await server.listen(keyPair);
        console.log(`HyperNAT UDP server listening on port ${port}`);
      },
    },
  };
};

const modes = {
  server: async (settings: ForwarderSchema): Promise<void> => {
    const { proto, port, host, secret } = settings;
    const hash = DHT.hash(Buffer.from(secret));
    const kp = DHT.keyPair(hash);
    console.log(`\x1b[32;1mYOUR PUBLIC KEY FOR THIS SESSION:\x1b[0m ${binary_to_base58(kp.publicKey)}`);
    
    const rel = await relay();
    const keys = new Keychain(kp);
    const keyPair = keys.get(proto + port);
    
    await rel[proto].server(keyPair, parseInt(port, 10), host);
  },
};

/**
 * Main execution function to start the HyperNAT server.
 */
export const startHypernatServer = async (): Promise<void> => {
  console.log('\x1b[31;1mHyperNAT server starting...\x1b[0m');
  try {
    for (const forwarder of options.schema) {
      await modes[forwarder.mode](forwarder);
    }
  } catch (err) {
    console.error('An unexpected error occurred in HyperNAT server:', err);
    process.exit(1);
  }
};

