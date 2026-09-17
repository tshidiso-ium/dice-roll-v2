/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const {admin} = require('./firebase/admin');
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const {Webhook, WebhookVerificationError} = require("svix");
const {applyDeposit, applyDepositReservation} = require("./domain/paymentTransactions");
const {runRootTransaction} = require("./domain/gameTransactions");
const {
  createRateLimiter,
  requestContext,
  safeErrorResponse,
} = require("./http/requestSafety");

const payments = express();
payments.disable("x-powered-by");
payments.use(requestContext);

const joinRateLimit = createRateLimiter({windowMs: 60_000, max: 10, scope: "join"});
const rollRateLimit = createRateLimiter({windowMs: 10_000, max: 12, scope: "roll"});
const paymentRateLimit = createRateLimiter({windowMs: 60_000, max: 5, scope: "payment"});
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "http://localhost:3000,https://amadice-7e4fe.web.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    const error = new Error("Origin is not allowed");
    error.status = 403;
    return callback(error);
  },
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "Accept"],
  methods: ["GET", "POST"],
  credentials: false,
};

payments.post(
  "/",
  express.raw({type: "application/json"}),
  async (req, res) => {
    try {
      const secret = process.env.YOCO_WEBHOOK_SECRET;
      if (typeof secret !== "string" || secret.length < 32) {
        console.error("Payment webhook secret is unavailable or too short");
        return res.status(503).json({error: "Payment processing is unavailable"});
      }

      const rawPayload = Buffer.isBuffer(req.body) ? req.body : req.rawBody;
      if (!Buffer.isBuffer(rawPayload)) {
        return res.status(400).json({error: "Invalid webhook payload"});
      }

      const event = new Webhook(secret).verify(rawPayload.toString("utf8"), {
        "webhook-id": req.headers["webhook-id"],
        "webhook-timestamp": req.headers["webhook-timestamp"],
        "webhook-signature": req.headers["webhook-signature"],
      });

      if (event.type === "payment.succeeded") {
        const uid = event.payload?.metadata?.uid;
        if (!uid || event.payload?.metadata?.type !== "wallet_topup") {
          return res.status(400).json({error: "Invalid payment metadata"});
        }

        const result = await runRootTransaction(admin.database(), applyDeposit, {
          userId: uid,
          reservationId: event.payload?.metadata?.reservationId,
          providerEventId: event.id,
          amountMinor: Number(event.payload?.amount),
          currency: event.payload?.currency || "ZAR",
          now: Date.now(),
        });
        console.info("Payment webhook processed", {
          type: event.type,
          idempotent: result.idempotent,
        });
      }

      return res.status(200).json({status: "processed"});
    } catch (err) {
      console.error("Payment webhook failed", {
        code: err?.code || "WEBHOOK_ERROR",
        message: err?.message || "Unknown error",
      });
      const status = err instanceof WebhookVerificationError
        ? 400
        : Number(err?.status) || 500;
      return res.status(status).json({
        error: status >= 500 ? "Payment processing failed" : err.message,
      });
    }
  }
);


//var admin = require("firebase-admin");
const app = express();


const firebaseIndex = require('./firebase/controller');
const {onSchedule} = require("firebase-functions/v2/scheduler");
const helperFunctions = require('./helperFunctions/index.js');
const uploader = express();
const Busboy = require("busboy");
uploader.disable("x-powered-by");
uploader.use(requestContext);

//delet this later
// const {admin} = require('./firebase/admin.js');
const firstoreFunctions = require('./firebase/firestoreFuncions.js');
const realtimeFunctions = require('./firebase/realtimeFunctions.js');
const authorizationFunctions = require('./firebase/authorizationFunctions.js');

//production origin https://metrics-577f3.web.app 
app.disable("x-powered-by");
app.use(requestContext);
app.use(express.urlencoded({extended: false, limit: "16kb"}));
app.use(express.json({limit: "32kb"}));
app.use(
  cors(corsOptions)
);

//production origin https://metrics-577f3.web.app 
// payments.use(bodyParser.urlencoded({extended: true}));
// payments.use(bodyParser.json());

payments.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl === "/") {
        req.rawBody = buf;
      }
    },
  })
);

payments.use(
  cors(corsOptions)
);

uploader.use(
  cors({...corsOptions, methods: ["POST"]})
);


const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const diceAuditSecret = defineSecret("DICE_AUDIT_SECRET");
const yocoSecretKey = defineSecret("YOCO_SECRET_KEY");
const yocoWebhookSecret = defineSecret("YOCO_WEBHOOK_SECRET");


const logger = require("firebase-functions/logger");


