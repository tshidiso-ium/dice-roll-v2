const helperFunctions = require('../helperFunctions/index.js');
const {determineWinner} = require('../domain/gameTransactions.js');

const getAvailableBoards = async (db) => {
    try{
        const snapshot = await  db.ref(`boards/live`).once('value');
        if (snapshot.empty) {
            console.log('No matching documents.');
            return {message: 'No matching documents'};
        }
        else{
            return snapshot.val();
        }
    }
    catch(err){
        console.log("realtimeFunctions getAvailableBoards: Error");
        console.log(err);
        throw new Error(err); 
    }
};

const getAvailableBoardsByPrice = async (db, price) => {
    try{
        const snapshot = await db.ref(`boards/live/${price}`).once('value');
        if (snapshot.empty) {
            console.log('No matching documents.');
            return {message: 'No matching documents'};
        }
        else{
            return snapshot.val();
        }
    }
    catch(err){
        console.log("realtimeFunctions getAvailableBoards: Error");
        console.log(err);
        throw new Error(err); 
    }
};

const getAvailableBoardsAmountBased = async (amount,db) => {
    try{
        const snapshot = await  db.ref(`boards/live/${amount}`).once('value');
        if (snapshot.empty) {
            console.log('No matching documents.');
            return {message: 'No matching documents'};
        }
        else{
            return snapshot.val();
        }
    }
    catch(err){
        console.log("realtimeFunctions getAvailableBoards: Error");
        console.log(err);
        throw new Error(err); 
    }
};
const getExpiredBoards = async (db,amount) => {
    try{
        const snapshot = await  db.ref(`boards/expiredBoards/${amount}`).once('value');
        if (snapshot.empty) {
            console.log('No matching documents.');
            return {message: 'No matching documents'};
        }
        else{
            return snapshot.val();
        }
    }
    catch(err){
        console.log("realtimeFunctions getAvailableBoards: Error");
        console.log(err);
        throw new Error(err); 
    }
};

const getBoardDetails = async (db, betAmount, boardId) => {
    try{    
        const snapshot = await  db.ref(`boards/live/${betAmount}/${boardId}`).once('value');

        if (snapshot.empty || !snapshot.exists() || snapshot.val() === null) {
            console.log('No matching documents.');
            return {message: 'No matching documents'};
        }
        else{
            return snapshot.val();
        }
  
    }
    catch(err){
        console.log("realtimeFunctions GetBoardDetails: Error");
        console.log(err);
        throw new Error(err);
    }
};

const addPayerToBoard = async (db, betAmount, boardId, playerId, playerData) => {
    try {
        // Reference the board location in the database
        const boardRef = db.ref(`boards/live/${betAmount}/${boardId}/players`);
        // Set the data at the specified location
        await boardRef.child(playerId).set(playerData);

        return { message: 'Board details added successfully' };
    } catch (err) {
        console.error('Error adding board details:', err);
        throw new Error(err);
    }
};

const createUserDetails = async (db, userId, userData) => {
    try{
        const fullName = typeof userData?.fullName === "string" ? userData.fullName.trim() : "";
        const email = typeof userData?.email === "string" ? userData.email.trim().toLowerCase() : "";
        if (fullName.length < 2 || fullName.length > 80 || email.length > 254) {
            const error = new Error("Invalid user profile");
            error.code = "INVALID_PROFILE";
            error.status = 400;
            throw error;
        }
        // Reference the user location in the database
        const userRef = db.ref(`users/${userId}`);
        const createdAt = helperFunctions.getSouthAfricanTime();

        // Define the users's data structure
        const newUser = {
            email,
            fullName,
            // phoneNumber: userData.phoneNumber,
            createdAt: createdAt,
            gamesPlayed: 0,
            totalWinnings: 0,
            url: '',
            verified: false,
            wallet : {
                balance: 0,
                lockedBalance: 0,
                updatedAt: createdAt
            }
        };
        let created = false;
        const result = await userRef.transaction((current) => {
            if (current) return;
            created = true;
            return newUser;
        }, undefined, false);
        return {
            message: result.committed && created
                ? 'User details added successfully'
                : 'User profile already exists',
        };
    }   
    catch(err){
        console.log("realtimeFunctions CreateUserDetails: Error");
        console.log(err);
        throw new Error(err);
    }
};

