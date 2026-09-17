"use strict";

const crypto = require("crypto");
const {DomainError} = require("./errors");
const {validateKey} = require("./gameTransactions");

const DAILY_DEPOSIT_LIMIT_MINOR = 500_000;
const MONTHLY_DEPOSIT_LIMIT_MINOR = 2_000_000;

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const ensureRecord = (parent, key) => {
  if (!isRecord(parent[key])) parent[key] = {};
  return parent[key];
};

const providerEventKey = (providerEventId) => {
  if (typeof providerEventId !== "string" || providerEventId.length < 3 || providerEventId.length > 512) {
    throw new DomainError("INVALID_PAYMENT", "Payment event ID is invalid", 400);
  }
  return crypto.createHash("sha256").update(providerEventId).digest("hex");
};

const zaPeriodKeys = (timestamp) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({type, value}) => [type, value]));
  return {dayKey: `${values.year}-${values.month}-${values.day}`, monthKey: `${values.year}-${values.month}`};
};

const validateAmountMinor = (value) => {
  const amountMinor = Number(value);
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 1000 || amountMinor > 10_000_000) {
    throw new DomainError("INVALID_PAYMENT", "Payment amount is outside the supported range", 400);
  }
  return amountMinor;
};

const applyDepositReservation = (rootValue, input) => {
  const root = isRecord(rootValue) ? rootValue : {};
  const userId = validateKey(input.userId, "userId");
  const reservationId = validateKey(input.reservationId, "reservationId");
  const amountMinor = validateAmountMinor(input.amountMinor);
  const now = Number(input.now);
  if (!Number.isFinite(now)) throw new DomainError("INVALID_INPUT", "Transaction time is invalid", 400);
  if (!isRecord(root.users?.[userId])) throw new DomainError("USER_NOT_FOUND", "Payment user was not found", 404);

  const reservationsRoot = ensureRecord(root, "paymentReservations");
  const reservations = ensureRecord(reservationsRoot, userId);
  if (isRecord(reservations[reservationId])) {
    return {root, reservation: reservations[reservationId], idempotent: true};
  }

  const {dayKey, monthKey} = zaPeriodKeys(now);
  const counted = Object.values(reservations).filter((reservation) => (
    isRecord(reservation) && ["pending", "awaiting_payment", "completed"].includes(reservation.status)
  ));
  const dailyTotal = counted
    .filter((reservation) => reservation.dayKey === dayKey)
    .reduce((sum, reservation) => sum + Number(reservation.amountMinor || 0), 0);
  const monthlyTotal = counted
    .filter((reservation) => reservation.monthKey === monthKey)
    .reduce((sum, reservation) => sum + Number(reservation.amountMinor || 0), 0);

  if (dailyTotal + amountMinor > DAILY_DEPOSIT_LIMIT_MINOR) {
    throw new DomainError("DAILY_LIMIT_EXCEEDED", "Daily deposit limit exceeded", 409);
  }
  if (monthlyTotal + amountMinor > MONTHLY_DEPOSIT_LIMIT_MINOR) {
    throw new DomainError("MONTHLY_LIMIT_EXCEEDED", "Monthly deposit limit exceeded", 409);
  }

  const reservation = {
    reservationId,
    userId,
    amountMinor,
    currency: "ZAR",
    dayKey,
    monthKey,
    status: "pending",
    createdAt: now,
  };
  reservations[reservationId] = reservation;
  return {root, reservation, idempotent: false};
};

const applyDeposit = (rootValue, input) => {
  const root = isRecord(rootValue) ? rootValue : {};
  const userId = validateKey(input.userId, "userId");
  const reservationId = validateKey(input.reservationId, "reservationId");
  const eventKey = providerEventKey(input.providerEventId);
  const amountMinor = validateAmountMinor(input.amountMinor);
  const currency = String(input.currency || "").toUpperCase();
  const now = Number(input.now);

  if (currency !== "ZAR") throw new DomainError("INVALID_PAYMENT", "Payment currency is not supported", 400);
  if (!Number.isFinite(now)) throw new DomainError("INVALID_INPUT", "Transaction time is invalid", 400);

  const user = root.users?.[userId];
  if (!isRecord(user)) throw new DomainError("USER_NOT_FOUND", "Payment user was not found", 404);

  const transactions = ensureRecord(root, "transactions");
  if (isRecord(transactions[eventKey]) && transactions[eventKey].status === "completed") {
    return {root, operation: transactions[eventKey], idempotent: true};
  }

  const reservation = root.paymentReservations?.[userId]?.[reservationId];
  if (
    !isRecord(reservation) ||
    reservation.amountMinor !== amountMinor ||
    reservation.currency !== currency ||
    reservation.status === "failed"
  ) {
    throw new DomainError("INVALID_RESERVATION", "Payment reservation does not match", 409);
  }
  if (reservation.status === "completed") {
    throw new DomainError(
      "RESERVATION_ALREADY_COMPLETED",
      "Payment reservation has already been credited",
      409
    );
  }

  const wallet = ensureRecord(user, "wallet");
  const previousBalance = Number(wallet.balance);
  if (!Number.isFinite(previousBalance) || previousBalance < 0) {
    throw new DomainError("INVALID_BALANCE", "Wallet balance is invalid", 409);
  }

  const amount = amountMinor / 100;
  const newBalance = previousBalance + amount;
  const operation = {
    type: "deposit",
    status: "completed",
    provider: "yoco",
    providerEventId: input.providerEventId,
    reservationId,
    userId,
    amount,
    amountMinor,
    currency,
    previousBalance,
    newBalance,
    createdAt: now,
  };

  wallet.balance = newBalance;
  wallet.updatedAt = now;
  transactions[eventKey] = operation;
  reservation.status = "completed";
  reservation.completedAt = now;
  reservation.providerEventKey = eventKey;
  return {root, operation, idempotent: false};
};

module.exports = {
  DAILY_DEPOSIT_LIMIT_MINOR,
  MONTHLY_DEPOSIT_LIMIT_MINOR,
  applyDeposit,
  applyDepositReservation,
  providerEventKey,
  zaPeriodKeys,
};
