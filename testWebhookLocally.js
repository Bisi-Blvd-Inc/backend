// One-off: simulates a real Stripe webhook delivery against this server's
// own live endpoint, signed with the real STRIPE_WEBHOOK_SECRET exactly
// the way Stripe does — used because Stripe's dashboard doesn't offer a
// "Send test event" option for Live mode endpoints (only Sandbox). Sends
// a fake payment_intent.succeeded for a customer id that won't match any
// real user, so userWebhook's "unknown customer" path handles it safely
// (no real data touched). Not a real transaction, no money involved.
//
// Usage: node testWebhookLocally.js [url]
//   url defaults to http://localhost:3001/frontend/user/webhook

require("dotenv").config();
const crypto = require("crypto");
const https = require("https");
const http = require("http");

const targetUrl = process.argv[2] || "http://localhost:3001/frontend/user/webhook";

const payload = JSON.stringify({
  id: "evt_test_local_" + Date.now(),
  object: "event",
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: "pi_test_local",
      object: "payment_intent",
      customer: "cus_test_local_nonexistent",
      amount: 2000,
      currency: "usd",
    },
  },
});

const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
  .update(signedPayload, "utf8")
  .digest("hex");

const stripeSignatureHeader = `t=${timestamp},v1=${signature}`;

const url = new URL(targetUrl);
const client = url.protocol === "https:" ? https : http;

const req = client.request(
  {
    hostname: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "Stripe-Signature": stripeSignatureHeader,
    },
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Response:", body);
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
  }
);

req.on("error", (err) => {
  console.error("Request failed:", err.message);
  process.exit(1);
});

req.write(payload);
req.end();
