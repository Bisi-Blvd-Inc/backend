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

const port = process.env.PORT || 3001;


const checkAllUsersWithDeactivate = async () => {
  try {
    const currentTime = new Date();
    const allDeactivateAccounts = await users.find({ isActivateAccount: true });

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
            if(user.paymentStatus == 1){

            
        const subscription =    await stripe.subscriptions.cancel(user.subscription.id);
        
            const deletedSubscription = await users.findByIdAndUpdate(
              user._id,
              { paymentStatus: 0 , subscriptionStatus : false , upgradeStatus : false , subscriptionStatus: false}
            );
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
              if(user.paymentStatus == 1){
              // Cancel subscription if current time is past the new subscription end date
              await stripe.subscriptions.cancel(user.subscription.id);
              const deletedSubscription = await users.findByIdAndUpdate(
                user._id,
                { paymentStatus: 0 , subscriptionStatus : false , upgradeStatus : false ,subscriptionStatus: false}
              );
            }
          }
          } else {
            const deactivateDate = new Date(user.DeactivateAccountDate);
            deactivateDate.setDate(deactivateDate.getDate() + 30); // Add 30 days
            deactivateDate.setDate(deactivateDate.getDate() - 1); // Subtract 1 day

            if (currentTime >= deactivateDate) {
              // Cancel subscription if current time is past the deactivate date
              if(user.paymentStatus == 1){
              await stripe.subscriptions.cancel(user.subscription.id);
              const deletedSubscription = await users.findByIdAndUpdate(
                user._id,
                { paymentStatus: 0 , subscriptionStatus : false , upgradeStatus : false , subscriptionStatus: false}
              );
            }
          }
          }
        }

        if (
          deactivateDate30days.getFullYear() === currentTime.getFullYear() &&
          deactivateDate30days.getMonth() === currentTime.getMonth() &&
          deactivateDate30days.getDate() === currentTime.getDate()  
        ) {

          await users.findByIdAndUpdate(
                  user._id,{paymentStatus: 0 , status : 0, HistoryActivateStatus:false}
                );
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
        text: `Dear ${firstName} This is a friendly reminder of your account payment due in 3 days. To complete your payment, please login to the Bisi Blvd. website or you may call the office, 312-450-0418.`,
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.set("view engine", "ejs");
app.use("/uploads", express.static("uploads"));
require("./config/database");
app.use("/admin", require("./routes/admin/index"));
app.use("/frontend", require("./routes/frontend/index"));

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
