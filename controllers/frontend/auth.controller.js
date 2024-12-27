const authService = require("../../services/auth.services");
const businessService = require("../../services/business.service");
const bookingService = require("../../services/booking.service")
const emailSettingService=require('../../models/emailSetting')
const _ = require("lodash");
const { pick } = require("lodash");
const { createAdminNotification } = require("./notification.controller");
const { generateToken, comparePassword, verifyJWT } = require("../../helpers/helper");
const bcrypt = require("bcrypt");
const { sendForgotPasswordMailForFrontend } = require("../../helpers/helper");
const { sendActivationMail, returnAccountActivationMail, sendReturnuser, activateAccount, sendWrongPasswordMail, accountactivationMailToOwner, accountDeactivationMailToOwner, sendNewuserCreated, accountDeactivationMail, accountactivationMail } = require("../../helpers/users");
const {sendLeadConnectorWebhook} = require("../../helpers/marketingConnector");

const signin = async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;
    const user = await authService.findOne({ email });
    const resultsArray = await Promise.all(
      user.businessType.map(async (businessTypeId) => {
        return await businessService.findOne({ _id: businessTypeId });
      })
    );
    if (user) {
      const validPassword = await comparePassword(password, user.password);

      if (!validPassword) {
        sendWrongPasswordMail(email);
        return res.status(203).json({
          message: "Invalid username/password",
        });
      }

      if (user.role !== 2) {
        return res.status(203).send({
          message: "Access denied!",
          status: 403,
        });
      }
      if (user.isDeleted == true) {
        return res.status(203).send({
          message: "Your account is deactivated",
          status: 403,
        });
      }
      const token = await generateToken(user);
      if (!token) {
        return res.status(206).json({
          message: "Error in generating token",
        });
      }

      const userId = user._id;

      const getUser = await authService.find({ _id: userId });
      let array = getUser[0].fcmToken;

      if (!array.includes(fcmToken)) {
        array.push(fcmToken);
      }

      let obj = {
        fcmToken: array,
      };

      let updatedUser = await authService.update(userId, { fcmToken: array, isActivateAccount : false});
      if (user?.status == 0 && user?.HistoryActivateStatus == false) {
        returnAccountActivationMail(user?.email);
        sendReturnuser(user?.firstName, resultsArray)
      }

      res.status(200).json({
        message: "Logged In",
        data: {
          user: user,
          token: token,
        },
      });
    } else {
      res.status(206).json({
        message: "Email doesn't exist",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};


const signup = async (req, res) => {
  try {
    console.log("hereeeeeeee")
    const {
      email,
      password,
      firstName,
      fcmToken,
    } = req.body;
    const user = await authService.findOne({ email, isDeleted: false });
    const resultsArray = await Promise.all(
      req.body.businessType.map(async (businessTypeId) => {
        return await businessService.findOne({ _id: businessTypeId });
      })
    );
    // Now, resultsArray contains the results for each business type
    if (user?.HistoryActivateStatus == true && user?.status == 1 || user?.status == 1) {
      return res.status(400).json({
        message: "Email Already Exists",
      });
    }
    else if (user?.HistoryActivateStatus == false && user?.status == 0) {
      returnAccountActivationMail(email);
      sendReturnuser(req?.body?.firstName, resultsArray)
      return res.status(201).json({
        success: true,
        message: "You having already having an account, Please verify email!",
        data: user,
      });

    }
    if (password) {
      bcrypt.hash(password?.toString(), 10, async (err, hash) => {
        try {
          if (err) {
            return res.status(400).json({
              error: "Something went wrong",
            });
          }
          const newUser = {
            ...req.body,
            password: hash,
          };


          const createdUser = await authService.post(newUser);

          sendLeadConnectorWebhook(createdUser);

          await sendActivationMail(email);
          await sendNewuserCreated(req?.body?.firstName, resultsArray);
          let notification = {
            title: "Your Business is Growing",
            text: `A new subscriber was added to your salon. Please ensure <strong>${createdUser.firstName}</strong> has accurate login credentials.`,
            role: createdUser.role,
            clientName: createdUser.firstName,
            fcmToken: fcmToken,
          };

          await createAdminNotification(notification);
          await emailSettingService.create({description1:"",description2:"",endsWith:"",addedBy:createdUser._id})
          return res.status(201).json({
            success: true,
            message: "Registered successfully, Please verify email!",
            data: createdUser,
          });
        } catch (error) {
          return res.status(500).json({
            message: error.message,
            data: {},
            success: false,
          });
        }
      });
    } else {
      const newUser = {
        ...req.body,
      };

      const createdUser = await authService.post(newUser);

      sendstaffMail(
        email,
        firstName,
        createdUser._id
      );
      await emailSettingService.create({description1:"",description2:"",endsWith:"",addedBy:createdUser._id})
      return res.status(201).json({
        success: true,
        message: "Staff add successfully.. ",
        data: createdUser,
      });
    }

  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};

const onActivateAccount = async (req, res) => {
  try {
    const user = await activateAccount(req.params.token);

    if (user.status == 0) {

      return res.status(200).json({
        status: 200,
        success: true,
        data: user,

        message: "Account activated successfully",
      });
    } else {
      return res.status(400).json({
        status: 400,
        success: true,
        data: user,

        message: "your Account is aleady verified",
      });
    }
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    let result1 = await authService.findOne({ email });
    if (!result1) {
      return res.status(200).send({
        message: "Email is not valid, please enter correct Email",
        code: 404,
      });
    } else if (result1.role !== 2) {
      return res.status(200).json({
        message: "Please enter the registered email adddress",
      });
    } else {
      const token = await generateToken(result1);
      await sendForgotPasswordMailForFrontend({
        token: token,
        email: email,
      });

      return res.status(200).json({
        message: "Email sent successfully",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetLink, password } = req.body;
    if (resetLink) {
      let decodedData = verifyJWT(resetLink);
      let ids = decodedData.userData;

      const users = await authService.findOne(ids);
      if (users) {
        await authService.find({ resetLink: resetLink });
        try {
          if (!users) {
            return res.status(500).json({
              message: "User with this email doesn't Exists",
            });
          }
          bcrypt.hash(password.toString(), 10, async (err, hash) => {
            let decodedData = verifyJWT(resetLink);
            try {
              const obj = {
                password: hash,
              };
              let userId = decodedData.userData._id;
              const user = await authService.updateone(userId, obj);
              return res.status(201).json({
                success: true,
                message: "Password Changed Successfully",
                data: user,
              });
            } catch (err) {
              return res.status(500).json({
                error: err.message,
              });
            }
          });
        } catch (error) {
          return res.status(500).json({
            error: error.message,
          });
        }
      } else {
        return res.status(500).json({
          message: "Incorrect token or it is expired!!!",
        });
      }
    } else {
      if (err || !user) {
        return res.status(500).json({
          error: " error!!",
        });
      }
    }
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

const editprofile = async (req, res) => {
  try {
    const conditions = { _id: req.params.id };
    let data = pick(req.body, ["firstName", "email"]);
    let result = await authService.update(
      conditions,
      { $set: data },
      { fields: { _id: 1 }, new: true }
    );
    if (result) {
      return res.status(200).json({
        message: "User updated  successfully",
      });
    } else {
      return res.status(400).json({
        message: "Something went wrong",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

const getUser = async (req, res) => {
  try {
    const condition = { _id: req.params.id };
    let result = await authService.findOne(condition);
    if (!result) {
      return res.status(200).send({
        message: "User is not exists",
      });
    } else {
      return res.status(200).json({
        message: " Successfull",
        data: result,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};
const getUserByEmail = async (req, res) => {
  try {
    const condition = { email: req.params.email };
    let result = await authService.findOne(condition);
    if (!result) {
      return res.status(200).send({
        message: "User is not exists",
      });
    } else {
      return res.status(200).json({
        message: " Successfull",
        data: result,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    let decoded = req._user;
    const userPassword = await authService.findById(decoded);

    if (!req.body.oldPassword && !req.body.newpassword) {
      return res.send({
        status: 500,
        message: "Input can't be empty",
      });
    }
    const validPassword = await bcrypt.compare(
      req.body.oldPassword,
      userPassword.password
    );
    if (decoded && validPassword) {
      const password = await bcrypt.hash(req.body.newpassword, 10);
      const payload = { password: password };
      const data = await authService.update(decoded, payload);

      return res.status(200).send({
        statusCode: 200,
        message: "Password changed successfully",
        data: data
      });
    } else {
      return res.status(200).json({
        statusCode: 400,
        message: "Old Password is not matched",
      });
    }
  } catch (error) {
    return res.status(200).send({ statusCode: 500, message: error.message });
  }
};

const autoSignIn = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await authService.findOne({ email });
    if (user) {
      const subscription = user.subscriptionStatus;
      const subscriptionDate = user.subscriptionEndDate;
      const date = new Date();
      if (!subscription) {
        return res.status(203).json({
          message: "Please Choose Subscription Plan",
        });
      }
      if (subscriptionDate <= date) {
        return res.status(203).json({
          message: "Subscription Plan Expired",
        });
      }
      if (user.status !== 1) {
        sendActivationMail(email);
        return res.status(203).send({
          message: "Email is not verified, please check your email and verify!",
          status: 405,
        });
      }

      if (user.role !== 2) {
        return res.status(203).send({
          message: "Access denied!",
          status: 403,
        });
      }

      const token = await generateToken(user);
      if (!token) {
        return res.status(206).json({
          message: "Error in generating token",
        });
      }
      res.status(200).json({
        message: "Logged In",
        data: {
          user: user,
          token: token,
        },
      });
    } else {
      res.status(206).json({
        message: "Email doesn't exists",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};
const accountDeactivation = async (req, res) => {
  const { firstname, email } = req.body
  const { id } = req.params
  try {
    const checkBookingStatus = await bookingService.findBycutomerID({ userId: id, bookingStatus: "Confirmed" })
    if (checkBookingStatus.length > 0) {
      return res.status(200).json({
        status: 201,
        success: true,
        message: "You can not Deactivate Account because you having pending Bookings",
      });
    }
    const deactivationDate = new Date();
    const userDeactivate = await authService.update(id, {
      isActivateAccount: true,
      DeactivateAccountDate: deactivationDate,
    });
    const user = await accountDeactivationMail(firstname, email);
    //  const sendOwnerMail = await  accountDeactivationMailToOwner(firstname,email)
    return res.status(200).json({
      status: 200,
      success: true,
      data: user,

      message: "Account Deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating user account:", error);
  }
}


const accountActivateByClient = async (req, res) => {
  const { firstname, email } = req.body
  const { id } = req.params
  try {
    const deactivationDate = new Date();
    const userDeactivate = await authService.update(id, {
      isActivateAccount: false,
      DeactivateAccountDate: ""
    });
    const user = await accountactivationMail(firstname, email);
    //  const sendOwnerMail = await  accountactivationMailToOwner(firstname,email)
    return res.status(200).json({
      status: 200,
      success: true,
      data: userDeactivate,

      message: "Account activated successfully",
    });
  } catch (error) {
    console.error("Error deactivating user account:", error);
  }
}

module.exports = {
  signin,
  signup,
  forgotPassword,
  resetPassword,
  changePassword,
  editprofile,
  getUser,
  getUserByEmail,
  onActivateAccount,
  autoSignIn,
  accountDeactivation,
  accountActivateByClient
};
