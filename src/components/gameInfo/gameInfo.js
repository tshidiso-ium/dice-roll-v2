import { useEffect, useState } from "react";
import { database } from "../../modules/firebase";
import { ref, onValue, off } from "firebase/database";

export default function GameInfo({ myScore }) {
  const [data, setData] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const boardId = localStorage.getItem("joinedBoard");
  const betAmount = localStorage.getItem("betAmount");

  useEffect(() => {
    if (!betAmount || !boardId) return;

    const dataRef = ref(database, `boards/live/${betAmount}/${boardId}`);

    const handleDataChange = (snapshot) => {
      setData(snapshot.val());
    };

    onValue(dataRef, handleDataChange);

    return () => {
      off(dataRef, "value", handleDataChange);
    };
  }, [betAmount, boardId]);

  useEffect(() => {
    if (data) {
      setGameInfo(data);
      const user = data.players || {};
      const id = localStorage.getItem("userId");
      setUserInfo(getDataById(user, id));
    }
  }, [data]);

  const getDataById = (players, id) => {
    return players?.[id] || null;
  };

  const totalStake =
    gameInfo && userInfo
      ? Object.entries(gameInfo.players || {}).length * Number(userInfo.bet || 0)
      : 0;

  return (
    <div className="sticky top-0 z-30 w-full border-yellow-500/20 bg-[#120202]/95 backdrop-blur-xl">
      <div className="mx-auto w-full px-0 py-0">
        <div className="overflow-hidden  border-yellow-500/20 bg-gradient-to-r from-[#2a0505] via-[#140909] to-black">
          {/* top shine */}
          <div className="h-[3px] w-full bg-gradient-to-r from-yellow-700 via-yellow-300 to-yellow-700" />

          {/* header */}
          <div className="flex items-center justify-between px-4 pt-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-yellow-500/70">
                Live Table
              </p>
              <h2 className="mt-1 text-xs font-extrabold uppercase tracking-wide text-yellow-100">
                Current Game Info
              </h2>
            </div>

            <div className="rounded-full flex justify-center border border-red-500/20 bg-red-600/10 p-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-red-300">
                Live
              </span>
            </div>
          </div>

          {/* content */}
          {gameInfo && userInfo ? (
            <div className="grid grid-cols-3 gap-3 p-2">
              <InfoCard
                label="Score"
                value={userInfo.score ?? 0}
                accent="gold"
              />
              <InfoCard
                label="Bet"
                value={`R${userInfo.bet}`}
                accent="red"
              />
              <InfoCard
                label="Stake"
                value={`R${totalStake}`}
                accent="gold"
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-3">
              <LoadingCard label="Score" />
              <LoadingCard label="Bet" />
              <LoadingCard label="Stake" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, accent = "gold" }) {
  const accentStyles =
    accent === "red"
      ? "border-red-500/20 bg-gradient-to-b from-red-900/40 to-black text-red-100"
      : "border-yellow-500/20 bg-gradient-to-b from-yellow-500/10 to-black text-yellow-100";

  const labelStyles =
    accent === "red" ? "text-red-300/75" : "text-yellow-400/75";

  return (
    <div
      className={`rounded-2xl border p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${accentStyles}`}
    >
      <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${labelStyles}`}>
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

function LoadingCard({ label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
      <div className="mt-3 h-6 animate-pulse rounded-md bg-white/10" />
    </div>
  );
}