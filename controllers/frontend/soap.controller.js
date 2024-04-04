const userSoapservices = require("../../services/usersoap.services");

const addSoap = async (req, res) => {
  try {
    const { level, subjective, objective, assessment, plan, additionalNotes } =
      req.body;
    const images = req.files;
    const Id = req._user;
    const imageArray = [];
    if (images && images.length > 0) {
      images.forEach((element) => {
        const payload = {
          ...element,
          name: element.filename,
        };
        imageArray.push(payload);
      });
    }
    const obj = {
      userBookingId: req.params.id,
      level: level,
      subjective: subjective,
      objective: objective,
      assessment: assessment,
      plan: plan,
      additionalNotes: additionalNotes,
      files: imageArray,
      addedBy :  Id
    };

    const soapResult = await userSoapservices.post(obj);
    return res.status(200).json({
      success: true,
      message: "Added successfully",
      data: soapResult,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};

const getSoap = async (req, res) => {
  try {
    let { id } = req.params;
    const response = await userSoapservices.getSoapwithId({
      userBookingId: id,
    });
    if (!response) {
      return res.status(200).json({
        message: "User not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Users get successfully",
        data: response,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};

const updateSoap = async (req, res) => {
  try {
    const {
      level,
      subjective,
      objective,
      assessment,
      plan,
      additionalNotes,
      id,
    } = req.body;
    const images = req.files;
    const imageArray = [];
    if (images && images.length > 0) {
      images.forEach((element) => {
        const payload = {
          ...element,
          name: element.filename,
        };
        imageArray.push(payload);
      });
    }

    const obj = {
      level: level,
      subjective: subjective,
      objective: objective,
      assessment: assessment,
      plan: plan,
      additionalNotes: additionalNotes,
      files: req.body.file
        ? [
            ...imageArray,
            ...JSON.parse(req.body.file).filter(
              (item) => Object.keys(item).length !== 0
            ),
          ]
        : imageArray,
    };
    const response = await userSoapservices.update({ _id: id }, obj);
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};

module.exports = {
  addSoap,
  getSoap,
  updateSoap,
};
