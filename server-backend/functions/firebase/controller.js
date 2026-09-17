const {admin} = require('./admin.js');
const firstoreFunctions = require('./firestoreFuncions.js');
const realtimeFunctions = require('./realtimeFunctions.js');
const authorizationFunctions = require('./authorizationFunctions.js');
const storageFunctions = require('./storageFunctions.js');
const { createSecureDiceRoll } = require('./secureDice.js');
const {
  BOARD_SELECTION_SAFETY_MS,
  applyBoardJoin,
  applyWinnerPayout,
  isBoardJoinable,
  runRootTransaction,
  validateBet,
  validateKey,
} = require('../domain/gameTransactions.js');
const {DomainError} = require('../domain/errors.js');

const getCollection = async (collectionName, idToken) => {
  try{
    const auth = admin.auth();
    const isAdmin = await authorizationFunctions.verifyUser(auth, idToken);
    if (isAdmin.errorInfo){
      return {'error' : isAdmin.errorInfo};
    }
    else{
      if(isAdmin.admin == true && isAdmin.accessLevel >= 4)
        {
          const db = admin.firestore();
          return await (firstoreFunctions.getCollectionAdmin(db, collectionName)) ;
        }
      else if (isAdmin.admin == false && isAdmin.accessLevel >=2)
        {
          console.log("isAdmin", isAdmin);
          const db = admin.firestore();
          return await (firstoreFunctions.getCollectionManager(db, collectionName, isAdmin.name)) ;
        }
      else{
          return {message: "unauthorized"}
        }
    }
  }
  catch(err){
    console.log("getCollection: Error")
    console.log(err)
    throw new Error(err);
  }
}

const cronGetLiveBoards = async (price)=> {
  try{
      console.log("cronGetLiveBoards: Start")
      const db = admin.database();
      return await (realtimeFunctions.getAvailableBoardsByPrice(db, price)) ;
  }
  catch(err){
    console.log("cronGetLiveBoards: Error")
    console.log(err)
    throw new Error(err);
  }
}

const cronGetAllBoards = async (price)=> {
  try{
      console.log("cronGetLiveBoards: Start")
      const db = admin.database();
      return await (realtimeFunctions.getAvailableBoardsByPrice(db, price)) ;
  }
  catch(err){
    console.log("cronGetLiveBoards: Error")
    console.log(err)
    throw new Error(err);
  }
}


const cronGetExpiredBoards = async (amount)=> {
  try{
      const db = admin.database();
      return await (realtimeFunctions.getExpiredBoards(db, amount)) ;
  }
  catch(err){
    console.log("cronGetLiveBoards: Error")
    console.log(err)
    throw new Error(err);
  }
}


const createTestBoard = async () => {
  try{
      const db = admin.firestore();
      const data = {
          bet: 5, 
          createdBy: "testUser",
          createdAt: new Date().toISOString(),
          status: "Available",
          players: {}
      }
      //(db, collectionName, uid, data) 
    return await firstoreFunctions.createDoc(db, 'boards', '5',data);
  } catch(err){
    console.log("createTestBoard: Error")
    console.log(err)
    throw new Error(err);
  } 
}


const getUserDoc = async (uid, idToken) => {
  try{
    const auth = admin.auth();
    const isAdmin = await authorizationFunctions.verifyUser(auth, idToken);
    if (isAdmin.errorInfo){
      return {'error' : isAdmin.errorInfo};
    }
    else{
      const db = admin.firestore();
      if(isAdmin.admin == true && isAdmin.accessLevel){
        //(db, collectionName, uid)
        //here user requsting the data is an admin
        return await firstoreFunctions.getDoc(db, 'Exemployees', uid)
      }
      else{
        //here user requesting the data is not an admin
        if(isAdmin.accessLeve > 2 ){
          return await firstoreFunctions.getDoc(db, 'Exemployees', uid)
        }
        else if (uid === isAdmin.uid){
          return await firstoreFunctions.getDoc(db, 'Exemployees', uid)
        }
        else{
          return {'error' : "Unauthorized"};
        }

      }
    }
  }
  catch(err){
    console.log("getUserDoc: Error")
    console.log(err)
    throw new Error(err);
  }
}

