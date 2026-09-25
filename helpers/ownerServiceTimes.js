// How long a service takes is set per subscriber (Goals page / Settings ->
// Booking Service, stored in `serviceSetting`). Bookings populate the shared
// `businessService` record, whose own time is only a default (often 0), so
// the owner's time is applied on top wherever a booking's length is used:
// the calendar, and the Google Calendar event.
const ServiceSetting = require("../models/serviceSetting");

const loadOwnerServiceTimes = async (ownerId) => {
  const times = new Map();
  if (!ownerId) return times;
  const setting = await ServiceSetting.findOne({
    addedBy: ownerId,
    isDeleted: { $ne: true },
  }).lean();
  for (const entry of (setting && setting.service) || []) {
    const hours = Number(entry.serviceTime && entry.serviceTime.hours) || 0;
    const minutes = Number(entry.serviceTime && entry.serviceTime.minutes) || 0;
    if (entry.serviceId && hours + minutes > 0) {
      times.set(String(entry.serviceId), { hours, minutes });
    }
  }
  return times;
};

// Returns the services with the owner's time applied (input isn't mutated).
const withOwnerServiceTimes = (services, times) =>
  (services || []).map((service) => {
    const plain = service && typeof service.toObject === "function" ? service.toObject() : service;
    const time = plain && times.get(String(plain._id));
    return time ? { ...plain, serviceTime: time } : plain;
  });

module.exports = { loadOwnerServiceTimes, withOwnerServiceTimes };
