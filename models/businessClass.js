var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const occurrenceSchema = new Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  seats: {
    availableSeats: { type: Number, default: 0 },
    bookedSeats: { type: Number, default: 0 },
    totalSeats: { type: Number, default: 0 },
  },
});

var businessClassSchema = new Schema(
  {
    name: { type: String, required: true },
    instructor: { type: String, required: true },
    description: { type: String },
    price: { type: Number, default: 0, required: true },
    date: { type: Date, default: Date.now, required: true },
    occurrences: [occurrenceSchema],
    difficultyLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    location: { type: String },
    isReoccurring: { type: Boolean, default: false },
    reoccurringDays: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
    },
    reoccurringEndDate: { type: Date },
    isDeleted: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "businessClass",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var businessClass = mongoose.model("businessClass", businessClassSchema);

module.exports = businessClass;
