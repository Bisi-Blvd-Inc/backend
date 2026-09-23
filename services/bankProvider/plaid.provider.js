const {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} = require("plaid");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const plaidEnv = process.env.PLAID_ENV || "sandbox";

const configuration = new Configuration({
  basePath: PlaidEnvironments[plaidEnv],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

// One Link token per user, short-lived, used client-side to open Plaid
// Link. webhook points at our own endpoint so Plaid can notify us of new
// transactions instead of us having to poll constantly.
//
// existingAccessToken, when passed, puts Link into "update mode" — it
// re-authenticates the SAME item instead of creating a new one, which is
// what a subscriber needs when a connection errors out (e.g. BMO Harris'
// known ITEM_LOGIN_REQUIRED behavior — see the plan's note on this) rather
// than losing their synced transaction history by reconnecting from
// scratch. Products/webhook are omitted in that case — Plaid rejects them
// alongside access_token, since update mode reuses the item's existing
// configuration.
const createLinkToken = async (userId, existingAccessToken) => {
  const payload = {
    user: { client_user_id: String(userId) },
    client_name: "Bisi Books",
    country_codes: [CountryCode.Us],
    language: "en",
  };

  if (existingAccessToken) {
    payload.access_token = existingAccessToken;
  } else {
    payload.products = [Products.Transactions];
    payload.webhook = process.env.PLAID_WEBHOOK_URL; // e.g. https://api.bisiblvd.com/frontend/bank/webhook
  }

  const response = await client.linkTokenCreate(payload);
  return response.data.link_token;
};

// Exchanges Plaid Link's public_token (short-lived, client-side) for a
// permanent access_token (server-side only, never sent to the browser) and
// the item's id + institution info.
const exchangePublicToken = async (publicToken) => {
  const exchangeResponse = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });
  const accessToken = exchangeResponse.data.access_token;
  const itemId = exchangeResponse.data.item_id;

  let institutionId = null;
  let institutionName = null;
  try {
    const itemResponse = await client.itemGet({ access_token: accessToken });
    institutionId = itemResponse.data.item.institution_id || null;
    if (institutionId) {
      const instResponse = await client.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us],
      });
      institutionName = instResponse.data.institution.name;
    }
  } catch (err) {
    // Non-fatal — connection still works without a display name, it'll
    // just show as "your bank" in the UI until this backfills.
    console.warn("Plaid institution lookup failed:", err.message);
  }

  return { accessToken, itemId, institutionId, institutionName };
};

// Cursor-based incremental sync (Plaid's recommended approach over the
// older /transactions/get) — pass the previous cursor to only get what's
// changed since, or omit it for the first sync. has_more means keep
// calling with the returned next_cursor until it's false.
const syncTransactions = async (accessToken, cursor) => {
  const response = await client.transactionsSync({
    access_token: accessToken,
    cursor: cursor || undefined,
  });
  return {
    added: response.data.added,
    modified: response.data.modified,
    removed: response.data.removed,
    nextCursor: response.data.next_cursor,
    hasMore: response.data.has_more,
  };
};

// Plaid signs webhooks with a JWT in the Plaid-Verification header (ES256,
// verified against a rotating public key Plaid publishes per key id).
// Caching keys by kid since Plaid asks callers not to re-fetch per request.
const verificationKeyCache = new Map();

const getVerificationKey = async (keyId) => {
  if (verificationKeyCache.has(keyId)) return verificationKeyCache.get(keyId);
  const response = await client.webhookVerificationKeyGet({ key_id: keyId });
  const key = response.data.key;
  verificationKeyCache.set(keyId, key);
  return key;
};

// rawBody must be the exact raw request body Plaid sent (express.raw()),
// not a re-serialized JSON.parse'd-then-stringify'd copy — the signature
// covers the exact bytes.
const verifyWebhookSignature = async (rawBody, plaidVerificationHeader) => {
  if (!plaidVerificationHeader) return false;

  const decodedHeader = jwt.decode(plaidVerificationHeader, {
    complete: true,
  });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    return false;
  }

  const jwk = await getVerificationKey(decodedHeader.header.kid);
  // jsonwebtoken's verify() takes a PEM, not a raw JWK — convert via
  // Node's own crypto module (jwk support added in Node 12+) first.
  const publicKeyPem = crypto
    .createPublicKey({ key: jwk, format: "jwk" })
    .export({ type: "spki", format: "pem" });

  let claims;
  try {
    claims = jwt.verify(plaidVerificationHeader, publicKeyPem, {
      algorithms: ["ES256"],
    });
  } catch (err) {
    return false;
  }

  const bodyHash = crypto
    .createHash("sha256")
    .update(rawBody)
    .digest("hex");
  return bodyHash === claims.request_body_sha256;
};

module.exports = {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
  verifyWebhookSignature,
};
