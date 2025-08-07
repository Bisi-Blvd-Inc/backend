const userCollection = require("../models/user");
const upgradeCollection = require("../models/upgrade");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SK_KEY);
const post = (payload) => userCollection.create(payload);
const getUserWithPagination = (pageNo, limit) => {
  return userCollection
    .find({ role: 3, isDeleted: false })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ _id: -1 });
};

const getUserBySearch = (text) => {
  return userCollection.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [{ firstName: { $regex: String(text), $options: "i" } }],
          },
          { isDeleted: false },
        ],
      },
    },
  ]);
};

const update = (condition, payload) =>
  userCollection.findByIdAndUpdate(condition, payload);
const loginStatusUpdate = (condition, payload) => {
  return userCollection.findByIdAndUpdate(condition, payload);
};

const stripeSignupPlans = async () => {
  try {
    const products = await stripe.products.list();
    return products;
  } catch (e) {
    throw new ApiError(500, e.message);
  }
};

const stripePriceList = async () => {
  try {
    const prices = await stripe.prices.list();
    return prices;
  } catch (e) {
    throw new ApiError(500, e.message);
  }
};

const stripeFinalList = async () => {
  try {
    const products = await stripe.products.list({ active: true, limit: 100});
    const productData = products.data
      .filter(product => product.name !== 'Bisi')
      .filter(product => product.default_price !== null);

    const productIds = productData.map(product => product.id);
    const desiredIds = productIds

    const filteredData = products.data.filter(product => desiredIds.includes(product.id));
    const newObject = {
      object: products.object,
      data: filteredData,
      has_more: products.has_more,
      url: products.url
    };
    const prices = await Promise.all(
      newObject.data.map(async (product) => {
        const price = await stripe.prices.retrieve(product?.default_price);
        return price;
      })
    );
    let finalProducts = [];
    const finalData =
      products &&
      products.data &&
      products.data.length > 0 &&
      products.data.map((productData) => {
        let price =
          prices &&

          prices.length > 0 &&
          prices.filter(
            (priceData) =>
              priceData.product === productData.id && priceData.active === true
          );
        productData.price = price && price.length > 0 && price[0];
        finalProducts.push(productData);
        return finalProducts;
      });
    return finalProducts;
  } catch (e) {
    throw new ApiError(500, e.message);
  }
};

const getUser = (condition) => {
  return userCollection.findById(condition);
};

const getDateDiff = (condition) => {
  let date = new Date();
  return userCollection.aggregate([
    {
      $project: {
        Start: date,
        End: "$subscriptionEndDate",
        email: "$email",
        upgradeStatus: "$upgradeStatus",
        id: "$_id",
        days: {
          $dateDiff: {
            startDate: date,
            endDate: "$subscriptionEndDate",
            unit: "day",
          },
        },
        _id: 0,
      },
    },
    {
      $match: {
        $or: [
          { days: 7, upgradeStatus: false },
          { days: 3, upgradeStatus: false },
          { days: 1, upgradeStatus: false },
        ],
      },
    },
  ]);
};

