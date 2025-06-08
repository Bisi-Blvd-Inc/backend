const userService = require("../../services/user.service");
const bookingService = require("../../services/booking.service");
const usersService = require("../../services/users.services");
const customerCollection = require("../../services/customer.service");
const customerService = require("../../services/customer.service");
const productService = require("../../services/product.service");
const inventoryService = require("../../services/inventory.service");
const paymentCollection = require("../../models/paymentHistory");
const businessClassService = require("../../services/businessClass.service");
const Mongoose = require("mongoose");
const serviceName = require("../../models/businessService");
const BookingLink = require("../../models/customizedLink");
const calenderSettingService = require("../../services/schedule.service");
var nodeCron = require("node-cron");
const serviceSettingCollection = require("../../models/serviceSetting");
const {
  planAlertMail,
  sendPaymentMail,
  sendProductPaymentMail,
  sendProductBookingOwner,
  sendBookingMailOwner,
  sendBookingMailExternal,
} = require("../../helpers/users");
const { pick } = require("lodash");
const notificatinCollection = require("../../models/notification");
const businessServiceCollection = require("../../models/businessService");
const customerCollectionModel = require("../../models/customer");
const bookingCollection = require("../../models/booking");
const businessClassCollection = require("../../models/businessClass");
const scheduleCollection = require("../../models/schedule");
const customersLinkCollection = require("../../models/customizedLink");
const personalBudgetCollection = require("../../models/personalBudget");
// const serviceSettingCollection = require ("../../models/serviceSetting");
// const upgradeCollection =  require("../../models/upgrade");
const goalsCollection = require("../../models/goalsCompanyBudget");
const inventoryCollection = require("../../models/inventory");
// const paymentCollection = require("../../models/paymentHistory");
const userDetailFileuploadCollection = require("../../models/userDetailfileupload");
const userdetailNotes = require("../../models/userdetailnotes");
const userDetailSoap = require("../../models/userdetailsoap");

const userCollection = require("../../models/user");
const upgradeCollection = require("../../models/upgrade");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("secretKey");
const moment = require("moment");
const stripe = require("stripe");
const countryCodes = require("country-codes-list");
const User = require("../../models/user");
const { createNotification } = require("./notification.controller");
const { smtpSms } = require("../../helpers/twilio");
const emailSettingService = require("../../models/emailSetting");
const mongoose = require("mongoose");

