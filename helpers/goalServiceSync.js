// Services a subscriber checks on the My Goals page must also be available
// wherever services are listed for booking (calendar, bookings, Settings).
// Those lists read the `serviceSetting` document, not the goals record, so
// selecting a service on Goals left it invisible to bookings until the same
// service was selected again under Settings -> Booking Service.
//
// This only ADDS missing services (using the price/time entered on Goals). It
// never overwrites an existing entry, so price changes made later in Settings
// are safe, and it never removes anything.
const toNumber = (value) =>
  Number(String(value === undefined || value === null ? "" : value).replace(/[^0-9.]/g, "")) || 0;

const buildEntries = (goalServices, alreadyInSettings) =>
  (Array.isArray(goalServices) ? goalServices : [])
    .filter(
      (item) =>
        item &&
        item.checked === true &&
        item._id &&
        item.isDeleted !== true &&
        !alreadyInSettings.has(String(item._id))
    )
    .map((item) => ({
      serviceId: item._id,
      price: toNumber(item.serviceCharge !== undefined ? item.serviceCharge : item.price),
      serviceTime: {
        hours: toNumber(item.serviceHours !== undefined ? item.serviceHours : item.serviceTime && item.serviceTime.hours),
        minutes: toNumber(item.serviceMinute !== undefined ? item.serviceMinute : item.serviceTime && item.serviceTime.minutes),
      },
    }));

// Returns how many services were added.
const syncGoalServicesToBookingSettings = async (userId, goalServices, ServiceSetting) => {
  const setting = await ServiceSetting.findOne({ addedBy: userId, isDeleted: { $ne: true } });
  const existing = new Set(((setting && setting.service) || []).map((s) => String(s.serviceId)));
  const entries = buildEntries(goalServices, existing);
  if (entries.length === 0) return 0;

  if (setting) {
    await ServiceSetting.updateOne({ _id: setting._id }, { $push: { service: { $each: entries } } });
  } else {
    await ServiceSetting.create({ addedBy: userId, service: entries });
  }
  return entries.length;
};

module.exports = { buildEntries, syncGoalServicesToBookingSettings };
