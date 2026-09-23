const Cryptr = require("cryptr");

// Dedicated encryption for payment-processor credentials (Stripe secret keys, etc).
// Separate from the existing `new Cryptr("secretKey")` instances used elsewhere
// in this codebase for encrypting ids in links — those are a different, lower-
// sensitivity use case and are left untouched here to avoid invalidating any
// links already issued with that passphrase.
const ENCRYPTION_SECRET = process.env.PAYMENT_ENCRYPTION_KEY;
const cryptr = ENCRYPTION_SECRET ? new Cryptr(ENCRYPTION_SECRET) : null;

const ENCRYPTED_PREFIX = "enc:";

// Encrypts a payment credential before it's stored. Values that predate this
// change are stored as plain text with no prefix; decryptSecret below treats
// those as legacy and returns them unchanged, so existing subscribers' saved
// keys keep working and get encrypted the next time they're saved.
//
// Both the web and mobile settings screens pre-fill this field with whatever
// is currently stored and re-submit it on save, even when the user didn't
// change it. Once a value is encrypted, that round-trip would otherwise feed
// an already-"enc:"-prefixed string back into encryptSecret and double-wrap
// it, corrupting the stored key. Guard against that here instead of changing
// what any endpoint returns, since that's a much larger compatibility surface
// (both apps' settings screens rely on the current response shape).
const encryptSecret = (plainText) => {
  if (!plainText) return plainText;
  if (plainText.startsWith(ENCRYPTED_PREFIX)) return plainText;
  if (!cryptr) {
    console.warn(
      "PAYMENT_ENCRYPTION_KEY is not set — storing payment credential unencrypted. Set this env var in production."
    );
    return plainText;
  }
  return ENCRYPTED_PREFIX + cryptr.encrypt(plainText);
};

const decryptSecret = (value) => {
  if (!value) return value;
  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    return value; // legacy plaintext value stored before encryption was added
  }
  if (!cryptr) {
    throw new Error(
      "PAYMENT_ENCRYPTION_KEY is not set; cannot decrypt a stored payment credential"
    );
  }
  return cryptr.decrypt(value.slice(ENCRYPTED_PREFIX.length));
};

module.exports = { encryptSecret, decryptSecret };
