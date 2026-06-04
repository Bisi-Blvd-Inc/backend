var nodemailer = require("nodemailer");
require("dotenv").config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports.sendMailer = (data) => {
  const msg = {
    to: data.email,
    from: process.env.SMTP_FROM_EMAIL,
    subject: data.subject,
    html: data.html,
  };

  (async () => {
    try {
      await sgMail.send(msg);
      console.log("Message sent");
    } catch (error) {
      console.error(error);
      if (error.response) {
        console.error(error.response.body);
      }
    }
  })();
};

module.exports.sendMailerHtml = async (data) => {
  const msg = {
    to: data.email? data.email : data.ownerEmail,
    from: process.env.SMTP_FROM_EMAIL,
    subject: data.subject,
    html: data.html,
  };

  try {
    await sgMail.send(msg);
    console.log("Password reset email sent to:", data.email);
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) {
      console.error("Response body:", error.response.body);
    }
    throw error;
  }
};

module.exports.sendUserMailerHtml = (data) => {
  const msg = {
    to: data.email,
    from: process.env.SMTP_FROM_EMAIL,
    subject: data.subject,
    html: data.body,
  };

  (async () => {
    try {
      await sgMail.send(msg);
      console.log("Message sent");
    } catch (error) {
      console.error(error);
      if (error.response) {
        console.error(error.response.body);
      }
    }
  })();
};
