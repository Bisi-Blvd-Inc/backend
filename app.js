require("dotenv").config();
const express = require("express");
const app = express();
var cors = require("cors");
const logger = require("morgan");
const cron = require("node-cron");
const users = require("./models/user")
const { planAlertMail } = require("./helpers/users")
const { smtpSms } = require("./helpers/twilio")
const moment = require('moment');
const responseLogger = require ("./middlewares/responseLogger")
const port = process.env.PORT || 3001;

cron.schedule("0 0 * * *", async function () {
  const allSuscription = await users.find({ role: 2, subscriptionStatus: true });
  if (allSuscription) {
    for (const result of allSuscription) {
      const { email, firstName, mobile, subscription: { current_period_end } } = result;
      const todaydate = Date.now();
      const date = new Date(current_period_end * 1000);
      const dueDate = moment(date).subtract(3, 'days').toDate();
      const now = new Date(todaydate);
      const nowUTC = new Date(now.toISOString());
      const smsData = {
        to: `${mobile}`,
        text: `Dear ${firstName} This is a friendly reminder of your account payment due in 3 days. To complete your payment, please login to the Bisi Blvd. website or you may call the office, 312-450-0418.`
      }
      if (nowUTC >= dueDate && nowUTC <= date) {
        await users.updateOne({ email }, { oneDayMailStatus: true });
        await planAlertMail(email, firstName);
        await smtpSms(smsData)
      }

    }
  }
});
app.use(cors());
app.options("*", cors());
app.use(logger("dev"));
app.use(responseLogger);

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