const authorizeUser = async (idToken) => {
  try{
    const auth = admin.auth();
    const results = await (authorizationFunctions.verifyUser(auth, idToken))
    return results.uid;
  }
  catch(err){
    console.log("getCollection: Error")
    console.log(err)
    throw new Error(err);
  }
}

const getUserRole = async (idToken) => {
  try{
    const auth = admin.auth();
    const results = await (authorizationFunctions.verifyUser(auth, idToken))
    return results;
  }
  catch(err){
    console.log("getCollection: Error")
    console.log(err)
    throw new Error(err);
  }
}

const createUserDetails = async (uid, userData, idToken) => {
  try{
    const auth = admin.auth();
    const isAdmin = await authorizationFunctions.verifyUser(auth, idToken);
    if (isAdmin.errorInfo){
      return {'error' : isAdmin.errorInfo};
    }
    else{
      if(isAdmin.uid === uid ){
        const db = admin.database();
        return await realtimeFunctions.createUserDetails(db, uid, {
          fullName: userData?.fullName,
          email: isAdmin.email || userData?.email,
        });
      }
    }
  }
  catch(err){
    console.log("createUserDetails: Error")
    console.log(err)
    throw new Error(err);
  }
}

const getUserData = async (uid, idToken) => {
  try{
    const auth = admin.auth();
    const isAdmin = await authorizationFunctions.verifyUser(auth, idToken);
    if (isAdmin.errorInfo){
      return {'error' : isAdmin.errorInfo};
    }
    else{
      const db = admin.database();
      if(isAdmin.admin == true && isAdmin.accessLevel){
        //here user requsting the data is an admin
        return await realtimeFunctions.getUserDetails(db, uid)
      }
      else{
        //here user requesting the data is not an admin therefore can only access their own data
        if(isAdmin.uid === uid ){
          return await realtimeFunctions.getUserDetails(db, uid)
        }
        else{   
          return {'error' : "Unauthorized"};
        }
      }
    }
  }
  catch(err){
    console.log("getUserData: Error")
    console.log(err)
    throw new Error(err);
  }
}

const uploadProfilePicture = async (uid, file, mimeType, fillName, idToken) => {
  try{
    const auth = admin.auth();
    const isAdmin = await authorizationFunctions.verifyUser(auth, idToken);
    if (isAdmin.errorInfo){
      return {'error' : isAdmin.errorInfo};
    }
    else{
      if(isAdmin.uid === uid ){
        const storage = admin.storage();
        const allowedTypes = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };
        const extension = allowedTypes[mimeType];
        if (!extension || !Buffer.isBuffer(file) || file.length === 0) {
          const error = new Error("Invalid avatar file");
          error.code = "INVALID_UPLOAD";
          error.status = 400;
          throw error;
        }
        const filePath = `avatars/${uid}/${Date.now()}-avatar.${extension}`;
        await storageFunctions.deleteImage(storage,`avatars/${uid}`)
        return await (storageFunctions.uploadImage(storage, filePath, file, mimeType));
      }
    }
  }
  catch(err){
    console.error("uploadProfilePicture failed", {
      uid,
      code: err?.code || "UPLOAD_FAILED",
      message: err?.message || "Unknown error",
    });
    throw err;
  }
}

const updateUserDetails = async (uid, update, idToken) => {
  try{
    const auth = admin.auth();
    const isAdmin = await authorizationFunctions.verifyUser(auth, idToken);
      if (isAdmin.errorInfo){
      return {'error' : isAdmin.errorInfo};
    }
    else{
       const db = admin.database();
      if(isAdmin.admin == true && isAdmin.accessLevel){
        //here user requsting the data is an admin
        return await realtimeFunctions.updateUserDetails(db, uid, update)
      }
      else{
        //here user requesting the data is not an admin therefore can only access their own data
        if(isAdmin.uid === uid ){
          return await realtimeFunctions.updateUserDetails(db, uid, update)
        }
        else{   
          return {'error' : "Unauthorized"};
        }
      }
    }
  }
  catch(err){
    throw new Error(err);
  }
}

