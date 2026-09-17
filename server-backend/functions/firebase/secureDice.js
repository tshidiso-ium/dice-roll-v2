const crypto = require("crypto");

const RNG_ALGORITHM = "SHA-256/rejection-sampling-v1";
const SIGNATURE_ALGORITHM = "HMAC-SHA-256";
const ACCEPTABLE_BYTE_LIMIT = 252; // Largest multiple of six below 256.
const MINIMUM_AUDIT_SECRET_BYTES = 32;

const buildContext = ({ betAmount, boardId, playerId, rollId, generatedAt }) =>
  [
    "dice-roll-v1",
    String(betAmount),
    String(boardId),
    String(playerId),
    rollId,
    generatedAt,
  ].join("|");

const deriveDice = (entropy, context) => {
  const dice = [];
  let counter = 0;

  while (dice.length < 2) {
    const digest = crypto
      .createHash("sha256")
      .update(`${context}|${entropy}|${counter}`)
      .digest();

    for (const byte of digest) {
      // Rejection sampling avoids the modulo bias produced by 256 % 6.
      if (byte < ACCEPTABLE_BYTE_LIMIT) {
        dice.push((byte % 6) + 1);
        if (dice.length === 2) break;
      }
    }

    counter += 1;
  }

  return dice;
};

const getAuditSecret = (auditSecret = process.env.DICE_AUDIT_SECRET) => {
  if (
    typeof auditSecret !== "string" ||
    Buffer.byteLength(auditSecret, "utf8") < MINIMUM_AUDIT_SECRET_BYTES
  ) {
    throw new Error(
      "DICE_AUDIT_SECRET must contain at least 32 bytes before dice rolls are enabled"
    );
  }

  return auditSecret;
};

const createProofHash = ({ context, entropy, dice1, dice2, auditSecret }) =>
  crypto
    .createHmac("sha256", getAuditSecret(auditSecret))
    .update(`${RNG_ALGORITHM}|${context}|${entropy}|${dice1}|${dice2}`)
    .digest("hex");

const createSecureDiceRoll = ({ betAmount, boardId, playerId, auditSecret }) => {
  if (betAmount === undefined || !boardId || !playerId) {
    throw new Error("betAmount, boardId and playerId are required for a dice roll");
  }

  const rollId = crypto.randomUUID();
  const generatedAt = new Date().toISOString();
  const entropy = crypto.randomBytes(32).toString("hex");
  const context = buildContext({
    betAmount,
    boardId,
    playerId,
    rollId,
    generatedAt,
  });
  const [dice1, dice2] = deriveDice(entropy, context);
  const proofHash = createProofHash({
    context,
    entropy,
    dice1,
    dice2,
    auditSecret,
  });

  return {
    dice1,
    dice2,
    sum: dice1 + dice2,
    audit: {
      rollId,
      algorithm: RNG_ALGORITHM,
      signatureAlgorithm: SIGNATURE_ALGORITHM,
      generatedAt,
      context,
      entropy,
      proofHash,
    },
  };
};

const verifySecureDiceRoll = (roll, auditSecret) => {
  if (
    !roll?.audit ||
    roll.audit.algorithm !== RNG_ALGORITHM ||
    roll.audit.signatureAlgorithm !== SIGNATURE_ALGORITHM
  ) {
    return false;
  }

  const [expectedDice1, expectedDice2] = deriveDice(
    roll.audit.entropy,
    roll.audit.context
  );
  const expectedProofHash = createProofHash({
    context: roll.audit.context,
    entropy: roll.audit.entropy,
    dice1: roll.dice1,
    dice2: roll.dice2,
    auditSecret,
  });

  const suppliedProofHash = Buffer.from(roll.audit.proofHash, "hex");
  const calculatedProofHash = Buffer.from(expectedProofHash, "hex");
  const proofMatches =
    suppliedProofHash.length === calculatedProofHash.length &&
    crypto.timingSafeEqual(suppliedProofHash, calculatedProofHash);

  return (
    roll.dice1 === expectedDice1 &&
    roll.dice2 === expectedDice2 &&
    roll.sum === expectedDice1 + expectedDice2 &&
    proofMatches
  );
};

module.exports = {
  createSecureDiceRoll,
  verifySecureDiceRoll,
};
