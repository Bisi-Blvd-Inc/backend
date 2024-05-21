const serviceSettingCollection = require("../../models/serviceSetting");
const businessService = require("../../models/businessService");
const userCollection = require("../../models/user");
const mongoose = require("mongoose");
const emailSettingService=require('../../models/emailSetting')
const createService = async (req, res) => {
  try {
    const { service } = req.body;
    const serviceSetting = await serviceSettingCollection.findOne({
      addedBy: req._user,
    });
    const serviceData = await businessService.find({
      addedBy: req._user,
    });
    const updatedServiceSettings = service?.map((serviceId, index) => {
      const matchingServiceData = serviceData?.find((data) => {
        return String(data._id) === String(serviceId);
      });
      let admin_price;
      let admin_servicetime;
      if (matchingServiceData == undefined) {
        const nonMatchingElements = serviceSetting?.service?.filter(
          (obj2) => obj2?.serviceId == serviceId
        );
        admin_price = nonMatchingElements?.length > 0 ? nonMatchingElements[0]?.price : 0;
        
        admin_servicetime=nonMatchingElements?.length > 0 ?nonMatchingElements[0]?.serviceTime: 0;
      }
      const serviceTime =matchingServiceData?  matchingServiceData?.serviceTime: admin_servicetime;
      const finalPrice = matchingServiceData
        ? matchingServiceData?.price
        : admin_price;

      return {
        _id: new mongoose.Types.ObjectId(),
        serviceId: new mongoose.Types.ObjectId(serviceId),
        price: finalPrice,
        serviceTime: serviceTime,
        addedBy: new mongoose.Types.ObjectId(req._user),
      };
    });
    
   

    if (serviceSetting) {
      const remove_array = [];
      const businessnonmatching = serviceData.filter((obj2) => {
        const isMatching = service.some(
          (id1) => String(id1) === String(obj2._id)
        );
        if (!isMatching) {
          remove_array.push(obj2._id);
        }
        return !isMatching;
      });

      serviceSetting.service = updatedServiceSettings;
      await serviceSetting.save();

      if (remove_array.length > 0) {
        const filter = {
          "service.serviceId": { $in: service },
          addedBy: new mongoose.Types.ObjectId(req._user),
        };
        const update = {
          $pull: { service: { serviceId: { $in: remove_array } } },
        };
        const result = await serviceSettingCollection.updateOne(filter, update);
      }
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Services updated successfully",
      });
    } else {
      const createdType = await serviceSettingCollection.create({
        service: updatedServiceSettings,
        addedBy: req._user,
      });


      return res.status(200).json({
        status: 200,
        success: true,
        message: "Services added successfully.",
        data: createdType,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "An error occurred.",
      error: error.message,
    });
  }
};

const updateStripeDetail = async (req, res) => {
  try {
    const Id = req._user;
    const { secretKey, publicKey } = req.body;

    const user = await userCollection.findById(Id);

    if (user) {
      const obj = {
        secretKey: secretKey,
        publicKey: publicKey,
      };
      let result = await userCollection.findByIdAndUpdate(
        {
          _id: Id,
        },
        { $set: { ...obj } },
        { fields: { _id: 1 }, new: true }
      );
      return res.status(200).json({
        status: 200,
        success: true,
        data: result,
        message: "Stripe details updated successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID provided",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "An error occurred.",
      error: error.message,
    });
  }
};

const getService = async (req, res) => {
  try {
    const result = await serviceSettingCollection
      .find({ addedBy: req._user })
      .populate("service.serviceId", null, { isDeleted: false });

    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Service get successfully",
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

const updateService = async (req, res) => {
  try {
    const { id, price, serviceHours,serviceMinutes } = req.body;
    if (!id)
      return res.status(401).json({
        success: false,
        message: "Invalid Service ID provided",
      });
    if (!price)
      return res.status(401).json({
        success: false,
        message: "Price is required",
      });
    const check_service = await serviceSettingCollection.findOne({
      addedBy: new mongoose.Types.ObjectId(req._user),
    });

    check_service.service;

    const serviceTime = {
      hours:serviceHours,
      minutes:serviceMinutes,
    }

    for (let i = 0; i < check_service.service.length; i++) {
      const service = check_service.service[i];
      if (service._id == id) {
        service.price = price;
        service.serviceTime = serviceTime
      }
    }
    await check_service.save();

    return res.status(200).json({
      message: "Service Update successfully",
      data: check_service,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const createEmailSetting = async (req, res) => {
  try {
    
    const userId=req._user
    let {description1,description2,ending}=req.body
    description1=description1?.trim()
    description2=description2?.trim()
    ending=ending?.trim()

    //check if user already done setting
    const emailSettingData=await emailSettingService.findOne({addedBy:userId})
    
    if(emailSettingData){
      //user already did some settings, so just update that document
      emailSettingData.description1=description1
      emailSettingData.description2=description2
      emailSettingData.endsWith=ending
      await emailSettingData.save()
      
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Setting updated successfully",
      });
    }
    else{
      //user never did any setting, so create new document
      const createSetting=await emailSettingService.create({
        description1,
        description2,
        endsWith:ending,
        addedBy:userId
      })
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Setting created successfully",
      });
    }
    
  } catch (error) {
   console.log(error)
    return res.status(500).json({
      status: 500,
      success: false,
      message: "An error occurred.",
      error: error.message,
    });
  }
};

const getEmailSetting = async (req, res) => {
  try {
    
    const userId=req._user
    const emailSettingData=await emailSettingService.findOne({addedBy:userId})
    
 
      
      return res.status(200).json({
        status: 200,
        success: true,
        emailSettingData,
      })
    
  } catch (error) {
   console.log(error)
    return res.status(500).json({
      status: 500,
      success: false,
      message: "An error occurred.",
      error: error.message,
    });
  }
};

module.exports = {
  createService,
  getService,
  updateStripeDetail,
  updateService,
  createEmailSetting,
  getEmailSetting
};
