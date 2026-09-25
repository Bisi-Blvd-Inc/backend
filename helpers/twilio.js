const twilio = require('twilio');
require("dotenv").config();

// Last four digits only, so logs can say who a text went to without
// storing the whole number.
const maskNumber = (value) => `***${String(value || "").slice(-4)}`;

// Sends a text and reports what happened. It used to fire the request without
// waiting for the answer, so a failure (out of funds, wrong token, bad number)
// vanished without a trace. Never throws: a failed text must not fail the
// booking that triggered it.
const smtpSms = async (options) => {
    const to = String(options?.to || "");
    // Numbers with no digits after the country code (e.g. "+1") can't be texted.
    if (to.replace(/\D/g, "").length < 8) {
        console.warn(`SMS not sent: no usable phone number (${maskNumber(to)})`);
        return false;
    }
    try {
        const accountSid = process.env.accountSid;
        const authToken = process.env.authToken;
        const client = twilio(accountSid, authToken);
        const message = await client.messages.create({
            body: options.text,
            from: process.env.TWILIO_FROM_NUMBER || '+18623782474',
            to,
        });
        console.log(`SMS to ${maskNumber(to)}: ${message.status} (${message.sid})`);
        return true;
    } catch (error) {
        console.error(
            `SMS to ${maskNumber(to)} failed: ${error.code ? `Twilio ${error.code} - ` : ""}${error.message}`
        );
        return false;
    }
}

module.exports = {
    smtpSms
}
