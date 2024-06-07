const User = require("../../models/user");
// const scheduleBooking = require("../../models/bookingSchedule");
const scheduleService = require("../../services/schedule.service");
const bookingCollection = require("../../models/booking");
const { sendActivationMail } = require("../../helpers/users");


const createSchedule = async (req, res) => {
  try {
    let scheduledData = req.body.scheduledData;
    if (scheduledData == null || scheduledData == "null") {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        status: 500,
      });
    }
    const schedule = await scheduleService.find({
      addedBy: req._user,
    });

    // const scheduleBooked = await scheduleBooking.findOne({
    //   addedBy: req._user,
    // })
    if (schedule) {
      const Id = schedule._id;
      // const bookedId = scheduleBooked?._id
      let data = [];
      scheduledData.map((item, i) => {
        const obj = {
          startDate: item.startDate,
          startTime: item.startTime,
          endTime: item.endTime,
        };
        data.push(obj);
      });

      const obj = {
        scheduledData: data
      };
      let result = await scheduleService.update(Id, obj);
      // let result1 = await scheduleBooking.findByIdAndUpdate(bookedId, obj);
      return res.status(200).json({
        status: 200,
        success: true,
        data: result,
        message: "Schedule updated successfully",
      });
    }
    let data = [];
    scheduledData.map((item, i) => {
      const obj = {
        startDate: item.startDate,
        startTime: item.startTime,
        endTime: item.endTime,
      };
      data.push(obj);
    });
    const user1 = await User.findById(req._user);
    if (!user1)
      return res.status(401).json({
        success: false,
        message: "User not found with provided token!!",
      });
    const createdSchedule = await scheduleService.post({
      scheduledData: data,
      addedBy: user1._id,
    });
    // const bookingSchedule = await scheduleBooking.create({
    //   scheduledData: data,
    //   addedBy: user1._id,
    //   referBy: createdSchedule._id
    // });
    return res.status(200).json({
      success: true,
      message: "Schedule added successfully",
      data: createdSchedule,
    });
  } catch (error) {
    console.log(error);
  }
};
const resendmail = async (req, res) => {
  try {
    const email = req?.body?.emaii;
    if (email) {
      await sendActivationMail(email)
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Activation email has been sent. Please check your email",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getScheduleList = async (req, res) => {
  try {
    const response = await scheduleService.findSchedule({
      isDeleted: false,
      addedBy: req._user
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
        count: response.length,
        status: 200,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getBookingScheduleListthisweek = async (req, res) => {
  try {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const query = {
      bookingStatus: "Confirmed",
      paymentType: "Paid",
      startDateTime: {
        $gte: new Date(monday),
      }
    };
    const response = await bookingCollection.find(query);
    if (!response) {
      return res.status(200).json({
        message: " No Schedule found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Schedule get successfully",
        data: response.filter((item) => new Date(item.startDateTime).getTime() < new Date(sunday).getTime()),
        count: response.length,
        status: 200,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getBookingScheduleListthismonth = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);
    const query = {
      bookingStatus: "Confirmed",
      paymentType: "Paid",
      startDateTime: {
        $gte: new Date(firstDayOfMonth),
      }
    };
    const response = await bookingCollection.find(query);
    if (!response) {
      return res.status(200).json({
        message: " No Schedule found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Schedule get successfully",
        data: response.filter((item) => new Date(item.startDateTime).getTime() < new Date(lastDayOfMonth).getTime()),
        count: response.length,
        status: 200,
      });
    }
  } catch (error) {
    console.log(error);
  }
};


const deleteSchedule = async (req, res) => {
  try {
    const response = await scheduleService.deleteSchedule(
      { _id: req.params.id },
      {
        isDeleted: true,
      }
    );
    if (response) {
      return res.status(200).json({
        success: true,
        message: "Schedule Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Schedule Found",
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
  createSchedule,
  getScheduleList,
  deleteSchedule,
  getBookingScheduleListthisweek,
  getBookingScheduleListthismonth,
  resendmail
};
