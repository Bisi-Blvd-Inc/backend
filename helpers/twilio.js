const twilio = require('twilio');
require("dotenv").config();

const smtpSms = async (options) => {
    try {
        const accountSid = process.env.accountSid;
        const authToken = process.env.authToken;

        const client = twilio(accountSid, authToken);
        client.messages
            .create({
                body: options.text,
                from: '+18623782474',
                to: `${options.to}`
            })
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    smtpSms
}