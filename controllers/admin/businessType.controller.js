const businessService = require("../../services/business.service");
const { pick } = require("lodash");

const createBusinessType = async (req, res) => {
  try {
    const { businessType } = req.body;
    const type = { businessType };

    const exist = await businessService.findOne({
      businessType,
      isDeleted: false,
    });

    if (exist) {
      return res.status(201).json({
        message: "Business type already exists",
      });
    } else {
      const createdType = await businessService.post(type);
      return res.status(201).json({
        success: true,
        message: "Type added successfully",
        data: createdType,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const getAllBusinessTypes = async (req, res) => {
  try {
    const result = await businessService.getAll();

    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    return res.status(200).json({
      message: "Data retrieved successfully",
      data: result,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const editBusinessType = async (req, res, next) => {
  try {
    const businessId = req.params.id;
    if (!businessId)
      return res.status(200).json({
        status: 401,
        success: false,
        message: "businessId is required ",
      });
    let data = pick(req.body, ["isDeleted", "businessType"]);
    const businessData = await businessService.find({
      businessType: data.businessType,
    });

    let message = "Business Type updated successfully";
    if (data.isDeleted) {
      message = "Business Type Deleted successfully";
    }

    const resultdata = businessData.filter((val) => {
      if (val.businessType === data.businessType) {
        return val.businessType;
     
      }
    });
    let obj = {};
    resultdata.map((val) => {
      if (val.businessType === data.businessType) {
        obj.type = val.businessType;
      }
    });

   
    if (obj.type === data.businessType) {
      return res.status(200).json({
        status: 400,
        message: "Business type already exist",
      });
    } else {
      let result = await businessService.update(
        {
          _id: businessId,
        },
        { $set: data },
        { fields: { _id: 1 }, new: true }
      );

      if (!result)
        return res.status(200).json({
          status: 401,
          success: false,
          message: "Only admin can delete or modify project",
        });
      return res.status(200).json({
        status: 200,
        success: true,
        result,
        message: "Business Type updated successfully",
      });
    }
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const getAllWithPagination = async (req, res) => {
  try {
    let { pageNo, limit } = req.params;
    pageNo = Number(pageNo);
    limit = Number(limit);

    const result = await businessService.getAllPagination(pageNo, limit);
    const count = await businessService.countDocuments();

    if (result.length === 0) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    return res.status(200).json({
      message: "Data retrieved successfully",
      data: result,
      totalCount: count,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getById = async (req, res) => {
  const id = req.params.id;

  try {
    const response = await businessService.getById(id);

    if (response) {
      return res.status(200).json({
        success: true,
        data: response,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No Data Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
      success: false,
    });
  }
};

const Search = async (req, res) => {
  try {
    let { page, limit, text } = req.query;
    let text1 = text.trim();
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number or limit.",
      });
    }

    const totalCount = await businessService.countDocuments({
      businessType: regex,
    });

    const totalPages = Math.ceil(totalCount / limit);
    const skipRecords = (page - 1) * limit;

    const response = await businessService
      .find({ businessType: regex })
      .sort({ createdAt: 1 })
      .skip(skipRecords)
      .limit(limit)
      .populate("businessTypeId")
      .populate("addedBy");

    if (response.length > 0) {
      return res.status(200).json({
        success: true,
        data: response,
        count: totalCount,
        totalPages: totalPages,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No Service Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const usersStatus = async (req, res) => {
  try {
    console.log(req?.params?.status,"req.params.statusreq.params.statusreq.params.statusreq.params.status")
    const conditions = {
      _id: req.params.id,
    };
    if (req?.params?.status == "false") {
      const payload = {
        isDeleted: true,
      };
      let result = await businessService.updatestatus(conditions, payload);
      return res.status(200).json({
        message: "Service disabled successfully",
        status: 201,
        data: result,
      });
    } else {
      const payload = {
        isDeleted: false,
      };

      let result = await businessService.updatestatus(conditions, payload);
      return res.status(200).json({
        message: "Service enabled successfully",
        status: 200,
        data: result
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error,
      status: 500,
    });
  }
};

module.exports = {
  createBusinessType,
  getAllBusinessTypes,
  // Delete,
  editBusinessType,
  getAllWithPagination,
  getById,
  Search,
  usersStatus
};
