const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../../models/user");

exports.authMiddleware = async (req, res, next) => {

  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer") ||
    !req.headers.authorization.split(" ")[1]
  ) {
    return res.status(401).json({
      success: false,
      message: "Please provide the token",
    });
  }
  const accessToken = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.FRONTEND_JWT_SECRET);
    let userId = decoded.userData._id;

    // Same terminal state signin() and the booking-link checks already
    // enforce — extended here 2026-10-01 so a deactivated account can't
    // keep using the API just by holding onto an already-issued token.
    // Deliberately NOT checking paymentCureDeadline here yet: the actual
    // "fix your payment" endpoints aren't behind this middleware, but the
    // dashboard calls that get a user there mostly are, and there's no
    // frontend screen yet to catch that block and explain it — blocking
    // here first would just break the dashboard with no way out, worse
    // than today's gap. Wire it in once that screen exists (see
    // subscription-access-lifecycle, Phase 4).
    const user = await User.findById(userId).select("isAccountDeactivated");
    if (user?.isAccountDeactivated === true) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated.",
      });
    }

    req._user = userId;

    return next();
  } catch (error) {

    return res.status(200).json({ success: false, message: error.message });
  }
};
