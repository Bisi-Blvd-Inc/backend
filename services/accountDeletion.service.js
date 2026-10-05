const crypto = require("crypto");
const stripeLib = require("stripe");
const User = require("../models/user");
const Booking = require("../models/booking");
const Customer = require("../models/customer");
const BusinessService = require("../models/businessService");
const BusinessClass = require("../models/businessClass");
const Notification = require("../models/notification");
const Schedule = require("../models/schedule");
const CustomizedLink = require("../models/customizedLink");
const PersonalBudget = require("../models/personalBudget");
const ServiceSetting = require("../models/serviceSetting");
const Upgrade = require("../models/upgrade");
const GoalsCompanyBudget = require("../models/goalsCompanyBudget");
const Inventory = require("../models/inventory");
const PaymentHistory = require("../models/paymentHistory");
const UserDetailFileupload = require("../models/userDetailfileupload");
const UserDetailNotes = require("../models/userdetailnotes");
const UserDetailSoap = require("../models/userdetailsoap");
const EmailSetting = require("../models/emailSetting");
const Product = require("../models/product");
const Staff = require("../models/staff");
const RejectImports = require("../models/rejectImports");
const Enterprise = require("../models/enterprise");
const DeletedAccountSummary = require("../models/deletedAccountSummary");
const googleCalendar = require("./googleCalendar.service");
const { decryptSecret } = require("../helpers/paymentCrypto");

// The bank-connection code only exists on `stage` until Plaid's live-tier
// approval lets it ship to `main`, so these are loaded lazily. When the
// modules aren't present (production today) there are no bank connections
// to clean up.
const loadBankModules = () => {
  try {
    return {
      BankConnection: require("../models/bankConnection"),
      BankTransaction: require("../models/bankTransaction"),
      plaidProvider: require("./bankProvider/plaid.provider"),
    };
  } catch (err) {
    return null;
  }
};

const REASON_CODES = [
  "too_expensive",
  "not_using",
  "missing_features",
  "switching",
  "privacy",
  "other",
];

class AccountDeletionError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const month = (d) => (d ? new Date(d).toISOString().slice(0, 7) : undefined);

// Cancel every Stripe subscription and erase the Stripe customer's personal
// details, but keep the (now anonymous) customer record and tag the cancelled
// subscriptions, so churn history and cohorts survive in Stripe reports.
// Stripe keeps invoices and payment records either way, which covers the
// billing records we are legally required to retain. If this fails the whole
// deletion stops, so nobody is charged after deleting their account.
const closeBilling = async (user, reasonCode) => {
  if (!user.stripeCustomerId && !user.subscription?.id) return;
  if (!process.env.STRIPE_SK_KEY) {
    throw new AccountDeletionError(
      500,
      "Billing is unavailable right now. Please try again shortly."
    );
  }
  const stripe = stripeLib(process.env.STRIPE_SK_KEY);
  const ignoreMissing = (err) => {
    if (err.code !== "resource_missing") throw err;
  };
  const note = {
    account_deleted: "true",
    cancel_reason: reasonCode || "none",
    canceled_at: new Date().toISOString(),
  };
  const cancel = async (id) => {
    await stripe.subscriptions.update(id, { metadata: note }).catch(ignoreMissing);
    await stripe.subscriptions.del(id).catch(ignoreMissing);
  };

  if (user.stripeCustomerId) {
    const customer = user.stripeCustomerId;
    const subs = await stripe.subscriptions
      .list({ customer, status: "all", limit: 100 })
      .catch((err) => {
        ignoreMissing(err);
        return { data: [] };
      });
    for (const sub of subs.data) {
      if (sub.status !== "canceled") await cancel(sub.id);
    }
    const cards = await stripe.paymentMethods
      .list({ customer, type: "card", limit: 100 })
      .catch((err) => {
        ignoreMissing(err);
        return { data: [] };
      });
    for (const card of cards.data) {
      await stripe.paymentMethods.detach(card.id).catch(ignoreMissing);
    }
    await stripe.customers
      .update(customer, {
        name: "",
        email: "",
        phone: "",
        address: "",
        description: "Deleted Bisi Books account",
        metadata: note,
      })
      .catch(ignoreMissing);
  } else if (user.subscription?.id) {
    await cancel(user.subscription.id);
  }
};

const removeBankConnections = async (userId) => {
  const bank = loadBankModules();
  if (!bank) return false;
  const connections = await bank.BankConnection.find({ userId });
  for (const c of connections) {
    await bank.plaidProvider.removeItem(decryptSecret(c.accessTokenEncrypted));
  }
  await bank.BankTransaction.deleteMany({ userId });
  await bank.BankConnection.deleteMany({ userId });
  return connections.length > 0;
};

