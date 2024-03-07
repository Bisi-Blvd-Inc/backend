const notesCollection = require("../models/userdetailnotes");
const post = (payload) => notesCollection.create(payload);

const getAll = (condition) => {
  return notesCollection.find(condition);
};


module.exports = {
  post,
  getAll,
};