app.get('/getAllBoaards', async (req, res) => {
  try{
    const { collection } = req.query;
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await firebaseIndex.getCollection(collection, token)
    if(result.error){
      const err = result.error
      switch (err.code) {
        case "auth/id-token-expired":
          // Code to be executed if expression matches value1
            res.status(401).send({"message": "ID token has expired. Please login again"});
          break;
        case "auth/user-not-found":
          // Code to be executed if expression matches value1
            res.status(404).send({"message": "This user does not exist in the database"});
          break;
        default:
          // Code to be executed if expression doesn't match any case
          break;
      }
    }
    else{
      res.status(200).send(result)
    }
  }
  catch(err){
    console.log("app.get('/getAllEmployees): Error")
    console.log(err)
    throw new Error(err);
  }
});

app.post('/createUserProfile', async (req, res) => {
  try{
    const authHeader = req.headers.authorization;
    const { fullName, email } = req.body; // Extract email and role from the request body
    const { userId } = req.query;
    let token; 

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await firebaseIndex.createUserDetails(userId,{ fullName, email }, token);
    if(result.error){
      const err = result.error
      switch (err.code) {
        case "auth/user-already-exists":
          // Code to be executed if expression matches value1
          res.status(404).send({"message": "This user already exists in the database"});
        break;
        default:
          // Code to be executed if expression doesn't match any case
          break;
      }
    }
    else{
      res.status(200).send(result)
    }
  }
  catch(err){
    console.log('SetUserRole: Error');
    console.log(err)
    res.status(500).send({err});
  }
});

app.post('/updateUserProfile', async (req, res) => {
  try{
    const authHeader = req.headers.authorization;
    const { userId } = req.query;
    const { update } = req.body;
    let token; 
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await firebaseIndex.updateUserDetails(userId, update, token);

    if(result.error){
      const err = result.error
      switch (err.code) {
        case "auth/id-token-expired":
          // Code to be executed if expression matches value1
            res.status(401).send({"message": "ID token has expired. Please login again"});
          break;
        case "auth/user-not-found":
          // Code to be executed if expression matches value1
            res.status(404).send({"message": "This user does not exist in the database"});
          break;
        default:
          // Code to be executed if expression doesn't match any case
          break;
      }
    }
    else{
      res.status(200).send(result)
    }
  }
  catch(err){
    console.log("app.post('/updateUserProfile): Error");
    console.log(err);
    res.status(500).send({"message": err});
    throw new Error(err);
  }
})

app.get('/getUserData', async (req, res) => {
  try{
    const { userId } = req.query;
    const authHeader = req.headers.authorization;
    var token ='NO HEADER';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await firebaseIndex.getUserData(userId, token);
    if(result.error){
      const err = result.error
      console.log('getUserData err');
      console.log(err);
      switch (err.code) {
        case "auth/id-token-expired":
          // Code to be executed if expression matches value1
            res.status(401).send({"message": "ID token has expired. Please login again"});
          break;
        case "auth/user-not-found":
          // Code to be executed if expression matches value1
            res.status(404).send({"message": "This user does not exist in the database"});
          break;
        default:
          // Code to be executed if expression doesn't match any case
          break;
      }
    }
    else{
        res.status(200).send(result)
    }
  }
  catch(err){
    console.log("app.get('/getUserData): Error")
    console.log(err)
    res.status(500).send({"message": err});
    throw new Error(err);
  }
});


