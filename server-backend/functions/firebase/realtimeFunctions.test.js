"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {applyDiceRoll} = require("./realtimeFunctions");

const roll = (rollId, dice1, dice2) => ({
  dice1,
  dice2,
  sum: dice1 + dice2,
  audit: {rollId, algorithm: "test", generatedAt: new Date(0).toISOString()},
});

const fakeDb = (initialBoard, {coldStart = false} = {}) => {
  const state = {board: initialBoard};
  return {
    state,
    ref: () => ({
      transaction: async (update) => {
        if (coldStart) assert.equal(update(null), null);
        const next = update(state.board);
        if (next === undefined) return {committed: false};
        state.board = next;
        return {committed: true, snapshot: {val: () => state.board}};
      },
    }),
  };
};

test("dice roll atomically updates score and audit and ignores duplicate roll IDs", async () => {
  const db = fakeDb({
    status: "Available",
    players: {human: {score: 0, status: "Rolling"}},
  });
  const secureRoll = roll("roll-1", 2, 3);
  await applyDiceRoll(db, 5, "board", "human", secureRoll, "human");
  await applyDiceRoll(db, 5, "board", "human", secureRoll, "human");
  assert.equal(db.state.board.players.human.score, 5);
  assert.equal(db.state.board.rolls["roll-1"].sum, 5);
});

test("dice roll survives an empty cold-start cache before board data arrives", async () => {
  const db = fakeDb({
    status: "Available",
    players: {human: {score: 0, status: "Rolling"}},
  }, {coldStart: true});

  await applyDiceRoll(db, 5, "board", "human", roll("cold-roll", 2, 4), "human");

  assert.equal(db.state.board.players.human.score, 6);
  assert.equal(db.state.board.rolls["cold-roll"].sum, 6);
});

test("a losing roll marks the player out and increments the derived counter once", async () => {
  const db = fakeDb({
    status: "Available",
    players: {
      human: {score: 10, status: "Rolling"},
      bot: {score: 4, status: "Rolling"},
    },
  });
  await applyDiceRoll(db, 5, "board", "human", roll("roll-7", 3, 4), "human");
  assert.equal(db.state.board.players.human.status, "Out");
  assert.equal(db.state.board.players.human.score, 10);
  assert.equal(db.state.board.outPlayers, 1);
  await assert.rejects(
    () => applyDiceRoll(db, 5, "board", "human", roll("another", 1, 2), "human"),
    (error) => error.code === "ROLL_REJECTED"
  );
});

test("the last losing roll concludes the board and publishes the winner immediately", async () => {
  const db = fakeDb({
    status: "Available",
    players: {
      human: {score: 10, status: "Rolling", userName: "Human", participantType: "human"},
      bot: {score: 20, status: "Out", userName: "Bot", participantType: "bot"},
    },
  });

  await applyDiceRoll(db, 5, "board", "human", roll("final-roll", 3, 4), "human");

  assert.equal(db.state.board.status, "Concluded");
  assert.equal(db.state.board.conclusionPending, true);
  assert.deepEqual(db.state.board.winnerIs, {
    score: 20,
    playerId: "bot",
    playerName: "Bot",
    participantType: "bot",
  });
});
