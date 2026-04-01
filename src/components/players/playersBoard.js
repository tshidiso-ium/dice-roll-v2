import React, { useState, useEffect, useMemo } from "react";
import Avatar from "@mui/material/Avatar";
import { database } from "../../modules/firebase";
import { ref, onValue, off } from "firebase/database";

const Playersboard = () => {
  const [data, setData] = useState(null);
  const [players, setPlayers] = useState({});

  const userId = localStorage.getItem("userId");
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
    if (data?.players) {
      const filteredPlayers = Object.entries(data.players).filter(
        ([, player]) => player?.hasOwnProperty("bet")
      );
      setPlayers(Object.fromEntries(filteredPlayers));
    }
  }, [data]);

  const sortedEntries = useMemo(() => {
    return Object.entries(players).sort(
      ([, memberA], [, memberB]) => (memberB?.score || 0) - (memberA?.score || 0)
    );
  }, [players]);

  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  const isPlayerOut = (status) => {
    const value = String(status || "").toLowerCase();
    return (
      value.includes("out") ||
      value.includes("eliminated") ||
      value.includes("busted") ||
      value.includes("knocked")
    );
  };

  const getStatusTone = (status) => {
    const value = String(status || "").toLowerCase();

    if (isPlayerOut(value)) {
      return {
        border: "border-red-700/40",
        bg: "bg-red-950/60",
        text: "text-red-200",
      };
    }

    if (value.includes("winner") || value.includes("leading")) {
      return {
        border: "border-yellow-500/30",
        bg: "bg-yellow-500/10",
        text: "text-yellow-300",
      };
    }

    if (value.includes("active") || value.includes("playing")) {
      return {
        border: "border-red-500/30",
        bg: "bg-red-500/10",
        text: "text-red-200",
      };
    }

    return {
      border: "border-white/10",
      bg: "bg-white/[0.04]",
      text: "text-white/70",
    };
  };

  const getRowTone = (member, key) => {
    const out = isPlayerOut(member?.status);
    const isCurrentUser = key === userId;

    if (out) {
      return "border-red-800/40 bg-gradient-to-r from-red-950 via-[#2a0505] to-black text-red-100 opacity-80";
    }

    if (isCurrentUser) {
      return "border-yellow-400/30 bg-gradient-to-r from-yellow-500/12 via-red-800/25 to-black shadow-[0_8px_20px_rgba(250,204,21,0.08)]";
    }

    return "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]";
  };

  return (
    <section className=" text-white ">
      <div className="overflow-hidden  border-yellow-500/20 bg-gradient-to-b from-[#2a0505] via-[#140909] to-black shadow-[0_18px_45px_rgba(0,0,0,0.45)]">

        <div className="flex items-center justify-between border-b border-yellow-500/10 px-4 py-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-yellow-500/70">
              Live Leaderboard
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-yellow-500/10 bg-black/20 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-yellow-400/80">
          <div className="col-span-2 text-center">Pos</div>
          <div className="col-span-5">Player</div>
          <div className="col-span-2 text-center">Score</div>
          <div className="col-span-3 text-center">Status</div>
        </div>

        <div className="p-1">
          {sortedEntries.length > 0 ? (
            <div className="space-y-2">
              {sortedEntries.map(([key, member], index) => {
                const medal = getMedal(index);
                const isCurrentUser = key === userId;
                const tone = getStatusTone(member?.status);
                const out = isPlayerOut(member?.status);

                return (
                  <div
                    key={key}
                    className={`grid grid-cols-12 items-center rounded-2xl border px-3 py-1 transition ${getRowTone(
                      member,
                      key
                    )}`}
                  >
                    <div className="col-span-2 flex items-center justify-center">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-sm font-extrabold ${
                          out
                            ? "border-red-700/40 bg-red-900/40 text-red-200"
                            : index === 0
                            ? "border-yellow-400/30 bg-yellow-500/15 text-yellow-300"
                            : index === 1
                            ? "border-white/20 bg-white/10 text-white"
                            : index === 2
                            ? "border-amber-700/30 bg-amber-700/15 text-amber-300"
                            : "border-white/10 bg-white/[0.04] text-white/80"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    <div className="col-span-5 flex min-w-0 items-center gap-2">
                      <div className="relative">
                        <div
                          className={`rounded-full border p-[2px] ${
                            out
                              ? "border-red-700/40"
                              : "border-yellow-400/30"
                          }`}
                        >
                          <Avatar
                            alt={member?.userName || "Player"}
                            src={member?.picture}
                            sx={{ width: 24, height: 24 }}
                          />
                        </div>
                        {medal && !out && (
                          <span className="absolute -bottom-1 -right-1 text-sm">
                            {medal}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-xs font-bold ${
                            out
                              ? "text-red-200"
                              : isCurrentUser
                              ? "text-yellow-100"
                              : "text-white"
                          }`}
                        >
                          {member?.userName || "Unknown Player"}
                        </p>
                        <p
                          className={`truncate text-[9px] uppercase tracking-wide ${
                            out
                              ? "text-red-300/70"
                              : "text-yellow-400/60"
                          }`}
                        >
                          {out ? "Out" : isCurrentUser ? "You" : "Player"}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 text-center">
                      <div
                        className={`inline-flex min-w-[22px] items-center justify-center rounded-xl border px-2 py-2 text-[9px] font-extrabold ${
                          out
                            ? "border-red-700/40 bg-red-950/50 text-red-200"
                            : "border-red-500/20 bg-red-500/10 text-red-100"
                        }`}
                      >
                        {member?.score ?? 0}
                      </div>
                    </div>

                    <div className="col-span-3 flex justify-center">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-wide ${tone.border} ${tone.bg} ${tone.text}`}
                      >
                        {member?.status || "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400/70">
                Waiting for players
              </p>
              <p className="mt-2 text-xs text-white/60">
                Live player entries will appear here as soon as the table updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Playersboard;