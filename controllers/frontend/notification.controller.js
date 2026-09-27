const Notification = require("../../models/notification");
const User = require("../../models/user");
const axios = require("axios");
const { messaging } = require("../../config/firebase");
const notificationService = require("../../services/notification.service");
require("dotenv").config();

const createNotification = async (notification, res) => {
  const nn = await Notification.create(notification);
  const fcmTokens = Array.isArray(notification?.fcmToken)
    ? notification?.fcmToken
    : [];

  for (let i = 0; i < fcmTokens.length; i++) {
    const fcmToken = fcmTokens[i];

    if (fcmToken !== null) {
      const options = {
        ...notification,
        fcmToken: fcmToken,
      };
      await sendNotification(options);
    }
  }
};

const createAdminNotification = async (notification, res) => {
  const nn = await Notification.create(notification);
  sendAdminNotification(notification);
};

// The saved `text` is HTML (built with <strong> tags for the in-app
// notification list); a push notification banner can't render markup, so
// strip tags and collapse whitespace for the version shown there.
const plainText = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

// A push token stops working when the app is uninstalled or the browser's
// site data is cleared; Firebase tells us so on send, and there's no reason
// to keep retrying it, so drop it from the user's saved list.
const forgetDeadToken = async (fcmToken) => {
  try {
    await User.updateMany({ fcmToken }, { $pull: { fcmToken } });
  } catch (err) {
    console.error("Could not remove a dead FCM token:", err.message);
  }
};

// Sends one push notification via Firebase Cloud Messaging (the v1 API,
// authenticated with the service account in config/firebase.js). This used
// to call https://fcm.googleapis.com/fcm/send, the legacy FCM HTTP API,
// which Google shut down in June 2024 — every push notification has been
// silently failing since. A failure here must never break the booking flow
// that triggered it, so this always resolves.
const sendNotification = async (options) => {
  const { title, text, clientName, fcmToken } = options;
  if (!fcmToken) return;
  if (!messaging) {
    console.warn(
      "Push notification skipped: Firebase isn't configured on this server."
    );
    return;
  }
  try {
    const response = await messaging.send({
      token: fcmToken,
      notification: {
        title: title || "Bisi Books",
        body: plainText(text) || clientName || "",
      },
      webpush: {
        fcmOptions: {
          link: process.env.FRONT_BASE_URL,
        },
      },
    });
    console.log("Notification sent:", response);
  } catch (error) {
    const code = error?.errorInfo?.code || error?.code;
    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-argument"
    ) {
      await forgetDeadToken(fcmToken);
    }
    console.error("Push notification failed:", code || error.message);
  }
};

const sendAdminNotification = async (options) => {
  const { title, text, clientName, fcmToken } = options;
  if (!fcmToken) return;
  if (!messaging) {
    console.warn(
      "Push notification skipped: Firebase isn't configured on this server."
    );
    return;
  }
  try {
    const response = await messaging.send({
      token: fcmToken,
      notification: {
        title: title || "Bisi Books",
        body: plainText(text) || clientName || "",
      },
      webpush: {
        fcmOptions: {
          link: process.env.ADMIN_BASE_URL,
        },
      },
    });
    console.log("Admin notification sent:", response);
  } catch (error) {
    const code = error?.errorInfo?.code || error?.code;
    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-argument"
    ) {
      await forgetDeadToken(fcmToken);
    }
    console.error("Admin push notification failed:", code || error.message);
  }
};

const getNotification = async (req, res) => {
  let code = 200;
  const userId = req._user;
  try {
    const getData = await notificationService.find(userId);
    return res.status(code).json({
      code,
      message: "Data fetched",
      data: getData,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const getAdminNotification = async (req, res) => {
  let code = 200;
  try {
    const getData = await notificationService.findAdmin();
    return res.status(code).json({
      code,
      message: "Data fetched",
      data: getData,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const updateNotification = async (req, res) => {
  let code = 200;
  const { Id, data } = req.body;

  const obj = {
    status: data,
  };

  try {
    const getData = await Notification.findByIdAndUpdate(Id, obj);
    return res.status(code).json({
      code,
      message: "Data fetched",
      data: getData,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};
module.exports = {
  createNotification,
  getNotification,
  getAdminNotification,
  updateNotification,
  createAdminNotification,
};
