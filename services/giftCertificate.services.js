const bookingCollection = require("../models/booking");

const findgiftcutomerID  = (condition) => {
  return bookingCollection.find(condition).populate("bookingFor").populate('service');
};

module.exports = {
  findgiftcutomerID
};
