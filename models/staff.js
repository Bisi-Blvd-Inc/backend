var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var StaffSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    isDeleted: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    countryCode:{type:String},
    phoneNumber: { type: String },
    role: { type: String,  default: "staff" },
    password : {type: String }, 
    permission: {
      toDo: { type: Boolean, default: false },
      goals: { type: Boolean, default: false },
      number: { type: Boolean, default: false },
      bookings: { type: Boolean, default: false },
      calender: { type: Boolean, default: false },
      users: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
      inventory: { type: Boolean, default: false },
      myAccount: { type: Boolean, default: false },
      payment: { type: Boolean, default: false },
      rollManagement: { type: Boolean, default: false },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var Staff = mongoose.model("Staff", StaffSchema);

module.exports = Staff;
