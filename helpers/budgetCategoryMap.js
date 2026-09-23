// Maps Plaid's transaction categories onto the budget categories this app
// already uses (models/personalBudget.js field names: housing,
// transportation, houseHold, loanPayments, personalInsurance,
// discretionary, companyExpenses — see "personal Budget Performa.csv" for
// the original spec these came from). This exists so a bank-vs-budget
// comparison has a stable category to sum actual transactions against,
// without touching the existing freeform personalBudget/goalsCompanyBudget
// schemas.
//
// Plaid's Personal Finance Category "primary" values, mapped in:
// https://plaid.com/docs/api/products/transactions/#personal-finance-category

const BUDGET_CATEGORIES = [
  "housing",
  "transportation",
  "houseHold",
  "loanPayments",
  "personalInsurance",
  "discretionary",
  "companyExpenses",
];

// Money movement, not spend — excluded from budget-vs-actual entirely.
const EXCLUDED_PLAID_CATEGORIES = ["INCOME", "TRANSFER_IN", "TRANSFER_OUT"];

const PLAID_TO_BUDGET_CATEGORY = {
  RENT_AND_UTILITIES: "housing",
  HOME_IMPROVEMENT: "housing",
  TRANSPORTATION: "transportation",
  FOOD_AND_DRINK: "houseHold",
  GENERAL_MERCHANDISE: "houseHold",
  LOAN_PAYMENTS: "loanPayments",
  MEDICAL: "personalInsurance",
  PERSONAL_CARE: "personalInsurance",
  // Judgment call, not verified with Noelle: professional/subscription
  // services often skew business-related for a service-business owner.
  // Revisit if this doesn't hold up against real transaction data.
  GENERAL_SERVICES: "companyExpenses",
  ENTERTAINMENT: "discretionary",
  TRAVEL: "discretionary",
  BANK_FEES: "discretionary",
  GOVERNMENT_AND_NON_PROFIT: "discretionary",
  OTHER: "discretionary",
};

// Returns a budgetCategory string, or null if this transaction shouldn't
// count toward budget-vs-actual at all (income/transfers).
const mapPlaidCategoryToBudgetCategory = (plaidPrimaryCategory) => {
  if (!plaidPrimaryCategory) return "discretionary";
  if (EXCLUDED_PLAID_CATEGORIES.includes(plaidPrimaryCategory)) return null;
  return PLAID_TO_BUDGET_CATEGORY[plaidPrimaryCategory] || "discretionary";
};

module.exports = {
  BUDGET_CATEGORIES,
  EXCLUDED_PLAID_CATEGORIES,
  PLAID_TO_BUDGET_CATEGORY,
  mapPlaidCategoryToBudgetCategory,
};
