"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {applyDeposit, applyDepositReservation} = require("./paymentTransactions");

test("deposit atomically credits once across webhook retries", () => {
  const root = applyDepositReservation(
    {users: {person: {wallet: {balance: 10}}}},
    {userId: "person", reservationId: "reserve-1", amountMinor: 2500, now: 1}
  ).root;
  const input = {
    userId: "person",
    reservationId: "reserve-1",
    providerEventId: "evt_123",
    amountMinor: 2500,
    currency: "ZAR",
    now: 2,
  };
  const first = applyDeposit(root, input);
  const retry = applyDeposit(first.root, {...input, now: 2});
  assert.equal(first.root.users.person.wallet.balance, 35);
  assert.equal(retry.root.users.person.wallet.balance, 35);
  assert.equal(retry.idempotent, true);
});

test("deposit rejects events without a server-created reservation", () => {
  const root = {users: {person: {wallet: {balance: 10}}}};
  assert.throws(
    () => applyDeposit(root, {
      userId: "person",
      providerEventId: "evt_123",
      amountMinor: 2500,
      currency: "ZAR",
      now: 1,
    }),
    (error) => error.code === "INVALID_INPUT"
  );
  assert.equal(root.users.person.wallet.balance, 10);
});

test("deposit rejects unsupported amounts and currencies without mutation", () => {
  const root = {users: {person: {wallet: {balance: 10}}}};
  assert.throws(
    () => applyDeposit(root, {
      userId: "person",
      reservationId: "reserve-1",
      providerEventId: "evt_123",
      amountMinor: 999,
      currency: "ZAR",
      now: 1,
    }),
    (error) => error.code === "INVALID_PAYMENT"
  );
  assert.equal(root.users.person.wallet.balance, 10);
});

test("deposit reservations enforce daily limits across concurrent-style requests", () => {
  const root = {users: {person: {wallet: {balance: 10}}}};
  const first = applyDepositReservation(root, {
    userId: "person",
    reservationId: "reserve-1",
    amountMinor: 300_000,
    now: Date.parse("2026-09-17T08:00:00Z"),
  });
  assert.throws(
    () => applyDepositReservation(first.root, {
      userId: "person",
      reservationId: "reserve-2",
      amountMinor: 250_000,
      now: Date.parse("2026-09-17T09:00:00Z"),
    }),
    (error) => error.code === "DAILY_LIMIT_EXCEEDED"
  );
});

test("deposit completes a matching reservation", () => {
  const state = applyDepositReservation(
    {users: {person: {wallet: {balance: 10}}}},
    {userId: "person", reservationId: "reserve-1", amountMinor: 2500, now: 1}
  ).root;
  state.paymentReservations.person["reserve-1"].status = "awaiting_payment";
  const result = applyDeposit(state, {
    userId: "person",
    reservationId: "reserve-1",
    providerEventId: "evt_reserved",
    amountMinor: 2500,
    currency: "ZAR",
    now: 2,
  });
  assert.equal(result.root.users.person.wallet.balance, 35);
  assert.equal(result.root.paymentReservations.person["reserve-1"].status, "completed");
});

test("a completed reservation cannot be credited by a different provider event", () => {
  const state = applyDepositReservation(
    {users: {person: {wallet: {balance: 10}}}},
    {userId: "person", reservationId: "reserve-1", amountMinor: 2500, now: 1}
  ).root;
  const completed = applyDeposit(state, {
    userId: "person",
    reservationId: "reserve-1",
    providerEventId: "evt_first",
    amountMinor: 2500,
    currency: "ZAR",
    now: 2,
  });

  assert.throws(
    () => applyDeposit(completed.root, {
      userId: "person",
      reservationId: "reserve-1",
      providerEventId: "evt_second",
      amountMinor: 2500,
      currency: "ZAR",
      now: 3,
    }),
    (error) => error.code === "RESERVATION_ALREADY_COMPLETED"
  );
  assert.equal(completed.root.users.person.wallet.balance, 35);
});
