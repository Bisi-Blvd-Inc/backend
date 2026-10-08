require("dotenv").config();
const express = require("express");
const app = express();
var cors = require("cors");
const logger = require("morgan");
const cron = require("node-cron");
const users = require("./models/user");
const upgradeCollection = require("./models/upgrade");
const { planAlertMail } = require("./helpers/users");
const { smtpSms } = require("./helpers/twilio");
const moment = require("moment");
const stripe = require("stripe")(process.env.STRIPE_SK_KEY);
const googleCalendarRoutes = require("./routes/googleCalendarRoutes");
const microsoftCalendarRoutes = require("./routes/microsoftCalendarRoutes");
const userController = require("./controllers/frontend/user.controller");

const port = process.env.PORT || 3001;


// Cancels a user's Stripe subscription and marks them paymentStatus:0.
// The cancel is best-effort: a subscription that's already gone
// (Stripe's resource_missing, e.g. "No such subscription: sub_...")
// is treated the same as a successful cancel rather than aborting —
// previously this threw, which skipped the user's own DB update (they
// got stuck in limbo) and, because it's inside a Promise.all, logged
// the same error every single minute this cron runs.
const cancelSubscriptionAndFinalize = async (user) => {
  if (user.subscription && user.subscription.id) {
    try {
      await stripe.subscriptions.cancel(user.subscription.id);
    } catch (err) {
      if (err.code !== "resource_missing") {
        console.error(
          `Stripe cancel failed for user ${user._id}, subscription ${user.subscription.id}:`,
          err.message
        );
      }
    }
  }
  await users.findByIdAndUpdate(user._id, {
    paymentStatus: 0,
    subscriptionStatus: false,
    upgradeStatus: false,
  });
};

const checkAllUsersWithDeactivate = async () => {
  try {
    const currentTime = new Date();
    // Was isActivateAccount (collided with an unrelated flag most real
    // accounts carry as true — fixed 2026-09-30, see models/user.js).
    const allDeactivateAccounts = await users.find({ isAccountDeactivated: true });

    // Loop through all deactivate accounts
    await Promise.all(
      allDeactivateAccounts.map(async (user) => {

        let deactivateDate30days = new Date(user.DeactivateAccountDate);
        deactivateDate30days.setDate(deactivateDate30days.getDate() + 30);
        if (user?.planDeatils?.planName === "Monthly Membership") {

          const newSubscriptionEndDate = new Date(user.subscriptionEndDate);
          newSubscriptionEndDate.setDate(newSubscriptionEndDate.getDate() - 1);

          if (currentTime >= newSubscriptionEndDate) {
            // Cancel subscription if current time is past the new subscription end date
            if (user.paymentStatus == 1) {
              await cancelSubscriptionAndFinalize(user);
            }
          }
        } else {
          const after30DaysTime =
            currentTime.getTime() + 30 * 24 * 60 * 60 * 1000;

          if (user.subscriptionEndDate < after30DaysTime) {
            const newSubscriptionEndDate = new Date(user.subscriptionEndDate);
            newSubscriptionEndDate.setDate(
              newSubscriptionEndDate.getDate() - 1
            );

            if (currentTime >= newSubscriptionEndDate) {
              if (user.paymentStatus == 1) {
                // Cancel subscription if current time is past the new subscription end date
                await cancelSubscriptionAndFinalize(user);
              }
            }
          } else {
            const deactivateDate = new Date(user.DeactivateAccountDate);
            deactivateDate.setDate(deactivateDate.getDate() + 30); // Add 30 days
            deactivateDate.setDate(deactivateDate.getDate() - 1); // Subtract 1 day

            if (currentTime >= deactivateDate) {
              // Cancel subscription if current time is past the deactivate date
              if (user.paymentStatus == 1) {
                await cancelSubscriptionAndFinalize(user);
              }
            }
          }
        }

        if (
          deactivateDate30days.getFullYear() === currentTime.getFullYear() &&
          deactivateDate30days.getMonth() === currentTime.getMonth() &&
          deactivateDate30days.getDate() === currentTime.getDate()
        ) {
          // Only deactivate if they truly have no active subscription
          if (user.subscriptionStatus === false && user.paymentStatus === 0) {
            await users.findByIdAndUpdate(
              user._id, { paymentStatus: 0, status: 0, HistoryActivateStatus: false }
            );
          }
        }
      })
    );
  } catch (error) {
    console.error("Error processing deactivate accounts:", error);
  }
};
cron.schedule("* * * * *", () => {
  checkAllUsersWithDeactivate();
});

