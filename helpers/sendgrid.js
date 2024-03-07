const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_KEY);

const sendActivationMail = async (options) => {

  const msg = {
    to: options.email,
    from: `${options.fromName ? options.fromName : process.env.MAILER_EMAIL} <${options.fromEmail ? options.fromEmail : process.env.MAILER_EMAIL
      }>`,
    subject: options.subject,
    text: "email send successfully",
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

module.exports = sendActivationMail;