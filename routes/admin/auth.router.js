const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const validator = require("./../../utilities/validator");
const authController = require("../../controllers/admin/auth.contoller");
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
  "/loginAdmin",
  [
    check("email").not().isEmpty().withMessage("Email field is required"),
    check("password").not().isEmpty().withMessage("password field is required"),
  ],
  validator,
  authController.signinadmin
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
router.post("/forgot", authController.forgotPassword);
router.post("/resetPassword", authController.resetPassword);
router.post("/changePassword", authMiddleware, authController.changePassword);
router.put(
  "/profileUpdate/:id",
  [
    check("firstName")
      .not()
      .isEmpty()
      .withMessage("first_name field is required"),
    check("lastName")
      .not()
      .isEmpty()
      .withMessage("last_name field is required"),
    check("email").not().isEmpty().withMessage("email field is required"),
  ],
  validator,
  authController.editProfile
);
router.get("/getUser/:id", authController.getUser);

module.exports = router;
