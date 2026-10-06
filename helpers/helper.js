const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs");
const mail = require("../utilities/mail");
require("dotenv").config();

const generateToken = (data, exp) => {
  const userData = {
    _id: data._id,
  };
  const payload = {
    userData,
  };
  if (exp) {
    payload.exp = exp // expires in 48 hours
  } else {
    payload.iat = Math.floor(Date.now() / 1000) - 30;
  }
  try {
    const token = jwt.sign(payload, process.env.FRONTEND_JWT_SECRET);
    return token;
  } catch (err) {
    return false;
  }
};

const generateTokenForUSer = (data) => {
  const userData = {
    _id: data._id,
  };
  const payload = {
    userData,
    iat: Math.floor(Date.now() / 1000) - 30,
  };
  try {
    const token = jwt.sign(payload, process.env.FRONTEND_USER_JWT_SECRET);
    return token;
  } catch (err) {
    return false;
  }
};

const verifyJWT = (resetToken) => {
  try {
    const legit = jwt.verify(resetToken, process.env.FRONTEND_JWT_SECRET);
    return legit;
  } catch (err) {
    return false;
  }
};
const comparePassword = async (password, enteredPassword) => {
  const valid = await bcrypt.compare(password, enteredPassword);
  if (valid) {
    return true;
  }
  return false;
};

// Admin-console emails. These used to log in to a separate mailbox over SMTP
// (MAILER_HOST / MAILER_EMAIL / MAILER_PASSWORD); they now go through SendGrid
// like every other email, from SMTP_FROM_EMAIL. Failures are logged, not
// thrown, matching how they behaved before.
const sendForgotPasswordMail = async (values) => {
  const { token, email } = values;
  try {
    await mail.sendMailerHtml({
      email,
      subject: "Forgot Password",
      html: ` <a>please Click here  to reset your password</a>
    <a href = ${process.env.CLIENT_URL}/resetPassword/${token}>Click Here</a>
    `,
    });
  } catch (error) {
    console.log("Admin forgot-password email failed:", error.message);
  }
};

const sendForgotPasswordMailForFrontend = async (values) => {


  try {
    const { token, email } = values;
    let mailOptions = {
      email,
      subject: "Forgot Password",
      text: "Node.js testing mail for GeeksforGeeks",
      html: ` <a>Please Click here to reset your password. It expires in 48 hours.</a>
      
      <a href = ${process.env.CLIENT_URL_FRONT}/resetPassword/${token}>Click Here</a>
      `,
    };
    return await mail.sendMailerHtml(mailOptions);
  } catch (error) {
    throw error;
  }

};

const sendForgotPasswordMailForBookingClient = async (values) => {


  try {
    const { token, email } = values;
    let mailOptions = {
      email,
      subject: "Forgot Password",
      text: "Node.js testing mail for GeeksforGeeks",
      html: ` <a>Please Click here to reset your password. It expires in 48 hours.</a>
 
      <a href = ${process.env.BOOKING_APP_SCHEME}://reset-password/${token}>Click Here</a>
      `,
    };
    return mail.sendMailerHtml(mailOptions);
  } catch (error) {
    throw error;
  }

};

const sendMailForUser = async (values) => {
  const { email, password } = values;
  const attachments = [];
  try {
    attachments.push({
      content: fs.readFileSync("./personal Budget Performa.csv").toString("base64"),
      filename: "personal Budget Performa.csv",
      type: "text/csv",
      disposition: "attachment",
    });
  } catch (error) {
    console.log("Login-details email: budget template not attached:", error.message);
  }
  try {
    await mail.sendMailerHtml({
      email,
      subject: "Login Details",
      html: `<a></a>
    <p>Email: ${email} </p>
    <p>Password: ${password}</p>
    <a href = ${process.env.FRONT_BASE_URL}>Please click here to login</a>
    `,
      attachments,
    });
  } catch (error) {
    console.log("Login-details email failed:", error.message);
  }
};

const getToken = (req)  => {
  let token;
  // 1. Check if the authorization header exists and starts with "Bearer "
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // 2. Split the header string by the space and get the second part (the token)
    token = req.headers.authorization.split(' ')[1];
  }
  return token;
}
module.exports = {
  verifyJWT,
  generateToken,
  comparePassword,
  sendForgotPasswordMail,
  generateTokenForUSer,
  sendForgotPasswordMailForFrontend,
  sendForgotPasswordMailForBookingClient,
  sendMailForUser,
  getToken
};
