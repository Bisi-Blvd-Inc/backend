// A Personal Budget counts as complete only when every line item the
// steps actually show has an explicit entry. "0" is a valid answer; blank
// is not (the gray "0" placeholder in each field is not an entry). Only
// the fields listed below are checked, so stale keys in older saved
// budgets (e.g. an unused discretionary "childCare") can't block anyone.
// Keep in sync with the frontend's helper/budgetCompleteness.js.
const BUDGET_FIELDS = {
  housing: ["mortgage", "propertyTax", "homeMaintenance", "homeowerInsurance", "electric", "gas", "water", "cable", "talephone", "other"],
  transportation: ["autoPayment", "autoInsurance", "transportationGas", "maintenance", "LicenseRegistration", "ParkingTollBusTrain", "Others"],
  houseHold: ["groceries", "personalCare", "ClothingDryCleaning", "domesticHelp", "professionaldues", "dependentChildCare", "educationSchool", "cashAllowances", "others"],
  loanPayments: ["creditCardPayment", "otherLoanPayment", "savingInvesting", "others"],
  personalInsurance: ["healthInsurance", "lifeInsurance", "disabilityIncomeInsurance", "healthCareInsurance", "medicalDentalVisionDrug", "others"],
  discretionary: ["diningOut", "recreationClubDues", "moviesSportingEvents", "hobbies", "vacationTravel", "giftContributions", "others"],
  companyExpenses: ["rent", "companyGas", "companyWater", "electricity", "cellular", "internet", "marketing"],
};

const BUDGET_CATEGORIES = Object.keys(BUDGET_FIELDS);

const isFilled = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const isCategoryComplete = (name, category) =>
  !!category && BUDGET_FIELDS[name].every((key) => isFilled(category[key]));

const isBudgetComplete = (budget) =>
  !!budget &&
  BUDGET_CATEGORIES.every((name) => isCategoryComplete(name, budget[name]));

module.exports = {
  BUDGET_FIELDS,
  BUDGET_CATEGORIES,
  isCategoryComplete,
  isBudgetComplete,
};
