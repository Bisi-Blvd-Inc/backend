// One-time backfill: for every subscriber, add the services they checked on
// the My Goals page to their booking service list (serviceSetting), the same
// thing saving Goals now does automatically. Only adds missing services;
// never overwrites or removes.
//
// Dry run by default (prints what WOULD change). Add --apply to write.
//   node scripts/syncGoalServicesToBooking.js
//   node scripts/syncGoalServicesToBooking.js --apply
//
// Run from the backend folder so .env (MONGO_URL) is found.
require("dotenv").config();
const mongoose = require("mongoose");
const GoalsCompanyBudget = require("../models/goalsCompanyBudget");
const ServiceSetting = require("../models/serviceSetting");
const { buildEntries, syncGoalServicesToBookingSettings } = require("../helpers/goalServiceSync");

const apply = process.argv.includes("--apply");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useCreateIndex: false });
  const goals = await GoalsCompanyBudget.find({}).lean();
  let usersToChange = 0;
  let servicesToAdd = 0;

  for (const goal of goals) {
    if (!goal.addedBy) continue;
    const setting = await ServiceSetting.findOne({ addedBy: goal.addedBy, isDeleted: { $ne: true } }).lean();
    const existing = new Set(((setting && setting.service) || []).map((s) => String(s.serviceId)));
    const missing = buildEntries(goal.service, existing).length;
    if (missing === 0) continue;
    usersToChange += 1;
    servicesToAdd += missing;
    if (apply) {
      await syncGoalServicesToBookingSettings(goal.addedBy, goal.service, ServiceSetting);
    }
  }

  console.log(
    `${apply ? "APPLIED" : "DRY RUN"}: ${servicesToAdd} service(s) across ${usersToChange} of ${goals.length} goal records${
      apply ? "" : " — re-run with --apply to write"
    }`
  );
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