const updateUserDetails = async (db, userId, userData) => {
    try{
        const fullName = typeof userData?.fullName === "string" ? userData.fullName.trim() : "";
        const url = typeof userData?.url === "string" ? userData.url.trim() : "";
        if (fullName.length < 2 || fullName.length > 80 || url.length > 2048) {
            const error = new Error("Invalid profile update");
            error.code = "INVALID_PROFILE";
            error.status = 400;
            throw error;
        }
        const userRef = db.ref(`users/${userId}`);
        await userRef.update({fullName, url});
        return { message: 'User details updated successfully' };
    }
    catch(err){
        console.log("realtimeFunctions updateUserDetails: Error");
        console.log(err);
        throw new Error(err);
    }
}

const updateUserGameCount = async (db, userId) => {
    try{
        // Reference the user location in the database
        const gamesPlayedRef =  db.ref(
            `/users/${userId}/gamesPlayed`
        );

        const gamesPlayedTxn = await gamesPlayedRef.transaction((currentGamesPlayed) => {
            return Number(currentGamesPlayed ?? 0) + 1;
        });

       return { message: 'User details updated successfully' };
    }
    catch(err){
        console.log("realtimeFunctions updateUserGameCount: Error");
        console.log(err);
        throw new Error(err);
    }
}


const getUserDetails = async (db, userId) => {
    try{    
        var userDetails;

        const snapshot = await  db.ref(`users/${userId}`).once('value');

        if (snapshot.empty) {
            console.log('No matching documents.');
            return {message: 'No matching documents'};
        }
        else{
            userDetails = snapshot.val();
            return userDetails;
        }
  
    }
    catch(err){
        console.log("realtimeFunctions GetUserDetails: Error");
        console.log(err);
        throw new Error(err);
    }
};

const updateScore = async (db, betAmount, boardId, playerId, playerScore, dice1, dice2) => {
    try{
        // Reference the board location in the database
        const boardRef = db.ref(`boards/live/${betAmount}/${boardId}/players/${playerId}`);
        // Set the data at the specified location
        var currentScore = 0;
        boardRef.child("status").once("value", async (userStatus) => {
            if(userStatus.val() !== "Out"){
                boardRef.child("score").once("value", async (snapshot) => {
                    await boardRef.child("score").set((snapshot.val() + playerScore));
                    await boardRef.child("dice1").set(dice1);
                    await boardRef.child("dice2").set(dice2);
                })
            }
            else if(userStatus.val() === "Out"){
                console.log("Player is out, score not updated.");
                    boardRef.child("score").once("value", async (snapshot) => {
                    await boardRef.child("dice1").set(dice1);
                    await boardRef.child("dice2").set(dice2);
                })
            }

        })

        return { message: 'Board details added successfully' };
    }
    catch(err){
        console.log("updateScore : Error", err);
        throw new Error (err);
    }
};

