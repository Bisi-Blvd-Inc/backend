// One-off maintenance script: subscriptionStatus and paymentStatus are set
// once at initial checkout and never touched again (no Stripe webhook has
// ever been configured in production, confirmed 2026-10-01), so they've
// drifted completely out of sync with reality — only ~10% of real accounts
// show as active in the database. This queries Stripe directly for each
// account's real current subscription and corrects the local fields to
// match before any access enforcement can safely be built on them.
//
// Defaults to a dry run (reports what it would change, writes nothing).
// Pass --apply to actually write the corrections.
//
// Usage:
//   node reconcileSubscriptionStatus.js              (dry run)
//   node reconcileSubscriptionStatus.js --apply       (writes corrections)

require("./config/database");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SK_KEY);
const User = require("./models/user");

const APPLY = process.argv.includes("--apply");

// Stripe subscription statuses that mean "this account should have access."
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

function diffLine(user, real) {
  const parts = [];
  if (user.subscriptionStatus !== real.subscriptionStatus) {
    parts.push(
      `subscriptionStatus ${user.subscriptionStatus} -> ${real.subscriptionStatus}`
    );
  }
  const realPaymentStatus = real.subscriptionStatus ? 1 : 0;
  if (user.paymentStatus !== realPaymentStatus) {
    parts.push(`paymentStatus ${user.paymentStatus} -> ${realPaymentStatus}`);
  }
  const currentEnd = user.subscriptionEndDate
    ? new Date(user.subscriptionEndDate).toISOString()
    : "none";
  const realEnd = real.subscriptionEndDate
    ? real.subscriptionEndDate.toISOString()
    : "none";
  if (currentEnd !== realEnd) {
    parts.push(`subscriptionEndDate ${currentEnd} -> ${realEnd}`);
  }
  return parts;
}

async function getRealStatus(user) {
  // Prefer the specific subscription id we already have on file — precise,
  // one API call, no ambiguity if a customer somehow has more than one.
  const subId = user.subscription?.id;
  let subscription = null;

  if (subId) {
    try {
      subscription = await stripe.subscriptions.retrieve(subId);
    } catch (err) {
      if (err.code !== "resource_missing") throw err;
      // Subscription id on file no longer exists in Stripe at all —
      // fall through to the customer-based lookup below.
    }
  }

  if (!subscription && user.stripeCustomerId) {
    const list = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      limit: 10,
    });
    // Prefer an active/trialing one if any exist; otherwise take the most
    // recently created (Stripe returns newest first).
    subscription =
      list.data.find((s) => ACTIVE_STATUSES.has(s.status)) ||
      list.data[0] ||
      null;
  }

  if (!subscription) {
    return { subscriptionStatus: false, subscriptionEndDate: null, stripeStatus: "no_subscription_found" };
  }

  return {
    subscriptionStatus: ACTIVE_STATUSES.has(subscription.status),
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    stripeStatus: subscription.status,
  };
}

async function run() {
  const users = await User.find({
    isDeleted: false,
    role: { $in: [2, 3] },
    $or: [{ "subscription.id": { $exists: true, $ne: null } }, { stripeCustomerId: { $exists: true, $ne: null } }],
  });

  console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — checking ${users.length} accounts with a Stripe subscription or customer id on file.\n`);

  let matched = 0;
  let corrected = 0;
  let noStripeRecord = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const real = await getRealStatus(user);
      if (real.stripeStatus === "no_subscription_found") {
        noStripeRecord++;
      }
      const diffs = diffLine(user, real);
      if (diffs.length === 0) {
        matched++;
        continue;
      }
      corrected++;
      console.log(`${user.email} (${user._id}) [stripe status: ${real.stripeStatus}]`);
      diffs.forEach((d) => console.log(`  ${d}`));

      if (APPLY) {
        await User.findByIdAndUpdate(user._id, {
          subscriptionStatus: real.subscriptionStatus,
          paymentStatus: real.subscriptionStatus ? 1 : 0,
          subscriptionEndDate: real.subscriptionEndDate,
        });
      }
    } catch (err) {
      errors++;
      console.error(`ERROR on ${user.email} (${user._id}): ${err.message}`);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Checked:              ${users.length}`);
  console.log(`Already matched:      ${matched}`);
  console.log(`${APPLY ? "Corrected" : "Would correct"}:        ${corrected}`);
  console.log(`No Stripe record:     ${noStripeRecord} (subscription id/customer id on file but nothing found in Stripe)`);
  console.log(`Errors:               ${errors}`);
  if (!APPLY && corrected > 0) {
    console.log("\nThis was a dry run — nothing was written. Re-run with --apply to write these corrections.");
  }

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