uploader.post('/uploadProfilePicture', async (req, res) => {
  try {
    const {userId} = req.query;
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({error: 'Unauthorized'});
    }
    const token = authHeader.slice('Bearer '.length);
    const busboy = Busboy({headers: req.headers, limits: {files: 1, fileSize: 2 * 1024 * 1024}});
    let uploadBuffer = null;
    let mimeType = null;

    busboy.on("file", (fieldname, file, info) => {
      if (fieldname !== "avatar" || !["image/jpeg", "image/png", "image/webp"].includes(info.mimeType)) {
        file.resume();
        return;
      }
      mimeType = info.mimeType;
      const chunks = [];
      file.on("data", (data) => chunks.push(data));
      file.on("limit", () => {
        uploadBuffer = null;
        file.resume();
      });
      file.on("end", () => {
        if (!file.truncated) uploadBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", async () => {
      try {
        if (!uploadBuffer) return res.status(400).json({error: "A valid image under 2MB is required"});
        const result = await firebaseIndex.uploadProfilePicture(
          userId,
          uploadBuffer,
          mimeType,
          "avatar",
          token
        );
        return res.status(200).json({result});
      } catch (error) {
        return safeErrorResponse(req, res, error);
      }
    });
    busboy.on("error", (error) => safeErrorResponse(req, res, error));
    busboy.end(req.rawBody);
    return undefined;
  } catch (err) {
    return safeErrorResponse(req, res, err);
  }
});


app.post('/joinBoard', joinRateLimit, async (req, res) => {
  try{
    const { userId } = req.query;
    const { boardId, betAmount } = req.body;
    const authHeader = req.headers.authorization;

    var token ='NO HEADER';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Call function to add the user into a board
    // console.log("Joining board with details: ", { userId, boardId, betAmount, token })
    const result = await firebaseIndex.joindBoard({userId, boardId, betAmount, token});
    const botResult = await firebaseIndex.populateBotsForBoard({
      betAmount,
      boardId,
      bots: testPlayersData(),
    });

    if (botResult?.error) {
      console.warn("Bots could not be populated during join", {
        requestId: req.requestId,
        betAmount: Number(betAmount),
        boardId,
        error: botResult.error,
      });
    }
    return res.status(200).json({data: result, boardId});
  } catch (err) {
    return safeErrorResponse(req, res, err);
  }
});

app.post("/randomBoardJoin", async (req, res) => {
  try {
    const { userId } = req.query;
    const { betAmount } = req.body;
    console.log("betAmount: ", betAmount);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!userId || typeof userId !== "string") {
      return res
        .status(400)
        .json({ status: "error", message: "Missing or invalid userId" });
    }

    if (betAmount === undefined || betAmount === null) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing betAmount" });
    }


    const result = await firebaseIndex.findAvailableBoard({
      userId,
      betAmount,
      token,
    });

    if (result?.error) {
      const message =
        typeof result.error === "string"
          ? result.error
          : result.error?.message || "Unable to find available board";

      const statusCode =
        message === "Unauthorized" || message === "Unauthorized access"
          ? 401
          : message === "Insufficient funds"
          ? 400
          : 500;

      return res.status(statusCode).json({
        status: "error",
        message,
      });
    }

    if (!result?.success || !Array.isArray(result?.boards)) {
      // console.log("Invalid board search response", result);
      return res.status(500).json({
        status: "error",
        message: "Invalid board search response",
      });
    }

    let boardToJoin = null;

    for (const board of result.boards) {
      if (!board || typeof board !== "object") {
        continue;
      }

      const playerCount = Object.keys(board.players || {}).length;

      if (playerCount < 5) {
        boardToJoin = board.id;
        break;
      }

    }

    if (!boardToJoin) {
      const createdBoard = await firebaseIndex.createBoardJoin({
        token,
        bet: betAmount,
      });


      if (!createdBoard) {
        return res.status(500).json({
          status: "error",
          message: "Failed to create board",
        });
      }

      return res.status(200).json({
        status: "success",
        data: createdBoard,
      });
    }

    return res.status(200).json({
      status: "success",
      data: boardToJoin,
    });
  } catch (err) {

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

//  rollDice
app.post('/rollDice', rollRateLimit, async (req, res) => {
  try{

    const { userId } = req.query;
    const { boardId , betAmount} = req.body;
    const authHeader = req.headers.authorization;

    var token ='NO HEADER';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Call function to add the user into a board
    const result = await firebaseIndex.rollDice({userId, betAmount, boardId, token});
    if(result.error || result.Error){
      const message = result.error?.message || result.error || result.Error;
      return res.status(409).json({error: {code: "ROLL_REJECTED", message}, requestId: req.requestId});
      // switch (err.code) {
      //   case "auth/user-already-exists":
      //     // Code to be executed if expression matches value1
      //     res.status(404).send({"message": "This user already exists in the database"});
      //   break;
      //   default:
      //     // Code to be executed if expression doesn't match any case
      //     break;
      // }
    }
    else{
     return res.status(200).send({data: result, boardId: boardId})
    }
  }
  catch(err){
    return safeErrorResponse(req, res, err);
  }
})


// app.get('/deleteCollection', async (req, res) => {
//   try{
//     const { price } = req.query;
//     // const authHeader = req.headers.authorization;
//     // let token;
//     // if (authHeader && authHeader.startsWith('Bearer ')) {
//     //   token = authHeader.split(' ')[1];
//     // } else {
//     //   return res.status(401).json({ error: 'Unauthorized' });
//     // }
//     console.log("deleteNode")
//     console.log("deleteNodeprice", price);
//     const result = await firebaseIndex.deleteNode(`boards/expiredBoards/${price}`);
//     console.log("deleteNode result", result);
//     if(result?.error){
//       const err = result.error
//       switch (err.code) {
//         case "auth/id-token-expired":
//           // Code to be executed if expression matches value1
//             res.status(401).send({"message": "ID token has expired. Please login again"});
//           break;
//         case "auth/user-not-found":
//           // Code to be executed if expression matches value1

//             res.status(404).send({"message": "This user does not exist in the database"});
//           break;
//         default:
//           // Code to be executed if expression doesn't match any case
//           break;
//       }
//     }
//     else{
//       res.status(200).send(result)
//     }
//   }
//   catch(err){
//     console.log("app.get('/getAllEmployees): Error")
//     console.log(err)
//     throw new Error(err);
//   }
// });

// app.get('/createTestBoard', async (req, res) => {
//   try{
//     console.log("createTestBoard")
//     const result = await firebaseIndex.createTestBoard();
    
//       res.status(200).send(result)
//   }
//   catch(err){
//     console.log("app.get('/getAllEmployees): Error")
//     console.log(err)
//     throw new Error(err);
//   }
// });


app.get('/', (req, res) => {
  res.send('Hello World!');
});

exports.app = onRequest({secrets: [diceAuditSecret]}, app);

exports.uploader = onRequest(uploader);

const {onValueCreated, onValueWritten} = require('firebase-functions/v2/database');


const BOT_POPULATION_LOCK_MS = 10 * 60 * 1000;

const claimBotPopulation = async (betAmount, boardId) => {
  const boardRef = admin.database().ref(
    `boards/live/${betAmount}/${boardId}`
  );
  const startedAt = Date.now();

  const boardSnapshot = await boardRef.get();
  const board = boardSnapshot.val();
  if (!board || board.status !== "Available") return false;

  const result = await boardRef.child("botPopulation").transaction((population) => {
    const lockIsFresh = (
      population?.status === "in_progress" &&
      startedAt - Number(population.startedAt) < BOT_POPULATION_LOCK_MS
    );

    if (population?.status === "complete" || lockIsFresh) return;

    return {
      status: "in_progress",
      startedAt,
    };
  }, undefined, false);

  return result.committed;
};

const claimBotPlay = async (betAmount, boardId) => {
  const playRef = admin.database().ref(
    `boards/live/${betAmount}/${boardId}/botPlay`
  );
  const startedAt = Date.now();
  const result = await playRef.transaction((play) => {
    const lockIsFresh = play?.status === "in_progress" &&
      startedAt - Number(play.startedAt) < BOT_POPULATION_LOCK_MS;
    if (play?.status === "complete" || lockIsFresh) return;
    return {status: "in_progress", startedAt};
  }, undefined, false);
  return result.committed;
};

const handlePlayerJoined = (betAmount) => async (event) => {
  const player = event.data.val();
  const {boardId} = event.params;

  if (
    !player ||
    typeof player !== "object" ||
    Array.isArray(player) ||
    player.participantType === "bot"
  ) {
    return;
  }

  const bots = testPlayersData();
  const claimed = await claimBotPopulation(betAmount, boardId);
  if (claimed) {
    const result = await firebaseIndex.addBotsToBoard({
      betAmount,
      boardId,
      bots,
    });

    if (result?.error) {
      console.warn("Bot population was completed by another request", {
        betAmount,
        boardId,
        error: result.error,
      });
    }
  }

  if (!(await claimBotPlay(betAmount, boardId))) return;
  const playRef = admin.database().ref(`boards/live/${betAmount}/${boardId}/botPlay`);
  try {
    await firebaseIndex.botPlay({boardId, players: bots, betAmount});
    await playRef.update({status: "complete", completedAt: Date.now()});
  } catch (error) {
    await playRef.update({
      status: "failed",
      failedAt: Date.now(),
      code: error?.code || "BOT_PLAY_FAILED",
    });
    throw error;
  }
};

const botJoinTriggerOptions = (betAmount) => ({
  ref: `/boards/live/${betAmount}/{boardId}/players/{playerId}`,
  instance: "amadice-7e4fe-default-rtdb",
  region: "us-central1",
  secrets: [diceAuditSecret],
  timeoutSeconds: 540,
});

exports.writeToDatabase5 = onValueCreated(
  botJoinTriggerOptions(5),
  handlePlayerJoined(5)
);


exports.writeToDatabase40 = onValueCreated(
  botJoinTriggerOptions(40),
  handlePlayerJoined(40)
);

exports.writeToDatabase10 = onValueCreated(
  botJoinTriggerOptions(10),
  handlePlayerJoined(10)
);

//trigger changes when outPlayers Increase
exports.determinBoardWinner5 = onValueWritten('/boards/live/5', async (event) => {
    console.log("determinBoardWinner5 event", event);
    const data = event.data;
    // console.log("boards", data);
    // console.log("boards before", data.before._data);
    const boardBefore = Object.entries(data.before._data).map(([key, value]) => {
      return {
        id: key, // Using the key as an identifier
        ...value // Spreading the value properties into the object
      };
    });
    const boardAfter = Object.entries(data.after._data).map(([key, value]) => {
      return {
        id: key, // Using the key as an identifier
        ...value // Spreading the value properties into the object
      };
    });

    const changedBoard = helperFunctions.findChangedBoard(boardBefore, boardAfter);
    if(changedBoard?.players && changedBoard?.outPlayers ){

      // 1️⃣ Count player states
      const { totalPlayers, outPlayers, activePlayers } = firebaseIndex.countGamePlayerFields(changedBoard.players);

      if(outPlayers === totalPlayers){
        // 2️⃣Ensure 10 seconds has passed since game started
        if (!helperFunctions.has10SecondsPassed(changedBoard.startsAt)) {
            console.log("Winner check skipped: 10 seconds has not passed yet");
            determinWinnerAfterSomeTime(event);
          return;
        }

        // 3️⃣ Apply game-end rules
        const shouldConclude =
          outPlayers === totalPlayers || activePlayers <= 1;

        if (!shouldConclude) {
          console.log("Winner check skipped: game still active");
          return;
        }

        // 4️⃣ Determine winner
        console.log("Determining winner…");

        const highestScore = helperFunctions.boardHighestScore(changedBoard.players);
        // console.log(("changedBoard: ", changedBoard));
        await firebaseIndex.writeWinner({
          stakeAmount: (changedBoard.betAmount * totalPlayers),
          betAmount: changedBoard.betAmount,
          boardId: changedBoard.id,
          highScore: highestScore.highestScore,
          highestScorePlayer: highestScore.highestScorePlayer,
          playerName: highestScore.playerName
        });
      }
    }
});

//trigger changes when outPlayers Increase
exports.determinBoardWinner40 = onValueWritten('/boards/live/40', async (event) => {
    const data = event.data;
    // console.log("boards", data);
    // console.log("boards before", data.before._data);
    const boardBefore = Object.entries(data.before._data).map(([key, value]) => {
      return {
        id: key, // Using the key as an identifier
        ...value // Spreading the value properties into the object
      };
    });
    const boardAfter = Object.entries(data.after._data).map(([key, value]) => {
      return {
        id: key, // Using the key as an identifier
        ...value // Spreading the value properties into the object
      };
    });

    const changedBoard = helperFunctions.findChangedBoard(boardBefore, boardAfter);
    if(changedBoard?.players && changedBoard?.outPlayers ){

      // 1️⃣ Count player states
      const { totalPlayers, outPlayers, activePlayers } = firebaseIndex.countGamePlayerFields(changedBoard.players);

      if(outPlayers === totalPlayers){
        // 2️⃣Ensure 10 seconds has passed since game started
        if (!helperFunctions.has10SecondsPassed(changedBoard.startsAt)) {
            console.log("Winner check skipped: 10 seconds has not passed yet");
            determinWinnerAfterSomeTime(event);
          return;
        }

        // 3️⃣ Apply game-end rules
        const shouldConclude =
          outPlayers === totalPlayers || activePlayers <= 1;

        if (!shouldConclude) {
          console.log("Winner check skipped: game still active");
          return;
        }

        // 4️⃣ Determine winner
        console.log("Determining winner…");

        const highestScore = helperFunctions.boardHighestScore(changedBoard.players);
        // console.log(("changedBoard: ", changedBoard));
        await firebaseIndex.writeWinner({
          stakeAmount: (changedBoard.betAmount * totalPlayers),
          betAmount: changedBoard.betAmount,
          boardId: changedBoard.id,
          highScore: highestScore.highestScore,
          highestScorePlayer: highestScore.highestScorePlayer,
          playerName: highestScore.playerName
        });
      }
    }
});


const determinWinnerSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const determinWinnerAfterSomeTime = async (event) => {
  try {
    const data = event.data;

    const beforeData = data.before.val() || {};
    const afterData = data.after.val() || {};

    const boardBefore = Object.entries(beforeData).map(([key, value]) => ({
      id: key,
      ...value,
    }));

    const boardAfter = Object.entries(afterData).map(([key, value]) => ({
      id: key,
      ...value,
    }));

    const changedBoard = helperFunctions.findChangedBoard(boardBefore, boardAfter);

    if (!changedBoard?.id || !changedBoard?.players) {
      console.log("Winner check skipped: invalid changed board");
      return;
    }

    const db = admin.database();
    const maxAttempts = 12; // 12 * 2.5s = 30 seconds max
    const retryDelayMs = 2500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Winner check attempt ${attempt} for board ${changedBoard.id}`);

      const latestBoard = await realtimeFunctions.getBoardDetails(
        db,
        5,
        changedBoard.id
      );

      if (!latestBoard?.players) {
        console.log(`Board ${changedBoard.id} no longer exists or has no players`);
        return;
      }

      if (latestBoard.status === "Concluded" || latestBoard.winnerProcessed === true) {
        console.log(`Winner already processed for board ${changedBoard.id}`);
        return;
      }

      const { totalPlayers, outPlayers, activePlayers } =
        firebaseIndex.countGamePlayerFields(latestBoard.players);

      if (totalPlayers <= 0) {
        console.log(`Winner check skipped: no players on board ${changedBoard.id}`);
        return;
      }

      if (!helperFunctions.has10SecondsPassed(latestBoard.startsAt)) {
        console.log(`Winner check skipped: 10 seconds has not passed for ${changedBoard.id}`);

        if (attempt < maxAttempts) {
          await determinWinnerSleep(retryDelayMs);
          continue;
        }

        return;
      }

      const shouldConclude =
        outPlayers === totalPlayers || activePlayers <= 1;

      if (!shouldConclude) {
        console.log(`Winner check skipped: game still active for ${changedBoard.id}`);

        if (attempt < maxAttempts) {
          await sleep(retryDelayMs);
          continue;
        }

        return;
      }

      console.log(`Determining winner for board ${changedBoard.id}...`);

      const highestScore = helperFunctions.boardHighestScore(latestBoard.players);

      if (!highestScore?.highestScorePlayer) {
        console.log(`No highest score player found for board ${changedBoard.id}`);

        if (attempt < maxAttempts) {
          await sleep(retryDelayMs);
          continue;
        }

        return;
      }

      await firebaseIndex.writeWinner({
        stakeAmount: Number(latestBoard.betAmount ?? 0) * Number(totalPlayers),
        betAmount: Number(latestBoard.betAmount ?? 0),
        boardId: changedBoard.id,
        highScore: highestScore.highestScore,
        highestScorePlayer: highestScore.highestScorePlayer,
        playerName: highestScore.playerName,
      });

      console.log(`Winner determined successfully for board ${changedBoard.id}`);
      return;
    }

    console.log(`Winner was not determined within retry window for board ${changedBoard.id}`);
  } catch (err) {
    console.log("determinWinnerAfterSomeTime error", err);
  }
};

const handleBoardWinner = (betAmount) => async (event) => {
  console.log('handleBoardWinner event', event);
  const boardId = event.params.boardId;
  let board = event.data.after.val();
  if (!board || board.winnerProcessed) return;
  if (board.status === "Concluded" && board.conclusionPending !== true) return;

  let counts = firebaseIndex.countGamePlayerFields(board.players || {});
  if (counts.totalPlayers <= 0 || counts.outPlayers !== counts.totalPlayers) return;

  const minimumEndAt = Date.parse(board.startsAt) + 10_000;
  if (Number.isFinite(minimumEndAt) && Date.now() < minimumEndAt) {
    await determinWinnerSleep(minimumEndAt - Date.now());
    const snapshot = await admin.database().ref(
      `boards/live/${betAmount}/${boardId}`
    ).get();
    board = snapshot.val();
    if (!board || board.status === "Concluded" || board.winnerProcessed) return;
    counts = firebaseIndex.countGamePlayerFields(board.players || {});
    if (counts.totalPlayers <= 0 || counts.outPlayers !== counts.totalPlayers) return;
  }

  const highestScore = helperFunctions.boardHighestScore(board.players);
  if (!highestScore?.highestScorePlayer) return;
  await firebaseIndex.writeWinner({
    betAmount,
    boardId,
    highScore: highestScore.highestScore,
    highestScorePlayer: highestScore.highestScorePlayer,
    playerName: highestScore.playerName,
  });
};

const winnerTriggerOptions = (betAmount) => ({
  ref: `/boards/live/${betAmount}`,
  instance: "amadice-7e4fe-default-rtdb",
  region: "us-central1",
  // Winner settlement is idempotent, so transient database or archive
  // failures can be retried safely instead of leaving a finished game open.
  retry: true,
});

// Per-board triggers avoid reading and diffing every live board on each roll.
// Reassigning these names replaces the legacy broad triggers above.
exports.determinBoardWinner5 = onValueWritten(
  winnerTriggerOptions(5),
  handleBoardWinner(5)
);
exports.determinBoardWinner10 = onValueWritten(
  winnerTriggerOptions(10),
  handleBoardWinner(10)
);
exports.determinBoardWinner40 = onValueWritten(
  winnerTriggerOptions(40),
  handleBoardWinner(40)
);

// const testPlayersData = () => {
//   const players = [
//     {
//       id: "lczXAucJaHToHTee0KXsCJobsv63",
//       bet: 10,
//       chip_colour: "primary",
//       picture: "https://www.rafmuseum.org.uk/images/online_exhibitions/GoeringLG.jpg",
//       position: 0,
//       score: 0,
//       status: "Rolling",
//       userName: "Hermann Göring"
//     },
//     {
//       id: "aFU1XbcdpXP3HW8kbwFbZq2eMV32",
//       bet: 10,
//       chip_colour: "primary",
//       picture: "https://firebasestorage.googleapis.com/v0/b/amadice-7e4fe.appspot.com/o/bots%2FHeinrich_Himmler.jpg?alt=media&token=b9a1696f-e0fb-4303-a22a-f7ed67cdec34",
//       position: 0,
//       score: 0,
//       status: "Rolling",
//       userName: "Heinrich Himmler"
//     },
//     {
//       id: "dxSVaTA9vsQzUc9muH4BmPilSp72",
//       bet: 10,
//       chip_colour: "primary",
//       picture: "https://firebasestorage.googleapis.com/v0/b/amadice-7e4fe.appspot.com/o/bots%2FJoseph_Goebbels.jpg?alt=media&token=59e0a514-fc57-4b3c-9794-386c8f2d4b0a",
//       position: 0,
//       score: 0,
//       status: "Rolling",
//       userName: "Joseph Goebbels"
//     }
//   ]

//   return players;
// };

const testPlayersData = (count = 15) => {
  const ids = [
    "lczXAucJaHToHTee0KXsCJobsv63",
    "aFU1XbcdpXP3HW8kbwFbZq2eMV32",
    "dxSVaTA9vsQzUc9muH4BmPilSp72",
    "qNf2LmR8wYp4ZvK1xHs7TdUcBe95",
    "mJk8QpLs2Vn6XcR4tYh9WuEaDf31",
    "bRt5YpNx7Kq3LmV8cZd1HsWuTe64",
    "vHx3QaLp9Mz6TkR2nYs8DcWeFu27",
    "pLs7XnQ4Vr9TmK2cYh5ZdWuEa81",
    "tYk2LmQ8Vx4RpN7cHs9ZwUdBe36",
    "nVc6XpR2Lm8QyT4hKs1ZdWeFu93",
    "kQw4ZnLp7Xs2VmR9tYh6DcUeBa58",
    "rTm9XvQ3Lp6NkW2cYs4ZhUdBe17",
    "wLp8QrN2Xt5VmK7hYc9ZdEuFa43",
    "xHs5LmQ9Vp3RnT6cYk2ZwUdBe74",
    "zRp2XnL8Qv4TmK6hYs1DcWeFu39",
    "cVn7LpQ5Xt2RmK8yZh4WuDeBa61",
    "uTk4XmQ9Lp6RnV2cYs8ZdWeFb25",
    "yLm3QpX7Vn5RtK2hZc9WuDeBa84",
    "hQs6XpL2Vm8RnT4cYk1ZdWeFu57",
    "eRn9LmQ4Xp7VkT2cYs5ZhUdBa68",
  ];
  const firstNames = [
    "Sipho", "Thabo", "Sibusiso", "Lunga", "Mandla",
    "Themba", "Nkosi", "Bongani", "Anele", "Siyabonga",
    "Teboho", "Katlego", "Kagiso", "Tshepo", "Mpho",
    "Refilwe", "Lesego", "Naledi", "Boitumelo", "Palesa",
    "Ayanda", "Nokuthula", "Zanele", "Lerato", "Nomsa",
    "Nandi", "Thandeka", "Busisiwe", "Khanyisa", "Asanda"
  ];

  const lastNames = [
    "Nkosi", "Dlamini", "Mokoena", "Ndlovu", "Zulu",
    "Khumalo", "Mthembu", "Mabaso", "Sithole", "Mahlangu",
    "Molefe", "Mokoena", "Maseko", "Mokoele", "Tshabalala",
    "Madonsela", "Mokgosi", "Mphahlele", "Baloyi", "Mhlongo",
    "Moletsane", "Mopedi", "Sefako", "Mofokeng", "Mahlasela",
    "Ncube", "Molekoa", "Mabena", "Mogale", "Mthethwa"
  ];

  const chipColours = ["primary", "success", "warning", "danger", "info"];
  const usedNames = new Set();

  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generateUniqueName = () => {
    let fullName = "";

    do {
      fullName = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    } while (usedNames.has(fullName));

    usedNames.add(fullName);
    return fullName;
  };

  const players = Array.from({ length: Math.max(20, count) }, (_, index) => ({
    id: ids[index],
    // bet: 10,
    chip_colour: chipColours[index % chipColours.length],
    picture: `https://i.pravatar.cc/150?img=${(index % 70) + 1}`,
    position: 0,
    score: 0,
    status: "Rolling",
    userName: generateUniqueName(),
  }));

  return players;
};