const setUserRole = async (userEmail, uid , role, idToken) => {
  try{ 
      const auth = admin.auth();
      const isAdmin = await authorizationFunctions.verifyUser(auth, idToken);
      if (isAdmin.errorInfo){
        return {'error' : isAdmin.errorInfo};
      }
      else{
        if(isAdmin.admin == true && uid == isAdmin.uid){
          return await (authorizationFunctions.setUserRole(auth, userEmail, role, isAdmin.accessLevel));
        }
        else{
          return {message: "unauthorized"}
        }
      }
  }
  catch(err){
    console.log("index setUserRole: Error")
    console.log(err);
    throw new Error(err);
  }
}

const createUser = async (fullName,email, phoneNumber, password) => {
  try{
    const auth = admin.auth();
    const userResults =  await (authorizationFunctions.createUser(auth, fullName, email, phoneNumber, password));
    if(userResults.uid){
      //resulst.userRecord
      const data = {
          role: position,
          fullName: fullName,
          position: position,
          department: department,
          reportsTo: reportsTo,
          startDate: startDate,
          phoneNumber: phoneNumber,
          dateEmployeeAddedToSystem: getSouthAfricanTime()
      }
      const db = admin.firestore();
      const results = await (firstoreFunctions.createDoc(db, 'Exemployees', userResults.uid, data ));
      return {results, userId: userResults.uid };
    }
    else{
      return userResults;
    }
  }
  catch (err){
    console.log("index creatUser: Error")
    console.log(err);
    throw new Error(err);
  }
} 

const getSouthAfricanTime = () => {
    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-ZA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Africa/Johannesburg'
    }).format(date);
    
    return formattedDate;
}



// ______________________________________________________________________________________________________


const rollDice = async (details) => {
  try {
    const userId = validateKey(details.userId, "userId");
    const boardId = validateKey(details.boardId, "boardId");
    const betAmount = validateBet(details.betAmount);
    const auth = admin.auth();
    const db = admin.database();
    const verifiedUser = await authorizationFunctions.verifyUser(auth, details.token);
    if (!verifiedUser?.uid) throw new DomainError("UNAUTHORIZED", "Unauthorized", 401);
    if (verifiedUser.email_verified !== true) {
      throw new DomainError("EMAIL_NOT_VERIFIED", "Email verification is required", 403);
    }
    if (userId !== verifiedUser.uid) throw new DomainError("FORBIDDEN", "Incorrect token", 403);

    const board = await realtimeFunctions.getBoardDetails(db, betAmount, boardId);
    if (!board?.players || !Object.prototype.hasOwnProperty.call(board.players, userId)) {
      throw new DomainError("PLAYER_NOT_FOUND", "Player is not on this board", 409);
    }
    return await roll(db, betAmount, boardId, userId);
  } catch (err) {
    console.error("rollDice failed", {
      code: err?.code || "ROLL_FAILED",
      message: err?.message || "Unknown error",
    });
    throw err;
  } 
}

const roll = async (db, betAmount, boardId, player) => {
  const secureRoll = createSecureDiceRoll({ betAmount, boardId, playerId: player });
  const { dice1, dice2, sum } = secureRoll;

  await realtimeFunctions.applyDiceRoll(
    db,
    betAmount,
    boardId,
    player,
    secureRoll,
    "human"
  );
  return {dice1, dice2, sum, rollId: secureRoll.audit.rollId, proof: secureRoll.audit};
}