const createUser = async (req, res) => {
  try {
    const { firstName, email, password } = req.body;
    let user = {
      firstName,
      email,
      password,
      role: 3,
    };
    const user1 = await usersService.findOne(req._user);
    if (!user1)
      return res.status(401).json({
        success: false,
        message: "Client not found with provided token!!",
      });

    user.addedBy = user1._id;
    const createdUser = await userService.post(user);
    return res.status(201).json({
      success: true,
      message: "Client added succesfully",
      data: createdUser,
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const restoreHistory = async (req, res) => {
  try {
    const { id } = req.body;
    const user1 = await usersService.update(id, {
      HistoryActivateStatus: true,
    });
    if (user1)
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Restore all data !",
      });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const deleteHistory = async (req, res) => {
  try {
    const { id } = req.body;
    const notificationResult = await notificatinCollection.deleteMany({
      bookedBy: id,
    });
    const businessServiceResult = await businessServiceCollection.deleteMany({
      addedBy: id,
    });
    const customerResult = await customerCollectionModel.deleteMany({
      userId: id,
    });
    const bookingResult = await bookingCollection.deleteMany({ userId: id });
    const scheduleResult = await scheduleCollection.deleteMany({ addedBy: id });
    const customersLinkResult = await customersLinkCollection.deleteMany({
      userId: id,
    });
    const personalBudgetResult = await personalBudgetCollection.deleteMany({
      addedBy: id,
    });
    const serviceSettingResult = await serviceSettingCollection.deleteMany({
      addedBy: id,
    });
    const upgradeResult = await upgradeCollection.deleteMany({ userId: id });
    const goalsResult = await goalsCollection.deleteMany({ addedBy: id });
    const inventoryResult = await inventoryCollection.deleteMany({
      userId: id,
    });
    const paymentResult = await paymentCollection.deleteMany({ userId: id });
    const userDetailFileuploadResult =
      await userDetailFileuploadCollection.deleteMany({ addedByowner: id });
    const userdetailNotesResult = await userdetailNotes.deleteMany({
      addedBy: id,
    });
    const userDetailSoapResult = await userDetailSoap.deleteMany({
      addedBy: id,
    });

    // Check if any of the operations failed
    if (
      notificationResult.ok &&
      businessServiceResult.ok &&
      customerResult.ok &&
      bookingResult.ok &&
      scheduleResult.ok &&
      customersLinkResult.ok &&
      personalBudgetResult.ok &&
      serviceSettingResult.ok &&
      upgradeResult.ok &&
      goalsResult.ok &&
      inventoryResult.ok &&
      paymentResult.ok &&
      userDetailFileuploadResult.ok &&
      userdetailNotesResult.ok &&
      userDetailSoapResult.ok
    ) {
      return res.status(200).json({
        status: 200,
        success: true,
        message: "History deleted successfully",
      });
    } else {
      // If any of the operations failed, return an error response
      throw new Error("One or more delete operations failed");
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, success: false, message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    let { pageNo, limit } = req.params;
    const response = await userService.getUserWithPagination(
      Number(pageNo),
      Number(limit)
    );

    const count = await userCollection.count({ role: 3, isDeleted: false });
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
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const getAllUsersList = async (req, res) => {
  try {
    const response = await User.find({ role: 2, isDeleted: false });
    if (!response) {
      return res.status(200).json({
        message: "Client not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Client get successfully",
        data: response,
        status: 200,
      });
    }
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const UserEdit = async (req, res) => {
  try {
    const Id = req.params.id;
    if (!Id)
      return res.status(200).json({
        status: 401,
        success: false,
        message: "Id is required ",
      });
    let data = pick(req.body, [
      "firstName",
      "email",
      "businessName",
      "phone",
      "mobile",
      "state",
      "selectedCountry",
      "selectedBusinessCountry",
      "businessType",
      "reffered",
    ]);
    let result = await userService.update(
      {
        _id: Id,
      },
      { $set: { ...data } },
      { fields: { _id: 1 }, new: true }
    );
    return res.status(200).json({
      status: 200,
      success: true,
      data: result,
      message: "User updated successfully",
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const UserSignEdit = async (req, res) => {
  const Id = req.params.id;
  const obj = {
    ...req.body,
  };
  const user = await userService.updateUser(Id, obj);
  res.send({ user, success: true, message: "Payment Successfull" });
};

const UserFreeSignEdit = async (req, res) => {
  const Id = req.params.id;
  const obj = {
    ...req.body,
  };
  const user = await userService.updateFreeUser(Id, obj);
  res.send({ user, success: true, message: "Payment Successfull" });
};

const userDelete = async (req, res) => {
  try {
    const response = await userCollection.updateOne(
      { _id: req.params.id },
      {
        isDeleted: true,
      }
    );
    if (response) {
      return res.status(200).json({
        success: true,
        message: "Client Deleted Successfully",
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

const UserSearch = async (req, res) => {
  try {
    let { text, pageNo, limit } = req.params;
    const response = await userService.getUserBySearch(
      text,
      Number(pageNo),
      Number(limit)
    );
    if (response) {
      return res.status(200).json({
        success: true,
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

const loginStatusUpdate = async (req, res, next) => {
  try {
    const Id = req._user;
    if (!Id)
      return res.status(200).json({
        status: 401,
        success: false,
        message: "Id is required ",
      });
    let data = pick(req.body, ["loginStatus"]);
    let result = await userService.loginStatusUpdate(
      {
        _id: Id,
      },
      { $set: { ...data } },
      { fields: { _id: 1 }, new: true }
    );

    return res.status(200).json({
      status: 200,
      success: true,
      data: result,
      message: "Client Status Updated successfully",
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};
const getStripeSignupPlans = async (req, res) => {
  const userPlans = await userService.stripeSignupPlans();
  res.send({ userPlans, success: true });
};
const getStripePriceList = async (req, res) => {
  const plansPrices = await userService.stripePriceList();
  res.send({ plansPrices, success: true });
};
const getStripeFinalList = async (req, res) => {
  const plansPrices = await userService.stripeFinalList();
  res.send({ plansPrices, success: true });
};
const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const response = await userService.getUser(id);
    if (response) {
      return res.status(200).json({
        success: true,
        message: "Client of this Id is...",
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

const getUserByIdforDashboard = async (req, res) => {
  try {
    const id = req.params.id;
    const response = await userService.getUser(id);

    if (response) {
      return res.status(200).json({
        success: true,
        message: "User of this Id is...",
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

nodeCron.schedule("0 0 * * * ", async () => {
  try {
    const response = await userService.getDateDiff();
    if (response) {
      let userEmail = "";
      let userId = [];
      response &&
        response.length > 0 &&
        response.map(async (val) => {
          userEmail = val.email;
          userId.push(val.id);
          planAlertMail(val.email);

          if (val.days === 7) {
            let userId = {};
            userId = val.id;
            const obj = {
              sevenDaysMailStatus: true,
            };
            const update = await userCollection.findByIdAndUpdate(userId, obj);
          }
          if (val.days === 3) {
            let userId = {};
            userId = val.id;
            const obj = {
              threeDaysMailStatus: true,
            };
            const update = await userCollection.findByIdAndUpdate(userId, obj);
          }
          if (val.days === 1) {
            let userId = {};
            userId = val.id;
            const obj = {
              oneDayMailStatus: true,
            };
            const update = await userCollection.findByIdAndUpdate(userId, obj);
          }
        });
      // return res.status(200).json({
      //   success: true,
      //   message: "User are",
      //   data: response,
      // });
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
});
const getCouponPlans = async (req, res) => {
  const useCoupon = await userService.stripeCouponPlans();

  res.send({ useCoupon, success: true });
};
const getProductWithCoupon = async (req, res) => {
  const plansPrices = await userService.stripePlanListWithCoupons();
  res.send({ plansPrices, success: true });
};

const deleteSubscription = async (req, res) => {
  const subId = req.params.id;
  const deletedSub = await userService.delSub(subId);
  res.send({
    deletedSub,
    success: true,
    message: "Subscription deleted Successfully",
  });
};

const userWebhook = async (req, res) => {
  const event = req.body;
  if (event.type === "payment_intent.succeeded") {
    let customerId = event.data.object.customer;
    const user = await userCollection.findOne({
      stripeCustomerId: customerId,
    });
    let userSubscriptionEndDate = user?.subscriptionEndDate;

    let dateFormattoString = new Date(userSubscriptionEndDate.toString());

    let userId = user._id;
    let userPrice = user?.planDeatils?.price;
    let startDate = moment(new Date());

    if (user.upgradeStatus === true && user.endDate === startDate) {
      const upgradedUser = await upgradeCollection.findOne({
        stripeCustomerId: customerId,
      });
      let upgradeUserId = upgradedUser._id;
      let planPriceWitDecimal = upgradedUser?.subscription?.plan?.amount;
      let planPriceWithoutDecimal = planPriceWitDecimal / 100;
      let upgradeCardDeatils = upgradedUser?.cardDetails;
      let upgradePlanDetails = upgradedUser?.planDeatils;
      let upgradeSuscription = upgradedUser?.subscription;
      let endDate = " ";
      if (planPriceWithoutDecimal === "1105") {
        endDate = moment().add(12, "M");
      } else {
        endDate = moment().add(1, "M");
      }
      const obj = {
        subscriptionStatus: true,
        cardDetails: upgradeCardDeatils,
        planDeatils: upgradePlanDetails,
        upgradeStatus: false,
        subscription: upgradeSuscription,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
      };
      const update = await userCollection.findByIdAndUpdate(userId, obj);
      const remove = await upgradeCollection.findByIdAndDelete(upgradeUserId);
    } else {
      if (userPrice === 1105) {
        endDate = moment().add(12, "M");
      } else {
        endDate = moment().add(1, "M");
      }
      const obj = {
        subscriptionStatus: true,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
      };
      const update = await userCollection.findByIdAndUpdate(userId, obj);
    }
  }
};

const encryptId = async (req, res) => {
  try {
    const { id } = req.body;

    const encryptedString1 = cryptr.encrypt(id);
    const encryptedString = encryptedString1.substring(0, 50);
    if (!encryptedString) {
      return res.status(200).json({
        message: "Client id not valid",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "encrypted successfully",
        data: encryptedString,
        status: 200,
      });
    }
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const getExternalServiceSetting = async (req, res) => {
  try {
    const result = await serviceSettingCollection
      .find({ addedBy: req.body.userId })
      .populate("service.serviceId");
    if (!result) {
      return res.status(200).json({
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

const getScheduleList = async (req, res) => {
  try {
    const response = await calenderSettingService.findSchedule({
      isDeleted: false,
      addedBy: req.body.userId,
    });
    if (!response) {
      return res.status(200).json({
        message: " No Schedule found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Schedule get successfully",
        data: response,
        count: response?.length,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createExternalBooking = async (req, res) => {
  try {
    let {
      name,
      email,
      phoneNumber,
      startDate,
      startDateTime,
      endDateTime,
      endDate,
      userId,
      paymentType,
      servicePrice,
      benificialName,
      bookingType,
      benificialEmail,
      benificialPhone,
      bookingStatus,
      selectedBenificialCountry,
      selectedCountry,
      availableSlot,
      service,
      scheduleexist,
      serviceType,
      numberOfSeats,
      classes,
      products,
      classOccurenceId,
    } = req.body;
    const emailSettingData = await emailSettingService.findOne({
      addedBy: userId,
    });
    const description1 = emailSettingData?.description1 || "";
    const description2 = emailSettingData?.description2 || "";
    const endsWith = emailSettingData?.endsWith || "";

    const salonOwner = await userCollection.findById(userId);
    if (salonOwner.isActivateAccount == true) {
      return res.status(400).json({
        success: true,
        message: "Link is Expired",
        status: 400,
      });
    }

    const ownerEmail = salonOwner?.email;
    const ownerName = salonOwner?.firstName;

    let durationDescription = "";
    let businessClassData = [];
    let servicess = [];

    // Either Class or Service
    if (serviceType === "Class") {
      businessClassData = await businessClassCollection.find({
        _id: { $in: classes },
      });
      const classStartTime = moment(
        businessClassData[0]?.occurrences[0]?.startTime,
        "hh:mm A"
      );
      const classEndTime = moment(
        businessClassData[0]?.occurrences[0]?.endTime,
        "hh:mm A"
      );
      const duration = moment.duration(classEndTime.diff(classStartTime));
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      durationDescription = `${hours} hours ${minutes} minutes`;
      servicess = `${businessClassData[0]?.name} class (${numberOfSeats} ${
        numberOfSeats > 1 ? "seats" : "seat"
      })`;
    } else {
      if (availableSlot == null || availableSlot == "null") {
        return res.status(500).json({
          success: false,
          message: "Something went wrong",
          status: 500,
        });
      }
      let totalHours = 0;
      let totalMinutes = 0;
      const serviceVal = service?.map(Mongoose.Types.ObjectId);
      const singleBooking = await serviceName.find({
        _id: {
          $in: serviceVal,
        },
      });
      const serviceDuration = await serviceSettingCollection.find({
        addedBy: userId,
      });
      const serviceValSet = new Set(serviceVal?.map((val) => val.toString()));
      const serviceTime = serviceDuration[0]?.service;

      serviceTime?.forEach((service) => {
        const serviceIdString = service?.serviceId.toString();
        if (serviceValSet.has(serviceIdString)) {
          totalHours += service?.serviceTime?.hours;
          totalMinutes += service?.serviceTime?.minutes;
        }
      });
      if (totalMinutes >= 60) {
        const extraHours = Math.floor(totalMinutes / 60);
        totalHours += extraHours;
        totalMinutes -= extraHours * 60;
      }

      durationDescription = `${totalHours} hours ${totalMinutes} minutes`;
      servicess = singleBooking?.map((item) => {
        return item?.service;
      });
    }

    const getToken = await userService?.getUser(userId);

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
      classes: classes,
      numberOfSeats: numberOfSeats,
      serviceType: serviceType,
    };
    if (exist) {
      if (bookingType == "self") {
        const newObj = {
          ...obj,
          customerId: exist._id,
          bookingFor: exist?._id,
          selectedBenificialCountry: selectedBenificialCountry,
          bookedBy: userId,
        };

        const createdBooking = await bookingService.post(newObj);
        const bookingId = createdBooking?._id;

        const userData = await bookingService.findById(bookingId);

        const notificationService =
          serviceType === "Class"
            ? userData?.classes[0]?.name
            : userData?.service?.map((item) => {
                return item?.service;
              });

        const bookingStatusVal = createdBooking?.bookingStatus;
        const bookingDate = createdBooking?.startDateTime.slice(0, 15);
        var dateObj = moment(
          createdBooking?.startDateTime,
          "ddd MMM DD YYYY hh:mm:A"
        );
        var time = dateObj.format("hh:mm:A");
        const price = servicePrice ? servicePrice : "UnPaid";
        sendBookingMailExternal(
          email,
          name,
          servicess,
          bookingDate,
          durationDescription,
          time,
          bookingStatusVal,
          bookingId,
          paymentType,
          description1,
          description2,
          endsWith
        );

        sendBookingMailOwner(
          ownerEmail,
          name,
          ownerName,
          servicess,
          bookingDate,
          time,
          bookingStatusVal,
          bookingId,
          price
        );
        if (createdBooking) {
          // If class or service
          if (serviceType === "Class") {
            const businessClassId = businessClassData[0]?._id;
            await businessClassService.bookClassOccurrence(
              businessClassId,
              classOccurenceId,
              numberOfSeats
            );
          } else {
            const schedule = await calenderSettingService.find({
              addedBy: userId,
            });
            const obj = {
              scheduledData: availableSlot,
            };
            await calenderSettingService.update(schedule?._id, obj);
          }

          // Update products if exist
          if (products?.length > 0) {
            const productData = await Promise.all(
              products.map(async (item) => {
                const inventory = await inventoryService.getInventoryById(
                  item?.productId
                );
                const updatedStock = inventory?.productstock - item?.quantity;
                await inventoryService.update(item?.productId, {
                  productstock: updatedStock,
                });
                return {
                  addedBy: userId,
                  userId: exist?._id,
                  inventoryId: item?.productId,
                  price: item?.price,
                  quantity: item?.quantity,
                };
              })
            );
            const createdProducts = await productService.createMultiple(
              productData
            );
            await bookingService.update(bookingId, {
              products: createdProducts?.map((product) => product?._id),
            });
          }
        }
        let notification = {
          title: "You’ve Got Booked",
          text: `Cha-ching $! Your closer to your revenue goal! <strong>${
            createdBooking?.name
          }</strong> just booked <strong>${notificationService}</strong> for <strong>${moment(
            createdBooking.startDateTime
          ).format("YYYY-MM-DD")}</strong> & <strong>${moment(
            createdBooking.startDateTime
          )
            .utcOffset("+05:30")
            .format(
              "hh:mm A"
            )}</strong>. Do your happy dance!! Remember, they could have gone to someone else.`,
          clientName: createdBooking.name,
          type: "Booking",
          bookedBy: userId,
          bookingId: bookingId,
          customerId: exist?._id,
          fcmToken: getToken?.fcmToken,
        };

        await createNotification(notification);
        const countryCode = selectedCountry?.split(" ")[1];

        if (createdBooking?.phoneNumber?.length > 0) {
          let smsData = {
            to: `${countryCode}${createdBooking.phoneNumber}`,
            text: "Your Booked Service Appointment is confirmed.",
          };

          await smtpSms(smsData);
        }
        return res.status(200).json({
          success: true,
          message: "Booking added successfully",
          data: createdBooking,
          status: 200,
        });
      } else if (bookingType === "giftcertificate") {
        if (benificialEmail) {
          const gift = await customerCollection.findOne({
            email: benificialEmail,
            userId: Mongoose.Types.ObjectId(userId),
          });
          if (gift) {
            const newObj = {
              ...obj,
              customerId: exist._id,
              bookingFor: gift._id,
              selectedBenificialCountry: selectedBenificialCountry,
              bookedBy: userId,
            };
            const createdBooking = await bookingService.post(newObj);
            const bookingId = createdBooking._id;
            const userData = await bookingService.findById(bookingId);

            const notificationService = userData.service.map((item) => {
              return item.service;
            });
            const bookingStatusVal = createdBooking.bookingStatus;
            const bookingDate = createdBooking.startDateTime.slice(0, 15);
            var dateObj = moment(
              createdBooking?.startDateTime,
              "ddd MMM DD YYYY hh:mm:A"
            );
            var time = dateObj.format("hh:mm:A");
            const price = servicePrice ? servicePrice : "UnPaid";
            sendBookingMailExternal(
              email,
              name,
              servicess,
              bookingDate,
              durationDescription,
              time,
              bookingStatusVal,
              bookingId,
              paymentType,
              description1,
              description2,
              endsWith
            );
            sendBookingMailOwner(
              ownerEmail,
              name,
              ownerName,
              servicess,
              bookingDate,
              time,
              bookingStatusVal,
              bookingId,
              price
            );
            if (createdBooking) {
              const schedule = await calenderSettingService.find({
                addedBy: userId,
              });

              const Id = schedule._id;
              const obj = {
                scheduledData: availableSlot,
              };
              let result = await calenderSettingService.update(Id, obj);
            }
            let notification = {
              title: "You’ve Got Booked",
              text: `Cha-ching $! Your closer to your revenue goal! <strong>${
                createdBooking?.name
              }</strong> just booked <strong>${notificationService}</strong> for <strong>${moment(
                createdBooking.startDateTime
              ).format("YYYY-MM-DD")}</strong> & <strong>${moment(
                createdBooking.startDateTime
              )
                .utcOffset("+05:30")
                .format(
                  "hh:mm A"
                )}</strong>. Do your happy dance!! Remember, they could have gone to someone else.`,
              clientName: createdBooking.name,
              type: "Booking",
              bookedBy: userId,
              bookingId: bookingId,
              customerId: exist._id,
              fcmToken: getToken.fcmToken,
            };
            await createNotification(notification);
            const countryCode = selectedCountry?.split(" ")[1];
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

            let notification = {
              title: "Your Business is Growing",
              text: `Your client list is growing!! <strong>${createCustomer.name}</strong> has been added to your client database. Be sure to greet them with a smile when they arrive!! Remember, they could have gone to someone else.`,
              type: "User",
              clientName: createCustomer.name,
              bookingFor: createCustomer._id,
              customerId: createCustomer._id,
              bookedBy: userId,
              fcmToken: getToken.fcmToken,
            };

            await createNotification(notification);
            const newObj = {
              ...obj,
              customerId: exist._id,
              bookingFor: createCustomer._id,
              selectedBenificialCountry: selectedBenificialCountry,
              bookedBy: userId,
            };
            const createdBooking = await bookingService.post(newObj);

            const bookingId = createdBooking._id;
            const userData = await bookingService.findById(bookingId);

            const notificationService = userData.service.map((item) => {
              return item.service;
            });
            const bookingStatusVal = createdBooking.bookingStatus;
            const bookingDate = createdBooking.startDateTime.slice(0, 15);
            var dateObj = moment(
              createdBooking?.startDateTime,
              "ddd MMM DD YYYY hh:mm:A"
            );
            var time = dateObj.format("hh:mm:A");
            const price = servicePrice ? servicePrice : "UnPaid";
            sendBookingMailExternal(
              email,
              name,
              servicess,
              bookingDate,
              durationDescription,
              time,
              bookingStatusVal,
              bookingId,
              paymentType,
              description1,
              description2,
              endsWith
            );
            sendBookingMailOwner(
              ownerEmail,
              name,
              ownerName,
              servicess,
              bookingDate,
              time,
              bookingStatusVal,
              bookingId,
              price
            );
            if (createdBooking) {
              const schedule = await calenderSettingService.find({
                addedBy: userId,
              });

              const Id = schedule._id;
              const obj = {
                scheduledData: availableSlot,
              };
              let result = await calenderSettingService.update(Id, obj);
            }
            let notification1 = {
              title: "You’ve Got Booked",
              text: `Cha-ching $! Your closer to your revenue goal! <strong>${
                createdBooking?.name
              }</strong> just booked <strong>${notificationService}</strong> for <strong>${moment(
                createdBooking.startDateTime
              ).format("YYYY-MM-DD")}</strong> & <strong>${moment(
                createdBooking.startDateTime
              )
                .utcOffset("+05:30")
                .format(
                  "hh:mm A"
                )}</strong>. Do your happy dance!! Remember, they could have gone to someone else.`,
              clientName: createdBooking.name,
              type: "Booking",
              bookedBy: userId,
              bookingId: bookingId,
              customerId: exist._id,
              fcmToken: getToken.fcmToken,
            };

            await createNotification(notification1);

            const countryCode = createdBooking.selectedCountry?.split(" ")[1];
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
        const createCustomer = await customerService.post(obj3);
        let notification3 = {
          title: "Your Business is Growing",
          text: `Your client list is growing!! <strong>${createCustomer?.name}</strong> has been added to your client database. Be sure to greet them with a smile when they arrive!! Remember, they could have gone to someone else.`,
          type: "User",
          clientName: createCustomer?.name,
          bookingFor: createCustomer?._id,
          customerId: createCustomer?._id,
          bookedBy: userId,
          fcmToken: getToken?.fcmToken,
        };

        await createNotification(notification3);

        const newObj = {
          ...obj,
          customerId: createCustomer?._id,
          bookingFor: createCustomer?._id,
          selectedBenificialCountry: selectedBenificialCountry,
          bookedBy: userId,
        };

        const createdBooking = await bookingService.post(newObj);
        const bookingId = createdBooking._id;
        const userData = await bookingService.findById(bookingId);

        const notificationService =
          serviceType === "Class"
            ? userData?.classes[0]?.name
            : userData?.service?.map((item) => {
                return item?.service;
              });
        const data = {
          ...obj3,
          bookingId: createdBooking._id,
        };
        const CustomerId = createCustomer._id;
        await customerService.update(CustomerId, data);

        const bookingStatusVal = createdBooking.bookingStatus;
        const bookingDate = createdBooking.startDateTime.slice(0, 15);
        var dateObj = moment(
          createdBooking?.startDateTime,
          "ddd MMM DD YYYY hh:mm:A"
        );
        var time = dateObj.format("hh:mm:A");
        const price = paymentType === "Owning" ? "UnPaid" : "Paid";

        sendBookingMailExternal(
          email,
          name,
          servicess,
          bookingDate,
          durationDescription,
          time,
          bookingStatusVal,
          bookingId,
          paymentType,
          description1,
          description2,
          endsWith
        );

        sendBookingMailOwner(
          ownerEmail,
          name,
          ownerName,
          servicess,
          bookingDate,
          time,
          bookingStatusVal,
          bookingId,
          price
        );
        if (createdBooking) {
          // If class or service
          if (serviceType === "Class") {
            const businessClassId = businessClassData[0]?._id;
            await businessClassService.bookClassOccurrence(
              businessClassId,
              classOccurenceId,
              numberOfSeats
            );
          } else {
            const schedule = await calenderSettingService.find({
              addedBy: userId,
            });
            const obj = {
              scheduledData: availableSlot,
            };
            await calenderSettingService.update(schedule?._id, obj);
          }

          // Update products if exist
          if (products?.length > 0) {
            const productData = await Promise.all(
              products.map(async (item) => {
                const inventory = await inventoryService.getInventoryById(
                  item?.productId
                );
                const updatedStock = inventory?.productstock - item?.quantity;
                await inventoryService.update(item?.productId, {
                  productstock: updatedStock,
                });
                return {
                  addedBy: userId,
                  userId: createCustomer?._id,
                  inventoryId: item?.productId,
                  price: item?.price,
                  quantity: item?.quantity,
                };
              })
            );
            const createdProducts = await productService.createMultiple(
              productData
            );
            await bookingService.update(bookingId, {
              products: createdProducts?.map((product) => product?._id),
            });
          }
        }

        let notification4 = {
          title: "You’ve Got Booked",
          text: `Cha-ching $! Your closer to your revenue goal! <strong>${
            createdBooking?.name
          }</strong> just booked <strong>${notificationService}</strong> for <strong>${moment(
            createdBooking?.startDateTime
          ).format("YYYY-MM-DD")}</strong> & <strong>${moment(
            createdBooking?.startDateTime
          )
            .utcOffset("+05:30")
            .format(
              "hh:mm A"
            )}</strong>. Do your happy dance!! Remember, they could have gone to someone else.`,
          clientName: createdBooking?.name,
          type: "Booking",
          bookedBy: userId,
          bookingId: bookingId,
          customerId: createCustomer?._id,
          fcmToken: getToken?.fcmToken,
        };

        await createNotification(notification4);

        const countryCode = selectedCountry?.split(" ")[1];
        if (createdBooking?.phoneNumber?.length > 0) {
          let smsData = {
            to: `${countryCode}${createdBooking.phoneNumber}`,
            text: "Your Booked Service Appointment is confirmed.",
          };

          await smtpSms(smsData);
        }

        return res.status(200).json({
          success: true,
          message: "Booking added successfully",
          data: createdBooking,

          status: 200,
        });
      } else if (bookingType == "giftcertificate") {
        const gift = await customerCollection.findOne({
          email: benificialEmail,
          userId: Mongoose.Types.ObjectId(userId),
        });

        if (gift) {
          const createCustomer = await customerService.post(obj3);

          let notification5 = {
            title: "Your Business is Growing",
            text: `Your client list is growing!! <strong>${createCustomer.name}</strong> has been added to your client database. Be sure to greet them with a smile when they arrive!! Remember, they could have gone to someone else.`,
            type: "User",
            clientName: createCustomer.name,
            bookingFor: createCustomer._id,
            customerId: createCustomer._id,
            bookedBy: userId,
            fcmToken: getToken.fcmToken,
          };

          await createNotification(notification5);
          const newObj = {
            ...obj,
            customerId: createCustomer._id,
            bookingFor: gift._id,
            selectedBenificialCountry: selectedBenificialCountry,
            bookedBy: userId,
          };
          const createdBooking = await bookingService.post(newObj);
          const bookingId = createdBooking._id;
          const userData = await bookingService.findById(bookingId);

          const notificationService = userData.service.map((item) => {
            return item.service;
          });
          const data = {
            ...obj3,
            bookingId: createdBooking._id,
          };
          const CustomerId = createCustomer._id;
          let result = await customerService.update(CustomerId, data);

          const bookingStatusVal = createdBooking.bookingStatus;
          const bookingDate = createdBooking.startDateTime.slice(0, 15);
          var dateObj = moment(
            createdBooking?.startDateTime,
            "ddd MMM DD YYYY hh:mm:A"
          );
          var time = dateObj.format("hh:mm:A");
          const price = servicePrice ? servicePrice : "UnPaid";

          sendBookingMailExternal(
            email,
            name,
            servicess,
            bookingDate,
            durationDescription,
            time,
            bookingStatusVal,
            bookingId,
            paymentType,
            description1,
            description2,
            endsWith
          );

          sendBookingMailOwner(
            ownerEmail,
            name,
            ownerName,
            servicess,
            bookingDate,
            time,
            bookingStatusVal,
            bookingId,
            price
          );
          if (createdBooking) {
            const schedule = await calenderSettingService.find({
              addedBy: userId,
            });

            const Id = schedule._id;
            const obj = {
              scheduledData: availableSlot,
            };

            let result = await calenderSettingService.update(Id, obj);

            let notification6 = {
              title: "You’ve Got Booked",
              text: `Cha-ching $! Your closer to your revenue goal! <strong>${
                createdBooking?.name
              }</strong> just booked <strong>${notificationService}</strong> for <strong>${moment(
                createdBooking.startDateTime
              ).format("YYYY-MM-DD")}</strong> & <strong>${moment(
                createdBooking.startDateTime
              )
                .utcOffset("+05:30")
                .format(
                  "hh:mm A"
                )}</strong>. Do your happy dance!! Remember, they could have gone to someone else.`,
              clientName: createdBooking.name,
              type: "Booking",
              bookedBy: userId,
              bookingId: bookingId,
              customerId: gift._id,
              fcmToken: getToken.fcmToken,
            };
            await createNotification(notification6);

            const countryCode = selectedCountry?.split(" ")[1];
            let smsData2 = {
              to: `${countryCode}${createdBooking.phoneNumber}`,
              text: "Your Booked Service Appointment is confirmed.",
            };

            await smtpSms(smsData2);
          }

          return res.status(200).json({
            success: true,
            message: "Booking added successfully",
            data: createdBooking,
            status: 200,
          });
        } else if (gift === null) {
          const createCustomers = await customerService.post(obj3);

          let notification7 = {
            title: "Your Business is Growing",
            text: `Your client list is growing!! <strong>${createCustomers.name}</strong> has been added to your client database. Be sure to greet them with a smile when they arrive!! Remember, they could have gone to someone else.`,
            type: "User",
            clientName: createCustomers.name,
            bookingFor: createCustomers._id,
            customerId: createCustomers._id,
            bookedBy: userId,
            fcmToken: getToken.fcmToken,
          };

          await createNotification(notification7);

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
            bookingStatus: bookingStatus,
            selectedBenificialCountry: selectedBenificialCountry,
            benificialName: "",
            benificialEmail: "",
            benificialPhone: "",
          };
          const createCustomer = await customerService.post(obj4);
          let notification8 = {
            title: "Your Business is Growing",
            text: `Your client list is growing!! <strong>${createCustomer.name}</strong> has been added to your client database. Be sure to greet them with a smile when they arrive!! Remember, they could have gone to someone else.`,
            type: "User",
            clientName: createCustomer.name,
            bookingFor: createCustomer._id,
            customerId: createCustomer._id,
            bookedBy: userId,
            fcmToken: getToken.fcmToken,
          };

          await createNotification(notification8);
          const newObj = {
            ...obj3,
            customerId: createCustomers._id,
            bookingFor: createCustomer._id,
            bookedBy: userId,
          };

          const createdBooking = await bookingService.post(newObj);

          const bookingId = createdBooking._id;
          const userData = await bookingService.findById(bookingId);

          const notificationService = userData.service.map((item) => {
            return item.service;
          });
          const data = {
            ...obj4,
            bookingId: createdBooking._id,
          };

          const CustomerId = createCustomer._id;
          let result = await customerService.update(CustomerId, data);

          const bookingStatusVal = createdBooking.bookingStatus;
          const bookingDate = createdBooking.startDateTime.slice(0, 15);
          var dateObj = moment(
            createdBooking?.startDateTime,
            "ddd MMM DD YYYY hh:mm:A"
          );
          var time = dateObj.format("hh:mm:A");
          const price = servicePrice ? servicePrice : "UnPaid";

          sendBookingMailExternal(
            email,
            name,
            servicess,
            bookingDate,
            durationDescription,
            time,
            bookingStatusVal,
            bookingId,
            paymentType,
            description1,
            description2,
            endsWith
          );

          sendBookingMailOwner(
            ownerEmail,
            name,
            ownerName,
            servicess,
            bookingDate,
            time,
            bookingStatusVal,
            bookingId,
            price
          );
          if (createdBooking) {
            const schedule = await calenderSettingService.find({
              addedBy: userId,
            });

            const Id = schedule._id;
            const obj = {
              scheduledData: availableSlot,
            };

            let result = await calenderSettingService.update(Id, obj);
          }

          let notification9 = {
            title: "You’ve Got Booked",
            text: `Cha-ching $! Your closer to your revenue goal! <strong>${
              createdBooking?.name
            }</strong> just booked <strong>${notificationService}</strong> for <strong>${moment(
              createdBooking.startDateTime
            ).format("YYYY-MM-DD")}</strong> & <strong>${moment(
              createdBooking.startDateTime
            )
              .utcOffset("+05:30")
              .format(
                "hh:mm A"
              )}</strong>. Do your happy dance!! Remember, they could have gone to someone else.`,
            clientName: createdBooking.name,
            type: "Booking",
            bookedBy: userId,
            bookingId: bookingId,
            customerId: createCustomers._id,
            fcmToken: getToken.fcmToken,
          };
          await createNotification(notification9);

          const countryCode = selectedCountry?.split(" ")[1];
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
    return res.status(500).json({ code: 500, message: error.message });
  }
};

const ExternalBookingPayment = async (req, res) => {
  try {
    let {
      paymentType,
      userId,
      service,
      name,
      email,
      paymentMethodId,
      customerId,
      selectedBenificialCountry,
      selectedCountry,
      phone,
      benificialPhone,
      totalPrice,
      numberOfSeats,
      classes,
    } = req.body;

    if (!paymentType || !userId || !name || !email || !totalPrice) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    let combinedDescription = "";
    let durationDescription = "";

    // Either booking a service or a class
    if (service?.length > 0) {
      let totalHours = 0;
      let totalMinutes = 0;

      const serviceIds = service.map(Mongoose.Types.ObjectId);
      const serviceDurationData = await serviceSettingCollection.find({
        addedBy: userId,
      });
      const serviceValSet = new Set(serviceIds.map((val) => val.toString()));

      const serviceTime = serviceDurationData[0]?.service || [];

      serviceTime.forEach((svc) => {
        if (serviceValSet.has(svc?.serviceId?.toString())) {
          totalHours += svc?.serviceTime?.hours || 0;
          totalMinutes += svc?.serviceTime?.minutes || 0;
        }
      });
      const bookedService = await serviceName.find({
        _id: { $in: serviceIds },
      });
      combinedDescription = bookedService
        .map((item) => item.service)
        .join(", ");
      if (totalMinutes >= 60) {
        const extraHours = Math.floor(totalMinutes / 60);
        totalHours += extraHours;
        totalMinutes -= extraHours * 60;
      }
      durationDescription = `${totalHours} hours ${totalMinutes} minutes`;
    } else if (classes?.length > 0) {
      const businessClassData = await businessClassCollection.find({
        _id: { $in: classes },
      });
      const classData = businessClassData?.[0];
      if (!classData) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found" });
      }

      const start = moment(classData?.startTime, "hh:mm A");
      const end = moment(classData?.endTime, "hh:mm A");
      const duration = moment.duration(end.diff(start));
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();

      durationDescription = `${hours} hours ${minutes} minutes`;
      combinedDescription = `${classData.name} class (${numberOfSeats} ${
        numberOfSeats > 1 ? "seats" : "seat"
      })`;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "No bookings found" });
    }

    const salonOwner = await userCollection.findById(userId);
    if (!salonOwner?.secretKey) {
      return res
        .status(400)
        .json({ success: false, message: "Salon owner or secret key missing" });
    }

    let stripeInstance;
    try {
      stripeInstance = stripe(salonOwner.secretKey);
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Stripe initialization failed" });
    }

    let Product;
    try {
      const products = await stripeInstance.products.list();
      Product = products.data.find((p) => p.name === "Bisi");

      if (!Product) {
        Product = await stripeInstance.products.create({ name: "Bisi" });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Stripe product error: " + err.message,
      });
    }

    let stripePrice;
    try {
      stripePrice = await stripeInstance.prices.create({
        product: Product.id,
        unit_amount: Math.round(Number(totalPrice) * 100),
        currency: "usd",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Stripe price creation error: " + err.message,
      });
    }

    if (paymentType === "Paid" || paymentType === "CreditCard") {
      let paymentIntent;
      try {
        paymentIntent = await stripeInstance.paymentIntents.create({
          amount: Math.round(Number(totalPrice) * 100),
          customer: customerId,
          payment_method: paymentMethodId,
          metadata: { product_id: Product.id },
          currency: "usd",
        });
        await stripeInstance.paymentIntents.confirm(paymentIntent.id);
      } catch (err) {
        return res
          .status(500)
          .json({ success: false, message: "Payment failed: " + err.message });
      }

      let invoice;
      try {
        invoice = await stripeInstance.invoices.create({
          customer: customerId,
          currency: "usd",
        });
        await stripeInstance.invoiceItems.create({
          customer: customerId,
          price: stripePrice.id,
          invoice: invoice.id,
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Invoice creation error: " + err.message,
        });
      }

      const paymentTime = new Date().toISOString().slice(11, 16);
      const date = new Date().toISOString().slice(0, 10);

      sendPaymentMail(
        name,
        email,
        combinedDescription,
        date,
        durationDescription,
        paymentTime,
        invoice.id,
        totalPrice
      );

      const countryCode = selectedCountry?.split(" ")[1] || "";
      const countryCode2 = selectedBenificialCountry?.split(" ")[1] || "";

      try {
        if (selectedBenificialCountry && benificialPhone) {
          await smtpSms({
            to: `${countryCode}${phone}`,
            text: "Your Booked Service Appointment is confirmed.",
          });
          await smtpSms({
            to: `${countryCode2}${benificialPhone}`,
            text: "Your Booked Service Appointment is confirmed.",
          });
        } else if (phone) {
          await smtpSms({
            to: `${countryCode}${phone}`,
            text: "Your Booked Service Appointment is confirmed.",
          });
        }
      } catch (err) {
        console.error("SMS sending error:", err.message);
      }

      const paymentDetails = {
        name,
        email,
        paymentIntent: paymentIntent.id,
        invoiceNumber: invoice.id,
        paymentStatus: paymentIntent.status,
        amount: Number(paymentIntent.amount) / 100,
        userId,
      };

      await paymentCollection.create(paymentDetails);

      return res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        price: paymentDetails.amount,
        status: 200,
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Unsupported payment type" });
  } catch (error) {
    console.error("Unhandled error in booking payment:", error.message);
    return res
      .status(500)
      .json({ code: 500, message: "Server error: " + error.message });
  }
};

const getUserForExternal = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await userService.getUser(id);
    if (response) {
      return res.status(200).json({
        success: true,
        message: "User of this Id is...",
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

const externalBookingSearch = async (req, res) => {
  try {
    const { name } = req.query;
    const userId = req.query.userId;
    const bookings = await bookingService.findByName(name, userId);

    return res.status(200).json({
      success: true,
      message: "Data fetched",
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getExternalCustomer = async (req, res) => {
  try {
    const email = Object.keys(req.body)[0];
    const ExistCustomer = await bookingService.findWithEmail(email);

    return res.status(200).json({
      success: true,
      message: "Data fetched",
      data: ExistCustomer,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerWithName = async (req, res) => {
  try {
    const name = req.body[0]?.name;
    const getBookingList = await bookingService.findCustomerWithName(name);

    return res.status(200).json({
      success: true,
      message: "Data fetched",
      data: getBookingList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const retrieveInvoice = async (req, res) => {
  try {
    const { userId, invoiceId } = req.body;
    const salonOwner = await userCollection.findById(userId);
    const stripeInstance = stripe(salonOwner.secretKey);

    const invoice = await stripeInstance.invoices.retrieve(invoiceId);

    if (invoice.status === "draft") {
      const invoiceFinalize = await stripeInstance.invoices.finalizeInvoice(
        invoiceId
      );

      return res.status(200).json({
        message: "Invoice finalized successfully",
        data: invoiceFinalize,
      });
    } else {
      return res.status(200).json({
        message: "Invoice get successfully",
        data: invoice,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const paymentData = await paymentCollection.find({ userId: req._user });
    return res.status(200).json({
      success: true,
      message: "Payment Data fetched",
      data: paymentData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSearchPaymentHistory = async (req, res) => {
  try {
    let { text, pageNo, limit } = req.query;
    let text1 = text.trim();
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const response = await paymentCollection
      .find({ userId: req._user, name: regex })
      .skip((pageNo - 1) * limit)
      .limit(Number(limit));

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
      data: error,
      message: error.message,
      success: false,
    });
  }
};

const getFilterPaymentHistory = async (req, res) => {
  try {
    const { endDate, paymentStatus, startDate } = req.body;
    const { text, pageNo, limit } = req.query;

    const pipeline = [
      {
        $match: { userId: Mongoose.Types.ObjectId(req._user) },
      },
    ];

    if (paymentStatus) {
      pipeline.push({
        $match: { paymentStatus: paymentStatus },
      });
    }

    if (startDate && endDate) {
      const adjustedStartDate = new Date(startDate);
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

      pipeline.push({
        $match: {
          createdAt: { $gte: adjustedStartDate, $lte: adjustedEndDate },
        },
      });
    } else if (startDate) {
      const adjustedStartDate = new Date(startDate);
      const adjustedEndDate = new Date(startDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

      pipeline.push({
        $match: {
          createdAt: { $gte: adjustedStartDate, $lt: adjustedEndDate },
        },
      });
    } else if (endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);

      pipeline.push({
        $match: {
          createdAt: { $lte: adjustedEndDate },
        },
      });
    }

    if (text !== "undefined") {
      const regex = new RegExp(
        text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      pipeline.push({
        $match: {
          $or: [{ name: regex }, { email: regex }, { invoiceNumber: regex }],
        },
      });
    }

    if (pageNo && limit) {
      const skip = (pageNo - 1) * limit;
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: Number(limit) });
    }

    pipeline.push({
      $sort: { createdAt: -1 },
    });

    const paymentData = await paymentCollection.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: "Payment Data fetched",
      data: paymentData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const UpdateStatus = async (req, res) => {
  try {
    const { status, paymentIntent } = req.body;
    const updateStatus = await paymentCollection.findOneAndUpdate(
      { paymentIntent },
      { $set: { paymentStatus: status } },
      { new: true }
    );

    if (updateStatus) {
      res.json({ success: true, updatedPayment: updateStatus, status: 200 });
    } else {
      res
        .status(404)
        .json({ success: false, error: "Payment not found", status: 404 });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const customizeData = async (req, res) => {
  try {
    const userid = req.body.userId;
    const response = await BookingLink.find({ userId: userid });

    if (response && response.length > 0) {
      return res.status(200).json({
        success: true,
        data: response,
        message: "Data fetched",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No Data Found",
      });
    }
  } catch (err) {
    const code = 500;
    return res.status(code).json({ code, message: err.message });
  }
};

const addCard = async (req, res) => {
  try {
    const { cardId, month, year, tokenCard, last4Digits, userId, email, name } =
      req.body;

    const salonOwner = await userCollection.findById(userId);

    const stripeInstance = stripe(salonOwner.secretKey);

    let customerId = "";
    const customers = await stripeInstance.customers.list({
      email: email,
    });

    if (!customers.data || customers.data.length === 0) {
      const customer = await stripeInstance.customers.create({
        name: name,
        email: email,
      });
      customerId = customer.id;
    } else {
      customerId = customers.data[0].id;
    }

    if (
      !customerId ||
      !cardId ||
      !month ||
      !year ||
      !tokenCard ||
      !last4Digits
    ) {
      return res.status(400).json({
        success: false,
        message: "customer id & card details are required to be filled",
      });
    }

    const paymentMethod = await stripeInstance.paymentMethods.create({
      type: "card",
      card: {
        token: tokenCard,
      },
    });

    const attachcard = await stripeInstance.paymentMethods.attach(
      paymentMethod.id,
      {
        customer: customerId,
      }
    );

    return res.status(200).json({
      success: true,
      paymentMethodId: paymentMethod.id,
      customerId: customerId,
      message: "card added successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const userId = req._user;
    const paymentCollectionId = req.body.Ids;

    const paymentData = await paymentCollection.find({
      userId: userId,
      _id: paymentCollectionId,
    });

    return res.status(200).json({
      message: "Payment Data fetched",
      data: paymentData,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

const getCountryCode = async (req, res) => {
  try {
    const myCountryCodesObject = countryCodes.customList(
      "countryCode",
      " +{countryCallingCode}"
    );
    return res.status(200).json({
      message: "Country Data fetched",
      data: myCountryCodesObject,
      status: 200,
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const getAllInventory = async (req, res) => {
  try {
    const { userId } = req.body;
    const response = await inventoryCollection.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), isDeleted: false } },
      {
        $lookup: {
          from: "businessService",
          localField: "service",
          foreignField: "_id",
          as: "service",
        },
      },

      { $sort: { name: -1 } },
      {
        $facet: {
          data: [{ $skip: 0 }, { $limit: 1000 }],
        },
      },
    ]);
    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: response,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSingleInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await inventoryCollection
      .findOne({ _id: id })
      .populate("service");
    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: response,
        totalCount: response.length,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getBusinessClasses = async (req, res) => {
  try {
    const { userId } = req.body;
    const response = await businessClassService.getClassById(userId);
    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: response,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createMultipleProducts = async (req, res) => {
  try {
    const { userId, name, email, products, paymentType } = req.body;
    const productsList = await inventoryCollection.find({
      _id: { $in: products?.map((item) => item?.productId) },
    });
    const productsDescription = productsList
      ?.map((item) => `${item?.name}`)
      .join(", ");
    const salonOwner = await userCollection.findById(userId);
    if (salonOwner?.isActivateAccount == true) {
      return res.status(400).json({
        success: true,
        message: "Link is Expired",
        status: 400,
      });
    }

    const exist = await customerCollection.findOne({
      email: email?.toLowerCase(),
      userId: Mongoose.Types.ObjectId(userId),
    });

    if (exist) {
      const productData = await Promise.all(
        products.map(async (item) => {
          const inventory = await inventoryService.getInventoryById(
            item?.productId
          );
          const updatedStock = inventory?.productstock - item?.quantity;
          await inventoryService.update(item?.productId, {
            productstock: updatedStock,
          });
          return {
            addedBy: userId,
            userId: exist?._id,
            inventoryId: item?.productId,
            price: item?.price,
            quantity: item?.quantity,
          };
        })
      );
      const createdProducts = await productService.createMultiple(productData);

      sendProductBookingOwner(
        name,
        salonOwner?.email,
        salonOwner?.firstName,
        productsDescription
      );

      let notification = {
        title: "You’ve Made Sales",
        text: `Cha-ching $! Your closer to your revenue goal! <strong>${name}</strong> just ordered <strong>${productsDescription}</strong> from your store. Do your happy dance!! Remember, they could have gone to someone else.`,
        clientName: name,
        type: "Product",
        bookedBy: userId,
        customerId: exist?._id,
        fcmToken: salonOwner?.fcmToken,
      };
      await createNotification(notification);

      const countryCode = exist?.selectedCountry?.split(" ")[1];
      if (exist?.phoneNumber) {
        let smsData = {
          to: `${countryCode}${exist?.phoneNumber}`,
          text: "Your Product order is confirmed.",
        };

        await smtpSms(smsData);
      }

      return res.status(200).json({
        success: true,
        message: "Products added successfully",
        data: createdProducts,
      });
    } else {
      const newCustomer = {
        name: name,
        email: email?.toLowerCase(),
        userId: userId,
        paymentType: paymentType,
      };

      const createCustomer = await customerService.post(newCustomer);
      let notification3 = {
        title: "Your Business is Growing",
        text: `Your client list is growing!! <strong>${createCustomer?.name}</strong> has been added to your client database. Be sure to greet them with a smile when they arrive!! Remember, they could have gone to someone else.`,
        type: "User",
        clientName: createCustomer?.name,
        bookingFor: createCustomer?._id,
        customerId: createCustomer?._id,
        bookedBy: userId,
        fcmToken: salonOwner?.fcmToken,
      };
      await createNotification(notification3);
      const productData = await Promise.all(
        products.map(async (item) => {
          const inventory = await inventoryService.getInventoryById(
            item?.productId
          );
          const updatedStock = inventory?.productstock - item?.quantity;
          await inventoryService.update(item?.productId, {
            productstock: updatedStock,
          });
          return {
            addedBy: userId,
            userId: createCustomer?._id,
            inventoryId: item?.productId,
            price: item?.price,
            quantity: item?.quantity,
          };
        })
      );
      const createdProducts = await productService.createMultiple(productData);

      sendProductBookingOwner(
        name,
        salonOwner?.email,
        salonOwner?.firstName,
        productsDescription
      );

      let notification = {
        title: "You’ve Made Sales",
        text: `Cha-ching $! Your closer to your revenue goal! <strong>${createCustomer?.name}</strong> just bought <strong>${productsDescription}</strong> from your store. Do your happy dance!! Remember, they could have gone to someone else.`,
        clientName: createCustomer?.name,
        type: "Product",
        bookedBy: userId,
        customerId: createCustomer?._id,
        fcmToken: salonOwner?.fcmToken,
      };
      await createNotification(notification);

      return res.status(200).json({
        success: true,
        message: "Products added successfully",
        data: createdProducts,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const handleProductsPayment = async (req, res) => {
  try {
    const {
      paymentMethodId,
      userId,
      name,
      email,
      products,
      customerId,
      totalPrice,
    } = req.body;
    const productsList = await inventoryCollection.find({
      _id: { $in: products },
    });
    const productsDescription = productsList
      ?.map((item) => `${item?.name}`)
      .join(", ");

    const salonOwner = await userCollection.findById(userId);

    const stripeInstance = stripe(salonOwner?.secretKey);
    const stripeProducts = await stripeInstance.products.list();
    let stripeProduct = stripeProducts.data.find((p) => p.name === "Bisi");
    if (!stripeProduct) {
      stripeProduct = await stripeInstance.products.create({
        name: "Bisi",
      });
    }
    const price = await stripeInstance.prices.create({
      product: stripeProduct.id,
      unit_amount: totalPrice * 100,
      currency: "usd",
    });

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: totalPrice * 100,
      customer: customerId,
      payment_method: paymentMethodId,
      metadata: {
        product_id: stripeProduct.id,
      },
      currency: "usd",
    });
    const paymentConfirm = await stripeInstance.paymentIntents.confirm(
      paymentIntent.id
    );
    await stripeInstance.paymentIntents.retrieve(paymentIntent.id);
    const invoice = await stripeInstance.invoices.create({
      customer: customerId,
      currency: "usd",
    });
    await stripeInstance.invoiceItems.create({
      customer: customerId,
      price: price.id,
      invoice: invoice.id,
    });

    const paymentDate = new Date();
    const [date, time] = paymentDate.toISOString()?.split("T");
    const paymentTime = time.slice(0, 5);
    const invoiceId = invoice.id;
    sendProductPaymentMail(
      name,
      email,
      invoiceId,
      productsDescription,
      totalPrice,
      date,
      paymentTime
    );
    const obj = {
      name: name,
      email: email,
      paymentIntent: paymentIntent.id,
      invoiceNumber: invoice.id,
      paymentStatus: paymentConfirm.status,
      amount: paymentIntent.amount / 100,
      paymentMthod: paymentMethodId,
      bookedBy: userId,
      userId,
    };

    paymentCollection.create(obj);

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent?.client_secret,
      price: obj.amount,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

module.exports = {
  createUser,
  getUser,
  UserEdit,
  userDelete,
  UserSearch,
  loginStatusUpdate,
  getStripeSignupPlans,
  getStripePriceList,
  getStripeFinalList,
  UserSignEdit,
  UserFreeSignEdit,
  getUserById,
  encryptId,
  getScheduleList,
  externalBookingSearch,
  createExternalBooking,
  getCustomerWithName,
  getExternalCustomer,
  getUserByIdforDashboard,
  getCouponPlans,
  getProductWithCoupon,
  deleteSubscription,
  userWebhook,
  getAllUsersList,
  getUserForExternal,
  getExternalServiceSetting,
  ExternalBookingPayment,
  retrieveInvoice,
  getPaymentHistory,
  getPaymentById,
  UpdateStatus,
  customizeData,
  addCard,
  getFilterPaymentHistory,
  getSearchPaymentHistory,
  getCountryCode,
  restoreHistory,
  deleteHistory,
  getAllInventory,
  getSingleInventory,
  getBusinessClasses,
  createMultipleProducts,
  handleProductsPayment,
};
