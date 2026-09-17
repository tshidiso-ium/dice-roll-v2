"use strict";

const {DomainError} = require("./errors");

const ALLOWED_BETS = new Set([5, 10, 40]);
const FIREBASE_KEY_PATTERN = /^[^.#$\[\]\/]{1,128}$/;
const BOARD_SELECTION_SAFETY_MS = 5000;

const isRecord = (value) => (
  value !== null && typeof value === "object" && !Array.isArray(value)
);

const isBoardJoinable = (board, now = Date.now(), safetyMs = 0) => {
  if (!isRecord(board) || board.status !== "Available") return false;

  const closeTime = Date.parse(board.closesAt);
  const normalizedNow = Number(now);
  const normalizedSafetyMs = Math.max(0, Number(safetyMs) || 0);

  return Number.isFinite(closeTime) &&
    Number.isFinite(normalizedNow) &&
    closeTime - normalizedNow > normalizedSafetyMs;
};

const validateKey = (value, label) => {
  if (typeof value !== "string" || !FIREBASE_KEY_PATTERN.test(value)) {
    throw new DomainError("INVALID_INPUT", `${label} is invalid`, 400);
  }
  return value;
};

const validateBet = (value) => {
  const bet = Number(value);
  if (!ALLOWED_BETS.has(bet)) {
    throw new DomainError("INVALID_BET", "Unsupported bet amount", 400);
  }
  return bet;
};

const ensureRecord = (parent, key) => {
  if (!isRecord(parent[key])) parent[key] = {};
  return parent[key];
};

const humanPlayers = (players = {}) => Object.entries(players).filter(
  ([, player]) => isRecord(player) && player.participantType !== "bot"
);

const calculateFundedStake = (board) => {
  const recordedStake = Number(board.stake);
  if (Number.isFinite(recordedStake) && recordedStake > 0) return recordedStake;

  return humanPlayers(board.players).reduce((total, [, player]) => {
    const bet = Number(player.bet);
    return total + (Number.isFinite(bet) && bet > 0 ? bet : 0);
  }, 0);
};

const determineWinner = (players = {}) => {
  return Object.entries(players)
    .filter(([, player]) => isRecord(player) && Number.isFinite(Number(player.score)))
    .sort(([idA, a], [idB, b]) => (
      Number(b.score) - Number(a.score) || idA.localeCompare(idB)
    ))[0] || null;
};

/**
 * Mutates and returns the supplied RTDB root value. Keeping the rules pure makes
 * retry, idempotency, and concurrency behavior directly testable.
 */
const applyBoardJoin = (rootValue, input) => {
  const root = isRecord(rootValue) ? rootValue : {};
  const userId = validateKey(input.userId, "userId");
  const boardId = validateKey(input.boardId, "boardId");
  const bet = validateBet(input.betAmount);
  const now = Number(input.now);

  if (!Number.isFinite(now)) {
    throw new DomainError("INVALID_INPUT", "Transaction time is invalid", 400);
  }

  const user = root.users?.[userId];
  const board = root.boards?.live?.[bet]?.[boardId];
  if (!isRecord(user)) throw new DomainError("USER_NOT_FOUND", "User profile was not found", 404);
  if (!isRecord(board)) throw new DomainError("BOARD_NOT_FOUND", "Board was not found", 404);

  const operations = ensureRecord(root, "financialOperations");
  const joins = ensureRecord(operations, "boardJoins");
  const betJoins = ensureRecord(joins, String(bet));
  const boardJoins = ensureRecord(betJoins, boardId);
  const previousOperation = boardJoins[userId];

  if (isRecord(previousOperation) && previousOperation.status === "completed") {
    return {root, operation: previousOperation, idempotent: true};
  }

  if (board.status !== "Available") {
    throw new DomainError("BOARD_UNAVAILABLE", "Board is no longer available", 409);
  }

  const closesAt = Date.parse(board.closesAt);
  if (!Number.isFinite(closesAt) || now >= closesAt) {
    throw new DomainError("BOARD_CLOSED", "The board joining window has closed", 409);
  }

  const players = ensureRecord(board, "players");
  if (isRecord(players[userId])) {
    throw new DomainError("JOIN_STATE_INVALID", "Board membership exists without a matching ledger entry", 409);
  }

  const otherHumans = humanPlayers(players).filter(([id]) => id !== userId);
  if (otherHumans.length > 0) {
    throw new DomainError("BOARD_FULL", "Board already has a human player", 409);
  }

  const wallet = ensureRecord(user, "wallet");
  const previousBalance = Number(wallet.balance);
  if (!Number.isFinite(previousBalance) || previousBalance < 0) {
    throw new DomainError("INVALID_BALANCE", "Wallet balance is invalid", 409);
  }
  if (previousBalance < bet) {
    throw new DomainError("INSUFFICIENT_FUNDS", "Insufficient funds", 409);
  }

  const newBalance = previousBalance - bet;
  const playerData = {
    bet,
    chip_colour: "primary",
    picture: typeof user.url === "string" ? user.url : "",
    position: 0,
    score: 0,
    status: "Rolling",
    userName: typeof user.fullName === "string" ? user.fullName : "Player",
    participantType: "human",
    joinedAt: now,
  };
  const operation = {
    type: "board_join",
    status: "completed",
    userId,
    boardId,
    betAmount: bet,
    previousBalance,
    newBalance,
    createdAt: now,
  };

  wallet.balance = newBalance;
  wallet.updatedAt = now;
  user.gamesPlayed = Number(user.gamesPlayed ?? user.gamesPLayed ?? 0) + 1;
  delete user.gamesPLayed;
  players[userId] = playerData;
  board.stake = calculateFundedStake(board);
  boardJoins[userId] = operation;

  return {root, operation, playerData, idempotent: false};
};

const applyWinnerPayout = (rootValue, input) => {
  const root = isRecord(rootValue) ? rootValue : {};
  const boardId = validateKey(input.boardId, "boardId");
  const bet = validateBet(input.betAmount);
  const now = Number(input.now);
  if (!Number.isFinite(now)) throw new DomainError("INVALID_INPUT", "Transaction time is invalid", 400);

  const board = root.boards?.live?.[bet]?.[boardId];
  if (!isRecord(board)) throw new DomainError("BOARD_NOT_FOUND", "Board was not found", 404);

  const operations = ensureRecord(root, "financialOperations");
  const payouts = ensureRecord(operations, "payouts");
  const betPayouts = ensureRecord(payouts, String(bet));
  const previousOperation = betPayouts[boardId];
  if (isRecord(previousOperation) && previousOperation.status === "completed") {
    return {root, operation: previousOperation, idempotent: true};
  }

  const winnerEntry = determineWinner(board.players);
  if (!winnerEntry) throw new DomainError("NO_WINNER", "No eligible winner was found", 409);

  const [winnerId, winner] = winnerEntry;
  const fundedStake = calculateFundedStake(board);
  if (!Number.isFinite(fundedStake) || fundedStake < 0) {
    throw new DomainError("INVALID_STAKE", "Board stake is invalid", 409);
  }

  const isHumanWinner = winner.participantType !== "bot";
  const payoutAmount = isHumanWinner ? fundedStake : 0;
  let previousBalance = null;
  let newBalance = null;

  if (isHumanWinner) {
    const user = root.users?.[winnerId];
    if (!isRecord(user)) throw new DomainError("WINNER_NOT_FOUND", "Winner profile was not found", 409);
    const wallet = ensureRecord(user, "wallet");
    previousBalance = Number(wallet.balance);
    if (!Number.isFinite(previousBalance) || previousBalance < 0) {
      throw new DomainError("INVALID_BALANCE", "Winner wallet balance is invalid", 409);
    }
    newBalance = previousBalance + payoutAmount;
    wallet.balance = newBalance;
    wallet.updatedAt = now;
    user.gamesWon = Number(user.gamesWon ?? 0) + 1;
    user.totalWinnings = Number(user.totalWinnings ?? 0) + payoutAmount;
  }

  const winnerIs = {
    score: Number(winner.score),
    playerId: winnerId,
    playerName: winner.userName || "Player",
    participantType: winner.participantType || "human",
  };
  const operation = {
    type: "winner_payout",
    status: "completed",
    boardId,
    betAmount: bet,
    winnerId,
    participantType: winnerIs.participantType,
    fundedStake,
    amount: payoutAmount,
    previousBalance,
    newBalance,
    createdAt: now,
  };

  board.winnerIs = winnerIs;
  board.status = "Concluded";
  board.winnerPaid = true;
  board.winnerProcessed = true;
  board.conclusionPending = false;
  board.winnerProcessedAt = now;
  board.endedAt = new Date(now).toISOString();
  betPayouts[boardId] = operation;

  return {root, operation, winner: winnerIs, idempotent: false};
};

const runRootTransaction = async (db, reducer, input) => {
  let outcome;
  let domainError;
  const result = await db.ref().transaction((root) => {
    // The RTDB client invokes transaction callbacks synchronously from its
    // local cache before the initial server read completes. On a cold Cloud
    // Functions instance that cache is null even when the database is not.
    // Returning the unchanged null value keeps the transaction queued; the
    // server rejects its stale hash and retries this callback with real data.
    if (root === null) return null;

    try {
      outcome = reducer(root, input);
      domainError = undefined;
      return outcome.root;
    } catch (error) {
      domainError = error;
      return undefined;
    }
  }, undefined, false);

  if (!result.committed) {
    throw domainError instanceof Error
      ? domainError
      : new DomainError("TRANSACTION_ABORTED", "The transaction could not be completed", 409);
  }
  if (!outcome) {
    throw new DomainError(
      "TRANSACTION_STATE_UNAVAILABLE",
      "The transaction state could not be loaded",
      503
    );
  }
  return outcome;
};

module.exports = {
  ALLOWED_BETS,
  BOARD_SELECTION_SAFETY_MS,
  applyBoardJoin,
  applyWinnerPayout,
  calculateFundedStake,
  determineWinner,
  isBoardJoinable,
  runRootTransaction,
  validateBet,
  validateKey,
};
