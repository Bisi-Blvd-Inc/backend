const express = require("express");

const authRouter = require("./auth.router");
const usersRouter = require("./users.router");

const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");
const businessRouter = require("./business.router");
const businessServiceRouter = require("./businessService.router");
const enterpriseRouter = require("./enterprise.router")

const router = express.Router();

router.use("/", authRouter);
router.use("/users", authMiddleware, usersRouter);
router.use("/business", authMiddleware, businessRouter);
router.use("/businessService", authMiddleware, businessServiceRouter);
router.use("/enterprise", authMiddleware, enterpriseRouter)

module.exports = router;
