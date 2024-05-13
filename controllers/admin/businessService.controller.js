const businessServiceCollection = require("../../models/businessService");
const businessService = require("../../services/businessService.service");
const userCollection = require("../../models/user");
const goalsCompanyBudget = require("../../models/goalsCompanyBudget");
const Business = require("../../models/business");
const serviceSchema = require("../../models/serviceSetting");
const Mongoose = require("mongoose");


const createBusinessService = async (req, res) => {
  try {
    const { businessTypeId, service, price, hours, minutes } = req.body;

    const role = await userCollection.findOne({ _id: req._user });
    const existsBusinessType = await businessServiceCollection.find({
      businessTypeId: req.body.businessTypeId,
      isDeleted: false,
    });

    let obj = {};

    existsBusinessType &&
      existsBusinessType.length > 0 &&
      existsBusinessType.forEach((val) => {
        if (val.addedBy == req._user) {
          if (val?.service?.toLowerCase() === req.body.service?.toLowerCase()) {
            obj.service = val.service;
          }
        }
      });

    if (obj.service) {
      return res.status(201).json({
        status: 201,
        success: false,
        message: "Service already exists",
      });
    } else {
      let serviceTime = {
        hours,
        minutes,
      };

      let serviceObject = {
        businessTypeId,
        service,
        price: price,
        addedBy: req._user,
        role: role.role,
        serviceTime,
      };

      const createdService = await businessService.post(serviceObject);

      const getService = await goalsCompanyBudget.find({ addedBy: req._user });

      if (getService) {
        await goalsCompanyBudget.updateOne(
          { addedBy: req._user },
          { $push: { service: createdService } }
        );
      }

      return res.status(201).json({
        status: 200,
        success: true,
        message: "Business Service added successfully",
        data: createdService,
      });
    }

  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: error.message,
    });
  }
};


const getBusinessServiceWithPagination = async (req, res) => {
  try {
    let { pageNo, limit } = req.params;
    pageNo = Number(pageNo);
    limit = Number(limit);

    const response = await businessService
      .getService(pageNo, limit)
      .populate("businessTypeId")
      .populate("addedBy");

    const count = await businessServiceCollection.countDocuments({ isDeleted: false });

    if (response.length === 0) {
      return res.status(404).json({
        message: "Business Service not found",
      });
    }

    return res.status(200).json({
      message: "Business Service retrieved successfully",
      data: response,
      totalCount: count,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const getServiceByTypeId = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await businessService.getByTypeId(id);
   
    if (response.length === 0) {
      return res.status(404).json({
        message: "Data not found",
      });
    } else {
      return res.status(200).json({
        message: "Get Services Successfully",
        data: response,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const deleteBusinessService = async (req, res) => {
  try {
    const objectId = Mongoose.Types.ObjectId(req.params.id);

    const response = await businessServiceCollection.updateOne(
      { _id: objectId },
      {
        isDeleted: true,
      }
    );

    const goalstable = await goalsCompanyBudget.updateOne(
      { "service._id": objectId },
      { $set: { "service.$.isDeleted": true } }
    );

    const serviceSettingtable = await serviceSchema.findOneAndUpdate(
      {
        service: { $eq: objectId },
      },
      { $set: { isDeleted: true } }
    );

    if (response.nModified > 0) {
      return res.status(200).json({
        success: true,
        message: "Business Service Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No Business Service Found",
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


const editBusinessService = async (req, res, next) => {
  //  console.log("LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL")
  try {
    const Id = req.params.id;

    if (!Id) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "id is required",
      });
    }

    const existsBusinessType = await businessServiceCollection.find({
      businessTypeId: req.body.businessTypeId,
      isDeleted: false,
    });
  // return   console.log(existsBusinessType)

    let obj = {};

    existsBusinessType &&
      existsBusinessType.length > 0 &&
      existsBusinessType.forEach((val) => {
        if (
          val?.service?.toLowerCase() === req.body?.service?.toLowerCase()
        ) {
          obj.service = val.service;
        }
      });
    if (obj?.service) {

      return res.status(201).json({
        status: 201,
        success: false,
        message: "Service already exists",
      });
    } 
    
    else {
      const service = {
        businessTypeId: req.body.businessTypeId,
        service: req.body.service,
      };

      const result = await businessService.updateById(Id, service);
      const data = await goalsCompanyBudget.updateOne(
        { "service._id": Id },
        { $set: { "service.$.service": req.body.service } }
      );

      if (!result) {
        return res.status(401).json({
          status: 401,
          success: false,
          message: "Only admin can delete or modify project",
        });
      }

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Business Service updated successfully",
      });
    }
  } catch (error) {
    return res.status(401).json({
      status: 401,
      success: false,
      message: error.message,
    });
  }
};


const searchServices = async (req, res) => {
  try {
    let { text, page, limit } = req.query;
    let text1 = text.trim();
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    // Convert pageNo and limit to integers
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number or limit.",
      });
    }

    const totalCount = await businessServiceCollection.countDocuments({
      service: regex,
      isDeleted: false,
    });

    const totalPages = Math.ceil(totalCount / limit);
    const skipRecords = (page - 1) * limit;

    const response = await businessServiceCollection
      .find({ service: regex, isDeleted: false })
      .skip(skipRecords)
      .limit(limit)
      .populate("businessTypeId")
      .populate("addedBy")
      .sort({ _id: -1 });

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
      message: "Internal Server Error",
      error: error.message,
      success: false,
    });
  }
};


const getServicesByUserId = async (req, res) => {
  const id = req.params.id;
  try {
    const response = await businessService.getServiceById(id);
    if (response) {
      return res.status(200).json({
        success: true,
        message: "Services of this Id",
        data: response,
        status: 200,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No Service Found",
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



module.exports = {
  createBusinessService,
  getBusinessServiceWithPagination,
  deleteBusinessService,
  editBusinessService,
  searchServices,
  getServiceByTypeId,
  getServicesByUserId,
};
