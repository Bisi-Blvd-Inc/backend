const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mail = require("../utilities/mail");
const fs = require("fs").promises;
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

const transporter = nodemailer.createTransport({
  TLS: true,
  port: 587,
  host: process.env.MAILER_HOST,
  auth: {
    user: process.env.MAILER_EMAIL,
    pass: process.env.MAILER_PASSWORD,
  },
});

const sendForgotPasswordMail = async (values) => {
  const { token, email, name } = values;
  const siteUrl = `${process.env.CLIENT_URL}/resetPassword/${token}`;
  const map = new Map();
  map.set("site_url", siteUrl);
  map.set("name", name);

  let mailOptions = {
    from: process.env.MAILER_EMAIL,
    to: email,
    subject: "Forgot Password",
    html: buildHtmlFromTemplate("./mail_template/resetPassword.html", map),
  };

  transporter.sendMail(mailOptions, (error, result) => {
    if (result) {
    } else {
      console.log("That's error!", error);
    }
  });
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
    return mail.sendMailerHtml(mailOptions);
  } catch (error) {
    throw error;
  }

};

const buildHtmlFromTemplate = async (templatePath, variableMap) => {
  let template = await fs.readFile(templatePath, "utf8");
  for( const [key, value] of variableMap) {
     template = template.replaceAll(`<%= ${key} %>`, value);
  }
  return template;
}

const sendMailForUser = async (values) => {
  const { token, email, password } = values;
  let mailOptions = {
    from: process.env.MAILER_EMAIL,
    to: email,
    subject: "Login Details",
    text: "Node.js testing mail for GeeksforGeeks CLICK HERE TO LOGIN",
    html: `<a></a>
    <p>Email: ${email} </p>
    <p>Password: ${password}</p>
    <a href = ${process.env.FRONT_BASE_URL}>Please click here to login</a>
    `,
    attachments: [
      {
        filename: "personal Budget Performa.csv",
        path: "./personal Budget Performa.csv",
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, result) => {
    if (result) {
    } else {
      console.log(error);
    }
  });
};
module.exports = {
  verifyJWT,
  generateToken,
  comparePassword,
  sendForgotPasswordMail,
  generateTokenForUSer,
  sendForgotPasswordMailForFrontend,
  sendMailForUser,
};
