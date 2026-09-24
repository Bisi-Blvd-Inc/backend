// A Personal Budget only counts as complete once every field in every
// category has an explicit value. "0" is a valid answer; blank is not —
// skipped spending areas are how loan requests end up too small, and the
// totals feed Goals, Profit Comparison, and Budget vs. Actual.
const BUDGET_CATEGORIES = [
  "housing",
  "transportation",
  "houseHold",
  "loanPayments",
  "personalInsurance",
  "discretionary",
  "companyExpenses",
];

const isFilled = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const isCategoryComplete = (category) =>
  !!category &&
  typeof category === "object" &&
  Object.keys(category).length > 0 &&
  Object.values(category).every(isFilled);

const isBudgetComplete = (budget) =>
  !!budget && BUDGET_CATEGORIES.every((name) => isCategoryComplete(budget[name]));

module.exports = { BUDGET_CATEGORIES, isCategoryComplete, isBudgetComplete };
