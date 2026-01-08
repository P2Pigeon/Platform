/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * SDP Utilities for WebRTC Privacy
 * 
 * Provides functions to strip metadata from SDP (Session Description Protocol)
 * to enhance privacy by removing identifying information like IP addresses,
 * hostnames, and other potentially sensitive data.
 */

/**
 * Strips private IP addresses from SDP to prevent local network topology leakage
 * @param sdp The original SDP string
 * @returns The sanitized SDP string
 */
export function stripPrivateIPs(sdp: string): string {
  // Match private IPv4 ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
  const privateIPv4Regex = /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g;
  
  // Match link-local IPv6 addresses (fe80::)
  const linkLocalIPv6Regex = /\bfe80:[0-9a-fA-F:]+\b/gi;
  
  // Match local/private IPv6 (fd00::, fc00::)
  const privateIPv6Regex = /\b(fd|fc)[0-9a-fA-F]{2}:[0-9a-fA-F:]+\b/gi;

  return sdp
    .replace(privateIPv4Regex, '0.0.0.0')
    .replace(linkLocalIPv6Regex, '::')
    .replace(privateIPv6Regex, '::');
}

/**
 * Strips hostname information from SDP c= and o= lines
 * @param sdp The original SDP string
 * @returns The sanitized SDP string
 */
export function stripHostnames(sdp: string): string {
  // Replace hostname in o= line (origin)
  // Format: o=<username> <sess-id> <sess-version> <nettype> <addrtype> <unicast-address>
  const oLineRegex = /^(o=\S+\s+\S+\s+\S+\s+IN\s+IP[46]\s+)\S+/gm;
  
  return sdp.replace(oLineRegex, '$10.0.0.0');
}

/**
 * Removes mDNS candidates which can leak local hostnames
 * @param sdp The original SDP string
 * @returns The sanitized SDP string
 */
export function stripMdnsCandidates(sdp: string): string {
  // Match .local hostnames in ICE candidates
  const mdnsRegex = /a=candidate:[^\r\n]*\.local[^\r\n]*/g;
  
  return sdp.replace(mdnsRegex, '');
}

/**
 * Strips server reflexive (srflx) candidate addresses if privacy mode is enabled
 * This hides your public IP but may affect connectivity
 * @param sdp The original SDP string
 * @param stripPublicIP Whether to also strip public IP (srflx candidates)
 * @returns The sanitized SDP string
 */
export function stripReflexiveCandidates(sdp: string, stripPublicIP = false): string {
  if (!stripPublicIP) return sdp;
  
  // Remove server reflexive candidates (contain your public IP)
  const srflxRegex = /a=candidate:[^\r\n]*srflx[^\r\n]*\r?\n?/g;
  
  return sdp.replace(srflxRegex, '');
}

/**
 * Removes the session name which might contain identifying info
 * @param sdp The original SDP string
 * @returns The sanitized SDP string
 */
export function anonymizeSessionName(sdp: string): string {
  // Replace s= line with generic name
  const sLineRegex = /^s=.*/m;
  
  return sdp.replace(sLineRegex, 's=-');
}

/**
 * Full SDP sanitization for maximum privacy
 * @param sdp The original SDP string
 * @param options Sanitization options
 * @returns The sanitized SDP string
 */
export function sanitizeSDP(
  sdp: string,
  options: {
    stripPrivateIPs?: boolean;
    stripHostnames?: boolean;
    stripMdns?: boolean;
    stripPublicIP?: boolean;
    anonymizeSession?: boolean;
  } = {}
): string {
  const {
    stripPrivateIPs: doStripPrivateIPs = true,
    stripHostnames: doStripHostnames = true,
    stripMdns = true,
    stripPublicIP = false, // Disabled by default as it may break connectivity
    anonymizeSession = true
  } = options;

  let sanitized = sdp;

  if (doStripPrivateIPs) {
    sanitized = stripPrivateIPs(sanitized);
  }

  if (doStripHostnames) {
    sanitized = stripHostnames(sanitized);
  }

  if (stripMdns) {
    sanitized = stripMdnsCandidates(sanitized);
  }

  if (stripPublicIP) {
    sanitized = stripReflexiveCandidates(sanitized, true);
  }

  if (anonymizeSession) {
    sanitized = anonymizeSessionName(sanitized);
  }

  // Remove empty lines that might have been created
  sanitized = sanitized.replace(/\n\n+/g, '\n');

  return sanitized;
}

/**
 * Sanitizes an ICE candidate to remove private network information
 * @param candidate The RTCIceCandidate or RTCIceCandidateInit
 * @returns The sanitized candidate or null if it should be filtered out
 */
export function sanitizeIceCandidate(
  candidate: RTCIceCandidateInit | RTCIceCandidate
): RTCIceCandidateInit | null {
  if (!candidate.candidate) return null;

  const candidateStr = candidate.candidate;

  // Filter out mDNS candidates (.local hostnames)
  if (candidateStr.includes('.local')) {
    console.log('[Privacy] Filtered mDNS candidate');
    return null;
  }

  // Filter out host candidates with private IPs
  const privateIPv4Regex = /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/;
  
  if (candidateStr.includes('typ host') && privateIPv4Regex.test(candidateStr)) {
    console.log('[Privacy] Filtered private IP host candidate');
    return null;
  }

  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment
  };
}

export default {
  sanitizeSDP,
  sanitizeIceCandidate,
  stripPrivateIPs,
  stripHostnames,
  stripMdnsCandidates,
  stripReflexiveCandidates,
  anonymizeSessionName
};
