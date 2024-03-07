const giftCertificateservice = require("../../services/giftCertificate.services");
const Mongoose = require("mongoose");
const bookingCollection = require("../../models/booking");

const getGiftCertificateList = async (req, res) => {
  try {
    const customerId = req.params.id;
    const userId = req._user;
    
    const invoices = await giftCertificateservice.findgiftcutomerID({
      customerId,
      userId,
      bookingType: "giftcertificate",
    });

    return res.status(200).json({
      code: 200,
      message: "Data fetched",
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

const searchgiftDateandName = async (req, res) => {
  try {
    let {startDate,val, id } = req.query;
    const bookedBy = Mongoose.Types.ObjectId(req._user);
    let text1 = val.trim()
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');  
    const query = {};
    if (startDate) {
      query["startDate"] = startDate;
    }
    if (bookedBy) {
      query["userId"] = bookedBy;
    }
    if(id) {
 
       query["customerId"] = Mongoose.Types.ObjectId(id)
       query["bookingType"] = "giftcertificate"
    }
   
    if (val !== "undefined" && val) {
      query["bookingFor"] = {
        $elemMatch: {
          $and :[ { "name" :{ $regex: regex } }]
        }
      }
    }
  

    const response = await bookingCollection.aggregate([
      {
        $project: {
          startDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$startDate",
            },
          },
          name: 1,
          email: 1,
          service: 1,
          paymentType: 1,
          startDateTime: 1,
          endDateTime: 1,
          location: 1,
          address: 1,
          lat: 1,
          lng: 1,
          distanceField: 1,
          createdAt: 1,
          eventColor: 1,
          userId: 1,
          bookingStatus: 1,
          bookingFor: 1,
          customerId: 1,
          bookingType:1
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "bookingFor",
          foreignField: "_id",
          as: "bookingFor",
        },
      },
    
      {
        $lookup: {
          from: "businessService",
          localField: "service",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $match: query,
   
      },
    ]);

    if (response) {
      return res.status(200).json({
        success: true,
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Data Found",
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
  getGiftCertificateList,
  searchgiftDateandName
};
