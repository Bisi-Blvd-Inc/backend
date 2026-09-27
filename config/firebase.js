const admin = require("firebase-admin");

// The Google Calendar feature's Firestore integration and push notifications
// both need this key file, which is a secret and isn't checked into git.
// Rather than let a missing key crash the entire server at boot (it
// previously took down every route, not just Calendar), fail gracefully
// here: export nulls, and the features that depend on it are skipped with a
// clear message instead of crashing.
let db = null;
let messaging = null;
try {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  db = admin.firestore();
  messaging = admin.messaging();
} catch (err) {
  console.warn(
    "Firebase not initialized — config/serviceAccountKey.json is missing or invalid. Google Calendar and push notification features are disabled until it's added.",
    err.message
  );
}

module.exports = { db, messaging };
