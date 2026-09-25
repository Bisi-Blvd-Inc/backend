const { google } = require("googleapis");

const CALENDAR_ID = "primary";

const isGone = (err) => err && (err.code === 404 || err.code === 410);

const buildEvent = (booking) => {
  const serviceNames =
    (booking.service || [])
      .map((s) => s && s.service)
      .filter(Boolean)
      .join(", ") || "Appointment";
  const client = booking.benificialName || booking.name || "Client";
  const start = new Date(booking.startDate);
  const end =
    booking.endDate && new Date(booking.endDate) > start
      ? new Date(booking.endDate)
      : new Date(start.getTime() + 60 * 60 * 1000);

  const lines = [`Client: ${client}`];
  const email = booking.benificialEmail || booking.email;
  const phone = booking.benificialPhone || booking.phoneNumber;
  if (email) lines.push(`Email: ${email}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (booking.servicePrice != null) lines.push(`Price: $${booking.servicePrice}`);
  lines.push("", "Booked in Bisi Books");

  return {
    summary: `${serviceNames} — ${client}`,
    description: lines.join("\n"),
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: { useDefault: true },
    extendedProperties: { private: { bisiBookingId: String(booking._id) } },
  };
};

// Creates, updates, or deletes the Google Calendar event that mirrors one
// booking. `deps` exists so this can be tested without Google or Mongo.
const syncBooking = async (bookingId, deps = {}) => {
  const Booking = deps.Booking || require("../models/booking");
  const getAuthorizedClient =
    deps.getAuthorizedClient || require("./googleCalendar.service").getAuthorizedClient;
  const makeCalendar =
    deps.makeCalendar || ((auth) => google.calendar({ version: "v3", auth }));

  const booking = await Booking.findById(bookingId).populate("service");
  if (!booking || !booking.userId) return "skipped";

  const auth = await getAuthorizedClient(booking.userId);
  if (!auth) return "not-connected";
  const calendar = makeCalendar(auth);

  const cancelled = booking.isDeleted || booking.bookingStatus === "Cancelled";
  if (cancelled) {
    if (booking.googleEventId) {
      try {
        await calendar.events.delete({
          calendarId: CALENDAR_ID,
          eventId: booking.googleEventId,
        });
      } catch (err) {
        if (!isGone(err)) throw err;
      }
      await Booking.updateOne({ _id: booking._id }, { $unset: { googleEventId: 1 } });
      return "deleted";
    }
    return "skipped";
  }

  if (!booking.startDate) return "skipped";
  const requestBody = buildEvent(booking);

  if (booking.googleEventId) {
    try {
      await calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId: booking.googleEventId,
        requestBody,
      });
      return "updated";
    } catch (err) {
      // The event was removed on the Google side — recreate it below.
      if (!isGone(err)) throw err;
    }
  }

  const created = await calendar.events.insert({ calendarId: CALENDAR_ID, requestBody });
  await Booking.updateOne(
    { _id: booking._id },
    { $set: { googleEventId: created.data.id } }
  );
  return "created";
};

// For a booking that was hard-deleted: the document is gone, so the event id
// and owner were captured beforehand.
const removeEventForDeletedBooking = async ({ userId, googleEventId }, deps = {}) => {
  if (!userId || !googleEventId) return "skipped";
  const getAuthorizedClient =
    deps.getAuthorizedClient || require("./googleCalendar.service").getAuthorizedClient;
  const makeCalendar =
    deps.makeCalendar || ((auth) => google.calendar({ version: "v3", auth }));
  const auth = await getAuthorizedClient(userId);
  if (!auth) return "not-connected";
  try {
    await makeCalendar(auth).events.delete({
      calendarId: CALENDAR_ID,
      eventId: googleEventId,
    });
  } catch (err) {
    if (!isGone(err)) throw err;
  }
  return "deleted";
};

// Fire-and-forget wrappers used by the booking model hooks: a calendar
// problem must never fail or slow down saving a booking.
const syncBookingInBackground = (bookingId) => {
  if (!process.env.GOOGLE_CREDENTIALS_PATH) return;
  setImmediate(() => {
    syncBooking(bookingId).catch((err) =>
      console.error(`Google Calendar sync failed for booking ${bookingId}:`, err.message)
    );
  });
};

const removeEventInBackground = (info) => {
  if (!process.env.GOOGLE_CREDENTIALS_PATH) return;
  setImmediate(() => {
    removeEventForDeletedBooking(info).catch((err) =>
      console.error("Google Calendar event removal failed:", err.message)
    );
  });
};

module.exports = {
  buildEvent,
  syncBooking,
  removeEventForDeletedBooking,
  syncBookingInBackground,
  removeEventInBackground,
};