const applyDiceRoll = async (
  db,
  betAmount,
  boardId,
  playerId,
  roll,
  participantType
) => {
    const boardRef = db.ref(`boards/live/${betAmount}/${boardId}`);
    let rejection;
    let boardLoaded = false;

    const result = await boardRef.transaction((board) => {
        rejection = undefined;
        // A cold RTDB client invokes this callback with a null local cache
        // before the server value arrives. Keep the transaction queued so the
        // stale hash is retried with authoritative board data.
        if (board === null) return null;

        boardLoaded = true;
        if (board.status !== "Available") {
            rejection = "Board is unavailable";
            return;
        }

        const player = board.players?.[playerId];
        if (!player || typeof player !== "object") {
            rejection = "Player is not on this board";
            return;
        }

        board.rolls = board.rolls && typeof board.rolls === "object" ? board.rolls : {};
        if (board.rolls[roll.audit.rollId]) return board;
        if (player.status === "Out") {
            rejection = "Player is already out";
            return;
        }

        player.dice1 = roll.dice1;
        player.dice2 = roll.dice2;
        if (roll.sum === 7) {
            player.status = "Out";
            player.chip_colour = "error";
            board.outPlayers = Object.values(board.players || {}).filter(
                (candidate) => candidate && typeof candidate === "object" && candidate.status === "Out"
            ).length;
        } else {
            player.score = Number(player.score || 0) + roll.sum;
        }

        board.rolls[roll.audit.rollId] = {
            playerId,
            participantType,
            dice1: roll.dice1,
            dice2: roll.dice2,
            sum: roll.sum,
            ...roll.audit,
        };

        const playerRecords = Object.values(board.players || {}).filter(
            (candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate)
        );
        const allPlayersOut = playerRecords.length > 0 && playerRecords.every(
            (candidate) => String(candidate.status || "").toLowerCase() === "out"
        );

        if (allPlayersOut) {
            const winnerEntry = determineWinner(board.players);
            if (winnerEntry) {
                const [winnerId, winner] = winnerEntry;
                board.winnerIs = {
                    score: Number(winner.score),
                    playerId: winnerId,
                    playerName: winner.userName || "Player",
                    participantType: winner.participantType || "human",
                };
                board.status = "Concluded";
                board.conclusionPending = true;
                board.endedAt = roll.audit.generatedAt || new Date().toISOString();
            }
        }
        return board;
    }, undefined, false);

    if (!result.committed || !boardLoaded) {
        const error = new Error(rejection || "Dice roll transaction was aborted");
        error.code = "ROLL_REJECTED";
        error.status = 409;
        throw error;
    }

    return {message: "Dice roll applied", rollId: roll.audit.rollId};
};

const updatePlayerStatus = async (db, betAmount, boardId, playerId, status) => {
    try{
        // Reference the board location in the database
        const playerRef = db.ref(`boards/live/${betAmount}/${boardId}/players/${playerId}`);
        // Set the data at the specified location
        // Get the current value of "status"
        const snapshot = await playerRef.child("status").once("value");
        const currentStatus = snapshot.val(); // The current value of status
        console.log("Current Status: ", currentStatus);
        
        if(currentStatus !== "Out"){
            await playerRef.child("status").set(status);
            if(status == "Out"){
                // /chip_colour
                await playerRef.child("chip_colour").set("error");
                const boardRef = db.ref(`boards/live/${betAmount}/${boardId}`);
                const outPlayersRef = await boardRef.child("outPlayers");
                // Get the current value of outPlayers
                const currentOutPlayers = (await outPlayersRef.once("value")).val() || 0;
                // Increment the value by 1
                await outPlayersRef.set(currentOutPlayers + 1);
                return;
            }
            console.log('Board details added successfully:', status);
        }

        return { message: 'Board details added successfully' };
    }
    catch(err){
        console.log("updateScore : Error", err);
        throw new Error (err);
    }
};

const createBoard = async (db, userDetails, boardData, uid) => {
    try {
        const betAmount =
        typeof boardData?.bet === "string"
            ? Number(boardData.bet.replace(/[^0-9.-]+/g, ""))
            : Number(boardData?.bet ?? 0);
        // Create a new unique board ID (for example, you can use the current timestamp or a UUID)
        const boardId = db.ref().child(`boards/live/${betAmount}`).push().key; // Generates a unique ID for the new board
        // Add 30 seconds to the current time
        const startTime = helperFunctions.getSouthAfricanTime();
        const closeTime = helperFunctions.getSouthAfricanTime();
        closeTime.setTime(startTime.getTime() + 20 * 1000);
        const endTime = new Date(startTime.getTime() + 60 * 1000);

        // Define the board data structure, including the initial details and user details
        const newBoard = {
            bet: betAmount, // Set the bet from the input data
            players: {
                player1: "player 1",
            },
            stake: 0, // You can set the initial stake value
            status: 'Available', // The initial status of the board
            startsAt: startTime.toISOString(),
            closesAt: closeTime.toISOString(),
            endedAt: endTime.toISOString(),
        };

        // Add the new board to the database under 'boards' with the generated boardId
        await db.ref(`boards/live/${betAmount}/${boardId}`).set(newBoard);


        // Return the newly created board ID as a confirmation
        return { message: 'Board created successfully', boardId };

    } catch (err) {
        console.log("createBoard : Error", err);
        throw new Error(err);
    }
};

