require("dotenv").config();
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useCreateIndex: false,
});
mongoose.set("debug", true);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

db.once("open", function () {
  console.log("Connection Successful!");
});
