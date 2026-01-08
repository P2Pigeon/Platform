// Preload sodium-native to stabilize cold starts and avoid runtime errors

(() => {
  try {
    // Native require is safest for Electron preload context
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sodium = require('sodium-native');
    // Force initialization
    const buf = Buffer.alloc(sodium.crypto_secretbox_KEYBYTES);
    sodium.randombytes_buf(buf);
    console.log('[preload] sodium-native loaded and initialized');
  } catch (err) {
    console.warn('[preload] sodium-native not loaded or failed to initialize:', (err as any)?.message || err);
  }
})();

export {};