const updateUser = async (Id, userBody) => {
  try {
    const user = await userCollection.findById(Id);
    const coupons = await stripe.coupons.list({
      limit: 100
    });
    const desiredCouponName = userBody.planDeatils.couponName;
    const selectedCoupon = coupons.data.find(coupon => coupon.name === desiredCouponName.trim());
    let customerId = user?.subscription?.customer;
    if (customerId) {
      const paymentMethodFinal = await stripe.paymentMethods.attach(
        userBody.cardDetails.id,
        { customer: customerId }
      );
      let subscription;
      if (paymentMethodFinal) {
        try {
          subscription = await stripe.subscriptions.create({
            customer: customerId,
            default_payment_method: userBody.cardDetails.id,
            expand: ["latest_invoice.payment_intent"],
            items: [{ price: userBody.planDeatils.priceId }],
            coupon: selectedCoupon?.id
          });
        } catch (error) {
          console.log(error);
          throw new ApiError(500, "Subscription creation failed");
        }

        if (userBody.upgradeStatus && subscription) {
          const obj2 = {
            stripeCustomerId: customerId,
            subscription: subscription,
            paymentMethod: userBody.cardDetails,
            paymentStatus: 1,
            planDeatils: userBody.planDeatils,
            subscriptionEndDate:userBody.subscriptionEndDate,
            subscriptionStartDate:userBody.subscriptionStartDate,
            subscriptionStatus:userBody.subscriptionStatus
          };
          const upgradeId = userBody.upgradeId;
          const updateUpgradePlan = await upgradeCollection.findByIdAndUpdate(
            upgradeId,
            obj2
          );

          if (updateUpgradePlan) {

            const updatedUser = await userCollection.findByIdAndUpdate(Id, obj2);
            const updatefind  = await userCollection.findOne({_id:Id})
            return updatefind;
          }
        } else if (subscription) {
          const obj = {
            stripeCustomerId: customerId,
            subscription: subscription,
            paymentMethod: userBody.cardDetails,
            paymentStatus: 1,
            cardDetails: userBody.cardDetails,
            planDeatils: userBody.planDeatils,
            subscriptionStatus: userBody.subscriptionStatus,
            subscriptionStartDate: userBody.subscriptionStartDate,
            subscriptionEndDate: userBody.subscriptionEndDate,
          };
          const updatedUser = await userCollection.findByIdAndUpdate(Id, obj);
          const updatefind  = await userCollection.findOne({_id:Id})
          return updatefind;
        } else {
          throw new ApiError(500, "Payment subscription failed");
        }
      } else {
        throw new ApiError(500, "Payment failed");
      }
    }
    else {
      const customer = await stripe.customers.create({
        description: "test",
        email: user.email,
        name: user.firstName,
        address: {
          state: user.state,
        },
        phone: user.phone,
      });

      if (!customer) {
        throw new ApiError(500, err.message);
      } else {
        const paymentMethodFinal = await stripe.paymentMethods.attach(
          userBody.cardDetails.id,
          { customer: customer.id }
        );
        let subscription;
        if (paymentMethodFinal) {
          try {
            subscription = await stripe.subscriptions.create({
              customer: customer.id,
              default_payment_method: userBody.cardDetails.id,
              expand: ["latest_invoice.payment_intent"],
              items: [{ price: userBody.planDeatils.priceId }],
              coupon: selectedCoupon?.id,
            });
          } catch (error) {
            throw new ApiError(500, "Subscription creation failed");
          }

          if (userBody.upgradeStatus && subscription) {
            const obj2 = {
              stripeCustomerId: customer.id,
              subscription: subscription,
              upgradeStatus: userBody.upgradeStatus,
              paymentMethod: userBody.cardDetails,
              cardDetails: userBody.cardDetails,
              planDeatils: userBody.planDeatils,
              subscriptionStatus: userBody.subscriptionStatus,
              subscriptionStartDate: userBody.subscriptionStartDate,
              subscriptionEndDate: userBody.subscriptionEndDate,
              paymentStatus: 1,
            };

            const upgradeId = userBody.upgradeId;
            const updateUpgradePlan = await upgradeCollection.findByIdAndUpdate(
              upgradeId,
              obj2
            );
            if (updateUpgradePlan) {
              const updatedUser = await userCollection.findByIdAndUpdate(
                Id,
                obj2
              );
              const updatefind  = await userCollection.findOne({_id:Id})
              return updatefind;
            }
          } else if (subscription) {
            const obj = {
              stripeCustomerId: customer.id,
              subscription: subscription,
              paymentMethod: userBody.cardDetails,
              paymentStatus: 1,
              cardDetails: userBody.cardDetails,
              upgradeStatus: userBody.upgradeStatus,
              planDeatils: userBody.planDeatils,
              subscriptionStatus: userBody.subscriptionStatus,
              subscriptionStartDate: userBody.subscriptionStartDate,
              subscriptionEndDate: userBody.subscriptionEndDate,
            };
            const updatedUser = await userCollection.findByIdAndUpdate(Id, obj);
            const updatefind  = await userCollection.findOne({_id:Id})
            return updatefind;
          } else {
            throw new ApiError(500, "Payment subscription failed");
          }
        } else {
          throw new ApiError(500, "Payment failed");
        }
      }
    }
  } catch (e) {
    throw new ApiError(500, e.message);
  }
};

