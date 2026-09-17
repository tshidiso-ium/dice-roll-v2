import React, { useEffect, useRef, useState } from "react";
import Dice from "react-dice-roll";
import "./home.css";
import { database } from "../../modules/firebase";
import { ref, onValue, off } from "firebase/database";
import { getUserId } from "../../modules/sessionStorage";
import { apiRequest } from "../../modules/apiClient";

export default function DiceRoller() {
  const [userData, setUserData] = useState("");
  const [dice1, setDice1] = useState(0);
  const [dice2, setDice2] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [rollError, setRollError] = useState("");
  const firstDiceRef = useRef(null);
  const secondDiceRef = useRef(null);

  const userId = getUserId();
  const boardId = localStorage.getItem("joinedBoard");
  const betAmount = localStorage.getItem("betAmount");
  useEffect(() => {
    if (!userId || !boardId || !betAmount) return undefined;
    const userRef = ref(
      database,
      `boards/live/${betAmount}/${boardId}/players/${userId}`
    );
    const handleDataChange = (snapshot) => {
      const value = snapshot.val();
      setUserData(value);
      setDice1(value?.dice1);
      setDice2(value?.dice2);
    };
    onValue(userRef, handleDataChange);

    return () => {
      off(userRef, "value", handleDataChange);
    };
  }, [betAmount, boardId, userId]);

  useEffect(() => {
    const hasServerResult = [dice1, dice2].every((value) => {
      const result = Number(value);
      return Number.isInteger(result) && result >= 1 && result <= 6;
    });

    if (hasServerResult) {
      firstDiceRef.current?.rollDice();
      secondDiceRef.current?.rollDice();
    }
  }, [dice1, dice2]);

  const rollDice = async () => {
    if (rolling || !isRollingState) return;
    setRolling(true);
    setRollError("");

    if (navigator.vibrate) {
      navigator.vibrate([50, 20, 50, 20, 50, 50, 20, 50, 20, 50]);
    }

    try {
      const result = await rollDeDice(boardId, betAmount);
      if (result?.error) setRollError(result.error);
    } finally {
      window.setTimeout(() => {
      setRolling(false);
      }, 1000);
    }
  };

  const safeNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const sum = safeNumber(dice1) + safeNumber(dice2);

  const isOut = String(userData?.status || "").toLowerCase() === "out";
  const isRollingState = String(userData?.status || "").toLowerCase() === "rolling";

  return (
    <section className="relative mt-0 w-full">
      <div
        className={`overflow-hidden bg-transparent transition-all duration-300 ${
          isOut
            ? "border-red-700/30 "
            : "border-yellow-500/20"
        }`}
      >
        {/* top shine */}
        {/* <div
          className={`h-[3px] w-full ${
            isOut
              ? "bg-gradient-to-r from-red-900 via-red-500 to-red-900"
              : "bg-gradient-to-r from-yellow-700 via-yellow-300 to-yellow-700"
          }`}
        /> */}
          <div
            className={`pointer-events-none absolute top-8 flex h-32 w-full justify-evenly p-4 transition ${
              rolling ? "opacity-0" : "animate-floatUp"
            }`}
          >
            <p
              className={`flex justify-center text-7xl font-extrabold drop-shadow-lg  w-32 ${
                isOut
                  ? "text-red-500"
                  : sum === 7
                  ? "text-yellow-400 animate-pulse"
                  : sum === 0
                  ? "text-transparent"
                  : "text-green-500"
              }`}
            >
              +{sum}
            </p>
          </div>


  
        <div className="relative flex flex-wrap items-center justify-center gap-6 px-4 pb-6 pt-2">
          {/* floating result */}

          {/* status text */}
          <div className="w-full text-center mt-2">
            <p
              className={`text-xs font-bold uppercase tracking-[0.18em] ${
                isOut ? "text-red-300" : "text-yellow-300"
              }`}
            >
              {isRollingState ? "Tap the dice to roll" : "You are out"}
            </p>
          </div>

          {/* dice */}
          <div
            role="group"
            aria-label="Dice controls"
            aria-busy={rolling}
            className="z-10 mt-1 flex flex-nowrap gap-6"
            onClick={isRollingState && !rolling ? rollDice : undefined}
          >
            <div
              className={`flex h-32 w-32 flex-col justify-evenly rounded-[24px] border-0 p-4 transition duration-300 ${
                isOut
                  ? "border-red-700/40 bg-gradient-to-b from-red-950/60 to-black opacity-75"
                  : rolling
                  ? "dice-rolling-One"
                  : "border-yellow-500/20"
              }`}
            >
              <Dice
                ref={firstDiceRef}
                cheatValue={safeDiceValue(dice1)}
                size={100}
                triggers={[]}
                disabled={!isRollingState || rolling}
                aria-label="Roll both dice"
              />
            </div>

            <div
              className={`flex h-32 w-32 flex-col justify-evenly rounded-[24px] border-0 p-4 transition duration-300 ${
                isOut
                  ? "border-red-700/40 bg-gradient-to-b from-red-950/60 to-black opacity-75"
                  : rolling
                  ? "dice-rolling-Two "
                  : "border-yellow-500/20"
              }`}
            >
              <Dice
                ref={secondDiceRef}
                cheatValue={safeDiceValue(dice2)}
                size={100}
                triggers={[]}
                disabled={!isRollingState || rolling}
                aria-label="Roll both dice"
              />
            </div>
          </div>

          {rollError && (
            <p role="alert" className="w-full text-center text-sm text-red-300">
              {rollError}
            </p>
          )}

          {/* out notice */}
          {isOut && (
            <div className="mt-4 w-full max-w-md rounded-2xl border border-red-700/30 bg-red-950/40 px-4 py-3 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-300">
                You are out of this round
              </p>
              <p className="mt-1 text-sm text-red-100/70">
                Wait for the next game or rejoin from the lobby.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const VALID_DICE_VALUES = new Set([1, 2, 3, 4, 5, 6]);

function safeDiceValue(value) {
  const normalized = Number(value);
  return Number.isInteger(normalized) && VALID_DICE_VALUES.has(normalized)
    ? normalized
    : undefined;
}

const rollDeDice = async (boardId, betAmount) => {
  try {
    const {data} = await apiRequest("app", "/rollDice", {
      method: "POST",
      includeUserId: true,
      body: {boardId, betAmount},
    });
    return { status: "success", dice: data.data, boardId: data.boardId };
  } catch (err) {
    return {error: err?.message || "Unable to roll the dice right now."};
  }
};
