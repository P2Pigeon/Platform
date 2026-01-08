/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const content = type === 'privacy' ? (
    <>
      <h2 className="text-2xl font-bold text-white mb-6">Privacy Policy</h2>
      <p className="text-gray-400 text-sm mb-4">Last Updated: January 2026</p>
      
      <div className="space-y-6 text-gray-300">
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">1. Introduction</h3>
          <p className="leading-relaxed">
            P2Pigeon is designed with privacy as a foundational principle. This Privacy Policy explains 
            how our zero knowledge architecture ensures your communications remain private and under 
            your exclusive control.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">2. Data We Do Not Collect</h3>
          <p className="leading-relaxed mb-3">
            Due to our peer to peer architecture and client side encryption, P2Pigeon does not have 
            access to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Message content or metadata</li>
            <li>Video or audio call data</li>
            <li>Files shared in data rooms</li>
            <li>Your private cryptographic keys</li>
            <li>Contact lists or communication patterns</li>
            <li>IP addresses or location data</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">3. Cryptographic Architecture</h3>
          <p className="leading-relaxed">
            All encryption and decryption operations occur exclusively on your device. Your private 
            keys are generated locally and never transmitted. We implement AES 256 GCM encryption, 
            ED25519 digital signatures, and X25519 key agreement protocols.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">4. Peer to Peer Communications</h3>
          <p className="leading-relaxed">
            P2Pigeon establishes direct connections between users. Communications traverse the network 
            in encrypted form. No central server stores or processes your data. Infrastructure 
            operators possess no capability to access communication content.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">5. Local Storage</h3>
          <p className="leading-relaxed">
            Any data stored locally on your device, including keys and message history, remains under 
            your control. You may delete this data at any time through your browser or device settings.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">6. Third Party Services</h3>
          <p className="leading-relaxed">
            P2Pigeon may utilize Nostr relays for message delivery when direct peer connections are 
            unavailable. Messages transmitted through relays remain encrypted and indecipherable to 
            relay operators.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">7. Open Source Verification</h3>
          <p className="leading-relaxed">
            P2Pigeon is open source software. You may audit our codebase to verify our privacy claims. 
            Security researchers are encouraged to review and report any concerns.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">8. Contact</h3>
          <p className="leading-relaxed">
            For privacy related inquiries, please open an issue on our GitHub repository or contact 
            us through secure channels documented in our source code.
          </p>
        </section>
      </div>
    </>
  ) : (
    <>
      <h2 className="text-2xl font-bold text-white mb-6">Terms of Service</h2>
      <p className="text-gray-400 text-sm mb-4">Last Updated: January 2026</p>
      
      <div className="space-y-6 text-gray-300">
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h3>
          <p className="leading-relaxed">
            By accessing or using P2Pigeon, you agree to be bound by these Terms of Service. If you 
            do not agree to these terms, do not use the service.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">2. Description of Service</h3>
          <p className="leading-relaxed">
            P2Pigeon provides encrypted peer to peer communications infrastructure including messaging, 
            video conferencing, and file sharing capabilities. The service operates on a zero knowledge 
            basis where operators have no access to user content.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">3. User Responsibilities</h3>
          <p className="leading-relaxed mb-3">You are responsible for:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Maintaining the security of your cryptographic keys</li>
            <li>All activities conducted under your identity</li>
            <li>Ensuring your use complies with applicable laws</li>
            <li>Backing up your keys and data as appropriate</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">4. Prohibited Uses</h3>
          <p className="leading-relaxed mb-3">You may not use P2Pigeon to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Distribute malware or conduct cyberattacks</li>
            <li>Harass, threaten, or harm others</li>
            <li>Exploit minors in any manner</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">5. Key Management</h3>
          <p className="leading-relaxed">
            You are solely responsible for your cryptographic keys. P2Pigeon cannot recover lost keys 
            or decrypt your data. Loss of your private key results in permanent loss of access to 
            encrypted content.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">6. No Warranty</h3>
          <p className="leading-relaxed">
            P2Pigeon is provided "as is" without warranties of any kind, express or implied. We do 
            not guarantee uninterrupted or error free operation. Use at your own risk.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">7. Limitation of Liability</h3>
          <p className="leading-relaxed">
            To the maximum extent permitted by law, P2Pigeon and its contributors shall not be liable 
            for any indirect, incidental, special, consequential, or punitive damages arising from 
            your use of the service.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">8. Open Source License</h3>
          <p className="leading-relaxed">
            P2Pigeon is open source software released under applicable open source licenses. Your use 
            of the source code is governed by those licenses in addition to these Terms of Service.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">9. Modifications</h3>
          <p className="leading-relaxed">
            We reserve the right to modify these terms at any time. Continued use of P2Pigeon 
            following any changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">10. Governing Law</h3>
          <p className="leading-relaxed">
            These terms shall be governed by and construed in accordance with applicable laws, 
            without regard to conflict of law principles.
          </p>
        </section>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#12121a] rounded-2xl overflow-hidden">
        <div className="sticky top-0 flex items-center justify-between p-6 bg-[#12121a] border-b border-white/5">
          <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">
            {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {content}
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
