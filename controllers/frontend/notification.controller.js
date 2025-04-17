const Notification = require("../../models/notification");
const axios = require("axios");
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

const sendNotification = async (options) => {
  try {
    const { title, text, clientName, fcmToken, messaging_token } = options;
    let notification_payload = {
      to: fcmToken,
      notification: {
        title: title,
        clientName: clientName,
      },
      webpush: {
        fcm_options: {
          link: process.env.FRONT_BASE_URL,
        },
      },
    };

    const config = {
      headers: {
        Authorization: `Bearer ${process.env.FCM_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    const res = await axios.post(
      "https://fcm.googleapis.com/fcm/send",
      notification_payload,
      config
    );
    console.log("Notification sent:", res?.data);
  } catch (error) {
    console.error("FCM notification failed: ", error);
  }
};

const sendAdminNotification = async (options, next) => {
  const { title, clientName, fcmToken, messaging_token } = options;
  let notification_payload = {
    to: fcmToken,
    notification: {
      title: title,
      clientName: clientName,
    },
    webpush: {
      fcm_options: {
        link: process.env.ADMIN_BASE_URL,
      },
    },
  };

  const config = {
    headers: {
      Authorization: `Bearer ${process.env.FCM_TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  const res = await axios.post(
    "https://fcm.googleapis.com/fcm/send",
    notification_payload,
    config
  );
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
