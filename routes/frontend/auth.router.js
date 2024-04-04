const express = require("express");
const router = express.Router();
const { check, query } = require("express-validator");
const validator = require("./../../utilities/validator");
const authController = require("../../controllers/frontend/auth.controller");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");

router.post(
  "/login",
  [
    check("email").not().isEmpty().withMessage("Email field is required"),
    check("password").not().isEmpty().withMessage("password field is required"),
  ],
  validator,

  authController.signin
);
router.post(
  "/signup",
  [
    check("firstName")
      .not()
      .isEmpty()
      .withMessage("first_name field is required"),

    check("email").not().isEmpty().withMessage("email field is required"),
  ],
  validator,
  authController.signup
);
router.post("/autoSignin", authController.autoSignIn);

router.post("/forgot", authController.forgotPassword);
router.post("/resetPassword", authController.resetPassword);
router.put("/activate/:token", authController.onActivateAccount);
router.post("/accountDeactivate/:id", authController.accountDeactivation);
router.post("/accountActivateByClient/:id", authController.accountActivateByClient);
router.post("/changePassword", authMiddleware, authController.changePassword);
router.put(
  "/profileUpdate/:id",
  [
    check("firstName")
      .not()
      .isEmpty()
      .withMessage("first_name field is required"),
    check("email").not().isEmpty().withMessage("email field is required"),
  ],
  validator,
  authController.editprofile
);
router.get("/getUser/:id", authController.getUser);
router.get("/getUserByEmail/:email", authController.getUserByEmail);

module.exports = router;
