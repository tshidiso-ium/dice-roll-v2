import React, { useEffect, useState, useRef } from "react";
import Dice from "react-dice-roll";
import "./home.css";
import { database } from "../../modules/firebase";
import { ref, onValue, off } from "firebase/database";

export default function DiceRoller({ updateMyScore }) {
  const [userData, setUserData] = useState("");
  const [dice1, setDice1] = useState(0);
  const [dice2, setDice2] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [canVibrate, setCanVibrate] = useState("");

  const diceRef = useRef(null);
  const diceRef2 = useRef(null);

  const userId = localStorage.getItem("userId");
  const boardId = localStorage.getItem("joinedBoard");
  const betAmount = localStorage.getItem("betAmount");
  const userRef = ref(
    database,
    `boards/live/${betAmount}/${boardId}/players/${userId}`
  );

  useEffect(() => {
    const unsubscribe = getScore();

    if ("vibrate" in navigator) {
      setCanVibrate("Vibration API supported");
    } else {
      setCanVibrate("Vibration API not supported");
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userData && userData.status === "Rolling") {
      diceRef.current?.rollDice();
      diceRef2.current?.rollDice();
      updateMyScore(dice1 + dice2);
    } else if (userData && userData.status === "Out") {
      diceRef.current?.rollDice();
      diceRef2.current?.rollDice();
    }
  }, [dice1, dice2]);

  const rollDice = async () => {
    await rollDeDice(boardId, betAmount);

    if (diceRef.current && diceRef2.current) {
      setRolling(true);
    }

    if (navigator.vibrate) {
      navigator.vibrate([50, 20, 50, 20, 50, 50, 20, 50, 20, 50]);
    }

    setTimeout(() => {
      setRolling(false);
    }, 1000);
  };

  const getScore = () => {
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
                ref={diceRef2}
                cheatValue={dice1}
                size={100}
                triggers={rolling || isOut ? [] : ["click"]}
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
                ref={diceRef}
                cheatValue={dice2}
                size={100}
                triggers={rolling || isOut ? [] : ["click"]}
              />
            </div>
          </div>

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

const rollDeDice = async (boardId, betAmount) => {
  try {
    const userId = localStorage.getItem("userID");
    const idToken = localStorage.getItem("idToken");
    const url = new URL("https://app-2wtihj5jvq-uc.a.run.app/rollDice");

    url.searchParams.append("userId", userId);

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        boardId: boardId,
        betAmount: betAmount,
      }),
    });

    if (res.status === 401 || res.status === 404) {
      const data = await res.json();
      return { error: data.message };
    } else if (res.status === 200) {
      const data = await res.json();
      return { status: "success", dice: data.data, boardId: data.boardId };
    }

    return { data: "hello World" };
  } catch (err) {
    console.log("New User createUser: Error");
    console.log(err);
    throw new Error(err);
  }
};