const authService = require("../../services/auth.services");
const _ = require("lodash");
const { generateToken, comparePassword, verifyJWT } = require("../../helpers/helper");
const bcrypt = require("bcrypt");
const { pick } = require("lodash");
const { sendForgotPasswordMail } = require("../../helpers/helper");

const signin = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await authService.findOne({ email });
    if (user) {
      const validUser = await comparePassword(req.body.password, user.password);
      if (!validUser) {
        return res.status(203).json({ message: "Invalid username/password" });
      }
      if (user.role !== 1) {
        return res.status(203).send({ message: "Access denied!", status: 403 });
      }
      const token = await generateToken(user);
      if (!token) {
        return res.status(206).json({ message: "Error in generating token" });
      }
      res.status(200).json({
        message: "Logged In",
        data: { user: user, token: token },
      });
    } else {
      res.status(206).json({ message: "Invalid username/password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};
const signinadmin = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await authService.findOne({ email });
    if (user) {
      const validUser = await comparePassword(req.body.password, user.password);
      if (!validUser) {
        return res.status(203).json({ message: "Invalid username/password" });
      }
      const token = await generateToken(user);
      if (!token) {
        return res.status(206).json({ message: "Error in generating token" });
      }
      res.status(200).json({
        message: "Logged In",
        data: { user: user, token: token },
      });
    } else {
      res.status(206).json({ message: "Invalid username/password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};




const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email Already Exists" });
    }

    bcrypt.hash(password.toString(), 10, async (err, hash) => {
      try {
        if (err) {
          return res.status(400).json({ error: "Something went wrong" });
        }
        const newUser = { ...req.body, password: hash };
        const createdUser = await authService.post(newUser);
        return res.status(201).json({
          success: true,
          message: "Registered successfully",
          data: createdUser,
        });
      } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await authService.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Email does not exist. Please enter correct email",
      });
    }

    if (user.role !== 1) {
      return res.status(404).json({
        message: "Email does not exist",
      });
    }

    const token = await generateToken(user);
    await sendForgotPasswordMail({ token, email });

    return res.status(200).json({
      message: "Email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { resetLink, password } = req.body;
    if (resetLink) {
      const decodedData = verifyJWT(resetLink);
      const userId = decodedData.userdata._id;

      const user = await authService.findOne({ _id: userId });
      if (!user) {
        return res.status(500).json({
          message: "User with this email does not exist",
        });
      }

      bcrypt.hash(password.toString(), 10, async (err, hash) => {
        if (err) {
          return res.status(500).json({
            error: err.message,
          });
        }

        const obj = {
          password: hash,
        };

        const updatedUser = await authService.updateOne({ _id: userId }, obj);

        return res.status(201).json({
          success: true,
          message: "Password Changed Successfully",
          data: updatedUser,
        });
      });
    } else {
      return res.status(500).json({
        message: "Incorrect token or it is expired!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};


const changePassword = async (req, res) => {
  try {
    const user = await authService.findRole1();
    const decoded = user;

    if (!req.body.oldPassword || !req.body.newPassword) {
      return res.status(400).json({
        message: "Input can't be empty",
      });
    }

    const validPassword = await bcrypt.compare(req.body.oldPassword, decoded.password);

    if (decoded && validPassword) {
      const hashedNewPassword = await bcrypt.hash(req.body.newPassword, 10);

      return res.status(200).json({
        statusCode: 200,
        message: "Password changed successfully",
      });
    } else {
      return res.status(400).json({
        statusCode: 400,
        message: "Old Password is not matched",
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
    });
  }
};


const editProfile = async (req, res) => {
  try {
    const conditions = { _id: req.params.id };
    const data = pick(req.body, ["firstName", "lastName", "email"]);

    const result = await authService.update(
      conditions,
      { $set: data },
      { fields: { _id: 1 }, new: true }
    );

    if (result) {
      return res.status(200).json({
        message: "User updated successfully",
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
    const condition = {
      _id: req.params.id,
    };
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
module.exports = {
  signin,
  signup,
  forgotPassword,
  resetPassword,
  changePassword,
  editProfile,
  getUser,
  signinadmin
};