const joindBoard = async (details) => {
  try {
    const auth = admin.auth();
    const db = admin.database();
    const verifiedUser = await authorizationFunctions.verifyUser(auth, details.token);
    if (!verifiedUser?.uid) {
      const authError = new Error("Unauthorized");
      authError.code = "UNAUTHORIZED";
      authError.status = 401;
      throw authError;
    }
    if (verifiedUser.email_verified !== true) {
      const authError = new Error("Email verification is required");
      authError.code = "EMAIL_NOT_VERIFIED";
      authError.status = 403;
      throw authError;
    }

    if (details.userId !== verifiedUser.uid) {
      const authError = new Error("Authenticated user does not match the requested user");
      authError.code = "FORBIDDEN";
      authError.status = 403;
      throw authError;
    }

    const result = await runRootTransaction(db, applyBoardJoin, {
      userId: verifiedUser.uid,
      boardId: details.boardId,
      betAmount: details.betAmount,
      now: Date.now(),
    });

    return {
      success: true,
      idempotent: result.idempotent,
      message: result.idempotent ? "Board already joined" : "Board joined successfully",
    };
  } catch (err) {
    console.error("joinBoard failed", {
      code: err?.code || "INTERNAL_ERROR",
      message: err?.message || "Unknown error",
    });
    throw err;
  }
}

const findAvailableBoard = async (details) => {
  try {
    if (!details || typeof details !== "object") {
      return { error: "Invalid request details" };
    }

    const { token, userId, betAmount } = details;

    if (!token || typeof token !== "string") {
      return { error: "Missing or invalid token" };
    }

    validateKey(userId, "userId");

    if (betAmount === undefined || betAmount === null) {
      return { error: "Missing betAmount" };
    }

    const normalizedBetAmount = validateBet(betAmount);

    const auth = admin.auth();
    const db = admin.database();

    const verifiedUser = await authorizationFunctions.verifyUser(auth, token);

    if (!verifiedUser || verifiedUser.errorInfo) {
      return {
        error: verifiedUser?.errorInfo?.message || "Unauthorized",
      };
    }

    if (verifiedUser.uid !== userId) {
      console.warn("User ID mismatch", {
        requestedUserId: userId,
        authenticatedUserId: verifiedUser.uid,
      });

      return { error: "Unauthorized access" };
    }

    const userDetails = await realtimeFunctions.getUserDetails(db, verifiedUser.uid);

    const walletBalance = Number(userDetails?.wallet?.balance ?? 0);

    if (!Number.isFinite(walletBalance)) {
      return { error: "Invalid wallet balance" };
    }

    if (walletBalance < normalizedBetAmount) {
      console.warn("Insufficient funds", {
        walletBalance,
        betAmount: normalizedBetAmount,
        userId: verifiedUser.uid,
      });

      return { error: "Insufficient funds" };
    }

    const boards =
      (await realtimeFunctions.getAvailableBoardsAmountBased(
        normalizedBetAmount,
        db
      )) || {};

    const selectionTime = Date.now();
    const availableBoards = Object.entries(boards)
      .filter(([, board]) => (
        isBoardJoinable(board, selectionTime, BOARD_SELECTION_SAFETY_MS)
      ))
      .map(([boardKey, board]) => ({
        id: boardKey,
        ...board,
      }))
      .sort((boardA, boardB) => (
        Date.parse(boardB.closesAt) - Date.parse(boardA.closesAt)
      ));

    return {
      success: true,
      count: availableBoards.length,
      boards: availableBoards,
    };
  } catch (error) {
    console.error("findAvailableBoard error", {
      message: error?.message,
      stack: error?.stack,
    });

    return {
      error: "Internal server error",
    };
  }
};


const addBotToBoard = async (details) => {
  try{
    const db = admin.database();
      const playerData  = {
        bet: details.betAmount,
        chip_colour: "primary",
        picture: details.url,
        position: 0,
        score: 0,
        status: "Rolling",
        userName: details.fullName,
        participantType: "bot"
      };

      // Usage of the addBoardDetails function
      return  await realtimeFunctions.addPayerToBoard(db, details.betAmount, details.boardId, details.id, playerData)
  }
  catch(err){
    console.log("addBotToBoard Error: ", err);
    throw new Error(err);
  }
}

