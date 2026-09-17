const test = require("node:test");
const assert = require("node:assert/strict");

const {findBoardsWithNewHumanPlayers} = require("./index");

test("finds the joined board by database key when another board is removed", () => {
  const before = {
    removedBoard: {players: {placeholder: "player 1"}},
    targetBoard: {players: {placeholder: "player 1"}},
  };
  const after = {
    targetBoard: {
      players: {
        placeholder: "player 1",
        human123: {userName: "Player", participantType: "human"},
      },
    },
  };

  assert.deepEqual(findBoardsWithNewHumanPlayers(before, after), [
    {boardId: "targetBoard", playerIds: ["human123"]},
  ]);
});

test("ignores bot insertions so bot writes cannot start another batch", () => {
  const before = {board1: {players: {human1: {participantType: "human"}}}};
  const after = {
    board1: {
      players: {
        human1: {participantType: "human"},
        bot1: {participantType: "bot"},
      },
    },
  };

  assert.deepEqual(findBoardsWithNewHumanPlayers(before, after), []);
});

test("ignores score updates to existing players", () => {
  const before = {board1: {players: {human1: {score: 0}}}};
  const after = {board1: {players: {human1: {score: 6}}}};

  assert.deepEqual(findBoardsWithNewHumanPlayers(before, after), []);
});
