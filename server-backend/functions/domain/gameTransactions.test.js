"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  BOARD_SELECTION_SAFETY_MS,
  applyBoardJoin,
  applyWinnerPayout,
  isBoardJoinable,
  runRootTransaction,
} = require("./gameTransactions");

const makeRoot = () => ({
  users: {
    human: {fullName: "Human", wallet: {balance: 100}},
  },
  boards: {live: {5: {board: {
    bet: 5,
    stake: 0,
    status: "Available",
    closesAt: "2030-01-01T00:00:00.000Z",
    players: {placeholder: "player 1"},
  }}}},
});

test("board join debits and creates membership in one idempotent state change", () => {
  const first = applyBoardJoin(makeRoot(), {userId: "human", boardId: "board", betAmount: 5, now: 1});
  assert.equal(first.root.users.human.wallet.balance, 95);
  assert.equal(first.root.boards.live[5].board.players.human.participantType, "human");
  assert.equal(first.root.boards.live[5].board.stake, 5);

  const retry = applyBoardJoin(first.root, {userId: "human", boardId: "board", betAmount: 5, now: 2});
  assert.equal(retry.idempotent, true);
  assert.equal(retry.root.users.human.wallet.balance, 95);
  assert.equal(retry.root.users.human.gamesPlayed, 1);
});

test("concurrent-style second human join cannot debit a full board", () => {
  const state = applyBoardJoin(makeRoot(), {userId: "human", boardId: "board", betAmount: 5, now: 1}).root;
  state.users.other = {fullName: "Other", wallet: {balance: 50}};
  assert.throws(
    () => applyBoardJoin(state, {userId: "other", boardId: "board", betAmount: 5, now: 2}),
    (error) => error.code === "BOARD_FULL"
  );
  assert.equal(state.users.other.wallet.balance, 50);
});

test("board selection excludes closed boards and boards inside the safety window", () => {
  const now = Date.parse("2026-09-17T12:00:00.000Z");
  const board = {
    status: "Available",
    closesAt: new Date(now + BOARD_SELECTION_SAFETY_MS + 1).toISOString(),
  };

  assert.equal(isBoardJoinable(board, now, BOARD_SELECTION_SAFETY_MS), true);
  board.closesAt = new Date(now + BOARD_SELECTION_SAFETY_MS).toISOString();
  assert.equal(isBoardJoinable(board, now, BOARD_SELECTION_SAFETY_MS), false);
  board.status = "Concluded";
  board.closesAt = new Date(now + 60000).toISOString();
  assert.equal(isBoardJoinable(board, now, BOARD_SELECTION_SAFETY_MS), false);
});

test("winner payout is funded by paid human stakes and is idempotent", () => {
  const state = applyBoardJoin(makeRoot(), {userId: "human", boardId: "board", betAmount: 5, now: 1}).root;
  state.boards.live[5].board.players.human.score = 12;
  state.boards.live[5].board.players.bot = {score: 8, participantType: "bot", userName: "Bot"};
  const first = applyWinnerPayout(state, {boardId: "board", betAmount: 5, now: 3});
  assert.equal(first.root.users.human.wallet.balance, 100);
  assert.equal(first.root.boards.live[5].board.conclusionPending, false);
  assert.equal(first.operation.amount, 5);
  assert.equal(first.root.boards.live[5].board.status, "Concluded");

  const retry = applyWinnerPayout(first.root, {boardId: "board", betAmount: 5, now: 4});
  assert.equal(retry.idempotent, true);
  assert.equal(retry.root.users.human.wallet.balance, 100);
  assert.equal(retry.root.users.human.gamesWon, 1);
});

test("bot win concludes without creating or crediting a fake user wallet", () => {
  const state = applyBoardJoin(makeRoot(), {userId: "human", boardId: "board", betAmount: 5, now: 1}).root;
  state.boards.live[5].board.players.human.score = 2;
  state.boards.live[5].board.players.bot = {score: 20, participantType: "bot", userName: "Bot"};
  const result = applyWinnerPayout(state, {boardId: "board", betAmount: 5, now: 3});
  assert.equal(result.operation.amount, 0);
  assert.equal(result.root.users.bot, undefined);
  assert.equal(result.root.users.human.wallet.balance, 95);
});

test("root transaction survives an empty cold-start cache before server state arrives", async () => {
  const serverRoot = makeRoot();
  const callbackValues = [];
  const db = {
    ref: () => ({
      transaction: async (update) => {
        callbackValues.push(update(null));
        const updatedRoot = update(serverRoot);
        callbackValues.push(updatedRoot);
        return {committed: true};
      },
    }),
  };

  const result = await runRootTransaction(db, applyBoardJoin, {
    userId: "human",
    boardId: "board",
    betAmount: 5,
    now: 1,
  });

  assert.equal(callbackValues[0], null);
  assert.equal(result.root.users.human.wallet.balance, 95);
  assert.equal(result.root.boards.live[5].board.players.human.participantType, "human");
});
