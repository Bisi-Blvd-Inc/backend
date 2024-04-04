const UserModel = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ejs = require("ejs");
var path = require("path");
const mail = require("../utilities/mail");
const owner = require("../utilities/owner")
const { find } = require("lodash");
const { smtpSms } = require("../helpers/twilio")
require("dotenv").config();

const AdminUrl = process.env.ADMIN_BASE_URL;

const getUser = async (values) => {
  let { email, password } = values;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) throw Error("user not found");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw Error("wrong password");

    if (!user.status) throw Error("account is not activated yet !");

    return user;
  } catch (error) {
    throw error;
  }
};

const sendWrongPasswordMail = async (email) => {
  try {
    var parentDir = path.dirname("api");
    ejs.renderFile(
      parentDir + "/mail_template/forgetPassword.html",
      {
        email: email,
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const emailData = {
            email,
            subject: `A Wrong Password Was Entered`,
            html: data,
          };
          return mail.sendMailerHtml(emailData);
        }
      }
    );
  } catch (error) {
    throw error;
  }
};

const sendActivationMail = async (email) => {
  try {
    const token = jwt.sign({ email }, process.env.JWT_ACCOUNT_ACTIVATION, {
      expiresIn: "5m",
    });
    const emailData = {
      email,
      subject: `Account Invitation`,
      body: `<h1>Please use the following link to activate your account</h1>
      <p> <a href="${process.env.FRONT_lOGIN}/account/activate/${token}" target = "_blank">Activate Account</a> </p>
          <hr />
          <p>This email may contain sensetive information</p>
          <p></p>
      `,
    };
    return mail.sendUserMailerHtml(emailData);
  } catch (error) {
    throw error;
  }
};

const sendstaffMail = async (email,
  name,
  staffId) => {
  try {
    const emailData = {
      email,
      subject: `create password`,
      body: `<h1>Please use the following link to create password your account</h1>
          <p> <a href="${process.env.FRONT_lOGIN}/staff-password/${staffId}">Generate Password</a> </p>
          <hr />
          <p>This email may contain sensetive information</p>
          <p></p>
      `,
    };
    return mail.sendUserMailerHtml(emailData);
  } catch (error) {
    throw error;
  }
};


const sendNewuserCreated = async (firstName,resultsArray) => {

  try {
    const emailData = {
      email: "admin@bisiblvd.com",
      subject: `New Subscriber added`,
      html: `
          <p>Dear Noelle <p>
          <p> 
          A new subscriber <b style="color:green;">  ${firstName} </b> recently joined our community under <b style="color:green;"> ${resultsArray.map(data => data.businessType).join(', ')} </b>. Click here ${AdminUrl}/users to check more.</p>
          <hr />
          <p>This email may contain sensitive information</p>
          <p></p>
      `
    };
    return owner.sendOwnerMailer(emailData);
  } catch (error) {
    throw error;
  }
};




const sendBookingMail = async (
  email,
  name,
  servicess,
  ServiceDuration,
  Date,
  time,
  bookingStatusVal,
  bookingId,
  price
) => {
  try {
    var parentDir = path.dirname("api");
    const token = jwt.sign({ email }, process.env.JWT_ACCOUNT_ACTIVATION, {
      expiresIn: "5m",
    });
    const link = `${process.env.FRONT_BASE_URL}/editbooking/${bookingId}`;
    email
    ejs.renderFile(
      parentDir + "/mail_template/emailtemplate.html",
      {
        link: link,
        email: email,
        name: name,
        servicess: servicess,
        bookingStatusVal: bookingStatusVal,
        Date: Date,
        time: time,
        price: price,
        ServiceDuration: ServiceDuration
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const emailData = {
            email,
            subject: `booking email`,
            html: data,
          };
          return mail.sendMailerHtml(emailData);
        }
      }
    );
  } catch (error) {
    throw error;
  }
};

const sendBookingMailExternal = async (
  email,
  name,
  servicess,
  ServiceDuration,
  Date,
  time,
  bookingStatusVal,
  bookingId,
  bookingPaymentStatus
) => {
  try {
    var parentDir = path.dirname("api");
    const token = jwt.sign({ email }, process.env.JWT_ACCOUNT_ACTIVATION, {
      expiresIn: "5m",
    });
    const link = `${process.env.FRONT_BASE_URL}/editbooking/${bookingId}`;
    email
    ejs.renderFile(
      parentDir + "/mail_template/emailtemplate1.html",
      {
        link: link,
        email: email,
        name: name,
        servicess: servicess,
        bookingStatusVal: bookingStatusVal,
        Date: Date,
        time: time,
        price: bookingPaymentStatus,
        ServiceDuration: ServiceDuration
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const emailData = {
            email,
            subject: `booking email`,
            html: data,
          };
          return mail.sendMailerHtml(emailData);
        }
      }
    );
  } catch (error) {
    throw error;
  }
};