const addBotsToBoard = async (details) => {
  const db = admin.database();
  const boardRef = db.ref(
    `boards/live/${details.betAmount}/${details.boardId}`
  );
  const completedAt = Date.now();

  const boardSnapshot = await boardRef.get();
  const board = boardSnapshot.val();
  if (
    !board ||
    board.status !== "Available" ||
    board.botPopulation?.status !== "in_progress"
  ) {
    return {error: "Board is unavailable or bot population was not claimed"};
  }

  const updates = {};
  for (const bot of details.bots) {
    updates[`players/${bot.id}`] = {
      bet: details.betAmount,
      chip_colour: bot.chip_colour || "primary",
      picture: bot.picture,
      position: 0,
      score: 0,
      status: "Rolling",
      userName: bot.userName,
      participantType: "bot",
    };
  }
  updates.botPopulation = {
    ...board.botPopulation,
    status: "complete",
    botCount: details.bots.length,
    completedAt,
  };

  await boardRef.update(updates);

  return {
    message: "Bots added successfully",
    botCount: details.bots.length,
  };
};

/**
 * Put bots on the board before /joinBoard responds so the game screen can
 * render them without depending on Eventarc delivery latency.
 */
const populateBotsForBoard = async (details) => {
  const db = admin.database();
  const boardRef = db.ref(
    `boards/live/${details.betAmount}/${details.boardId}`
  );
  const populatedAt = Date.now();

  const boardSnapshot = await boardRef.get();
  const board = boardSnapshot.val();
  if (!board || board.status !== "Available") {
    return {error: "Board is unavailable for bot population"};
  }

  if (board.botPopulation?.status === "complete") {
      return {
        message: "Bots already populated",
        botCount: board.botPopulation.botCount || 0,
      };
  }

  const updates = {};
  for (const bot of details.bots) {
    updates[`players/${bot.id}`] = {
      bet: details.betAmount,
      chip_colour: bot.chip_colour || "primary",
      picture: bot.picture,
      position: 0,
      score: 0,
      status: "Rolling",
      userName: bot.userName,
      participantType: "bot",
    };
  }
  updates.botPopulation = {
    status: "populated",
    botCount: details.bots.length,
    populatedAt,
    source: "join_api",
  };

  await boardRef.update(updates);

  return {
    message: "Bots populated successfully",
    botCount: details.bots.length,
  };
};

//botPlay function and sleep helper work together to manage bot players' turns in the game.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const botPlay = async (gameDetails) => {
  try {
    const db = admin.database();

    const players = Array.isArray(gameDetails.players)
      ? gameDetails.players
      : Object.values(gameDetails.players || {});

    if (!players.length) return;

    await sleep(1000);

    const results = await Promise.allSettled(
      players.map((bot) =>
        rollBotDice(db, gameDetails.betAmount, gameDetails.boardId, bot)
      )
    );

    // Log any bot failures
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error("Bot roll sequence failed", {
          botIndex: i,
          code: r.reason?.code || "BOT_ROLL_FAILED",
          message: r.reason?.message || "Unknown bot roll error",
        });
      }
    });

    const failedRolls = results.filter((result) => result.status === "rejected");
    if (failedRolls.length > 0) {
      const error = new Error(`${failedRolls.length} bot roll sequences failed`);
      error.code = "BOT_PLAY_PARTIAL_FAILURE";
      throw error;
    }
  } catch (err) {
    console.log("botPlay - Error:", err);
    throw err;
  }
};

const LOSE_SUM = 7;
const ROLL_DELAY_MS = 3000;
const MAX_BOT_ROLLS = 50;

