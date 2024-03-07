const { validationResult } = require("express-validator");

const validator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorsData = {
      formData: "",
    };
    if (errors.array().length > 0) {
      errors.array().forEach((value) => {
        errorsData[value.param] = value.msg;
      });
      return res.json({
        success: false,
        status: 400,
        message: "validation error",
        errors: errorsData,
      });
    }
  } else {
    next();
  }
};

module.exports = validator;
