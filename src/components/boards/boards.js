import { useEffect, useMemo, useState } from "react";
import { database } from "../../modules/firebase";
import { ref, onValue, off } from "firebase/database";
import BoardGenerator from "../randomBoardGenerator/boardGenerator";
import { BoardCard } from "../boardCards/BoardCard";
import { LoadingBoards } from "../boardCards/LoadingBoards";

const BET_GROUPS = [5, 10];

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
  const [modalState, setStateModal] = useState({
    showModal: false,
    text: "",
    title: "",
    icon: "",
  });

  const showErrorModal = (message, title = "Something went wrong") => {
    setStateModal({
      showModal: true,
      text: message || "Please try again.",
      title,
      icon: "error",
    });
  };

  const openModal = () => {
    setStateModal({
      showModal: true,
      text: "",
      title: "",
      icon: "",
    });
  };
  const closeModal = () => {
    setStateModal({
      showModal: false,
      text: "",
      title: "",
      icon: "",
    });
  };

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

  const handleJoinBoard = async (betAmount, boardId) => {
    try {
      const status = await joinBoard(betAmount, boardId);

      if (status?.error) {
        showErrorModal(status.error, "Unable to join board");
        return;
      }

      if (status?.status === "success" && status?.boardId) {
        boardJoined(betAmount, status.boardId);
        return;
      }

      showErrorModal("Unexpected response while joining the board.", "Join failed");
    } catch (err) {
      console.error("handleJoinBoard error:", err);
      showErrorModal("A network error occurred while joining the board.", "Join failed");
    }
  };

  const getSouthAfricanNow = () =>
    new Date(
      new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg" })
    ).getTime();

  const calculateTimeLeft = (startTime) => {
    const start = new Date(startTime).getTime();
    if (!Number.isFinite(start)) return null;

    const now = getSouthAfricanNow();
    const difference = start - now;

    if (difference <= 7199000) return null;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!boards) return;

      const newCountdowns = {};

      Object.entries(boards[5] || {}).forEach(([roomId, room]) => {
        newCountdowns[roomId] = calculateTimeLeft(room.closesAt);
      });

      Object.entries(boards[10] || {}).forEach(([roomId, room]) => {
        newCountdowns[roomId] = calculateTimeLeft(room.closesAt);
      });

      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [boards]);

  const joinRandomBoardValue = async (amount) => {
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

      await handleJoinBoard(normalizedAmount, boardId);

      localStorage.setItem("joinedBoard", boardId);
      localStorage.setItem("betAmount", String(normalizedAmount));
    } catch (err) {
      console.error("joinRandomBoardValue error:", err);
      showErrorModal(
        "A network error occurred while looking for a random board.",
        "Random board unavailable"
      );
    }
  };

  useEffect(() => {
    if (playAgain) {
      closeModal();
      joinRandomBoardValue(playAgain.betAmount);
    }
  }, [playAgain]);

  const getValidBoards = (boardsForBet, countdowns) =>
    Object.entries(boardsForBet || {}).filter(
      ([roomId, room]) =>
        room.status !== "Concluded" && countdowns[roomId] !== null
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
                    <p className="mt-1 text-xl font-extrabold text-yellow-100">
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
}

const joinBoard = async (betAmount, boardId) => {
  try {
    const userId = localStorage.getItem("userID");
    const idToken = localStorage.getItem("idToken");

    if (!userId || !idToken) {
      return { error: "Your session has expired. Please log in again." };
    }

    const url = new URL("https://app-2wtihj5jvq-uc.a.run.app/joinBoard");
    url.searchParams.append("userId", userId);

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        boardId,
        betAmount,
      }),
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const data = isJson ? await res.json() : null;

    if (!res.ok) {
      return {
        error:
          data?.message ||
          data?.error ||
          "Unable to join board at the moment.",
      };
    }

    return {
      status: "success",
      boardId: data?.boardId ?? boardId,
    };
  } catch (err) {
    console.error("joinBoard error:", err);
    return { error: "A network error occurred while joining the board." };
  }
};

const randomBoardJoin = async (betAmount) => {
  try {
    const userId = localStorage.getItem("userID");
    const idToken = localStorage.getItem("idToken");

    if (!userId || !idToken) {
      return { error: "Your session has expired. Please log in again." };
    }

    const url = new URL("https://app-2wtihj5jvq-uc.a.run.app/randomBoardJoin");
    url.searchParams.append("userId", userId);

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        betAmount,
      }),
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const data = isJson ? await res.json() : null;
    console.log("randomBoardJoin response data:", data);
    if (!res.ok) {
      return {
        error:
          data?.message ||
          data?.error ||
          "Unable to find a random board right now.",
      };
    }

    return {
      status: "success",
      boardId: data?.data ?? null,
    };
  } catch (err) {
    console.error("randomBoardJoin error:", err);
    return { error: "A network error occurred while finding a random board." };
  }
};