const rollBotDice = async (db, betAmount, boardId, bot) => {
  try {
    if (!bot?.id) {
      throw new Error("Invalid bot object");
    }

    let isOut = false;
    let rollCount = 0;

    while (!isOut && rollCount < MAX_BOT_ROLLS) {
      rollCount += 1;
      const secureRoll = createSecureDiceRoll({
        betAmount,
        boardId,
        playerId: bot.id,
      });
      const { dice1, dice2, sum: rollSum } = secureRoll;

      // Wait before applying result
      await new Promise((resolve) => setTimeout(resolve, ROLL_DELAY_MS));

      await realtimeFunctions.applyDiceRoll(
        db,
        betAmount,
        boardId,
        bot.id,
        secureRoll,
        "bot"
      );
      isOut = rollSum === LOSE_SUM;
    }

    if (!isOut) {
      const error = new Error("Bot roll safety limit reached");
      error.code = "BOT_ROLL_LIMIT";
      throw error;
    }
  } catch (err) {
    console.error("rollBotDice failed", {
      betAmount,
      boardId,
      botId: bot?.id,
      error: err
    });
    throw err; // preserve original error
  }
};

const createBoardJoin = async (details) => {
    const auth = admin.auth();
    const db = admin.database();
    try{
        const isAdmin = await authorizationFunctions.verifyUser(auth, details.token);
        const userDetails = await realtimeFunctions.getUserDetails(db, isAdmin.uid);
        const result = await realtimeFunctions.createBoard(db, userDetails, details, isAdmin.uid);
        return result;
    }
    catch(err){
      return {'error' : "something went wrong"}
    }
}

// const writeWinner = async (details) => {
//   const db = admin.database();
//   const dbFirestore = admin.firestore();
//   try{
//     // Update the score after 6 seconds
//     //updateWinner = async (db, boardId, score, userDetails)
//     const boardDetails = await realtimeFunctions.getBoardDetails(db, details.betAmount, details.boardId);
//     if(boardDetails.status !== "Concluded"){
//       await firstoreFunctions.createDoc2(dbFirestore, details.boardId, details);
//       await realtimeFunctions.updateWinner(db, details.betAmount, details.boardId, {score: details.highScore, playerId: details.highestScorePlayer, playerName: details.playerName});
//       //after winning update the winner's wallet by adding the bet amount multiplied by the number of players in the game
//       const playerCount = Object.keys(boardDetails.players).length;
//       const winnings = Number(details.betAmount) * Number(playerCount);
//       const winnerDetails = await realtimeFunctions.getUserDetails(db, details.highestScorePlayer);
//       console.log("winnerDetails Balance: ",  Number(winnerDetails?.wallet?.balance ?? 0));
//       console.log("winnings: ", Number(winnings ?? 0));
//       const newBalance =
//       Number(winnerDetails?.wallet?.balance ?? 0) + Number(winnings ?? 0);
//       await realtimeFunctions.updateUserWallet(db, details.highestScorePlayer, newBalance, winnings, winnerDetails?.wallet?.balance );
//       return "success";
//     } 
//     return "success";
//   }
//   catch(err){
//     console.log("writeWinner Error: ", err)
//     return err;
//   }
// }

const writeWinner = async (details) => {
  const db = admin.database();
  const dbFirestore = admin.firestore();

  try {
    if (!details?.boardId || !details?.betAmount || !details?.highestScorePlayer) {
      throw new Error("Missing required winner details");
    }

    const payout = await runRootTransaction(db, applyWinnerPayout, {
      boardId: details.boardId,
      betAmount: details.betAmount,
      now: Date.now(),
    });

    // Firestore is an audit/archive copy. The authoritative payout, balance,
    // ledger entry, and board conclusion have already committed atomically.
    await firstoreFunctions.createDoc2(dbFirestore, details.boardId, {
      ...details,
      ...payout.operation,
      winner: payout.winner,
      idempotent: payout.idempotent,
    });

    return "success";
  } catch (err) {
    console.error("writeWinner failed", {
      boardId: details?.boardId,
      code: err?.code || "INTERNAL_ERROR",
      message: err?.message || "Unknown error",
    });
    throw err;
  }
};