const deleteBoard = async (db, betAmount, boardId) => {
  try {
    if (!boardId) {
      throw new Error("Board ID is required to delete a board.");
    }

    // Reference the board path
    const boardRef = db.ref(`boards/live/${betAmount}/${boardId}`);

    // Check if the board exists before deleting
    const snapshot = await boardRef.get();
    if (!snapshot.exists()) {
      console.log(`Board with ID "${boardId}" does not exist.`);
      return { message: "Board not found", boardId };
    }

    // Delete the board
    await boardRef.remove();

    console.log(`Board with ID "${boardId}" has been deleted successfully.`);

    return { message: "Board deleted successfully", boardId };
  } catch (err) {
    console.error("deleteBoard: Error deleting board", err);
    throw new Error(err.message || "Failed to delete board");
  }
};

const deleteExpiredBoard = async (db, betAmount, boardId) => {
  try {
    if (!boardId) {
      throw new Error("Board ID is required to delete a board.");
    }

    // Reference the board path
    const boardRef = db.ref(`expiredBoards/${betAmount}/${boardId}`);

    // Check if the board exists before deleting
    const snapshot = await boardRef.get();
    if (!snapshot.exists()) {
      console.log(`Board with ID "${boardId}" does not exist.`);
      return { message: "Board not found", boardId };
    }

    // Delete the board
    await boardRef.remove();

    console.log(`Board with ID "${boardId}" has been deleted successfully.`);

    return { message: "Board deleted successfully", boardId };
  } catch (err) {
    console.error("deleteBoard: Error deleting board", err);
    throw new Error(err.message || "Failed to delete board");
  }
};


const createExpiredBoard = async (db, board, boardId) => {
    try {
        // Add the new board to the database under 'boards' with the generated boardId
        await db.ref(`boards/expiredBoards/${board.bet}/${boardId}`).set(board);

        console.log('expired board moved successfully:', boardId);

        // Return the newly created board ID as a confirmation
        return { message: 'Board created successfully', boardId };

    } catch (err) {
        console.log("createBoard : Error", err);
        throw new Error(err);
    }
};

// async function createAutoBoard(db,betAmount) {
// //   const boardId = db.ref().child(`boards/live/${betAmount}`).push().key;


// //   await db.ref(`boards/live/${betAmount}/${boardId}`).set(newBoard);
// //   logger.info(`Created new R${betAmount} board with ID: ${boardId}`);

//     try{
//         const startTime = helperFunctions.getSouthAfricanTime();
//         const closesAt = helperFunctions.getSouthAfricanTime();
//         // startTime.setSeconds(startTime.getSeconds() + 60); // Start in 30s
//         closesAt.setSeconds(startTime.getSeconds() + 15); // Start in 30s
//         // End time = start time + 60 seconds (1 minute)
//         const endTime = new Date(startTime.getTime() + 60 * 1000);

//         const newBoard = {
//             bet: betAmount,
//             players: {
//                 player1: "player 1"
//             },
//             stake: 0,
//             status: "Available",
//             startsAt: startTime.toISOString(),
//             endedAt: endTime.toISOString(),
//             closesAt: closesAt.toISOString()
//         };
//         const boardId = db.ref().child(`boards/live/${betAmount}`).push().key;
//         await db.ref(`boards/live/${betAmount}/${boardId}`).set(newBoard);
//         console.log('New board created successfully:', newBoard);
//         return { message: 'Board created successfully', boardId };
//     }
//     catch(err){
//         console.log("createAutoBoard : Error", err);
//         throw new Error(err);
//     }   
// }


