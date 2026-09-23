// Read-only check: reports any User documents that share an email address.
// Run this before adding `unique: true` to the email field in models/user.js
// (see the reliability-fix plan) — if this prints any groups, resolve them
// first, or MongoDB will refuse to build the unique index.
//
// Usage: MONGODB_URI="<connection string>" node scripts/findDuplicateUserEmails.js

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

const run = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("Set MONGODB_URI (or MONGO_URI) before running this script.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const duplicates = await User.aggregate([
    { $match: { email: { $ne: null, $ne: "" } } },
    { $group: { _id: "$email", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]);

  if (duplicates.length === 0) {
    console.log("No duplicate emails found — safe to add a unique index.");
  } else {
    console.log(`Found ${duplicates.length} email(s) used by more than one account:\n`);
    duplicates.forEach((d) => {
      console.log(`  ${d._id}  (${d.count} accounts: ${d.ids.join(", ")})`);
    });
    console.log(
      "\nResolve these (merge or delete the stale duplicate) before adding `unique: true` to models/user.js's email field."
    );
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