const sendPaymentMail = async (
  name,
  email,
  combinedDescription,
  ServiceDuration,
  date,
  paymentTime,
  invoiceId,
  finalPrice
) => {
  try {
    var parentDir = path.dirname("api");
    const token = jwt.sign({ email }, process.env.JWT_ACCOUNT_ACTIVATION, {
      expiresIn: "5m",
    });
    email
    ejs.renderFile(
      parentDir + "/mail_template/paymenttemplate.html",
      {
        name: name,
        email: email,
        servicess: combinedDescription,
        Date: date,
        time: paymentTime,
        invoice: invoiceId,
        price: finalPrice,
        ServiceDuration: ServiceDuration
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const emailData = {
            email,
            subject: `payment email`,
            html: data,
          };
          return mail.sendMailerHtml(emailData);
        }
      }
    );
  } catch (error) {
    throw error;
  }
};
const sendBookingMailOwner = async (
  ownerEmail,
  name,
  ownerName,
  servicess,
  Date,
  time,
  bookingStatusVal,
  bookingId,
  price
) => {
  try {
    var parentDir = path.dirname("api");
    const token = jwt.sign({ ownerEmail }, process.env.JWT_ACCOUNT_ACTIVATION, {
      expiresIn: "5m",
    });
    const link = `${process.env.FRONT_BASE_URL}/editbooking/${bookingId}`;
    ownerEmail
    ejs.renderFile(
      parentDir + "/mail_template/bookingEmail.html",
      {
        link: link,
        email: ownerEmail,
        name: name,
        ownerName: ownerName,
        servicess: servicess,
        bookingStatusVal: bookingStatusVal,
        Date: Date,
        time: time,
        price: price,
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const emailData = {
            ownerEmail,
            subject: `You’ve Got Booked`,
            html: data,
          };
          return mail.sendMailerHtml(emailData);
        }
      }
    );
  } catch (error) {
    throw error;
  }
};

const cancelBookingMail = async (
  email,
  name,
  confirmTime,
  bookingStatusVal
) => {
  try {
    var parentDir = path.dirname("api");
    const token = jwt.sign({ email }, process.env.JWT_ACCOUNT_ACTIVATION, {
      expiresIn: "5m",
    });

    ejs.renderFile(
      parentDir + "/mail_template/cancelEmail.html",
      {
        email: email,
        name: name,
        confirmTime: confirmTime,
        bookingStatusVal: bookingStatusVal,
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const emailData = {
            email,
            subject: `booking cancel email`,
            html: data,
          };
          return mail.sendMailerHtml(emailData);
        }
      }
    );
  } catch (error) {
    throw error;
  }
};

const changeScheduleMail = async (email, name) => {
  try {
    var parentDir = path.dirname("api");
    const token = jwt.sign({ email }, process.env.JWT_ACCOUNT_ACTIVATION, {
      expiresIn: "5m",
    });

    ejs.renderFile(
      parentDir + "/mail_template/changeScheduleEmail.html",
      {
        email: email,
        name: name,
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const emailData = {
            email,
            subject: `booking cancel email`,
            html: data,
          };
          return mail.sendMailerHtml(emailData);
        }
      }
    );
  } catch (error) {
    throw error;
  }
};

const activateAccount = async (token) => {
  try {
    const decodedUser = jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);

    if (decodedUser) {
      const user = await UserModel.findOneAndUpdate(
        { email: decodedUser.email },
        { status: 1 }
      );
      const countryCode = user.selectedCountry.split(' ')[1];
      const smsData =
      {
        to: `${countryCode}${user.mobile}`,
        text: `Congratulations, your Bisi Blvd. Account has been activated.`,
      }
      await smtpSms(smsData);
      return user;
    }
  } catch (error) {
    console.log(error)
    throw error;
  }
};

const forgetPassword = async (email) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw Error("User not found");
    }
    if (user.role == 1) {
      throw Error("User not found");
    }

    const token = jwt.sign({ email }, process.env.JWT_RESET_PASSWORD);

    const emailData = {
      email,
      subject: `Password Reset link`,
      body: `
                 <h1>Please use the following link to reset your password</h1>
                 <p> <a href="${process.env.FRONT_BASE_URL}/resetPassword/${token}">Reset Password</a> </p>
                 <hr />
                 <p>This email may contain sensetive information</p>
                 <p>${process.env.FRONT_BASE_URL}</p>
             `,
    };
    //
    const updatedUser = await user.updateOne({ pw_token: token });
    return mail.sendMailerHtml(emailData);
  } catch (error) {
    throw error;
  }
};

const resetPassword = async (values) => {
  try {
    const { resetToken, password } = values;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    if (resetToken) {
      try {
        const decoded = await jwt.verify(resetToken, process.env.JWT_RESET_PASSWORD);
      } catch (err) {
        throw Error("password reset link is expired");
      }

      const findUser = await UserModel.findOne({ pw_token: resetToken });
      if (!findUser) throw Error("password is already changed");

      const recentPasswords = await UserPasswordModel.find({
        user_id: findUser._id,
      })
        .sort({ _id: -1 })
        .limit(3);
      let matchedPassword = find(recentPasswords, { password: password });
      if (matchedPassword)
        throw Error("Password should not be from last 3 passwords");

      UserModel.findOneAndUpdate(
        { pw_token: resetToken },
        {
          password: hashedPassword,
          pw_token: "",
        },
        async (err, user) => {
          if (err || !user) {
            throw Error(err);
          }
          if (user) {
            await UserPasswordModel.create({
              user_id: user._id,
              password: password,
            });
          }
          return user;
        }
      );
    }
  } catch (error) {
    throw error;
  }
};

const planAlertMail = async (email, name) => {
  try {
    var parentDir = path.dirname("api");
    const token = jwt.sign({ email }, process.env.JWT_ACCOUNT_ACTIVATION, {
      expiresIn: "5m",
    });

    ejs.renderFile(
      parentDir + "/mail_template/planExpired.html",
      {
        name: name,
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const emailData = {
            email,
            subject: `Subscription expire`,
            html: data,
          };
          return mail.sendMailerHtml(emailData);
        }
      }
    );
  } catch (error) {
    throw error;
  }
};
module.exports = {
  getUser,
  sendActivationMail,
  activateAccount,
  forgetPassword,
  sendWrongPasswordMail,
  resetPassword,
  planAlertMail,
  sendBookingMailOwner,
  sendBookingMail,
  sendNewuserCreated,
  sendPaymentMail,
  cancelBookingMail,
  changeScheduleMail,
  sendBookingMailExternal,
  sendstaffMail
};
