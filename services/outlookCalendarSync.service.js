const { getBookingTimes } = require("./calendarSync.service");
const { loadOwnerServiceTimes, withOwnerServiceTimes } = require("../helpers/ownerServiceTimes");

// Mirrors one booking to the owner's Outlook calendar through Microsoft Graph.
// Same behaviour as the Google sync in calendarSync.service.js: create on a
// new booking, update on a change, delete on cancel. `deps` exists so this can
// be tested without Microsoft or Mongo.

// Tags the event with the booking id (a "public string" extended property) so
// that, when we later read busy time from Outlook, our own events can be told
// apart from the owner's personal ones.
const BOOKING_TAG_PROPERTY = "String {00020329-0000-0000-C000-000000000046} Name bisiBookingId";

const isGone = (err) => err && err.response && (err.response.status === 404 || err.response.status === 410);

// Graph wants a local-looking dateTime plus a separate time zone name.
const toGraphDate = (date) => ({
  dateTime: date.toISOString().replace("Z", ""),
  timeZone: "UTC",
});

const buildOutlookEvent = (booking, services = booking.service) => {
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
    subject: `${serviceNames} — ${client}`,
    body: { contentType: "text", content: lines.join("\n") },
    start: toGraphDate(start),
    end: toGraphDate(end),
    isReminderOn: true,
    singleValueExtendedProperties: [
      { id: BOOKING_TAG_PROPERTY, value: String(booking._id) },
    ],
  };
};

const syncBooking = async (bookingId, deps = {}) => {
  const Booking = deps.Booking || require("../models/booking");
  const graph = deps.graphRequest || require("./microsoftCalendar.service").graphRequest;

  const booking = await Booking.findById(bookingId).populate("service");
  if (!booking || !booking.userId) return "skipped";

  const cancelled = booking.isDeleted || booking.bookingStatus === "Cancelled";
  if (cancelled) {
    if (!booking.outlookEventId) return "skipped";
    try {
      const result = await graph(booking.userId, "DELETE", `/me/events/${booking.outlookEventId}`);
      if (result === null) return `not-connected (owner ${booking.userId})`;
    } catch (err) {
      if (!isGone(err)) throw err;
    }
    await Booking.updateOne({ _id: booking._id }, { $unset: { outlookEventId: 1 } });
    return "deleted";
  }

  if (!booking.startDateTime && !booking.startDate) return "skipped";
  const ownerTimes = await (deps.loadOwnerServiceTimes || loadOwnerServiceTimes)(booking.userId);
  const event = buildOutlookEvent(booking, withOwnerServiceTimes(booking.service, ownerTimes));

  if (booking.outlookEventId) {
    try {
      // The tag is set once at creation; leave it out of updates.
      const { singleValueExtendedProperties, ...changes } = event;
      const result = await graph(booking.userId, "PATCH", `/me/events/${booking.outlookEventId}`, changes);
      if (result === null) return `not-connected (owner ${booking.userId})`;
      return "updated";
    } catch (err) {
      // The event was removed on the Outlook side — recreate it below.
      if (!isGone(err)) throw err;
    }
  }

  const created = await graph(booking.userId, "POST", "/me/events", event);
  if (created === null) return `not-connected (owner ${booking.userId})`;
  await Booking.updateOne({ _id: booking._id }, { $set: { outlookEventId: created.id } });
  return `created (event ${created.id})`;
};

// For a booking that was hard-deleted: the document is gone, so the event id
// and owner were captured beforehand.
const removeEventForDeletedBooking = async ({ userId, outlookEventId }, deps = {}) => {
  if (!userId || !outlookEventId) return "skipped";
  const graph = deps.graphRequest || require("./microsoftCalendar.service").graphRequest;
  try {
    const result = await graph(userId, "DELETE", `/me/events/${outlookEventId}`);
    if (result === null) return "not-connected";
  } catch (err) {
    if (!isGone(err)) throw err;
    return "already-gone (Outlook reported the event not found)";
  }
  return "deleted";
};

module.exports = { buildOutlookEvent, syncBooking, removeEventForDeletedBooking };
