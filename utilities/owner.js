var nodemailer = require("nodemailer");
require("dotenv").config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports.sendOwnerMailer = (data) => {
  const msg = {
    to: data.email,
    from: process.env.SMTP_FROM_EMAIL,
    subject: data.subject,
    html: data.html,
  };

  (async () => {
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(error);
      if (error.response) {
        console.error(error.response.body);
      }
    }
  })();
};
