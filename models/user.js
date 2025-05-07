var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema(
  {
    businessName: { type: String },
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    password: { type: String },
    phone: { type: String },
    mobile: { type: String },
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
      link: { type: Boolean, default: false },
      report: { type: Boolean, default: false },
    },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    selectedCountry:{type:String},
    selectedBusinessCountry:{type:String},
    state: { type: String },
    businessType: [{ type: Schema.Types.ObjectId, ref: "Business" }],
    reffered: { type: String },
    role: { type: Number, enum: [1, 2, 3], default: 2 },
    status: { type: Number, default: 0 },
    token: { type: String },
    secretKey: { type: String},
    publicKey: { type: String},
    isDeleted: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId},
    loginStatus: { type: Number, enum: [0, 1], default: 0 },
    cardDetails: { type: Object },
    planDeatils: { type: Object },
    subscriptionStatus: { type: Boolean, default: false },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    sevenDaysMailStatus: { type: Boolean, default: false },
    threeDaysMailStatus: { type: Boolean, default: false },
    oneDayMailStatus: { type: Boolean, default: false },
    upgradeStatus: { type: Boolean, default: false },
    stripeCustomerId: { type: String },
    invoiceNumber: {
      type: String,
    },
    fcmToken: { type: Array },
    type:{type: String, default: "user" },
    subscription: { type: Object },
    paymentMethod: { type: Object },
    paymentStatus: { type: Number , default: 0 },
    isActivateAccount: { type: Boolean, default: false },
    HistoryActivateStatus : { type: Boolean, default: true },
    DeactivateAccountDate : { type: String},
    withEnterprise: { type: Boolean, default: false },
  },

  { collection: "users", timestamps: { createdAt: true, updatedAt: true } }
);

var User = mongoose.model("User", userSchema);

module.exports = User;
