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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HyperswarmNative = void 0;
/**
 * Native Hyperswarm Service for Electron
 *
 * Provides direct DHT connections for true P2P communication
 * without relying on signaling servers.
 */
const dht_1 = __importDefault(require("@hyperswarm/dht"));
const events_1 = require("events");
const crypto = __importStar(require("crypto"));
class HyperswarmNative extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.rooms = new Map();
        this.isConnected = false;
        // Generate or use provided keypair
        this.keyPair = config?.keyPair || dht_1.default.keyPair();
        // Initialize DHT
        this.dht = new dht_1.default({
            bootstrap: config?.bootstrap,
            keyPair: this.keyPair
        });
    }
    /**
     * Get the public key as hex string
     */
    getPublicKey() {
        return this.keyPair.publicKey.toString('hex');
    }
    /**
     * Get the public key as buffer
     */
    getPublicKeyBuffer() {
        return this.keyPair.publicKey;
    }
    /**
     * Connect to the DHT network
     */
    async connect() {
        if (this.isConnected)
            return;
        await this.dht.ready();
        this.isConnected = true;
        this.emit('connected', this.getPublicKey());
        console.log('Hyperswarm DHT connected:', this.getPublicKey());
    }
    /**
     * Disconnect from the DHT network
     */
    async disconnect() {
        if (!this.isConnected)
            return;
        // Close all rooms
        for (const [roomId, room] of this.rooms) {
            await this.leaveRoom(roomId);
        }
        await this.dht.destroy();
        this.isConnected = false;
        this.emit('disconnected');
        console.log('Hyperswarm DHT disconnected');
    }
    /**
     * Create a room topic from a room ID
     */
    createTopic(roomId) {
        return crypto.createHash('sha256').update(roomId).digest();
    }
    /**
     * Create and announce a room
     */
    async createRoom(roomId) {
        if (this.rooms.has(roomId)) {
            return this.rooms.get(roomId);
        }
        const topic = this.createTopic(roomId);
        // Create a server that listens for connections on this topic
        const server = this.dht.createServer((socket) => {
            this.handleIncomingConnection(roomId, socket);
        });
        await server.listen(this.keyPair);
        // Announce to the topic
        await this.dht.announce(topic, this.keyPair);
        const room = {
            id: roomId,
            topic,
            peers: new Map(),
            server
        };
        this.rooms.set(roomId, room);
        this.emit('roomCreated', room);
        console.log('Room created:', roomId);
        return room;
    }
    /**
     * Join an existing room by connecting to peers
     */
    async joinRoom(roomId) {
        if (this.rooms.has(roomId)) {
            return this.rooms.get(roomId);
        }
        const topic = this.createTopic(roomId);
        const room = {
            id: roomId,
            topic,
            peers: new Map(),
            server: null
        };
        this.rooms.set(roomId, room);
        // Look up peers on this topic
        const lookup = this.dht.lookup(topic);
        lookup.on('peer', async (peer) => {
            try {
                const socket = this.dht.connect(peer.publicKey);
                await this.handleOutgoingConnection(roomId, socket, peer.publicKey);
            }
            catch (error) {
                console.error('Failed to connect to peer:', error);
            }
        });
        this.emit('roomJoined', room);
        console.log('Joined room:', roomId);
        return room;
    }
    /**
     * Leave a room
     */
    async leaveRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        // Close all peer connections
        for (const [peerId, peer] of room.peers) {
            peer.socket.destroy();
        }
        room.peers.clear();
        // Close server if we created one
        if (room.server) {
            await room.server.close();
        }
        // Unannounce from topic
        await this.dht.unannounce(room.topic, this.keyPair);
        this.rooms.delete(roomId);
        this.emit('roomLeft', roomId);
        console.log('Left room:', roomId);
    }
    /**
     * Handle incoming peer connection
     */
    handleIncomingConnection(roomId, socket) {
        const room = this.rooms.get(roomId);
        if (!room) {
            socket.destroy();
            return;
        }
        const remotePublicKey = socket.remotePublicKey;
        const peerId = remotePublicKey.toString('hex');
        const peer = {
            id: peerId,
            publicKey: this.keyPair.publicKey,
            remotePublicKey,
            socket,
            isInitiator: false
        };
        room.peers.set(peerId, peer);
        this.setupSocketHandlers(roomId, peer);
        this.emit('peerConnected', roomId, peer);
        console.log('Peer connected (incoming):', peerId.substring(0, 16));
    }
    /**
     * Handle outgoing peer connection
     */
    async handleOutgoingConnection(roomId, socket, remotePublicKey) {
        const room = this.rooms.get(roomId);
        if (!room) {
            socket.destroy();
            return;
        }
        const peerId = remotePublicKey.toString('hex');
        // Don't connect to ourselves
        if (peerId === this.getPublicKey())
            return;
        // Don't duplicate connections
        if (room.peers.has(peerId))
            return;
        const peer = {
            id: peerId,
            publicKey: this.keyPair.publicKey,
            remotePublicKey,
            socket,
            isInitiator: true
        };
        room.peers.set(peerId, peer);
        this.setupSocketHandlers(roomId, peer);
        this.emit('peerConnected', roomId, peer);
        console.log('Peer connected (outgoing):', peerId.substring(0, 16));
    }
    /**
     * Setup socket event handlers for a peer
     */
    setupSocketHandlers(roomId, peer) {
        const socket = peer.socket;
        socket.on('data', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.emit('message', roomId, peer.id, message);
            }
            catch {
                // Binary data
                this.emit('data', roomId, peer.id, data);
            }
        });
        socket.on('close', () => {
            const room = this.rooms.get(roomId);
            if (room) {
                room.peers.delete(peer.id);
            }
            this.emit('peerDisconnected', roomId, peer.id);
            console.log('Peer disconnected:', peer.id.substring(0, 16));
        });
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.emit('peerError', roomId, peer.id, error);
        });
    }
    /**
     * Send a message to all peers in a room
     */
    broadcast(roomId, message) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        for (const peer of room.peers.values()) {
            try {
                peer.socket.write(data);
            }
            catch (error) {
                console.error('Failed to send to peer:', peer.id.substring(0, 16));
            }
        }
    }
    /**
     * Send a message to a specific peer
     */
    sendToPeer(roomId, peerId, message) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const peer = room.peers.get(peerId);
        if (!peer)
            return;
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        peer.socket.write(data);
    }
    /**
     * Send binary data to a specific peer
     */
    sendDataToPeer(roomId, peerId, data) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const peer = room.peers.get(peerId);
        if (!peer)
            return;
        peer.socket.write(data);
    }
    /**
     * Get all peers in a room
     */
    getPeers(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return [];
        return Array.from(room.peers.values());
    }
    /**
     * Get all rooms
     */
    getRooms() {
        return Array.from(this.rooms.values());
    }
    /**
     * Check if connected to DHT
     */
    isReady() {
        return this.isConnected;
    }
}
exports.HyperswarmNative = HyperswarmNative;
exports.default = HyperswarmNative;
