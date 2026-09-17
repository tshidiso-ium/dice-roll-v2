function getSouthAfricanTime() {
  // Date represents an absolute instant. Converting a Johannesburg-formatted
  // string back into a Date shifts the instant when the server runs in UTC.
  // Store ISO/epoch values and apply Africa/Johannesburg only when formatting.
  return new Date();
}

function has20SecondsPassed(startsAt) {    
    const startTime = new Date(startsAt).getTime();
    const now = getSouthAfricanTime().getTime()
    if (!Number.isFinite(startTime)) return false;
    const TWENTY_SECONDS = 20 * 1000;
    return now >= startTime + TWENTY_SECONDS;
}

function has10SecondsPassed(startsAt) {    
    const startTime = new Date(startsAt).getTime();
    const now = getSouthAfricanTime().getTime()
    if (!Number.isFinite(startTime)) return false;
    const TEN_SECONDS = 10 * 1000;
    return now >= startTime + TEN_SECONDS;
}

function countAvailableBoards(boards) {
  let count = 0;

  if (!boards || typeof boards !== "object") {
    return 0;
  }

  for (const boardId in boards) {
    const board = boards[boardId];
    if (!board) continue;
    const now = getSouthAfricanTime();
    const boardBet = Number(board.bet);
    const closesAt = new Date(board.closesAt).getTime();

    if (
      board.status === "Available" &&
      Number.isFinite(closesAt) &&
      closesAt > now.getTime()
    ) {
      count++;
    }
  }

  return count;
}

function countActivePlayers(playersObj) {
  const players = getRealPlayers(playersObj);

  return players.filter((p) => {
    const status = (p.status || "").toString().toLowerCase();
    // Treat missing status as active, only "out" means out
    return status !== "out";
  }).length;
}

function getRealPlayers(playersObj) {
  if (!playersObj || typeof playersObj !== "object") return [];

  return Object.values(playersObj).filter((p) => {
    // Filter out placeholder strings like "player 1"
    if (!p) return false;
    if (typeof p === "string") return false;

    // Must be an object player record
    return typeof p === "object";
  });
}

function returnExpiredBoards(boards) {
  let expiredBoards = [];
  if (!boards || typeof boards !== "object") {
    return 0;
  }

  for (const boardId in boards) {
    const board = boards[boardId];
    if (!board) continue;
    const now = getSouthAfricanTime();
    const endedAt = new Date(board.endedAt).getTime();
    const totalPlayers = getRealPlayers(board.players).length;
    const activePlayers = countActivePlayers(board.players);
    const outPlayers =
        Number.isFinite(Number(board.outPlayers))
        ? Number(board.outPlayers)
        : Math.max(totalPlayers - activePlayers, 0);
    const allPlayersOut = totalPlayers >= 0 && outPlayers >= totalPlayers;
    if (
     ( 
      board.status === "Available" || board.status === "Concluded" ) &&
      allPlayersOut &&
      Number.isFinite(endedAt) &&
      endedAt < now.getTime()
    ) {
      expiredBoards.push(boardId);
    }
  }

  return expiredBoards;
}


const findChangedBoard = (before, after) => {
  for (const boardId in before) {
    // console.log("findChangedBoard Board Id: ",boardId )
    // console.log("Object Correct Match: ",Object.entries(after).findIndex(([key, value]) => value.id === before[boardId].id));

    // console.log("Before Correct Match: ",before[boardId].id);
    // console.log("After Correct Match: ", after[Object.entries(after).findIndex(([key, value]) => value.id === before[boardId].id)]?.id || false);
    if((after[Object.entries(after).findIndex(([key, value]) => value.id === before[boardId].id)]?.id || false) !== false){
      if (JSON.stringify(before[boardId]) !== JSON.stringify(after[boardId])) {
        const changedFields = findChangedFields(before[boardId], after[boardId]);
        return { id: before[boardId].id, startsAt: before[boardId].startsAt, betAmount: before[boardId].bet, outPlayers: after[boardId].outPlayers , changes: changedFields, players: after[boardId].players };
      }
    }
    else{
      // console.log("removed Item: ", before[boardId]);
      return null;
    }
    
  }
  return null; // Return null if no change is found
};

// Function to find changed fields
const findChangedFields = (beforeObj, afterObj) => {
  const changedFields = {};
  for (const key in beforeObj) {
    if (JSON.stringify(beforeObj[key]) !== JSON.stringify(afterObj[key])) {
      changedFields[key] = { before: beforeObj[key], after: afterObj[key] };
    }
  }
  return changedFields;
};

const isPlayerRecord = (player) => (
  player !== null &&
  typeof player === "object" &&
  !Array.isArray(player)
);

/**
 * Return boards where this write added at least one human player.
 * Boards are compared by their Realtime Database key, not by object order.
 */
const findBoardsWithNewHumanPlayers = (beforeBoards, afterBoards) => {
  const before = beforeBoards && typeof beforeBoards === "object"
    ? beforeBoards
    : {};
  const after = afterBoards && typeof afterBoards === "object"
    ? afterBoards
    : {};

  return Object.entries(after).flatMap(([boardId, board]) => {
    if (!board || typeof board !== "object") return [];

    const beforePlayers = before[boardId]?.players;
    const afterPlayers = board.players;
    const previous = beforePlayers && typeof beforePlayers === "object"
      ? beforePlayers
      : {};
    const current = afterPlayers && typeof afterPlayers === "object"
      ? afterPlayers
      : {};

    const playerIds = Object.entries(current)
      .filter(([playerId, player]) => (
        !Object.prototype.hasOwnProperty.call(previous, playerId) &&
        isPlayerRecord(player) &&
        player.participantType !== "bot"
      ))
      .map(([playerId]) => playerId);

    return playerIds.length ? [{boardId, playerIds}] : [];
  });
};


const boardHighestScore = (players) => {
  // console.log("Players in highest score: ", players);
  let highestScore = -Infinity;
  let highestScorePlayer = null;
  let playerName = null;
    // Iterate over the players
  for (const playerId in players) {
    const player = players[playerId];
    
    // Compare and update if the current player has a higher score
    if (player.score > highestScore) {
      highestScore = player.score;
      highestScorePlayer = playerId; // Store the player ID with the highest score
      playerName = player.userName;
    }
  }

  return {highestScore: highestScore , highestScorePlayer:highestScorePlayer, playerName:playerName};
};

const countFields = (obj) => {
  return Object.keys(obj).length;
};


module.exports = {
  has20SecondsPassed,
  getSouthAfricanTime,
  countAvailableBoards,
  returnExpiredBoards,
  has10SecondsPassed,
  findChangedBoard,
  findBoardsWithNewHumanPlayers,
  boardHighestScore,
  countFields
};