async function createAutoBoard(db, betAmount) {
  try {
    if (!db) throw new Error("Database instance is required");
    if (!Number.isFinite(Number(betAmount))) {
      throw new Error("Invalid betAmount");
    }

    const startTime = helperFunctions.getSouthAfricanTime(); // Date
    const startMs = startTime.getTime();

    const closesAt = new Date(startMs + 20 * 1000); // 20 seconds after start
    const endsAt = new Date(startMs + 60 * 1000);   // 1 minute after start

    const boardId = db.ref(`boards/live/${betAmount}`).push().key;
    if (!boardId) throw new Error("Failed to generate boardId");

    const newBoard = {
      bet: betAmount,
      players: {
        player1: "player 1"
      },
      stake: 0,
      status: "Available",
      startsAt: new Date(startMs).toISOString(),
      closesAt: closesAt.toISOString(),
      endedAt: endsAt.toISOString()
    };

    await db
      .ref(`boards/live/${betAmount}/${boardId}`)
      .set(newBoard);

    console.log(`New board created successfully [R${betAmount}]`, boardId);

    return {
      success: true,
      message: "Board created successfully",
      boardId
    };
  } catch (err) {
    console.error("createAutoBoard failed", {
      betAmount,
      error: err
    });
    throw err; // preserve original stack trace
  }
}


const updateWinner = async (db, betAmount, boardId, userDetails) => {
  try {
    // ---- Input validation ----
    if (!db) throw new Error("Database instance is required");
    if (!betAmount) throw new Error("betAmount is required");
    if (!boardId) throw new Error("boardId is required");
    if (!userDetails || typeof userDetails !== "object") {
      throw new Error("userDetails must be a valid object");
    }

    const boardPath = `boards/live/${betAmount}/${boardId}`;
    const boardRef = db.ref(boardPath);

    // ---- Atomic update (prevents partial writes) ----
    const updatePayload = {
      winnerIs: userDetails,
      status: "Concluded",
      endedAt: getSouthAfricanTime(),
    };

    await boardRef.update(updatePayload);

    return {
      success: true,
      message: "Board concluded and winner saved",
      boardId,
      betAmount,
    };
  } catch (err) {
    console.error("updateWinner failed", {
      betAmount,
      boardId,
      userDetails,
      error: err,
    });
    // Preserve original error message
    throw err;
  }
};


const updateUserWallet = async (db, userId, newBalance, winnings, currentBalance) => {
    try {
        if (!db) throw new Error("Database instance is required");
        if (!userId) throw new Error("userId is required");
        if (typeof newBalance !== "number" || isNaN(newBalance)) {
            throw new Error("newBalance must be a valid number");
        }       
        const userWalletRef = db.ref(`users/${userId}/wallet`);
        const updatedAt = helperFunctions.getSouthAfricanTime();
        await userWalletRef.update({    
            balance: newBalance,
            updatedAt: updatedAt
        });

        return {
            success: true,
            message: "User wallet updated successfully",
            userId,
            newBalance
        };
    } catch (err) {
        console.error("updateUserWallet failed", {
            userId,
            newBalance,
            error: err
        });
        throw err; // preserve original stack trace
    }   
};

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

module.exports = {
    getBoardDetails,
    addPayerToBoard,
    createUserDetails,
    getUserDetails,
    updateScore,
    applyDiceRoll,
    updatePlayerStatus,
    getAvailableBoards,
    getAvailableBoardsAmountBased,
    createBoard,
    updateWinner,
    deleteBoard,
    createExpiredBoard,
    createAutoBoard,
    deleteExpiredBoard,
    getExpiredBoards,
    getAvailableBoardsByPrice,
    updateUserDetails,
    updateUserWallet,
    updateUserGameCount
}
