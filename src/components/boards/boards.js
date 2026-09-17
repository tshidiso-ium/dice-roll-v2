import { useCallback, useEffect, useMemo, useState } from "react";
import { database } from "../../modules/firebase";
import { ref, onValue, off } from "firebase/database";
import BoardGenerator from "../randomBoardGenerator/boardGenerator";
import { BoardCard } from "../boardCards/BoardCard";
import { LoadingBoards } from "../boardCards/LoadingBoards";
import {
  BOARD_JOIN_SAFETY_MS,
  calculateTimeLeft,
} from "../../modules/boardCountdown";
import { apiRequest } from "../../modules/apiClient";

const BET_GROUPS = [5, 10, 40];

const parseBetAmount = (amount) => {
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? amount : 0;
  }

  if (typeof amount === "string") {
    const parsed = Number(amount.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const extractBoardId = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    if (typeof value.boardId === "string") return value.boardId;
    if (typeof value.id === "string") return value.id;
  }

  return null;
};

export default function Boards({ boardJoined, playAgain }) {
  const [boards, setBoards] = useState("");
  const [countdowns, setCountdowns] = useState({});
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [pendingBoardId, setPendingBoardId] = useState(null);
  const [modalState, setStateModal] = useState({
    showModal: false,
    text: "",
    title: "",
    icon: "",
  });

  const showErrorModal = useCallback((message, title = "Something went wrong") => {
    setStateModal({
      showModal: true,
      text: message || "Please try again.",
      title,
      icon: "error",
    });
  }, []);

  const openModal = () => {
    setStateModal({
      showModal: true,
      text: "",
      title: "",
      icon: "",
    });
  };

  const closeModal = useCallback(() => {
    setStateModal({
      showModal: false,
      text: "",
      title: "",
      icon: "",
    });
  }, []);

  useEffect(() => {
    const dataRef = ref(database, "boards/live");

    const handleDataChange = (snapshot) => {
      setBoards(snapshot.val());
    };

    onValue(dataRef, handleDataChange, (error) => {
      console.error("Listener failed:", error);
    });

    return () => {
      off(dataRef, "value", handleDataChange);
    };
  }, []);

  useEffect(() => {
    const offsetRef = ref(database, ".info/serverTimeOffset");
    const handleOffsetChange = (snapshot) => {
      const offset = Number(snapshot.val());
      setServerTimeOffset(Number.isFinite(offset) ? offset : 0);
    };

    onValue(offsetRef, handleOffsetChange, (error) => {
      console.error("Server clock listener failed:", error);
    });

    return () => {
      off(offsetRef, "value", handleOffsetChange);
    };
  }, []);

  const handleJoinBoard = useCallback(async (betAmount, boardId) => {
    if (pendingBoardId) return false;
    setPendingBoardId(boardId);
    try {
      const status = await joinBoard(betAmount, boardId);

      if (status?.error) {
        if (status.code === "BOARD_CLOSED") {
          setBoards((currentBoards) => {
            if (!currentBoards || typeof currentBoards !== "object") return currentBoards;
            const boardsForBet = currentBoards[betAmount];
            if (!boardsForBet?.[boardId]) return currentBoards;

            const remainingBoards = {...boardsForBet};
            delete remainingBoards[boardId];
            return {...currentBoards, [betAmount]: remainingBoards};
          });
          showErrorModal(
            "This board just closed. Please choose another available board.",
            "Board closed"
          );
          return false;
        }

        showErrorModal(status.error, "Unable to join board");
        return false;
      }

      if (status?.status === "success" && status?.boardId) {
        boardJoined(betAmount, status.boardId);
        return true;
      }

      showErrorModal("Unexpected response while joining the board.", "Join failed");
      return false;
    } catch (err) {
      console.error("handleJoinBoard error:", err);
      showErrorModal("A network error occurred while joining the board.", "Join failed");
      return false;
    } finally {
      setPendingBoardId(null);
    }
  }, [boardJoined, pendingBoardId, showErrorModal]);

  useEffect(() => {
    const updateCountdowns = () => {
      if (!boards) return;

      const newCountdowns = {};

      BET_GROUPS.forEach((bet) => {
        Object.entries(boards[bet] || {}).forEach(([roomId, room]) => {
          newCountdowns[roomId] = calculateTimeLeft(
            room.closesAt,
            Date.now() + serverTimeOffset,
            BOARD_JOIN_SAFETY_MS
          );
        });
      });

      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [boards, serverTimeOffset]);

  const joinRandomBoardValue = useCallback(async (amount) => {
    try {
      const normalizedAmount = parseBetAmount(amount);

      if (!normalizedAmount) {
        closeModal();
        return;
      }

      const result = await randomBoardJoin(normalizedAmount);

      if (result?.error) {
        showErrorModal(result.error, "Random board unavailable");
        return;
      }

      if (result?.status !== "success") {
        showErrorModal("Unexpected response from server.", "Random board unavailable");
        return;
      }

      const boardId = extractBoardId(result.boardId);

      if (!boardId) {
        showErrorModal("No board was returned by the server.", "Random board unavailable");
        return;
      }

      const joined = await handleJoinBoard(normalizedAmount, boardId);
      if (joined) {
        localStorage.setItem("joinedBoard", boardId);
        localStorage.setItem("betAmount", String(normalizedAmount));
      }
    } catch (err) {
      console.error("joinRandomBoardValue error:", err);
      showErrorModal(
        "A network error occurred while looking for a random board.",
        "Random board unavailable"
      );
    }
  }, [closeModal, handleJoinBoard, showErrorModal]);

  useEffect(() => {
    if (playAgain) {
      closeModal();
      joinRandomBoardValue(playAgain.betAmount);
    }
  }, [closeModal, joinRandomBoardValue, playAgain]);

  const getValidBoards = (boardsForBet, countdowns) =>
    Object.entries(boardsForBet || {}).filter(
      ([roomId, room]) =>
        room.status === "Available" && Boolean(countdowns[roomId])
    );

  const totalLiveBoards = useMemo(() => {
    return BET_GROUPS.reduce((total, bet) => {
      const boardsForBet = boards?.[bet];
      return total + getValidBoards(boardsForBet, countdowns).length;
    }, 0);
  }, [boards, countdowns]);

  return (
    <>
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.10),transparent_20%),linear-gradient(to_bottom,#220404_0%,#120202_45%,#000000_100%)] text-white">
        <section className="sticky top-0 z-40 border-b border-yellow-500/20 bg-[#120202]/90 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-7xl px-4 py-4">
            <div className="rounded-[28px] border border-yellow-500/20 bg-gradient-to-r from-[#3b0505] via-[#220404] to-[#120202] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-yellow-500/70">
                    Lobby
                  </p>
                  <h1 className="mt-1 text-xl font-extrabold tracking-tight text-yellow-100 md:text-3xl">
                    Available Boards
                  </h1>
                  <p className="mt-1 max-w-xl text-xs leading-6 text-yellow-100/70">
                    Join a live table, choose your stake, and get back into the
                    action.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="rounded-2xl border border-yellow-500/20 bg-black/25 px-4 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-500/70">
                      Live now
                    </p>
                    <p className="mt-1 text-xl font-extrabold text-yellow-100 flex justify-center">
                      {totalLiveBoards}
                    </p>
                  </div>
                  <button
                    onClick={openModal}
                    className="group relative overflow-hidden rounded-2xl border border-yellow-400/30 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#2b1200] shadow-[0_10px_30px_rgba(250,204,21,0.25)] transition hover:-translate-y-[1px] hover:brightness-105"
                  >
                    <span className="relative z-10">🎲 Random Board</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BoardGenerator
          modalState={modalState}
          joinRandomBoard={joinRandomBoardValue}
        />

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6">
          {BET_GROUPS.map((bet) => {
            const boardsForBet = boards?.[bet];

            if (!boardsForBet) {
              return (
                <section
                  key={bet}
                  className="rounded-[28px] border border-yellow-500/15 bg-white/[0.03] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.28)]"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-300/70">
                        Stake Group
                      </p>
                      <h2 className="mt-1 text-2xl font-extrabold text-yellow-100">
                        R{bet} Boards
                      </h2>
                    </div>

                    <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-300">
                      Loading
                    </div>
                  </div>

                  <LoadingBoards />
                </section>
              );
            }

            const validBoards = getValidBoards(boardsForBet, countdowns);

            return (
              <section
                key={bet}
                className="rounded-[28px] border border-yellow-500/15 bg-white/[0.03] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.28)]"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-300/70">
                      Stake Group
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold text-yellow-100">
                      💰 R{bet} Boards
                    </h2>
                  </div>

                  <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-300">
                    {validBoards.length} Live
                  </div>
                </div>

                {validBoards.length === 0 ? (
                  <div className="rounded-2xl border border-red-500/15 bg-gradient-to-b from-red-950/40 to-black/30 p-4">
                    <LoadingBoards />
                  </div>
                ) : (
                  <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
                    {validBoards.map(([roomId, room]) => (
                      <div
                        key={roomId}
                        className={`transition-all duration-500 ease-in-out ${
                          countdowns[roomId]
                            ? "translate-y-0 scale-100 opacity-100"
                            : "pointer-events-none translate-y-2 scale-95 opacity-0"
                        }`}
                      >
                        <BoardCard
                          roomId={roomId}
                          room={room}
                          countdowns={countdowns}
                          handleJoinBoard={handleJoinBoard}
                          joining={pendingBoardId === roomId}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </main>
      </div>
    </>
  );
};

const joinBoard = async (betAmount, boardId) => {
  try {
    const {data} = await apiRequest("app", "/joinBoard", {
      method: "POST",
      includeUserId: true,
      body: {boardId, betAmount},
    });

    return {
      status: "success",
      boardId: data?.boardId ?? boardId,
    };
  } catch (err) {
    return {
      error: err?.message || "A network error occurred while joining the board.",
      code: err?.code,
      statusCode: err?.status,
    };
  }
};

const randomBoardJoin = async (betAmount) => {
  try {
    const {data} = await apiRequest("app", "/randomBoardJoin", {
      method: "POST",
      includeUserId: true,
      body: {betAmount},
    });

    return {
      status: "success",
      boardId: data?.data ?? null,
    };
  } catch (err) {
    return { error: err?.message || "A network error occurred while finding a random board." };
  }
};