const updateFreeUser = async (Id, userBody) => {
  try {
    const obj = {
      paymentStatus: 1,
      planDeatils: userBody.planDeatils,
      subscriptionStatus: userBody.subscriptionStatus,
      subscriptionStartDate: userBody.subscriptionStartDate,
      subscriptionEndDate: userBody.subscriptionEndDate,
    };
    const upgradeId = userBody.upgradeId;
    const updatedUser = await userCollection.findByIdAndUpdate(Id, obj);
    const updateUpgradePlan = await upgradeCollection.findByIdAndUpdate(
      upgradeId,
      obj
    );
    return updatedUser;

  } catch (e) {
    throw new ApiError(500, e.message);
  }

};

const getDateWithNoDiff = (condition) => {
  let date = new Date();
  return userCollection.aggregate([
    {
      $project: {
        start: date,
        end: "$subscriptionEndDate",
        email: "$email",
        upgradeStatus: "$upgradeStatus",
        startDateFormated: {
          $dateToString: { format: "%Y-%m-%d", date: date },
        },
        endDateFormated: {
          $dateToString: { format: "%Y-%m-%d", date: "$subscriptionEndDate" },
        },
        _id: 1,
      },
    },
    {
      $project: {
        day: { $strcasecmp: ["$endDateFormated", "$startDateFormated"] },
        upgradeStatus: "$upgradeStatus",
        email: "$email",
      },
    },
    {
      $match: {
        day: 0,
      },
    },
  ]);
};
const stripeCouponPlans = async () => {
  try {
    const coupons = await stripe.coupons.list({
      limit: 100,
    });

    return coupons;
  } catch (e) {
    throw new ApiError(500, e.message);
  }
};

const delSub = async () => {
  try {
    const deleted = await stripe.subscriptions.del(subId);
    return deleted;
  } catch (e) {
    throw new ApiError(500, e.message);
  }
};



const stripePlanListWithCoupons = async () => {
  try {
    const products = await stripe.products.list();
    const prices = await stripe.prices.list();
    const coupons = await stripe.coupons.list();
    let finalProducts = [];
    const finalData =
      products &&
      products.data &&
      products.data.length > 0 &&
      products.data.map((productData) => {
        let price =
          prices &&
          prices.data &&
          prices.data.length > 0 &&
          prices.data.filter(
            (priceData) =>
              priceData.product === productData.id && priceData.active === true
          );

        let coupon =
          coupons &&
          coupons.data &&
          coupons.data.length > 0 &&
          coupons.data.filter(
            (couponsData) => couponsData.name === productData.name
          );
        productData.price = price && price.length > 0 && price[0];
        productData.coupon = coupon && coupon.length > 0 && coupon[0];
        finalProducts.push(productData);
        return finalProducts;
      });
    return finalProducts;
  } catch (e) {
    throw new ApiError(500, e.message);
  }
};

module.exports = {
  post,
  getUserWithPagination,
  update,
  getUserBySearch,
  loginStatusUpdate,
  stripeSignupPlans,
  stripeFinalList,
  stripePriceList,
  getUser,
  getDateDiff,
  getDateWithNoDiff,
  stripeCouponPlans,
  stripePlanListWithCoupons,
  updateUser,
  updateFreeUser,
  delSub,
};
