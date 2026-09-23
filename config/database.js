require("dotenv").config();
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;

// mongoose.connect() returns a promise. Without a .catch() here, a failed
// connection becomes an unhandled promise rejection — and Node treats
// unhandled rejections as fatal by default, killing the entire process.
// That meant any MongoDB restart, network blip, or misconfiguration took
// down the whole backend, not just the affected requests (confirmed by
// reproducing it locally: the db.on("error", ...) handler below fires as
// expected, but the process still crashes on a separate, unhandled path).
// Individual queries still fail on their own after Mongoose's buffering
// timeout (~10s) while disconnected — that's expected and unchanged;
// it's specifically the whole-process crash this fixes.
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useCreateIndex: false,
  })
  .catch((err) => {
    console.error("Initial MongoDB connection failed:", err.message);
  });
mongoose.set("debug", true);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.on("disconnected", () => {
  console.error(
    "MongoDB disconnected — the underlying driver will keep retrying automatically."
  );
});
db.on("reconnected", () => {
  console.log("MongoDB reconnected.");
});

db.once("open", function () {
  console.log("Connection Successful!");
});
