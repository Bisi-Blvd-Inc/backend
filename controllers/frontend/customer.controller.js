const businessSchema = require("../../models/businessService");
const customerCollection = require("../../models/customer");
const userCollection  =  require("../../models/user");
const notificationCollection = require("../../models/notification")
const customerService = require("../../services/customer.service");
const calenderSettingService = require("../../services/schedule.service");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("secretKey");
const bookingService = require("../../services/booking.service");
const { returnAccountActivationMail } = require("../../helpers/users");

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      startDate,
      endDate,
      startDateTime,
      endDateTime,
      bookingType,
      availableSlot,
      benificialName,
      benificialEmail,
      benificialPhone,
      userId,
      selectedCountry,
      service,
    } = req.body;

    const customerId = await customerCollection.findOne({
      email: { $regex: new RegExp(email, "i") },
      userId: userId,
    });

    const customerData = {
      name,
      email: email?.toLowerCase(),
      phoneNumber,
      userId,
      selectedCountry,
    };

    if (startDate && endDate && bookingType) {
      customerData.startDate = startDate;
      customerData.endDate = endDate;
      customerData.benificialName = benificialName;
      customerData.benificialEmail = benificialEmail;
      customerData.benificialPhone = benificialPhone;
      customerData.startDateTime = startDateTime;
      customerData.endDateTime = endDateTime;
      customerData.service = service;
    }

    if (customerId) {
      const newObj = {
        ...customerData,
        bookingFor: bookingType === "self" ? userId : customerId._id,
        bookedBy: userId,
      };

      const bookingCustomer = await bookingService.post(newObj);

      if (bookingCustomer) {
        const schedule = await calenderSettingService.find({
          addedBy: userId,
        });

        const Id = schedule._id;
        const obj = {
          scheduledData: availableSlot,
        };
        await calenderSettingService.update(Id, obj);
      }

      return res.status(200).json({
        status: 200,
        data: bookingCustomer,
        message: "Customer booking successful",
      });
    } else {
      const createdCustomer = await customerService.post(customerData);

      const newObj = {
        ...customerData,
        bookingFor: bookingType === "self" ? userId : createdCustomer._id,
        bookedBy: userId,
      };

      const bookingCustomer = await bookingService.post(newObj);

      if (bookingCustomer) {
        const schedule = await calenderSettingService.find({
          addedBy: userId,
        });

        const Id = schedule._id;
        const obj = {
          scheduledData: availableSlot,
        };
        await calenderSettingService.update(Id, obj);
      }

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Customer booking successful",
        data: bookingCustomer,
      });
    }
  } catch (error) {
    const code = 500;
    return res.status(code).json({ code, message: error.message });
  }
};
const resendmail = async (req, res) => {
  try {
   
    
    const email = req?.body?.emaii;
    const checkstatus =  await userCollection.findOne({email : req?.body?.emaii})
    if (checkstatus.status == 0) {
      returnAccountActivationMail(email)
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Activation email has been sent. Please check your email",
      });
    }
    else {
      // returnAccountActivationMail(email)
      return res.status(200).json({
        status: 201,
        success: true,
        message: "Account is be already activated",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
const createclient = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      userId,
      selectedCountry,
      role
    } = req.body;
    const customerData = {
      name,
      email: email?.toLowerCase(),
      phoneNumber,
      userId,
      selectedCountry,
      role
    };
    const customerId = await customerCollection.findOne({
      email: { $regex: new RegExp(email, "i") },
      userId: userId,
    })
    if(customerId){
      return res.status(201).json({
        status: 200,
        data: customerId,
        message: "Client already created",
      });
    }
    else{
      const createdCustomer = await customerService.post(customerData);
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Client created",
        data: createdCustomer,
      });
    }

    
  } catch (error) {
    const code = 500;
    return res.status(code).json({ code, message: error.message });
  }
};

const getUserServices = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await businessSchema.find({ addedBy: id });
    if (!result) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "services get successfully",
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

const decryptId = async (req, res) => {
  try {
    const { token } = req.body;
    const decryptedString = cryptr.decrypt(token);

    if (!decryptedString) {
      return res.status(200).json({
        message: "decrypt not successfully",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "decryptedString successfully",
        data: decryptedString,
        status: 200,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getAllCustomers = async (req, res) => {
  try {
    let { pageNo, limit } = req.params;
    const { userId } = req.body;
    const response = await customerService.getUserWithPagination(
      userId,
      Number(pageNo),
      Number(limit)
    );

    const count = await customerCollection.count({ userId: userId });
    if (!response) {
      return res.status(200).json({
        message: "Client not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Clients get successfully",
        data: response,
        totalCount: count,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getbyCustomersid = async (req, res) => {
  try {
    let { id } = req.params;
    const response = await customerService.getUserbyid(
      id

    );
    if (!response) {
      return res.status(200).json({
        message: "Client not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Clients get successfully",
        data: response,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const userDelete = async (req, res) => {
  try {
    const response = await customerCollection.findByIdAndDelete({
      _id: req.params.id,
    });

    if (response) {
      const response1 = await notificationCollection.deleteOne({ customerId: req.params.id });
    }
    if (response) {
      return res.status(200).json({
        success: true,
        message: "Client Deleted Successfully ",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Client Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const userSearch = async (req, res) => {
  try {
    let { text, pageNo, limit } = req.query;
    let text1 = text.trim();
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const response = await customerCollection
      .find({ userId: req._user, name: regex })
      .skip((pageNo - 1) * limit)
      .limit(Number(limit))
      .populate("service");

    if (response) {
      return res.status(200).json({
        success: true,
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No User Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const editBookingUser = async (req, res, next) => {
  try {
    const { name, phoneNumber, selectedCountry, email, address, dob, userProfileImg, tags } =
      req.body;
    const Id = req.params.id;
    if (!Id)
      return res.status(200).json({
        status: 401,
        success: false,
        message: "Id is required ",
      });
    if (req.file) {
      const data = {
        name: name,
        phoneNumber: phoneNumber,
        address: address,
        dob: dob,
        email: email,
        selectedCountry,
      };
      let userProfileImg = req.file.filename;
      data.userProfileImg = userProfileImg;

      let result = await customerService.update(Id, data);
      return res.status(200).json({
        status: 200,
        success: true,
        data: result,
        message: "Client updated successfully",
      });
    } else {
      const data = {
        name: name,
        phoneNumber: phoneNumber,
        address: address,
        dob: dob,
        email: email,
        selectedCountry,
        tags: tags,
      };
      let result = await customerService.update(Id, data);

      if (result.bookingId) {
        let result1 = await bookingService.update(
          {
            _id: result.bookingId,
          },
          { $set: { ...data } },
          { fields: { _id: 1 }, new: true }
        );
      }

      return res.status(200).json({
        status: 200,
        success: true,
        data: result,
        message: "Client updated successfully",
      });
    }

  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};



module.exports = {
  createCustomer,
  getUserServices,
  decryptId,
  getAllCustomers,
  getbyCustomersid,
  userDelete,
  userSearch,
  editBookingUser,
  createclient,
  resendmail
};
