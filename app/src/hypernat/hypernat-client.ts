#!/usr/bin/env node

import 'dotenv/config';
import Keychain from 'keypear';
import DHT from '@hyperswarm/dht';
import pump from 'pump';
import net from 'net';
import udp from 'dgram';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { base58_to_binary } from 'base58-js';

// --- Type Definitions ---

/**
 * @interface CLIArgs
 * @description Defines the expected command-line arguments.
 */
interface CLIArgs {
  peer?: string;
  [key: string]: unknown;
}

/**
 * @interface ForwarderSchema
 * @description Defines the structure for a port forwarding configuration.
 */
interface ForwarderSchema {
  mode: 'client';
  proto: 'tcp' | 'udp';
  port: string;
  publicKey: string;
}

/**
 * @interface Relay
 * @description Defines the structure of the relay object with protocol-specific clients.
 */
interface Relay {
  tcp: { client: (publicKey: Buffer, port: number) => Promise<void> };
  udp: { client: (publicKey: Buffer, port: number) => Promise<void> };
}

// --- Main Logic ---

const argv: CLIArgs = yargs(hideBin(process.argv)).argv as CLIArgs;

const options: { schema: ForwarderSchema[] } = {
  schema: [
    {
      mode: 'client',
      proto: (process.env.PROTO as 'tcp' | 'udp') || 'tcp',
      port: process.env.PORT || '3000',
      publicKey: process.env.PEER || argv.peer || '',
    },
  ],
};

/**
 * Creates and returns a relay object for handling TCP and UDP client connections.
 * @returns {Promise<Relay>} A promise that resolves to the relay object.
 */
const relay = async (): Promise<Relay> => {
  const node = new DHT({});
  await node.ready();

  return {
    tcp: {
      client: async (publicKey: Buffer, port: number): Promise<void> => {
        const server = net.createServer({ allowHalfOpen: true }, (local) => {
          console.log(`Connecting to TCP peer on port ${port}`)
          const socket = node.connect(publicKey, { reusableSocket: true });
          pump(local, socket, local);
        });
        server.listen(port, '127.0.0.1');
        console.log(`Listening for local connections on TCP port ${port}`);
      },
    },
    udp: {
      client: async (publicKey: Buffer, port: number): Promise<void> => {
        console.log(`Connecting to UDP peer on port ${port}`);
        const conn = await node.connect(publicKey);
        await new Promise<void>((res) => conn.on('open', res));
        console.log('UDP connection established');

        const server = udp.createSocket('udp4');
        let inport: number | undefined;

        server.on('message', (buf, rinfo) => {
          if (!inport) {
            console.log('Setting inbound UDP port:', rinfo.port);
            inport = rinfo.port;
          }
          conn.rawStream.send(buf);
        });

        conn.rawStream.on('message', (buf: Buffer) => {
          if (inport) {
            server.send(buf, inport, '127.0.0.1');
          }
        });

        server.bind(port);
        console.log(`UDP stream ready, listening for packets on port ${port}`);
      },
    },
  };
};

const modes = {
  client: async (settings: ForwarderSchema): Promise<void> => {
    const { proto, port, publicKey } = settings;
    if (!publicKey) {
      throw new Error('Peer public key is required. Use --peer or PEER env var.');
    }
    const keys = new Keychain(base58_to_binary(publicKey));
    const key = keys.get(`${proto}${port}`).publicKey;
    const rel = await relay();
    await rel[proto].client(key, parseInt(port, 10));
  },
};

/**
 * Main execution function to start the HyperNAT client.
 */
const run = async (): Promise<void> => {
  console.log('\x1b[31;1mHyperNAT client starting...\x1b[0m');
  if (!options.schema[0].publicKey) {
    console.error('\x1b[31;1mError: Peer public key not provided. Exiting.\x1b[0m');
    process.exit(1);
  }
  console.log(`\x1b[32;1mPEER:\x1b[0m ${options.schema[0].publicKey}`);

  for (const forwarder of options.schema) {
    await modes[forwarder.mode](forwarder);
  }
};

run().catch((err) => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});

