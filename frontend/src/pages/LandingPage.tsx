/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

import React, { useState } from 'react';
import { Shield, Key, Zap, Globe, Github, MessageCircle, Video, Database, ArrowRight, Lock, Eye, Server, Fingerprint, Radio } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import LegalModal from '../components/LegalModal';
import { Button } from '../components/ui/button';

const LandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({ isOpen: false, type: 'privacy' });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const openLegalModal = (type: 'privacy' | 'terms') => {
    setLegalModal({ isOpen: true, type });
  };

  const capabilities = [
    { 
      icon: MessageCircle, 
      title: 'Encrypted Messaging', 
      description: 'Cryptographically secured communications with forward secrecy. Messages are indecipherable without possession of private keys.' 
    },
    { 
      icon: Video, 
      title: 'Secure Video Conferencing', 
      description: 'Direct peer connections eliminate intermediary exposure. No central infrastructure to compromise or surveil.' 
    },
    { 
      icon: Database, 
      title: 'Classified Data Rooms', 
      description: 'Compartmentalized file sharing with cryptographic access controls. Maintain strict need to know protocols.' 
    },
  ];

  const securityFeatures = [
    { 
      icon: Shield, 
      title: 'Zero Trust Architecture', 
      description: 'Every component operates under the assumption of a compromised environment. Trust is established cryptographically, never assumed.' 
    },
    { 
      icon: Key, 
      title: 'Sovereign Key Management', 
      description: 'Cryptographic keys remain under exclusive user control. No third party custody eliminates single points of compromise.' 
    },
    { 
      icon: Eye, 
      title: 'Zero Knowledge Design', 
      description: 'Infrastructure operators possess no capability to access, decrypt, or analyze communications content or metadata.' 
    },
    { 
      icon: Server, 
      title: 'Serverless Operations', 
      description: 'Distributed architecture eliminates central servers as attack vectors. No infrastructure to subpoena or seize.' 
    },
  ];

  const protocols = [
    { icon: Lock, label: 'AES 256 GCM' },
    { icon: Fingerprint, label: 'ED25519' },
    { icon: Radio, label: 'Noise Protocol' },
    { icon: Globe, label: 'Nostr Native' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/90">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🕊️</span>
            <span className="text-xl font-semibold text-white tracking-tight">P2Pigeon</span>
          </div>
          <Button onClick={handleOpenModal}>
            Access Platform <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px]" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 mb-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-gray-400">Operational Security Grade Infrastructure</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            <span className="text-white">Secure Communications</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Without Intermediaries
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Enterprise grade encrypted peer to peer communications platform. 
            Zero knowledge architecture ensures complete operational security 
            with no central points of failure or compromise.
          </p>
          
          <Button onClick={handleOpenModal} size="lg">
            Initialize Secure Session <ArrowRight className="w-5 h-5" />
          </Button>

          {/* Protocol indicators */}
          <div className="mt-20 flex flex-wrap items-center justify-center gap-6">
            {protocols.map((protocol) => (
              <div key={protocol.label} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5">
                <protocol.icon className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400 font-medium">{protocol.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Architecture */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-sm font-medium text-violet-400 tracking-wider uppercase">Security Architecture</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              Designed for Adversarial Environments
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built on cryptographic primitives proven in high assurance applications. 
              No security through obscurity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, i) => (
              <div 
                key={feature.title} 
                className="p-8 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-sm font-medium text-cyan-400 tracking-wider uppercase">Platform Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              Complete Communications Suite
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Integrated secure communications tools designed for organizations 
              requiring the highest levels of confidentiality.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {capabilities.map((cap, i) => (
              <div 
                key={cap.title} 
                className="p-10 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-300 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 mx-auto mb-8 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <cap.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{cap.title}</h3>
                <p className="text-gray-400 leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="p-12 md:p-16 rounded-lg bg-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px]" />
            <div className="relative z-10 max-w-3xl">
              <span className="text-sm font-medium text-violet-400 tracking-wider uppercase">Technical Foundation</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-6">
                Cryptographic Assurance at Every Layer
              </h2>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                P2Pigeon implements the Noise Protocol Framework for secure channel establishment, 
                combined with Nostr protocol for decentralized message relay. All cryptographic 
                operations execute client side. Private keys never traverse the network.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium">AES 256 GCM Encryption</span>
                <span className="px-4 py-2 rounded-lg bg-violet-500/10 text-violet-400 text-sm font-medium">ED25519 Digital Signatures</span>
                <span className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm font-medium">X25519 Key Agreement</span>
                <span className="px-4 py-2 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-sm font-medium">BLAKE3 Hashing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Establish Secure Communications
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Deploy in minutes. No infrastructure required. Your cryptographic 
            keys are generated locally and remain under your exclusive control.
          </p>
          <Button onClick={handleOpenModal} size="lg">
            Generate Key Pair
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} P2Pigeon. Open Source.
            </p>
            <div className="flex items-center gap-6">
              <Button onClick={() => openLegalModal('privacy')} variant="ghost" size="sm" className="text-gray-600 hover:text-gray-400">
                Privacy Policy
              </Button>
              <Button onClick={() => openLegalModal('terms')} variant="ghost" size="sm" className="text-gray-600 hover:text-gray-400">
                Terms of Service
              </Button>
              <a 
                href="https://github.com/p2pigeon" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-2 text-sm"
              >
                <Github className="w-4 h-4" /> Source Code
              </a>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} mode="signup" />
      <LegalModal 
        isOpen={legalModal.isOpen} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })} 
        type={legalModal.type} 
      />
    </div>
  );
};

export default LandingPage;
