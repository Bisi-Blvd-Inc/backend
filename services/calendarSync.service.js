const { google } = require("googleapis");
const moment = require("moment");
const { loadOwnerServiceTimes, withOwnerServiceTimes } = require("../helpers/ownerServiceTimes");

const CALENDAR_ID = "primary";

const isGone = (err) => err && (err.code === 404 || err.code === 410);

// A booking's real start time lives in `startDateTime`, a string written by
// the web app like "Fri Sep 25 2026 11:00:AM:00 GMT-0500 (CDT)". `startDate`
// is only the calendar day (saved as midnight UTC), so using it alone shifts
// the event by the owner's UTC offset — an 11:00am booking landed at 7pm the
// day before. `endDateTime` is saved equal to the start, so the end comes from
// the services' durations (default 1 hour).
const STAMP_FORMATS = ["ddd MMM DD YYYY hh:mm:A:ss [GMT]ZZ", "ddd MMM D YYYY hh:mm:A ZZ"];

const parseStamp = (value) => {
  if (!value) return null;
  for (const format of STAMP_FORMATS) {
    const parsed = moment(String(value), format);
    if (parsed.isValid()) return parsed.toDate();
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const getBookingTimes = (booking, services = booking.service) => {
  const start = parseStamp(booking.startDateTime) || new Date(booking.startDate);
  const minutes = (services || []).reduce((total, s) => {
    const time = (s && s.serviceTime) || {};
    return total + (Number(time.hours) || 0) * 60 + (Number(time.minutes) || 0);
  }, 0);
  return { start, end: new Date(start.getTime() + (minutes || 60) * 60 * 1000) };
};

const buildEvent = (booking, services = booking.service) => {
  const serviceNames =
    (booking.service || [])
      .map((s) => s && s.service)
      .filter(Boolean)
      .join(", ") || "Appointment";
  const client = booking.benificialName || booking.name || "Client";
  const { start, end } = getBookingTimes(booking, services);

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
  if (!auth) return `not-connected (owner ${booking.userId})`;
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

  if (!booking.startDateTime && !booking.startDate) return "skipped";
  const ownerTimes = await (deps.loadOwnerServiceTimes || loadOwnerServiceTimes)(booking.userId);
  const requestBody = buildEvent(booking, withOwnerServiceTimes(booking.service, ownerTimes));

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
  return `created (event ${created.data.id})`;
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
    // Google says there is no such event on this account's calendar.
    return "already-gone (Google reported the event not found)";
  }
  return "deleted";
};

// Fire-and-forget wrappers used by the booking model hooks: a calendar
// problem must never fail or slow down saving a booking.
// Owners with no connected calendar are the norm, so that outcome is logged
// once per owner per process instead of on every booking.
const loggedNotConnected = new Set();

const syncBookingInBackground = (bookingId) => {
  if (!process.env.GOOGLE_CREDENTIALS_PATH) {
    console.warn("Google Calendar sync skipped: GOOGLE_CREDENTIALS_PATH is not set");
    return;
  }
  setImmediate(() => {
    syncBooking(bookingId)
      .then((result) => {
        if (String(result).startsWith("not-connected")) {
          if (loggedNotConnected.has(result)) return;
          loggedNotConnected.add(result);
        }
        console.log(`Google Calendar sync for booking ${bookingId}: ${result}`);
      })
      .catch((err) =>
        console.error(`Google Calendar sync failed for booking ${bookingId}:`, err.message)
      );
  });
};

const removeEventInBackground = (info) => {
  if (!process.env.GOOGLE_CREDENTIALS_PATH) return;
  setImmediate(() => {
    removeEventForDeletedBooking(info)
      .then((result) =>
        console.log(`Google Calendar event ${info.googleEventId} for deleted booking: ${result}`)
      )
      .catch((err) =>
        console.error("Google Calendar event removal failed:", err.message)
      );
  });
};

module.exports = {
  getBookingTimes,
  buildEvent,
  syncBooking,
  removeEventForDeletedBooking,
  syncBookingInBackground,
  removeEventInBackground,
};
