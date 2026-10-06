const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Issues a login token and makes it the account's only valid session: the
// newest login wins, and any token issued earlier stops working. Use this for
// logins only. Password-reset and other one-purpose tokens keep using
// generateToken, which carries no session id and so is never accepted as a login.
const issueSession = async (user, exp) => {
  const sid = crypto.randomBytes(16).toString("hex");
  await User.updateOne({ _id: user._id }, { $set: { activeSessionId: sid } });
  const payload = {
    userData: { _id: user._id },
    sid,
    iat: Math.floor(Date.now() / 1000) - 30,
  };
  if (exp) payload.exp = exp;
  return jwt.sign(payload, process.env.FRONTEND_JWT_SECRET);
};

module.exports = { issueSession };