// Finishes what invoice.payment_failed started (userWebhook): once the
// 15-day cure window closes without a successful payment, the block
// becomes permanent (isAccountDeactivated), same terminal state a user
// reaches by deactivating themselves. Hourly, not per-minute — a 15-day
// deadline doesn't need minute-level precision.
const checkAllUsersWithPaymentFailure = async () => {
  try {
    const now = new Date();
    const overdue = await users.find({
      paymentStatus: 0,
      paymentCureDeadline: { $lte: now },
      isAccountDeactivated: false,
    });
    await Promise.all(
      overdue.map((user) =>
        users.findByIdAndUpdate(user._id, {
          isAccountDeactivated: true,
          DeactivateAccountDate: now,
        })
      )
    );
    if (overdue.length > 0) {
      console.log(
        `Auto-deactivated ${overdue.length} account(s) past their payment cure deadline.`
      );
    }
  } catch (error) {
    console.error("Error processing payment cure deadlines:", error);
  }
};
cron.schedule("0 * * * *", () => {
  checkAllUsersWithPaymentFailure();
});

// Run the task every 5 minutes
// cron.schedule("0 0 * * *", () => {
//   checkAndDeleteEntries();
// });
cron.schedule("0 0 * * *", async function () {
  const allSuscription = await users.find({
    role: 2,
    subscriptionStatus: true,
  });
  if (allSuscription) {
    for (const result of allSuscription) {
      const {
        email,
        firstName,
        mobile,
        subscription: { current_period_end },
      } = result;
      const todaydate = Date.now();
      const date = new Date(current_period_end * 1000);
      const dueDate = moment(date).subtract(3, "days").toDate();
      const now = new Date(todaydate);
      const nowUTC = new Date(now.toISOString());
      const smsData = {
        to: `${mobile}`,
        text: `Dear ${firstName} This is a friendly reminder of your account payment due in 3 days. To complete your payment, please login to the Bisi Books website or you may call the office, 312-450-0418.`,
      };
      if (nowUTC >= dueDate && nowUTC <= date) {
        await users.updateOne({ email }, { oneDayMailStatus: true });
        await planAlertMail(email, firstName);
        await smtpSms(smsData);
      }
    }
  }
});
app.use(cors());
app.options("*", cors());
app.use(logger("dev"));

// Registered before express.json() below, on purpose: Stripe signs this
// webhook over the exact raw request bytes (see userWebhook's
// stripe.webhooks.constructEvent call), so the body has to reach the
// handler unparsed. If this were declared after (or inside) the routes
// that sit behind express.json(), the global parser would have already
// consumed the stream and the raw bytes needed for signature verification
// would be gone. This is also why it's not in routes/frontend/user.router.js
// alongside the authenticated user endpoints — Stripe calls it server-to-
// server with no user JWT, so it can't sit behind authMiddleware either.
// No Stripe webhook endpoint existed in production at all until
// 2026-10-01 — this used to trust req.body with zero signature verification.
app.post(
  "/frontend/user/webhook",
  express.raw({ type: "application/json" }),
  userController.userWebhook
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.set("view engine", "ejs");
app.use("/uploads", express.static("uploads"));
require("./config/database");
app.use("/admin", require("./routes/admin/index"));
app.use("/frontend", require("./routes/frontend/index"));
app.use(express.json());
app.use("/api/google-calendar", googleCalendarRoutes);
app.use("/api/microsoft-calendar", microsoftCalendarRoutes);

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
});

app.use("*", (req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint doesnt exist",
  });
});

app.listen(port, () => {
  console.log(`Example of app listening on port ${port}!`);
});
