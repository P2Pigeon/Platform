# P2Pigeon 🕊️

**Secure Peer-to-Peer Communications Platform**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-333333?logo=webrtc&logoColor=white)](https://webrtc.org/)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

[![Security](https://img.shields.io/badge/Security-E2E_Encrypted-00C853?logo=shield&logoColor=white)]()
[![Architecture](https://img.shields.io/badge/Architecture-Zero_Knowledge-7C3AED)]()
[![Protocol](https://img.shields.io/badge/Protocol-Hyperswarm_DHT-FF6B6B)]()
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-00BCD4)]()
[![Signatures](https://img.shields.io/badge/Signatures-ED25519-4CAF50)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

> Enterprise grade encrypted peer-to-peer communications with zero-knowledge architecture. No servers store your data. No intermediaries access your keys. Complete operational security.

---

## Executive Summary

P2Pigeon is a decentralized communications platform designed for organizations requiring the highest levels of security and privacy. Unlike traditional video conferencing solutions that route all traffic through centralized servers, P2Pigeon establishes direct encrypted connections between participants.

**Key Differentiators:**
- **Zero-Knowledge Architecture** — Encryption keys never leave user devices
- **Serverless Operation** — No infrastructure to compromise or subpoena
- **Metadata Protection** — IP addresses, network topology, and timing information are stripped
- **Censorship Resistant** — Distributed hash table discovery prevents blocking
- **Open Source** — Full audit capability, no hidden backdoors

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           P2PIGEON SYSTEM ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                            PRESENTATION LAYER                                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │  Video UI   │  │  Chat UI    │  │ Data Room   │  │  Contacts   │          │   │
│  │  │  (RoomPage) │  │  (Nostr)    │  │  (Files)    │  │  (ED25519)  │          │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │   │
│  └─────────┼────────────────┼────────────────┼────────────────┼─────────────────┘   │
│            │                │                │                │                     │
│  ┌─────────▼────────────────▼────────────────▼────────────────▼─────────────────┐   │
│  │                          PROTOCOL ABSTRACTION LAYER                          │   │
│  │                                                                              │   │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                        ProtocolManager.ts                             │   │   │
│  │  │  • Unified API for all communication protocols                        │   │   │
│  │  │  • Automatic protocol negotiation and fallback                        │   │   │
│  │  │  • Event normalization across protocol adapters                       │   │   │
│  │  └───────────────────────────────────────────────────────────────────────┘   │   │ 
│  │                                    │                                         │   │
│  │           ┌────────────────────────┼────────────────────────┐                │   │
│  │           ▼                        ▼                        ▼                │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │   │
│  │  │ WebRTCAdapter   │    │ServerlessMesh   │    │  NostrAdapter   │           │   │
│  │  │                 │    │    Adapter      │    │                 │           │   │
│  │  │ • ICE/STUN/TURN │    │ • DHT Discovery │    │ • Relay-based   │           │   │
│  │  │ • DTLS-SRTP     │    │ • Mesh Topology │    │ • NIP-04 E2E    │           │   │
│  │  │ • DataChannel   │    │ • VAD Routing   │    │ • Persistence   │           │   │
│  │  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘           │   │
│  └───────────┼──────────────────────┼──────────────────────┼────────────────────┘   │
│              │                      │                      │                        │
│  ┌───────────▼──────────────────────▼──────────────────────▼────────────────────┐   │
│  │                           TRANSPORT LAYER                                    │   │
│  │                                                                              │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │   │
│  │  │    WebRTC       │    │   Hyperswarm    │    │  Nostr Relays   │           │   │
│  │  │                 │    │      DHT        │    │                 │           │   │
│  │  │ • P2P Media     │    │ • Distributed   │    │ • Decentralized │           │   │
│  │  │ • NAT Traversal │    │ • Serverless    │    │ • Redundant     │           │   │
│  │  │ • Encrypted     │    │ • Holepunching  │    │ • Censorship-   │           │   │
│  │  │                 │    │                 │    │   Resistant     │           │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘           │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                           SECURITY LAYER                                     │   │
│  │                                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │  AES-256-GCM │  │   X25519     │  │   ED25519    │  │    BLAKE3    │      │   │
│  │  │  Symmetric   │  │   Key        │  │   Digital    │  │    Hashing   │      │   │
│  │  │  Encryption  │  │   Exchange   │  │   Signatures │  │              │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  │                                                                              │   │
│  │  ┌────────────────────────────────────────────────────────────────────────┐  │   │
│  │  │                     Metadata Protection                                │  │   │
│  │  │  • SDP Sanitization (removes private IPs, MACs, hardware IDs)          │  │   │
│  │  │  • ICE Candidate Filtering (strips host candidates, mDNS)              │  │   │
│  │  │  • Timing Attack Mitigation (randomized delays)                        │  │   │
│  │  └────────────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Communication Modes

### Mode 1: Serverless Mesh (Experimental)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVERLESS MESH TOPOLOGY                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           ┌─────┐                           ┌─────┐             │
│           │  A  │◄─────── WebRTC ──────────►│  B  │             │
│           └──┬──┘         (E2E)             └──┬──┘             │
│              │                                 │                │
│              │         Hyperswarm DHT          │                │
│              │      ┌───────────────┐          │                │
│              └─────►│   Discovery   │◄─────────┘                │
│                     │   (No Server) │                           │
│              ┌─────►│               │◄─────────┐                │
│              │      └───────────────┘          │                │
│              │                                 │                │
│           ┌──┴──┐                           ┌──┴──┐             │
│           │  C  │◄─────── WebRTC ──────────►│  D  │             │
│           └─────┘         (E2E)             └─────┘             │
│                                                                 │
│              ✓ Zero infrastructure cost                         │
│              ✓ Infinite horizontal scale                        │
│              ✓ No single point of failure                       │
│              ✓ Censorship resistant                             │
│              ✓ 100+ participant support                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
| Attribute | Value |
|-----------|-------|
| Discovery | Hyperswarm DHT (Kademlia-based) |
| Signaling | Encrypted P2P via DHT |
| Media | WebRTC DTLS-SRTP |
| Topology | Full mesh (≤8), Selective forwarding (>8) |
| Max Participants | 100+ |
| Server Dependency | None (DHT relay for browser compat only) |

### Mode 2: WebRTC Classic 

Traditional WebRTC with signaling server. Used when:
- Corporate firewalls block DHT traffic
- Legacy browser compatibility required
- Small team deployments (≤8 participants)

---

## Security Model

### Cryptographic Primitives

| Layer | Algorithm | Purpose | Key Size |
|-------|-----------|---------|----------|
| **Symmetric Encryption** | AES-256-GCM | Message/file encryption | 256-bit |
| **Key Exchange** | X25519 | ECDH key agreement | 256-bit |
| **Digital Signatures** | ED25519 | Identity verification | 256-bit |
| **Hashing** | BLAKE3 | Integrity verification | 256-bit |
| **Channel Security** | Noise Protocol (XX) | Perfect forward secrecy | Per-session |
| **Media Encryption** | DTLS-SRTP | WebRTC media streams | Per-stream |

### Threat Model

**Mitigated Threats:**

| Threat | Mitigation |
|--------|------------|
| Passive surveillance (ISP/State) | E2E encryption, no plaintext transit |
| MITM attacks | ED25519 identity verification, certificate pinning |
| Server compromise | Zero-knowledge architecture, no server-side keys |
| Metadata correlation | IP stripping, timing randomization |
| Replay attacks | Timestamps, nonces, sequence numbers |
| Traffic analysis | Padding, constant-rate options |

**Out of Scope:**

| Threat | Reason |
|--------|--------|
| Endpoint compromise | Requires device-level security |
| Participant recording | Social/policy problem, not technical |


### Metadata Protection

```typescript
// SDP Sanitization
sanitizeSDP(sdp) → removes:
  ├── Private IP addresses (RFC 1918)
  ├── MAC addresses
  ├── Hardware identifiers
  ├── Network topology hints
  └── Browser fingerprinting data

// ICE Candidate Filtering  
sanitizeIceCandidate(candidate) → removes:
  ├── Host candidates (local IPs)
  ├── mDNS candidates
  └── Relay server identifiers
```

---

## Technical Specifications

### Video Quality Tiers

Voice Activity Detection (VAD) automatically allocates bandwidth:

| Role | Resolution | Codec | Bitrate | Trigger |
|------|------------|-------|---------|---------|
| Primary Speaker | 1080p60 | AV1/VP9 | 8 Mbps | Active speech |
| Recent Speakers | 720p30 | VP9 | 2.5 Mbps | Speech in last 10s |
| Gallery View | 480p30 | VP8 | 1 Mbps | Visible in grid |
| Thumbnails | 240p15 | VP8 | 300 kbps | Minimized |

### Network Requirements

| Metric | Minimum | Recommended |
|--------|---------|-------------|
| Bandwidth (per stream) | 1 Mbps | 8 Mbps |
| Latency | <300ms | <100ms |
| Packet Loss | <5% | <1% |
| Ports | UDP 10000-60000 | Same |

---

## Project Structure

```
pigeon/
├── app/                          # Backend services
│   ├── src/
│   │   ├── server.ts             # Express signaling server
│   │   ├── hypernat/             # DHT relay for browsers
│   │   ├── dataroom/             # Hyperdrive file manager
│   │   └── sfu/                  # Optional SFU for large groups
│   └── package.json
│
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── services/
│   │   │   ├── protocols/
│   │   │   │   ├── WebRTCAdapter.ts         # WebRTC implementation
│   │   │   │   ├── ServerlessVideoMesh.ts   # P2P mesh engine
│   │   │   │   ├── HyperswarmSignaling.ts   # DHT signaling
│   │   │   │   └── sdpUtils.ts              # Privacy utilities
│   │   │   └── ProtocolManager.ts           # Protocol abstraction
│   │   ├── context/
│   │   │   └── CommunicationContext.tsx     # Global state
│   │   ├── pages/
│   │   │   ├── RoomPage.tsx                 # Video conferencing
│   │   │   ├── DashboardPage.tsx            # Main dashboard
│   │   │   ├── NostrChatPage.tsx            # Decentralized chat
│   │   │   └── DataRoom.tsx                 # Secure file sharing
│   │   └── components/
│   │       ├── video/                       # Video components
│   │       ├── chat/                        # Chat components
│   │       └── whiteboard/                  # Collaboration tools
│   └── package.json
│
└── docs/                         # Documentation
```

---

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+

### Installation

```bash
# Clone repository
git clone https://github.com/ArqonAi/pigeon.git
cd pigeon

# Install dependencies
pnpm install

# Start backend (signaling + DHT relay)
cd app && pnpm dev

# Start frontend (separate terminal)
cd frontend && pnpm dev

# Access application
open http://localhost:5173
```

### Environment Configuration

```bash
# frontend/.env
VITE_SIGNALING_URL=http://localhost:3060
VITE_DHT_RELAY_URL=ws://localhost:3051

# app/.env
PORT=3060
DHT_RELAY_PORT=3051
```

---

## Deployment

### Production Build

```bash
# Build frontend
cd frontend && pnpm build

# Build backend
cd app && pnpm build
```

### Docker Deployment

```bash
docker-compose up -d
```

### Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 2 GB | 8 GB |
| Storage | 10 GB | 100 GB |
| Network | 100 Mbps | 1 Gbps |

---

## API Reference

### Protocol Manager

```typescript
// Initialize
const protocolManager = new ProtocolManager();
await protocolManager.initialize(configs);

// Join room
const room = await protocolManager.joinRoom(roomId, protocol);

// Media control
await protocolManager.startLocalStream(audioDeviceId, videoDeviceId);
protocolManager.stopLocalStream();

// Messaging
await protocolManager.sendMessage(roomId, content);

// Host controls
protocolManager.muteParticipant(peerId, muted);
protocolManager.kickParticipant(peerId);
```

### Events

```typescript
protocolManager.on('onPeerConnect', (peer) => { });
protocolManager.on('onPeerDisconnect', (peerId) => { });
protocolManager.on('onMessageReceived', (message) => { });
protocolManager.on('onRemoteStreamAdded', (peerId, stream) => { });
```

---

## Contributing

We welcome contributions. Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- Comprehensive test coverage
- Documentation for public APIs

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:
- ✅ You can use, modify, and distribute this software
- ✅ You can use it for commercial purposes
- ⚠️ If you modify and deploy as a network service, you **must** release your source code
- ⚠️ Derivative works must use the same license

See [LICENSE](LICENSE) for the full text.

### Why AGPL-3.0?

P2Pigeon is a privacy-focused platform. We chose AGPL-3.0 to ensure:
1. **Transparency** — Anyone running a P2Pigeon service must share their modifications
2. **Trust** — Users can verify no backdoors exist in their service provider's version
3. **Community** — Improvements benefit everyone, not just proprietary forks

---

## Acknowledgments

Built on:
- [Hyperswarm](https://github.com/holepunchto/hyperswarm) — Distributed networking
- [Hyperdrive](https://github.com/holepunchto/hyperdrive) — P2P file system
- [Nostr](https://github.com/nostr-protocol/nostr) — Decentralized messaging protocol
- [WebRTC](https://webrtc.org/) — Real-time communication
- [React](https://reactjs.org/) — UI framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling

---

<div align="center">

**P2Pigeon** — Communication without compromise. 🕊️

[Website](https://pigeon.cx) · 
[Issues](https://github.com/p2pigeon/platform/issues)

</div>
