import React, { useState, useEffect, useMemo, useRef } from "react";
import Avatar from "@mui/material/Avatar";
import { database } from "../../modules/firebase";
import { ref, onValue, off } from "firebase/database";

const Playersboard = () => {
  const [data, setData] = useState(null);
  const [players, setPlayers] = useState({});
  const [showJumpToMe, setShowJumpToMe] = useState(false);

  const userId = localStorage.getItem("userId");
  const boardId = localStorage.getItem("joinedBoard");
  const betAmount = localStorage.getItem("betAmount");

  const leaderboardContainerRef = useRef(null);
  const currentUserRowRef = useRef(null);

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
        ([, player]) => Object.prototype.hasOwnProperty.call(player || {}, "bet")
      );
      setPlayers(Object.fromEntries(filteredPlayers));
    } else {
      setPlayers({});
    }
  }, [data]);

  const sortedEntries = useMemo(() => {
    return Object.entries(players).sort(
      ([, memberA], [, memberB]) => (memberB?.score || 0) - (memberA?.score || 0)
    );
  }, [players]);

  const currentUserEntry = useMemo(() => {
    const index = sortedEntries.findIndex(([key]) => key === userId);
    if (index === -1) return null;

    const [key, member] = sortedEntries[index];
    return { key, member, index };
  }, [sortedEntries, userId]);

  useEffect(() => {
    if (!currentUserEntry || !leaderboardContainerRef.current || !currentUserRowRef.current) {
      setShowJumpToMe(false);
      return;
    }

    const container = leaderboardContainerRef.current;
    const row = currentUserRowRef.current;

    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();

    const rowAbove = rowRect.top < containerRect.top;
    const rowBelow = rowRect.bottom > containerRect.bottom;

    setShowJumpToMe(rowAbove || rowBelow);
  }, [sortedEntries, currentUserEntry]);

  const scrollToCurrentUser = () => {
    if (currentUserRowRef.current) {
      currentUserRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

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

    if (value.includes("active") || value.includes("playing") || value.includes("rolling")) {
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
      return "border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 via-red-800/25 to-black shadow-[0_8px_20px_rgba(250,204,21,0.12)]";
    }

    return "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]";
  };

  return (
    <section className="text-white">
      <div className="overflow-hidden border-yellow-500/20 bg-gradient-to-b from-[#2a0505] via-[#140909] to-black shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-yellow-500/10 px-4 py-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-yellow-500/70">
              Live Leaderboard
            </p>
          </div>

          {currentUserEntry && showJumpToMe && (
            <button
              type="button"
              onClick={scrollToCurrentUser}
              className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-yellow-200 transition hover:bg-yellow-500/20"
            >
              Jump to Me
            </button>
          )}
        </div>

        {currentUserEntry && (
          <div className="border-b border-yellow-500/10 bg-yellow-500/10 px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-yellow-300/80">
              Your Position
            </p>

            <div className="mt-2 grid grid-cols-12 items-center rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-500/10 via-yellow-400/5 to-transparent px-3 py-2 shadow-[0_0_0_1px_rgba(250,204,21,0.06)]">
              <div className="col-span-2 flex justify-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-500/15 text-xs font-extrabold text-yellow-200">
                  {currentUserEntry.index + 1}
                </div>
              </div>

              <div className="col-span-5 flex min-w-0 items-center gap-2">
                <div className="rounded-full border border-yellow-400/40 p-[2px]">
                  <Avatar
                    alt={currentUserEntry.member?.userName || "You"}
                    src={currentUserEntry.member?.picture}
                    sx={{ width: 28, height: 28 }}
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-yellow-100">
                    {currentUserEntry.member?.userName || "You"}
                  </p>
                  <p className="truncate text-[9px] uppercase tracking-wide text-yellow-300/70">
                    You
                  </p>
                </div>
              </div>

              <div className="col-span-2 text-center">
                <div className="inline-flex min-w-[22px] items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-500/15 px-2 py-2 text-[9px] font-extrabold text-yellow-100">
                  {currentUserEntry.member?.score ?? 0}
                </div>
              </div>

              <div className="col-span-3 flex justify-center">
                {(() => {
                  const tone = getStatusTone(currentUserEntry.member?.status);
                  return (
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-wide ${tone.border} ${tone.bg} ${tone.text}`}
                    >
                      {currentUserEntry.member?.status || "Pending"}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 border-b border-yellow-500/10 bg-black/20 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-yellow-400/80">
          <div className="col-span-2 text-center">Pos</div>
          <div className="col-span-5">Player</div>
          <div className="col-span-2 text-center">Score</div>
          <div className="col-span-3 text-center">Status</div>
        </div>

        <div ref={leaderboardContainerRef} className="max-h-[192px] lg:max-h-[400px] overflow-y-auto p-1">
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
                    ref={isCurrentUser ? currentUserRowRef : null}
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
                            : isCurrentUser
                            ? "border-yellow-400/40 bg-yellow-500/15 text-yellow-100"
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
                              : isCurrentUser
                              ? "border-yellow-400/50"
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
                              : isCurrentUser
                              ? "text-yellow-300/80"
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
                            : isCurrentUser
                            ? "border-yellow-400/40 bg-yellow-500/15 text-yellow-100"
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