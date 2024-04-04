const businessCollection = require("../../models/business");
const businessService = require("../../services/business.service");
const userCollection = require("../../models/user");

const createBusinessType = async (req, res) => {
  try {
    const { businessType } = req.body;
    const type = {
      businessType,
    };
    const exist = await businessCollection.findOne({
      businessType,
    });
    if (exist) {
      return res.status(400).json({
        message: "This type already exist",
      });
    } else {
      const createdType = await businessService.post(type);
      return res.status(201).json({
        success: true,
        message: "Type Add successfully..",
        data: createdType,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getAllbussTypes = async (req, res) => {
  try {
    const result = await businessService.getAll();
    if (!result) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: result,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};



const getAllFrontendbussTypesForsignup = async (req, res) => {
  try {
    const result = await businessService.getAllFrontendsignup();
    if (!result) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: result,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getAllFrontendbussTypes = async (req, res) => {
  try {
    const result = await businessService.getAllFrontend();
    if (!result) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: result,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// const getBusinesstypeforemail =  async (req , res) =>{
//   try {
//     const result = await businessService.findOne({_id : req.body.id});
//     if (!result) {
//       return res.status(200).json({
//         message: "Data not found",
//         status: 404,
//       });
//     } else {
//       return res.status(200).json({
//         message: "Data get successfully",
//         data: result,
//         status: 200,
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// }



const getAdminService = async (req, res) => {
  try {
    const result = await businessService.getAdminService();
    console.log(result,"result")

    const userData = await userCollection.findOne({ _id: req._user })
      .populate('businessType')
      .exec();
    const businessTypes = userData?.businessType?.map(item => item?.businessType);
    const firstBusinessType = businessTypes[0];
    const salonData = result.filter((item) => {
      const businessTypes = item.businessTypeId.map(
        (type) => type.businessType
      );
      return businessTypes.includes(firstBusinessType);
    });
    console.log(salonData,"userDatauserData")

    if (!result) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: salonData,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getUserService = async (req, res) => {
  try {
    const addedBy = req._user;
    const result = await businessService.getUserService(addedBy);
    if (!result) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: result,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const response = await businessCollection.updateOne(
      { _id: req.params.id },
      {
        isDeleted: true,
      }
    );

    if (response) {
      return res.status(200).json({
        success: true,
        message: "Business Type Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Business Type category Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};


module.exports = {
  createBusinessType,
  getAllbussTypes,
  Delete,
  getAdminService,
  getUserService,
  getAllFrontendbussTypes,
  getAllFrontendbussTypesForsignup
};
