const businessClassCollection = require("../models/businessClass.js");
const moment = require("moment");

const generateOccurrences = ({
  date,
  reoccurringDays,
  reoccurringEndDate,
  startTime,
  endTime,
  seats,
}) => {
  const occurrences = [];
  let currentDate = moment(date);
  const endDate = moment(reoccurringEndDate);

  const interval =
    reoccurringDays === "Daily"
      ? "days"
      : reoccurringDays === "Weekly"
      ? "weeks"
      : "months";

  while (currentDate.isSameOrBefore(endDate, "day")) {
    occurrences.push({
      date: currentDate.toDate(),
      startTime,
      endTime,
      seats: { ...seats },
    });
    currentDate = currentDate.add(1, interval);
  }

  return occurrences;
};

const bookClassOccurrence = async ({
  classId,
  occurrenceDate,
  seatsToBook,
}) => {
  const classDoc = await businessClassCollection.findById(classId);

  if (!classDoc) return;

  const occurrenceIndex = classDoc.occurrences.findIndex((o) =>
    moment(o.date).isSame(moment(occurrenceDate), "day")
  );

  if (occurrenceIndex === -1) return;

  const occurrence = classDoc.occurrences[occurrenceIndex];

  if (occurrence.seats.availableSeats < seatsToBook)
    throw new Error("Not enough seats available");

  classDoc.occurrences[occurrenceIndex].seats.availableSeats -= seatsToBook;
  classDoc.occurrences[occurrenceIndex].seats.bookedSeats += seatsToBook;

  classDoc.markModified(`occurrences.${occurrenceIndex}.seats`);

  await classDoc.save();

  return classDoc.occurrences[occurrenceIndex];
};

const createClass = async (data) => {
  const {
    isReoccurring,
    date,
    reoccurringDays,
    reoccurringEndDate,
    startTime,
    endTime,
    seats,
  } = data;

  let occurrences = [];

  if (isReoccurring && reoccurringDays && reoccurringEndDate) {
    occurrences = generateOccurrences({
      date,
      reoccurringDays,
      reoccurringEndDate,
      startTime,
      endTime,
      seats,
    });
  } else {
    occurrences = [
      {
        date,
        startTime,
        endTime,
        seats,
      },
    ];
  }

  return await businessClassCollection.create({
    ...data,
    occurrences,
  });
};
const getClass = (pageNo, limit) => {
  return businessClassCollection
    .find({ isDeleted: false })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ _id: -1 });
};
const getClassById = (id) => {
  return businessClassCollection
    .find({ isDeleted: false, addedBy: id })
    .sort({ updatedAt: -1, createdAt: -1 });
};
const updateById = (condition, obj) => {
  const {
    isReoccurring,
    date,
    reoccurringDays,
    reoccurringEndDate,
    startTime,
    endTime,
    seats,
  } = obj;

  let occurrences = [];

  if (isReoccurring && reoccurringDays && reoccurringEndDate) {
    occurrences = generateOccurrences({
      date,
      reoccurringDays,
      reoccurringEndDate,
      startTime,
      endTime,
      seats,
    });
  } else {
    occurrences = [
      {
        date,
        startTime,
        endTime,
        seats,
      },
    ];
  }
  return businessClassCollection.findByIdAndUpdate(condition, {
    ...obj,
    occurrences,
  });
};
const getClassSearch = (pageNo, limit, text) => {
  return businessClassCollection
    .find({
      $or: [{ name: { $regex: String(text), $options: "i" } }],
      isDeleted: false,
    })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit);
};
const deleteById = (id) => {
  return businessClassCollection.findByIdAndDelete(id);
};

module.exports = {
  getClass,
  createClass,
  getClassSearch,
  updateById,
  getClassById,
  deleteById,
  bookClassOccurrence,
};