const deleteAccount = async (userId, { reasonCode } = {}) => {
  const user = await User.findById(userId);
  if (!user) throw new AccountDeletionError(404, "Account not found.");
  if (![2, 3].includes(user.role)) {
    throw new AccountDeletionError(403, "This account type can't be deleted here.");
  }

  const enterprise = await Enterprise.findOne({ userId: user._id });
  if (enterprise && (enterprise.userKeys || []).some((k) => k.user)) {
    throw new AccountDeletionError(
      409,
      "This account administers an enterprise that still has licensed members. Transfer or close the enterprise first, then delete the account."
    );
  }

  // Same idea as the Deactivate flow's pending-bookings rule, but only for
  // bookings that are still ahead, so an old booking nobody marked complete
  // can't make deletion impossible.
  const now = new Date();
  const upcoming = await Booking.countDocuments({
    userId,
    bookingStatus: "Confirmed",
    $or: [
      { endDate: { $gte: now } },
      { endDate: null, startDate: { $gte: now } },
    ],
  });
  if (upcoming > 0) {
    const plural = upcoming === 1;
    throw new AccountDeletionError(
      409,
      `You have ${upcoming} upcoming confirmed booking${plural ? "" : "s"}. Complete or cancel ${plural ? "it" : "them"} first, then delete your account, so your customers aren't left with appointments that disappear.`
    );
  }

  const [bookingsCount, customersCount, servicesCount] = await Promise.all([
    Booking.countDocuments({ userId }),
    Customer.countDocuments({ userId }),
    BusinessService.countDocuments({ addedBy: userId }),
  ]);

  // External systems first: if any of these fail nothing local has been
  // deleted yet, so the person can simply try again.
  await closeBilling(user, REASON_CODES.includes(reasonCode) ? reasonCode : undefined);
  const hadBankConnection = await removeBankConnections(userId);
  await googleCalendar.disconnect(userId).catch((err) => {
    console.warn("Calendar disconnect during account deletion failed:", err.message);
  });

  const staffUsers = await User.find({ addedBy: userId, role: 3 }).select("_id");
  const staffIds = staffUsers.map((s) => s._id);

  await Promise.all([
    Notification.deleteMany({ $or: [{ userId }, { bookedBy: userId }] }),
    BusinessService.deleteMany({ addedBy: userId }),
    BusinessClass.deleteMany({ addedBy: userId }),
    Customer.deleteMany({ userId }),
    Booking.deleteMany({ userId }),
    Schedule.deleteMany({ addedBy: userId }),
    CustomizedLink.deleteMany({ userId }),
    PersonalBudget.deleteMany({ addedBy: userId }),
    ServiceSetting.deleteMany({ addedBy: userId }),
    Upgrade.deleteMany({ userId }),
    GoalsCompanyBudget.deleteMany({ addedBy: userId }),
    Inventory.deleteMany({ userId }),
    PaymentHistory.deleteMany({ userId }),
    UserDetailFileupload.deleteMany({ addedByowner: userId }),
    UserDetailNotes.deleteMany({ addedBy: userId }),
    UserDetailSoap.deleteMany({ addedBy: userId }),
    EmailSetting.deleteMany({ addedBy: userId }),
    Product.deleteMany({ addedBy: userId }),
    RejectImports.deleteMany({ userId }),
    Staff.deleteMany({ userId: { $in: [userId, ...staffIds] } }),
    Enterprise.updateMany(
      { "userKeys.user": userId },
      { $set: { "userKeys.$[k].user": null, "userKeys.$[k].email": null } },
      { arrayFilters: [{ "k.user": userId }] }
    ),
  ]);
  if (staffIds.length) await User.deleteMany({ _id: { $in: staffIds } });

  const summary = {
    summaryId: crypto.randomUUID(),
    signedUpMonth: month(user.createdAt),
    lastLoginMonth: month(user.lastLoginAt),
    loginCount: user.loginCount || 0,
    tenureDays: user.createdAt
      ? Math.round((Date.now() - new Date(user.createdAt).getTime()) / 86400000)
      : undefined,
    planName: user.planDeatils?.planName,
    planPrice: Number(user.planDeatils?.price) || undefined,
    cancellationType: "self_deleted",
    hadActiveSubscription: user.subscriptionStatus === true,
    hadBankConnection,
    bookingsCount,
    customersCount,
    servicesCount,
    country: user.selectedBusinessCountry || user.selectedCountry,
    state: user.state,
    businessTypes: user.businessType,
    reasonCode: REASON_CODES.includes(reasonCode) ? reasonCode : undefined,
    deletedMonth: month(new Date()),
  };

  const { firstName, email } = user;
  await User.deleteOne({ _id: userId });
  await DeletedAccountSummary.create(summary);

  console.log(`Account deleted (summary ${summary.summaryId}).`);
  return { firstName, email };
};

module.exports = { deleteAccount, AccountDeletionError, REASON_CODES };