const createExpiredBoard = async (board, boardId) => {
  try {
    //board, boardId
    const db = admin.database();
    const result = await realtimeFunctions.createExpiredBoard(db, board, boardId);
    return result;
  }
  catch (err) {
      console.error('Error creating expired board:', err);
      throw new Error(err);
  }
}
  
const createExpiredBoardOnFirestore = async (board, boardId) => {
  try {
    const db = admin.firestore();
    const result = await firstoreFunctions.createDoc2(db, boardId, board);
    return result;
  } 
  catch (err) {
      console.error('Error creating expired board on Firestore:', err);
      throw new Error(err);
  }
}

const deleteExpiredBoard = async (betAmount,boardId) => {
  try {
    //board, boardId
    const db = admin.database();
    const result = await realtimeFunctions.deleteBoard(db,betAmount, boardId);
    return result;
  }
  catch (err) {
      console.error('Error creating expired board:', err);
      throw new Error(err);
  }
}

const deleteExpiredBoardV2 = async (betAmount,boardId) => {
  try {
    //board, boardId
    const db = admin.database();
    const result = await realtimeFunctions.deleteExpiredBoard(db,betAmount, boardId);
    return result;
  }
  catch (err) {
      console.error('Error creating expired board:', err);
      throw new Error(err);
  }
}

// This function creates a new board for a given bet amount
async function createAutoBoard(betAmount) {
  try {
      console.log("Creating auto board with bet amount:", betAmount);
      const db = admin.database();
      const result = await realtimeFunctions.createAutoBoard(db, betAmount);
      return result;
  } catch (err) {
      console.error('Error creating auto board:', err); 
      throw new Error(err);
  }
}

const deleteNode = async (path) => {
  console.log("deleteNode path: ", path);
  const db = admin.database();
  try {
    await db.ref(path).remove();
    console.log(`Successfully deleted collection at path: ${path}`);
  } catch (error) {
    console.error("Error deleting collection:", error);
  }
}

function countGamePlayerFields(players) {
  let totalPlayers = 0;
  let outPlayers = 0;
  let activePlayers = 0;

  if (!players || typeof players !== "object") {
    return { totalPlayers: 0, outPlayers: 0, activePlayers: 0 };
  }

  for (const playerId in players) {
    const player = players[playerId];

    // Ensure this is a valid player object
    if (!player || typeof player !== "object") continue;

    totalPlayers++;

    const status = (player.status || "").toLowerCase();

    if (status === "out") {
      outPlayers++;
    } else {
      activePlayers++;
    }
  }

  return {
    totalPlayers,
    outPlayers,
    activePlayers,
  };
}


/* All function here are cron jobs that run at specific intervals to manage game boards and players */

async function deleteBoardsAtomic( betAmount, boardIds = []) {
  const db = admin.database();
  const updates = {};

  for (const boardId of boardIds) {
    updates[`boards/live/${betAmount}/${boardId}`] = null;
  }

  await db.ref().update(updates);

  console.log(`✅ Atomically deleted ${boardIds.length} board(s)`);
}






module.exports = {
  joindBoard,
  getCollection,
  authorizeUser,
  createUser,
  setUserRole,
  getUserDoc,
  getUserRole,
  addBotToBoard,
  addBotsToBoard,
  populateBotsForBoard,
  botPlay,
  findAvailableBoard,
  createBoardJoin,
  writeWinner,
  rollDice,
  cronGetLiveBoards,
  createExpiredBoard,
  deleteExpiredBoard,
  createAutoBoard,
  deleteExpiredBoardV2,
  cronGetExpiredBoards,
  createExpiredBoardOnFirestore,
  deleteNode,
  createTestBoard,
  countGamePlayerFields,
  cronGetAllBoards,
  deleteBoardsAtomic,
  getUserData,
  createUserDetails,
  uploadProfilePicture,
  updateUserDetails
}
