const bookingService = require("../../services/booking.service");
const customerCollection = require("../../services/customer.service");
const customerService = require("../../services/customer.service");
const bookingCollection = require("../../models/booking");
const notificationCollection = require("../../models/notification");
const calenderSettingService = require("../../services/schedule.service");
const serviceName = require("../../models/businessService");
const serviceSetting = require("../../models/serviceSetting");
const BookingLink = require("../../models/customizedLink");
const moment = require("moment");
const { sendBookingMail, cancelBookingMail } = require("../../helpers/users");
const { smtpSms } = require("../../helpers/twilio");
const Mongoose = require("mongoose");
const { pick } = require("lodash");
const businessService = require("../../services/business.service");
const emailSettingService=require("../../models/emailSetting")
const createBooking = async (req, res) => {
  try {
    let {
      name,
      email,
      phoneNumber,
      startDate,
      startDateTime,
      endDateTime,
      endDate,
      paymentType,
      servicePrice,
      benificialName,
      bookingType,
      benificialEmail,
      benificialPhone,
      bookingStatus,
      selectedCountry,
      availableSlot,
      selectedBenificialCountry,
      service,
      scheduleexist,
    } = req.body;
    const userId = req._user;
    
    if (availableSlot == null || availableSlot == "null") {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        status: 500,
      });
    }
    const serviceVal = [];
    const serviceData = service.map(async (item) => {
      serviceVal.push(Mongoose.Types.ObjectId(item));
    });
    const singleBooking = await serviceName.find({
      _id: {
        $in: serviceVal,
      },
    });
    const serviceDuration = await serviceSetting.find({ addedBy: userId });
    const serviceValSet = new Set(serviceVal.map((val) => val.toString()));
    const serviceTime = serviceDuration[0].service;

    let totalHours = 0;
    let totalMinutes = 0;

    serviceTime.forEach((service) => {
      const serviceIdString = service.serviceId.toString();
      if (serviceValSet.has(serviceIdString)) {
        totalHours += service.serviceTime.hours;
        totalMinutes += service.serviceTime.minutes;
      }
    });
    if (totalMinutes >= 60) {
      const extraHours = Math.floor(totalMinutes / 60);
      totalHours += extraHours;
      totalMinutes -= extraHours * 60;
    }
    const ServiceDuration = `${totalHours} hours ${totalMinutes} minutes`;
    const servicess = singleBooking.map((item) => {
      return item.service;
    });
    const exist = await customerCollection.findOne({
      email: email?.toLowerCase(),
      userId: Mongoose.Types.ObjectId(userId),
    });
    const obj = {
      name: name,
      email: email?.toLowerCase(),
      phoneNumber: phoneNumber,
      userId: userId,
      startDate: startDate,
      paymentType: paymentType,
      endDate: endDate,
      servicePrice: servicePrice,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      bookingType: bookingType,
      selectedCountry: selectedCountry,
      selectedBenificialCountry: selectedBenificialCountry,
      service: service,
      bookingStatus: bookingStatus,
      benificialName: benificialName,
      benificialEmail: benificialEmail,
      benificialPhone: benificialPhone,
      scheduleexist: scheduleexist,
    };

    //email setting data
    const emailSettingData=await emailSettingService.findOne({addedBy:userId})
    const description1=emailSettingData?.description1 || ""
    const description2=emailSettingData?.description2 || ""
    const endsWith=emailSettingData?.endsWith || ""

    console.log(emailSettingData,description1,description2,endsWith," maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

    if (exist) {
      if (bookingType == "self") {
        const alreadySchdule = await bookingCollection.find({
          startDateTime: startDateTime,
        });
        if (alreadySchdule?.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Schedule is already booked",
            status: 400,
          });
        }
        const newObj = {
          ...obj,
          customerId: exist?._id,
          bookingFor: exist?._id,
          selectedBenificialCountry: selectedBenificialCountry,
          bookedBy: userId,
        };
        const createdBooking = await bookingService.post(newObj);
        const bookingId = createdBooking?._id;
        const userData = await bookingService.findById(bookingId);
        const bookingStatusVal = createdBooking.bookingStatus;
        const bookingDate = createdBooking.startDateTime.slice(0, 15);
        var dateObj = moment(
          createdBooking?.startDateTime,
          "ddd MMM DD YYYY hh:mm:A"
        );
        var time = dateObj.format("hh:mm:A");
        const price = servicePrice ? servicePrice : "UnPaid";
        sendBookingMail(
          email,
          name,
          servicess,
          bookingDate,
          ServiceDuration,
          time,
          bookingStatusVal,
          bookingId,
          price,
          description1,
          description2,
          endsWith
        );
        if (createdBooking) {
          const schedule = await calenderSettingService.find({
            addedBy: req._user,
          });

          const Id = schedule?._id;
          const obj = {
            scheduledData: availableSlot,
          };
          let result = await calenderSettingService.update(Id, obj);
        }
        const countryCode = createdBooking.selectedCountry.split(" ")[1];
        let smsData = {
          to: `${countryCode}${createdBooking.phoneNumber}`,
          text: "Your Booked Service Appointment is confirmed.",
        };
        await smtpSms(smsData);

        return res.status(200).json({
          success: true,
          message: "Booking added successfully",
          data: createdBooking,
          status: 200,
        });
      } else if (bookingType === "giftcertificate") {
        const alreadySchdule = await bookingCollection.find({
          startDateTime: startDateTime,
        });
        if (alreadySchdule.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Schedule is already booked",
            status: 400,
          });
        }
        if (benificialEmail) {
          const gift = await customerCollection.findOne({
            email: benificialEmail,
            userId: Mongoose.Types.ObjectId(userId),
          });
          if (gift) {
            const newObj = {
              ...obj,
              customerId: exist?._id,
              bookingFor: gift?._id,
              selectedBenificialCountry: selectedBenificialCountry,
              bookedBy: userId,
            };
            const createdBooking = await bookingService.post(newObj);
            const bookingId = createdBooking?._id;
            const userData = await bookingService.findById(bookingId);
            const bookingStatusVal = createdBooking.bookingStatus;
            const bookingDate = createdBooking.startDateTime.slice(0, 15);
            var dateObj = moment(
              createdBooking?.startDateTime,
              "ddd MMM DD YYYY hh:mm:A"
            );
            var time = dateObj.format("hh:mm:A");
            const price = servicePrice ? servicePrice : "UnPaid";

            sendBookingMail(
              email,
              name,
              servicess,
              bookingDate,
              ServiceDuration,
              time,
              bookingStatusVal,
              bookingId,
              price,
              description1,
              description2,
              endsWith
            );

            if (createdBooking) {
              const schedule = await calenderSettingService.find({
                addedBy: req._user,
              });

              const Id = schedule?._id;
              const obj = {
                scheduledData: availableSlot,
              };
              let result = await calenderSettingService.update(Id, obj);
            }
            const countryCode = createdBooking.selectedCountry.split(" ")[1];
            let smsData = {
              to: `${countryCode}${createdBooking.phoneNumber}`,
              text: "Your Booked Service Appointment is confirmed.",
            };

            await smtpSms(smsData);

            return res.status(200).json({
              success: true,
              message: "Booking added successfully",
              data: createdBooking,
              status: 200,
            });
          } else {
            const obj4 = {
              name: benificialName,
              email: benificialEmail?.toLowerCase(),
              phoneNumber: benificialPhone,
              userId: userId,
              startDate: startDate,
              servicePrice: servicePrice,
              endDate: endDate,
              startDateTime: startDateTime,
              paymentType: paymentType,
              endDateTime: endDateTime,
              service: service,
              bookingType: bookingType,
              selectedBenificialCountry: selectedBenificialCountry,
              bookingStatus: bookingStatus,
              benificialName: "",
              benificialEmail: "",
              benificialPhone: "",
            };
            const createCustomer = await customerService.post(obj4);
            const newObj = {
              ...obj,
              customerId: exist?._id,
              bookingFor: createCustomer?._id,
              selectedBenificialCountry: selectedBenificialCountry,
              bookedBy: userId,
            };
            const createdBooking = await bookingService.post(newObj);
            const bookingId = createdBooking?._id;
            const userData = await bookingService.findById(bookingId);
            const bookingStatusVal = createdBooking.bookingStatus;
            const bookingDate = createdBooking.startDateTime.slice(0, 15);
            var dateObj = moment(
              createdBooking?.startDateTime,
              "ddd MMM DD YYYY hh:mm:A"
            );
            var time = dateObj.format("hh:mm:A");
            const price = servicePrice ? servicePrice : "UnPaid";

            sendBookingMail(
              email,
              name,
              servicess,
              bookingDate,
              ServiceDuration,
              time,
              bookingStatusVal,
              bookingId,
              price,
              description1,
              description2,
              endsWith
            );
            if (createdBooking) {
              const schedule = await calenderSettingService.find({
                addedBy: req._user,
              });

              const Id = schedule?._id;
              const obj = {
                scheduledData: availableSlot,
              };
              let result = await calenderSettingService.update(Id, obj);
            }
            const countryCode = createdBooking.selectedCountry.split(" ")[1];

            let smsData = {
              to: `${countryCode}${createdBooking.phoneNumber}`,
              text: "Your Booked Service Appointment is confirmed.",
            };

            await smtpSms(smsData);

            return res.status(200).json({
              success: true,
              message: "Booking added successfully",
              data: createdBooking,
              status: 200,
            });
          }
        }
      }
    } else {
      const obj3 = {
        name: name,
        email: email?.toLowerCase(),
        phoneNumber: phoneNumber,
        userId: userId,
        startDate: startDate,
        servicePrice: servicePrice,
        endDate: endDate,
        startDateTime: startDateTime,
        paymentType: paymentType,
        endDateTime: endDateTime,
        service: service,
        bookingType: bookingType,
        bookingStatus: bookingStatus,
        benificialName: benificialName,
        selectedCountry: selectedCountry,
        selectedBenificialCountry: selectedBenificialCountry,
        benificialEmail: benificialEmail,
        benificialPhone: benificialPhone,
      };
      if (bookingType == "self") {
        const alreadySchdule = await bookingCollection.find({
          startDateTime: startDateTime,
        });
        if (alreadySchdule.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Schedule is already booked",
            status: 400,
          });
        }
        const createCustomer = await customerService.post(obj3);
        const newObj = {
          ...obj,
          customerId: createCustomer?._id,
          bookingFor: createCustomer?._id,
          selectedBenificialCountry: selectedBenificialCountry,
          bookedBy: userId,
        };

        const createdBooking = await bookingService.post(newObj);
        const data = {
          ...obj3,
          bookingId: createdBooking?._id,
        };
        const CustomerId = createCustomer?._id;
        let result = await customerService.update(CustomerId, data);

        const bookingStatusVal = createdBooking.bookingStatus;
        const bookingId = createdBooking?._id;
        const userData = await bookingService.findById(bookingId);
        const bookingDate = createdBooking.startDateTime.slice(0, 15);
        var dateObj = moment(
          createdBooking?.startDateTime,
          "ddd MMM DD YYYY hh:mm:A"
        );
        var time = dateObj.format("hh:mm:A");
        const price = servicePrice ? servicePrice : "UnPaid";

        sendBookingMail(
          email,
          name,
          servicess,
          bookingDate,
          ServiceDuration,
          time,
          bookingStatusVal,
          bookingId,
          price,
          description1,
              description2,
          endsWith
        );
        if (createdBooking) {
          const schedule = await calenderSettingService.find({
            addedBy: req._user,
          });

          const Id = schedule?._id;
          const obj = {
            scheduledData: availableSlot,
          };
          let result = await calenderSettingService.update(Id, obj);
        }
        const countryCode = createdBooking.selectedCountry.split(" ")[1];
        let smsData = {
          to: `${countryCode}${createdBooking.phoneNumber}`,
          text: "Your Booked Service Appointment is confirmed.",
        };

        await smtpSms(smsData);

        return res.status(200).json({
          success: true,
          message: "Booking added successfully",
          data: createdBooking,
          status: 200,
        });
      } else if (bookingType == "giftcertificate") {
        const alreadySchdule = await bookingCollection.find({
          startDateTime: startDateTime,
        });
        if (alreadySchdule.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Schedule is already created",
            status: 400,
          });
        }
        const gift = await customerCollection.findOne({
          email: benificialEmail,
          userId: Mongoose.Types.ObjectId(userId),
        });

        if (gift) {
          const createCustomer = await customerService.post(obj3);

          const newObj = {
            ...obj,
            customerId: createCustomer?._id,
            bookingFor: gift?._id,
            selectedBenificialCountry: selectedBenificialCountry,
            bookedBy: userId,
          };
          const createdBooking = await bookingService.post(newObj);
          const data = {
            ...obj3,
            bookingId: createdBooking?._id,
          };
          const CustomerId = createCustomer?._id;
          let result = await customerService.update(CustomerId, data);

          const bookingStatusVal = createdBooking.bookingStatus;
          const bookingId = createdBooking?._id;
          const bookingDate = createdBooking.startDateTime.slice(0, 15);
          var dateObj = moment(
            createdBooking?.startDateTime,
            "ddd MMM DD YYYY hh:mm:A"
          );
          var time = dateObj.format("hh:mm:A");
          const price = servicePrice ? servicePrice : "UnPaid";

          sendBookingMail(
            email,
            name,
            servicess,
            bookingDate,
            ServiceDuration,
            time,
            bookingStatusVal,
            bookingId,
            price,
            description1,
              description2,
            endsWith
          );
          if (createdBooking) {
            const schedule = await calenderSettingService.find({
              addedBy: req._user,
            });

            const Id = schedule?._id;
            const obj = {
              scheduledData: availableSlot,
            };

            let result = await calenderSettingService.update(Id, obj);
          }
          const countryCode = createdBooking.selectedCountry.split(" ")[1];
          let smsData2 = {
            to: `${countryCode}${createdBooking.phoneNumber}`,
            text: "Your Booked Service Appointment is confirmed.",
          };

          await smtpSms(smsData2);
          return res.status(200).json({
            success: true,
            message: "Booking added successfully",
            data: createdBooking,
            status: 200,
          });
        } else if (gift === null) {
          const createCustomers = await customerService.post(obj3);
          const obj4 = {
            name: benificialName,
            email: benificialEmail?.toLowerCase(),
            phoneNumber: benificialPhone,
            userId: userId,
            startDate: startDate,
            servicePrice: servicePrice,
            endDate: endDate,
            startDateTime: startDateTime,
            paymentType: paymentType,
            endDateTime: endDateTime,
            service: service,
            bookingType: bookingType,
            selectedBenificialCountry: selectedBenificialCountry,
            bookingStatus: bookingStatus,
            benificialName: "",
            benificialEmail: "",
            benificialPhone: "",
          };
          const createCustomer = await customerService.post(obj4);
          const newObj = {
            ...obj3,
            customerId: createCustomers?._id,
            bookingFor: createCustomer?._id,
            bookedBy: userId,
          };
          const createdBooking = await bookingService.post(newObj);

          const data = {
            ...obj4,
            bookingId: createdBooking?._id,
          };
          const CustomerId = createCustomer?._id;
          let result = await customerService.update(CustomerId, data);

          const bookingStatusVal = createdBooking.bookingStatus;
          const bookingId = createdBooking?._id;

          const userData = await bookingService.findById(bookingId);

          const bookingDate = createdBooking.startDateTime.slice(0, 15);
          var dateObj = moment(
            createdBooking?.startDateTime,
            "ddd MMM DD YYYY hh:mm:A"
          );
          var time = dateObj.format("hh:mm:A");
          const price = servicePrice ? servicePrice : "UnPaid";

          sendBookingMail(
            email,
            name,
            servicess,
            bookingDate,
            ServiceDuration,
            time,
            bookingStatusVal,
            bookingId,
            price,
            description1,
              description2,
            endsWith
          );
          if (createdBooking) {
            const schedule = await calenderSettingService.find({
              addedBy: req._user,
            });

            const Id = schedule?._id;
            const obj = {
              scheduledData: availableSlot,
            };

            let result = await calenderSettingService.update(Id, obj);
          }
          const countryCode = createdBooking.selectedCountry.split(" ")[1];

          let smsData2 = {
            to: `${countryCode}${createdBooking.phoneNumber}`,
            text: "Your Booked Service Appointment is confirmed.",
          };

          await smtpSms(smsData2);

          return res.status(200).json({
            success: true,
            message: "Booking added successfully",
            data: createdBooking,
            status: 200,
          });
        }
      }
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const singleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const singleBooking = await bookingService.findById(id);

    return res.status(200).json({
      code: 200,
      message: "Data fetched",
      data: singleBooking,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const allBookingList = async (req, res) => {
  try {
    const userId = req._user;
    const getBookingList = await bookingService.GetAllListwithLimit(userId);

    return res.status(200).json({
      code: 200,
      message: "Data fetched",
      data: getBookingList,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const allConfirmedBooking = async (req, res) => {
  try {
    const userId = req._user;
    const getBookingList = await bookingService.allConfirmedBooking(userId);

    return res.status(200).json({
      code: 200,
      message: "Data fetched",
      data: getBookingList,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const bookingSearch = async (req, res) => {
  try {
    const userId = req._user;
    const { name } = req.query;
    const booking = await bookingService.findByName(name, userId);

    return res.status(200).json({
      code: 200,
      message: "Data fetched",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

const AppointmentbookingSearch = async (req, res) => {
  try {
    const userId = req.params.id;

    const appointments = await bookingService.findBycutomerID({
      bookingFor: userId,
      bookedBy: req._user,
    });

    return res.status(200).json({
      code: 200,
      message: "Data fetched",
      data: appointments,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

const bookingFilter = async (req, res) => {
  try {
    const {
      endDate,
      paymentType,
      startDate,
      name,
      lat,
      lng,
      day,
      week,
      month,
      service,
    } = req.body;

    const query = [];
    let aggregrationQuery = [];

    if (day) {
      query.push({ startDate: moment(new Date()).format("YYYY-MM-DD") });
    }
    if (week) {
      const TODAY_MINUS_7_B = new Date(new Date() - 7 * 24 * 60 * 60 * 1000);
      query.push({
        startDate: {
          $gte: moment(TODAY_MINUS_7_B).format("YYYY-MM-DD"),
          $lte: moment(new Date()).format("YYYY-MM-DD"),
        },
      });
    }
    if (month) {
      var currentDate = new Date();
      var lastMonthDate = new Date(
        currentDate.setMonth(currentDate.getMonth() - 1)
      );
      query.push({
        startDate: {
          $gte: moment(lastMonthDate).format("YYYY-MM-DD"),
          $lte: moment(new Date()).format("YYYY-MM-DD"),
        },
      });
    }

    if (paymentType) {
      query.push({ paymentType: paymentType });
    }

    if (startDate && endDate) {
      query.push({
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      });
    } else {
      if (startDate) {
        query.push({
          startDate: { $gte: startDate },
          endDate: { $lte: moment(new Date()).format("YYYY-MM-DD") },
        });
      }
      if (endDate) {
        var currentDate = new Date();
        var lastMonthDate = new Date(
          currentDate.setMonth(currentDate.getMonth() - 60)
        );
        query.push({
          startDate: {
            $gte: moment(lastMonthDate).format("YYYY-MM-DD"),
            $lte: endDate,
          },
        });
      }
    }
    if (name) {
      query.push({ name: name });
    }

    if (service) {
      query.push({ "service._id": Mongoose.Types.ObjectId(req.body.service) });
    }

    if (lat && lng) {
      aggregrationQuery.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distanceField",
          spherical: true,
          distanceMultiplier: 0.001,
          maxDistance: 3 * 1000,
        },
      });
    }

    aggregrationQuery = [
      ...aggregrationQuery,
      {
        $project: {
          startDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$startDate",
            },
          },
          endDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$endDate",
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
    ];

    if (query.length > 0) {
      aggregrationQuery = [
        ...aggregrationQuery,

        {
          $match: { $and: query },
        },
      ];
    }

    const booking = await bookingCollection.aggregate(aggregrationQuery);
    const newVar = booking.filter((val1) => {
      return val1.userId?._id == req._user;
    });

    return res.status(200).json({ code: 200, data: newVar });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const bookingFilterConfirmed = async (req, res) => {
  try {
    const {
      endDate,
      paymentType,
      startDate,
      name,
      lat,
      lng,
      day,
      week,
      month,
      service,
    } = req.body;

    const query = [];
    let aggregrationQuery = [];

    if (day) {
      query.push({ startDate: moment(new Date()).format("YYYY-MM-DD") });
    }
    if (week) {
      const TODAY_MINUS_7_B = new Date(new Date() - 7 * 24 * 60 * 60 * 1000);
      query.push({
        startDate: {
          $gte: moment(TODAY_MINUS_7_B).format("YYYY-MM-DD"),
          $lte: moment(new Date()).format("YYYY-MM-DD"),
        },
      });
    }
    if (month) {
      var currentDate = new Date();
      var lastMonthDate = new Date(
        currentDate.setMonth(currentDate.getMonth() - 1)
      );
      query.push({
        startDate: {
          $gte: moment(lastMonthDate).format("YYYY-MM-DD"),
          $lte: moment(new Date()).format("YYYY-MM-DD"),
        },
      });
    }

    if (paymentType) {
      query.push({ paymentType: paymentType });
    }

    if (startDate && endDate) {
      query.push({
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      });
    } else {
      if (startDate) {
        query.push({
          startDate: { $gte: startDate },
          endDate: { $lte: moment(new Date()).format("YYYY-MM-DD") },
        });
      }
      if (endDate) {
        var currentDate = new Date();
        var lastMonthDate = new Date(
          currentDate.setMonth(currentDate.getMonth() - 60)
        );
        query.push({
          startDate: {
            $gte: moment(lastMonthDate).format("YYYY-MM-DD"),
            $lte: endDate,
          },
        });
      }
    }
    if (name) {
      query.push({ name: name });
    }

    if (service) {
      query.push({ "service._id": Mongoose.Types.ObjectId(req.body.service) });
    }

    if (lat && lng) {
      aggregrationQuery.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distanceField",
          spherical: true,
          distanceMultiplier: 0.001,
          maxDistance: 3 * 1000,
        },
      });
    }

    query.push({ bookingStatus: "Confirmed" });

    aggregrationQuery = [
      ...aggregrationQuery,
      {
        $project: {
          startDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$startDate",
            },
          },
          endDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$endDate",
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
    ];

    if (query.length > 0) {
      aggregrationQuery = [
        ...aggregrationQuery,

        {
          $match: { $and: query },
        },
      ];
    }

    const booking = await bookingCollection.aggregate(aggregrationQuery);
    const newVar = booking.filter((val1) => {
      return val1.userId?._id == req._user;
    });

    return res.status(200).json({ code: 200, data: newVar });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const editBooking = async (req, res, next) => {
  try {
    const Id = req.params.id;

    if (!Id)
      return res.status(200).json({
        status: 401,
        success: false,
        message: "Id is required ",
      });

    let data = pick(req.body, [
      "name",
      "email",
      "service",
      "phoneNumber",
      "location",
      "address",
      "start_date",
      "paymentType",
      "start_time",
      "end_time",
      "lng",
      "lat",
      "bookingStatus",
      "eventColor",
      "show",
      "checkinDate",
      "startDateTime",
      "classes",
    ]);
    let result = await bookingService.update(
      { _id: Id },
      { $set: { ...data } },
      { fields: { _id: 1 }, new: true }
    );
    const updatedBooking = await bookingCollection.findById({ _id: Id });

    return res.status(200).json({
      status: 200,
      success: true,
      data: updatedBooking,
      message: "Booking updated successfully",
    });
  } catch (error) {
    return res.status(200).json({
      status: 401,
      success: false,
      message: error.message,
    });
  }
};

const getBookingwithDate = async (req, res) => {
  try {
    const userId = req._user;
    const start_date = req.params.start_date;
    const end_date = req.params.end_date;

    const bookingsWithinDateRange = await bookingService.getBooingWithDate(
      userId,
      start_date,
      end_date
    );

    return res.status(200).json({
      status: 200,
      success: true,
      data: bookingsWithinDateRange,
      message: "booking fetched successfully",
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const getBookingwithName = async (req, res) => {
  try {
    const { name } = req.body;
    const getBookingList = await bookingService.findWithName(name);

    return res.status(200).json({
      code: 200,
      message: "Data fetched",
      data: getBookingList,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const getUserService = async (req, res) => {
  try {
    const userId = req._user;
    const services = await businessService.getAllService(userId);
    if (!services) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "services get successfully",
        data: services,
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

const getCustomer = async (req, res) => {
  try {
    let email = Object.keys(req.body)[0];
    const ExistCustomer = await bookingService.findWithEmail(email);
    return res.status(200).json({
      code: 200,
      message: "Data fetched",
      data: ExistCustomer,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const getCustomerWithName = async (req, res) => {
  try {
    const name = req.body[0]?.name;
    const bookingList = await bookingService.findCustomerWithName(name);
    return res.status(200).json({
      code: 200,
      message: "Data fetched",
      data: bookingList,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const bookingDelete = async (req, res) => {
  try {
    const { data } = req.query;
    const inputDate = moment(data, "ddd MMM DD YYYY hh:mm:A");

    const startDate = inputDate.format("MMM D, YYYY");
    const startTime = inputDate.format("hh:mm:A");
    const endTime = inputDate.clone().add(30, "minutes").format("hh:mm:A");

    const id = req.params.id;
    const exist = await bookingCollection.findOne({ _id: id });
    // console.log(exist,"fhdjfhfjdhfjdfhdjf")

    const response = await bookingCollection.deleteOne({ _id: id });
    if (exist) {
      const schedule = await calenderSettingService.find({
        addedBy: req._user,
      });
      const deleteNotification = await notificationCollection.deleteOne({
        bookingId: id,
      });

      const obj = {
        startDate: startDate,
        startTime: startTime,
        endTime: endTime,
      };
      const index = schedule.scheduledData.findIndex(
        (slot) => slot.startTime > obj.startTime
      );
      if (index === -1) {
        schedule.scheduledData.push(obj);
      } else {
        schedule.scheduledData.splice(index, 0, obj);
      }
      const Id = schedule?._id;
      const newObj = {
        scheduledData: schedule.scheduledData,
      };
      if (exist?.scheduleexist == true) {
        let calenderSetting = await calenderSettingService.update(Id, newObj);
      }
      return res.status(200).json({
        success: true,
        message: "Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Booking Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const bookingCancel = async (req, res, next) => {
  try {
    const { bookingStatus, data } = req.body;

    const inputDate = moment(data, "ddd MMM DD YYYY hh:mm:A");

    const startDate = inputDate.format("MMMM DD, YY");
    const startTime = inputDate.format("hh:mm:A");
    const endTime = inputDate.clone().add(30, "minutes").format("hh:mm:A");
    const id = req.params.id;

    if (!id) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Id is required",
      });
    }

    const dataToUpdate = pick(req.body, ["bookingStatus", "eventColor"]);

    const updatedBooking = await bookingService.update(
      { _id: id },
      { $set: { ...dataToUpdate } },
      { fields: { _id: 1 }, new: true }
    );
    if (updatedBooking?.scheduleexist == true) {
      if (updatedBooking) {
        const schedule = await calenderSettingService.find({
          addedBy: req._user,
        });

        const obj = {
          startDate: startDate,
          startTime: startTime,
          endTime: endTime,
        };

        const index = schedule.scheduledData.findIndex(
          (slot) => slot.startTime > obj.startTime
        );

        if (index === -1) {
          schedule.scheduledData.push(obj);
        } else {
          schedule.scheduledData.splice(index, 0, obj);
        }

        const scheduleId = schedule?._id;
        const updatedSchedule = {
          scheduledData: schedule.scheduledData,
        };

        await calenderSettingService.update(scheduleId, updatedSchedule);
      }
    }
    const confirmTime1 = new Date();
    const confirmTime = confirmTime1.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      hour12: false,
    });

    cancelBookingMail(
      updatedBooking.email,
      updatedBooking.name,
      confirmTime,
      bookingStatus
    );

    const countryCode = updatedBooking.selectedCountry.split(" ")[1];
    const smsData = {
      to: `${countryCode}${updatedBooking.phoneNumber}`,
      text: "Your service appointment has been cancelled.",
    };

    await smtpSms(smsData);

    return res.status(200).json({
      status: 200,
      success: true,
      data: updatedBooking,
      message: "Booking Cancelled successfully",
    });
  } catch (error) {
    return res
      .status(401)
      .json({ status: 401, success: false, message: error.message });
  }
};

const bookingEdit = async (req, res, next) => {
  try {
    const { scheduleTime, prevSchedule, availableSlot } = req.body;
    const Id = req.params.id;
    if (!Id) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Id is required ",
      });
    }

    if (availableSlot == null || availableSlot == "null") {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        status: 500,
      });
    }

    const data = pick(req.body, [
      "name",
      "email",
      "service",
      "phoneNumber",
      "location",
      "start_date",
      "startDate",
      "servicePrice",
      "paymentType",
      "start_time",
      "address",
      "scheduleexist",
      "end_time",
      "startDateTime",
      "lng",
      "lat",
    ]);
    const alreadySchdule = await bookingCollection.findOne({ _id: Id });
    const AllSchdule = await bookingCollection.find(
      { startDateTime: req?.body?.startDateTime  , 
      _id: { $ne: Id }
      }
    );
    if (AllSchdule.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Schedule is already booked",
        status: 400,
      });
    }
    // if (alreadySchdule?.startDateTime == req?.body?.startDateTime) {
      const timingExistornot = await bookingCollection.find({
        _id: Id,
      });

      let result = await bookingService.update(
        {
          _id: Id,
        },
        { $set: { ...data } },
        { fields: { _id: 1 }, new: true }
      );
      if (
        req.body.scheduleexist == true &&
        timingExistornot[0]?.scheduleexist == true
      ) {
        if (result) {
          const schedule = await calenderSettingService.find({
            addedBy: req._user,
          });

          const scheduleId = schedule?._id;
          const obj = {
            scheduledData: availableSlot,
          };

          let updatedSchedule = await calenderSettingService.update(
            scheduleId,
            obj
          );
        }

        if (scheduleTime != "null") {
          if (result?.scheduleexist == true) {
            const inputDate = moment(prevSchedule, "ddd MMM DD YYYY hh:mm:A");
            const startDate = inputDate.format("MMM D, YYYY");
            const startTime = inputDate.format("hh:mm:A");
            const endTime = inputDate
              .clone()
              .add(30, "minutes")
              .format("hh:mm:A");
            const obj = {
              startDate: startDate,
              startTime: startTime,
              endTime: endTime,
            };

            const schedule = await calenderSettingService.find({
              addedBy: req._user,
            });

            const index = schedule.scheduledData.findIndex(
              (slot) => slot.startTime > obj.startTime
            );

            if (index === -1) {
              schedule.scheduledData.push(obj);
            } else {
              schedule.scheduledData.splice(index, 0, obj);
            }

            const scheduleId = schedule?._id;
            const newObj = {
              scheduledData: schedule.scheduledData,
            };

            let updatedSchedule = await calenderSettingService.update(
              scheduleId,
              newObj
            );
          }
        }
      } else if (
        req.body.scheduleexist == false &&
        timingExistornot[0]?.scheduleexist == true
      ) {
        if (result) {
          const schedule = await calenderSettingService.find({
            addedBy: req._user,
          });

          const scheduleId = schedule?._id;
          const obj = {
            scheduledData: availableSlot,
          };
         
          let updatedSchedule = await calenderSettingService.update(
            scheduleId,
            obj
          );
        }

        if (scheduleTime != "null") {
          if (result?.scheduleexist == true) {
            const inputDate = moment(prevSchedule, "ddd MMM DD YYYY hh:mm:A");
            const startDate = inputDate.format("MMM D, YYYY");
            const startTime = inputDate.format("hh:mm:A");
            const endTime = inputDate
              .clone()
              .add(30, "minutes")
              .format("hh:mm:A");
            const obj = {
              startDate: startDate,
              startTime: startTime,
              endTime: endTime,
            };

            const schedule = await calenderSettingService.find({
              addedBy: req._user,
            });

            const index = schedule.scheduledData.findIndex(
              (slot) => slot.startTime > obj.startTime
            );

            if (index === -1) {
              schedule.scheduledData.push(obj);
            } else {
              schedule.scheduledData.splice(index, 0, obj);
            }

            const scheduleId = schedule?._id;
            const newObj = {
              scheduledData: schedule.scheduledData,
            };

            let updatedSchedule = await calenderSettingService.update(
              scheduleId,
              newObj
            );
          }
        }
      } else if (
        req.body.scheduleexist == true &&
        timingExistornot[0]?.scheduleexist == false
      ) {
        if (result) {
          const schedule = await calenderSettingService.find({
            addedBy: req._user,
          });

          const scheduleId = schedule?._id;
          const obj = {
            scheduledData: availableSlot,
          };

          let updatedSchedule = await calenderSettingService.update(
            scheduleId,
            obj
          );
        }

        if (scheduleTime != "null") {
          if (result?.scheduleexist == true) {
            const inputDate = moment(prevSchedule, "ddd MMM DD YYYY hh:mm:A");
            const startDate = inputDate.format("MMM D, YYYY");
            const startTime = inputDate.format("hh:mm:A");
            const endTime = inputDate
              .clone()
              .add(30, "minutes")
              .format("hh:mm:A");
            const obj = {
              startDate: startDate,
              startTime: startTime,
              endTime: endTime,
            };

            const schedule = await calenderSettingService.find({
              addedBy: req._user,
            });

            const index = schedule.scheduledData.findIndex(
              (slot) => slot.startTime > obj.startTime
            );

            if (index === -1) {
              schedule.scheduledData.push(obj);
            } else {
              schedule.scheduledData.splice(index, 0, obj);
            }

            const scheduleId = schedule?._id;
            const newObj = {
              scheduledData: schedule.scheduledData,
            };

            let updatedSchedule = await calenderSettingService.update(
              scheduleId,
              newObj
            );
          }
        }
      }
      return res.status(200).json({
        status: 200,
        success: true,
        data: result,
        message: "Booking updated successfully",
      });
    // }
  } catch (error) {
    return res.status(401).json({
      status: 401,
      success: false,
      message: error.message,
    });
  }
};

const multiDeleteBooking = async (req, res) => {
  try {
    const bookingData = await bookingCollection.find({
      _id: { $in: req.body.data },
      show: false,
    });
    const slotData = [];
    const availableSchedule = bookingData.map((item) => {
      if (item.scheduleexist) {
        slotData.push(item.startDateTime);
      }
    });
    const updatedSlots = slotData.map((timestamp) => {
      const inputDate = moment(timestamp, "ddd MMM DD YYYY hh:mm:A");
      const startDate = inputDate.format("MMM D, YYYY");
      const startTime = inputDate.format("hh:mm:A");
      const endTime = inputDate.clone().add(30, "minutes").format("hh:mm:A");

      return {
        startTime,
        endTime,
        startDate,
      };
    });

    const response = await bookingCollection.deleteMany({
      _id: { $in: req.body.data },
      show: false,
    });
    if (response) {
      const schedule = await calenderSettingService.find({
        addedBy: req._user,
      });
      const response1 = await notificationCollection.deleteMany({
        bookingId: { $in: req.body.data },
      });

      const compareSlots = (slot1, slot2) => {
        const time1 = new Date(`2000/01/01 ${slot1.startTime}`);
        const time2 = new Date(`2000/01/01 ${slot2.startTime}`);
        return time1 - time2;
      };
      if(schedule){ 
        schedule?.scheduledData.push(...updatedSlots);
        schedule?.scheduledData.sort(compareSlots);
  
        const Id = schedule?._id;
        const newObj = {
          scheduledData: schedule?.scheduledData,
        };
         let result = await calenderSettingService.update(Id, newObj);
      }


  
     

      return res.status(200).json({
        success: true,
        message: "Deleted Successfully",
        data: response,
      });
    }
     else {
      return res.status(400).json({
        success: false,
        message: "No data Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const searchAppointmentDateandName = async (req, res) => {
  try {
    let { service, paymentType, startDate, id } = req.query;

    const bookedBy = Mongoose.Types.ObjectId(req._user);
    const query = {};
    if (startDate) {
      query["startDate"] = startDate;
    }
    if (paymentType !== "undefined" && paymentType) {
      query["paymentType"] = paymentType;
    }
    if (bookedBy) {
      query["userId"] = bookedBy;
    }
    if (id) {
      query["bookingFor"] = Mongoose.Types.ObjectId(id);
    }
    if (service !== "undefined" && service) {
      query["service"] = { $elemMatch: { service: service } };
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
          bookingType: 1,
          servicePrice: 1,
          endDate: 1,
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

const Invoicesbooking = async (req, res) => {
  try {
    const customerId = req.params.id;
    const ownerID = req._user;

    const response = await bookingService.findInvoiceByCustomerAndUser({
      customerId,
      userId: ownerID,
      paymentType: "Paid",
    });

    if (response) {
      return res.status(200).json({
        success: true,
        data: response,
        message: "Data fetched",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Data Found",
      });
    }
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const searchinvoiceStatusandName = async (req, res) => {
  try {
    let { name, paymentType, id } = req.query;
    let text1 = name.trim();
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const query = {};

    const bookedBy = Mongoose.Types.ObjectId(req._user);
    if (paymentType !== "undefined" && paymentType) {
      query["paymentType"] = paymentType;
    }

    const response = await bookingCollection
      .find({
        bookingFor: Mongoose.Types.ObjectId(id),
        bookedBy: Mongoose.Types.ObjectId(req._user),
        paymentType: "Paid",
        ...query,
      })
      .populate({
        path: "bookingFor",
        match: { name: regex },
      });
    if (response) {
      if (response.length > 0 && !response[0].bookingFor)
        return res.status(200).json({
          success: true,
          data: [],
        });
      return res.status(200).json({
        success: true,
        data: response[0].customerId ? response : [],
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

const customizeBookingLink = async (req, res) => {
  try {
    const { Title, Description, Theme, online, offline } = req.body;
    const userId = req._user;

    const customizeBooking = await BookingLink.findOne({
      userId: userId,
    });

    let logo = req?.files.logo
      ? req?.files.logo[0]?.filename
      : customizeBooking.logo;
    let linkImg = req?.files.linkImg
      ? req?.files.linkImg[0]?.filename
      : customizeBooking.linkImg;

    if (!logo || !linkImg) {
      return res.status(400).json({
        success: false,
        message: "Please upload both images",
      });
    }

    let Paymentonline = online;
    let Paymentoffline = offline;

    if (customizeBooking) {
      customizeBooking.Title = Title;
      customizeBooking.Description = Description;
      customizeBooking.Theme = Theme;
      customizeBooking.Paymentonline = Paymentonline;
      customizeBooking.Paymentoffline = Paymentoffline;
      customizeBooking.logo = logo;
      customizeBooking.linkImg = linkImg;

      await customizeBooking.save();
      return res.status(200).json({
        success: true,
        message: "Customization update successfully",
        data: customizeBooking,
      });
    } else {
      let customizeData = new BookingLink({
        userId,
        Title,
        logo,
        linkImg,
        Description,
        Theme,
        Paymentonline,
        Paymentoffline,
      });

      await customizeData.save();
      return res.status(200).json({
        success: true,
        message: "Page customize successfully",
        data: customizeData,
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

module.exports = {
  createBooking,
  bookingFilter,
  singleBooking,
  allBookingList,
  bookingSearch,
  editBooking,
  getBookingwithDate,
  allConfirmedBooking,
  getBookingwithName,
  getUserService,
  getCustomer,
  getCustomerWithName,
  bookingDelete,
  bookingEdit,
  multiDeleteBooking,
  bookingCancel,
  AppointmentbookingSearch,
  searchAppointmentDateandName,
  Invoicesbooking,
  searchinvoiceStatusandName,
  bookingFilterConfirmed,
  customizeBookingLink,
};
