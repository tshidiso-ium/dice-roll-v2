const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createSecureDiceRoll,
  verifySecureDiceRoll,
} = require("./secureDice");

const AUDIT_SECRET = "test-only-audit-secret-with-at-least-32-bytes";

test("secure rolls stay in range and have verifiable proofs", () => {
  for (let index = 0; index < 1_000; index += 1) {
    const roll = createSecureDiceRoll({
      betAmount: 5,
      boardId: "board-test",
      playerId: "player-test",
      auditSecret: AUDIT_SECRET,
    });

    assert.ok(roll.dice1 >= 1 && roll.dice1 <= 6);
    assert.ok(roll.dice2 >= 1 && roll.dice2 <= 6);
    assert.equal(roll.sum, roll.dice1 + roll.dice2);
    assert.equal(verifySecureDiceRoll(roll, AUDIT_SECRET), true);
  }
});

test("proof verification rejects a modified outcome", () => {
  const roll = createSecureDiceRoll({
    betAmount: 10,
    boardId: "board-test",
    playerId: "player-test",
    auditSecret: AUDIT_SECRET,
  });

  const modifiedRoll = {
    ...roll,
    dice1: roll.dice1 === 6 ? 5 : roll.dice1 + 1,
  };

  assert.equal(verifySecureDiceRoll(modifiedRoll, AUDIT_SECRET), false);
});

test("roll creation fails closed without a strong audit secret", () => {
  assert.throws(
    () =>
      createSecureDiceRoll({
        betAmount: 5,
        boardId: "board-test",
        playerId: "player-test",
        auditSecret: "too-short",
      }),
    /DICE_AUDIT_SECRET/
  );
});
