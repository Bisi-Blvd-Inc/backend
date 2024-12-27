const axios = require("axios");
require("dotenv").config();

const sendLeadConnectorWebhook = (payload) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  axios.post(
    "https://services.leadconnectorhq.com/hooks/WppC61sz20FngWp0u1kL/webhook-trigger/56b8df0f-235f-4a94-8cf3-3c1fca7441e3",
    payload,
    config
  ).then((response) => {
    console.log("Success:", response.data);
    // Handle the success response here
  })
  .catch((error) => {
    console.error("Error:", error);
    // Handle the error response here
  });

};


module.exports = {
    sendLeadConnectorWebhook,
};