exports.scheduledBoardCleanup5 = onSchedule("every 2 hours", async (event) => {
  try{
      //"every 1 minutes"
      //every 2 days
      //get boards
      const PRICE_GROUPS = [5];
      const boards  = await firebaseIndex.cronGetAllBoards(PRICE_GROUPS[0]);
      if (!boards || boards.length === 0) {
        logger.info("No boards found.");
        return;
      }
      const boardsToDelete = helperFunctions.returnExpiredBoards(boards);
      await firebaseIndex.deleteBoardsAtomic(5, boardsToDelete);
  }
  catch(err){
      console.log("User cleanup failed", err);
  }
});

exports.scheduledBoardCreation5 = onSchedule("every 1 hours", async (event) => {
  try{
    //"every 1 minutes"
    //get boards
    const PRICE_GROUPS = [5];
    console.log("Starting scheduledBoardCreation...");
    const boards  = await firebaseIndex.cronGetLiveBoards(PRICE_GROUPS[0]);
    //each board has a status, and a start date time
    //create function that will go through each board in the results and determine if the board is concluded or the start time is smaller than the current time
    const availableBoards =  helperFunctions.countAvailableBoards(boards);
    console.log("Checking for available boards...");
    createBoardsWithWaves(PRICE_GROUPS[0], 20 - availableBoards);
    // if(availableBoards < 10){
    //   const boardsNeeded = 5 - availableBoards;
    //   for(let i = availableBoards; i < boardsNeeded; i++){
    //     console.log(`Creating board ${i + 1} of 5...`);
    //     await firebaseIndex.createAutoBoard(PRICE_GROUPS[0]);
    //   }
    // }
  }
  catch(err){
    console.log("User cleanup failed", err);
  }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createBoardsWithWaves = async (price, boardsNeeded) => {
  let created = 0;

  // Wave definitions
  const waves = [
    { count: 5, delayBefore: 0 },
    { count: 5, delayBefore: 20_000 },
    { count: 5, delayBefore: 40_000 },
    { count: 5, delayBefore: 60_000 }
  ];

  for (const wave of waves) {
    if (created >= boardsNeeded) break;

    if (wave.delayBefore > 0) {
      console.log(`Waiting ${wave.delayBefore / 1000}s before next wave...`);
      await sleep(wave.delayBefore);
    }

    const remaining = boardsNeeded - created;
    const toCreate = Math.min(wave.count, remaining);

    for (let i = 0; i < toCreate; i++) {
      console.log(
        `Creating board ${created + 1} of ${boardsNeeded} (R${price})`
      );
      await firebaseIndex.createAutoBoard(price);
      created++;
    }
  }

  console.log(`✅ Finished creating ${created} board(s)`);
};


//  rollDice
payments.post("/createTopUpPayment", paymentRateLimit, async (req, res) => {
  let reservationRef;
  try {
    /* =======================
       AUTHENTICATION
    ======================= */
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    if (decoded.email_verified !== true) {
      return res.status(403).json({error: "Email verification is required"});
    }

    /* =======================
       INPUT VALIDATION
    ======================= */
    const amount = Number(req.body?.amount);

    if (
      !Number.isFinite(amount) ||
      amount < 10 ||
      amount > 100000 ||
      Math.round(amount * 100) !== amount * 100
    ) {
      return res.status(400).json({
        error: "Invalid amount. Deposits must be between R10 and R100,000 with at most two decimals.",
      });
    }

    if (!process.env.YOCO_SECRET_KEY) {
      return res.status(503).json({error: "Payment processing is unavailable"});
    }
    const reservationId = crypto.randomUUID();
    await runRootTransaction(admin.database(), applyDepositReservation, {
      userId: uid,
      reservationId,
      amountMinor: Math.round(amount * 100),
      now: Date.now(),
    });
    reservationRef = admin.database().ref(`paymentReservations/${uid}/${reservationId}`);

    const yocoRes = await fetch(
      "https://payments.yoco.com/api/checkouts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: "ZAR",
          successUrl: process.env.YOCO_SUCCESS_URL,
          cancelUrl: process.env.YOCO_CANCEL_URL,
          metadata: {
            uid,
            type: "wallet_topup",
            reservationId,
          },
        }),
      }
    );

    if (!yocoRes.ok) {
      await reservationRef.update({status: "failed", failedAt: Date.now()});
      console.error("Yoco checkout request failed", {status: yocoRes.status});
      return res.status(500).json({
        error: "Unable to create payment session",
      });
    }

    const yocoData = await yocoRes.json();
    let checkoutUrl;
    try {
      checkoutUrl = new URL(yocoData.redirectUrl);
      if (checkoutUrl.protocol !== "https:") throw new Error("Checkout URL must use HTTPS");
    } catch {
      await reservationRef.update({status: "failed", failedAt: Date.now()});
      const error = new Error("Payment provider returned an invalid checkout URL");
      error.code = "INVALID_PROVIDER_RESPONSE";
      error.status = 502;
      throw error;
    }
    await reservationRef.update({
      status: "awaiting_payment",
      providerCheckoutId: yocoData.id || null,
      checkoutCreatedAt: Date.now(),
    });
    return res.status(200).json({
      checkoutUrl: checkoutUrl.toString(),
    });

  } catch (err) {
    if (reservationRef) {
      await reservationRef.update({status: "failed", failedAt: Date.now()}).catch(() => undefined);
    }
    console.error("Yoco checkout failed", {message: err?.message || "Unknown error"});
    return safeErrorResponse(req, res, err);
  }
});


// Webhook registration is intentionally not exposed over HTTP. Register the
// provider callback once through an authenticated operational process.
exports.payments = onRequest(
  {secrets: [yocoSecretKey, yocoWebhookSecret]},
  payments
);
