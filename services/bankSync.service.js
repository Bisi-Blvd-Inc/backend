const bankConnectionCollection = require("../models/bankConnection");
const bankTransactionCollection = require("../models/bankTransaction");
const plaidProvider = require("./bankProvider/plaid.provider");
const { decryptSecret } = require("../helpers/paymentCrypto");
const { mapPlaidCategoryToBudgetCategory } = require("../helpers/budgetCategoryMap");

const SYNC_LOCK_WINDOW_MS = 5 * 60 * 1000;

const upsertTransaction = async (connection, plaidTxn) => {
  const budgetCategory = mapPlaidCategoryToBudgetCategory(
    plaidTxn.personal_finance_category?.primary
  );
  await bankTransactionCollection.updateOne(
    { plaidTransactionId: plaidTxn.transaction_id },
    {
      userId: connection.userId,
      bankConnectionId: connection._id,
      plaidTransactionId: plaidTxn.transaction_id,
      amount: plaidTxn.amount,
      isoCurrencyCode: plaidTxn.iso_currency_code || "USD",
      date: new Date(plaidTxn.date),
      merchantName: plaidTxn.merchant_name || plaidTxn.name,
      description: plaidTxn.name,
      plaidCategory: plaidTxn.personal_finance_category?.primary,
      budgetCategory,
      pending: plaidTxn.pending,
      removed: false,
    },
    { upsert: true }
  );
};

// Syncs a single connection to completion (Plaid's sync endpoint pages
// results via has_more, so one "sync" is a loop of calls until caught up).
const syncConnection = async (connection) => {
  const accessToken = decryptSecret(connection.accessTokenEncrypted);
  let cursor = connection.cursor;
  let hasMore = true;

  try {
    while (hasMore) {
      const result = await plaidProvider.syncTransactions(accessToken, cursor);

      for (const txn of [...result.added, ...result.modified]) {
        await upsertTransaction(connection, txn);
      }
      for (const removedTxn of result.removed) {
        await bankTransactionCollection.updateOne(
          { plaidTransactionId: removedTxn.transaction_id },
          { removed: true }
        );
      }

      cursor = result.nextCursor;
      hasMore = result.hasMore;
    }

    await bankConnectionCollection.updateOne(
      { _id: connection._id },
      {
        cursor,
        lastSyncedAt: new Date(),
        needsSync: false,
        status: "connected",
        errorCode: null,
      }
    );
  } catch (error) {
    const errorCode = error?.response?.data?.error_code;
    console.error(
      `Bank sync failed for connection ${connection._id}:`,
      errorCode || error.message
    );
    // ITEM_LOGIN_REQUIRED (and similar) means the user needs to reconnect
    // via Plaid Link's "update mode" — surface that on the frontend rather
    // than silently retrying forever. See the BMO Harris note in the plan:
    // this specific bank is known to need this periodically.
    await bankConnectionCollection.updateOne(
      { _id: connection._id },
      { status: "error", errorCode: errorCode || "SYNC_FAILED", needsSync: false }
    );
  }
};

// Called from the cron job in app.js. Skips a connection if it was synced
// (or started syncing) within the last few minutes, so a slow run and the
// next scheduled tick can't double-process the same item — this codebase's
// existing cron jobs have no such guard, but money data warrants one.
const runScheduledSync = async () => {
  const connections = await bankConnectionCollection.find({
    isDeleted: false,
    status: { $ne: "disconnected" },
  });

  const now = Date.now();
  const due = connections.filter((connection) => {
    if (connection.needsSync) return true;
    if (!connection.lastSyncedAt) return true;
    return now - new Date(connection.lastSyncedAt).getTime() > SYNC_LOCK_WINDOW_MS;
  });

  for (const connection of due) {
    await syncConnection(connection);
  }
};

module.exports = { syncConnection, runScheduledSync };
