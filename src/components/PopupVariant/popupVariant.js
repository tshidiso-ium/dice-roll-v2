import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, RefreshCw } from "lucide-react";
import { Label } from "../../components/ui/label";
import { cn } from "../utils/cn";

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalMotion = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    transition: {
      duration: 0.18,
    },
  },
};

const BET_OPTIONS = ["R5", "R10", "R15", "R20", "R25", "R30", "R35", "R40"];

const PlayAgain = ({ modalState, joinRandomBoard }) => {
  const [selectedOption, setSelectedOption] = useState("R5");

  const isWinner = modalState?.id === modalState?.winer?.playerId;

  const heading = useMemo(() => {
    return isWinner ? "Jackpot Victory" : "Play Another Round";
  }, [isWinner]);

  const subheading = useMemo(() => {
    return isWinner
      ? "You came out on top. Raise the stakes and go again."
      : "Choose your bet and jump straight back into the action.";
  }, [isWinner]);

  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value);
  };

  function clearGameStorage() {
    try {
      localStorage.removeItem("joinedBoard");
      localStorage.removeItem("betAmount");
    } catch (err) {
      console.error("Error clearing localStorage", err);
    }
  }

  const handleSubmit = () => {
    clearGameStorage();
    joinRandomBoard({ playAgain: true, betAmount: selectedOption });
  };

  const handleCancel = () => {
    clearGameStorage();
    joinRandomBoard(0);
  };

  if (!modalState?.showModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
        variants={backdrop}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div
          variants={modalMotion}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-yellow-500/30 bg-gradient-to-b from-[#2a0505] via-[#140909] to-black shadow-[0_25px_80px_rgba(0,0,0,0.65)]"
        >
          {/* top shine */}
          <div className="h-[3px] w-full bg-gradient-to-r from-yellow-700 via-yellow-300 to-yellow-700" />

          {/* glow background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.16),transparent_35%),radial-gradient(circle_at_bottom,rgba(220,38,38,0.18),transparent_45%)]" />

          {/* close */}
          <button
            onClick={handleCancel}
            aria-label="Close modal"
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-yellow-500/20 bg-white/5 text-yellow-200 transition hover:bg-red-700/30 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="relative z-10 p-6 sm:p-7">
            {/* header */}
            <div className="mb-5 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl border shadow-inner",
                  isWinner
                    ? "border-yellow-400/40 bg-gradient-to-br from-yellow-300/20 to-red-700/20 text-yellow-300"
                    : "border-red-500/30 bg-gradient-to-br from-red-500/20 to-black text-red-300"
                )}
              >
                {isWinner ? <Trophy size={24} /> : <RefreshCw size={22} />}
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-yellow-500/70">
                  {isWinner ? "Winner's Table" : "High Stakes"}
                </p>
                <h2 className="font-extrabold tracking-tight text-yellow-100">
                  {heading}
                </h2>
              </div>
            </div>

            <p className="text-xs leading-6 text-yellow-100/75">{subheading}</p>

            {modalState?.text && (
              <p className="mt-3 text-xs leading-6 text-yellow-200/65">
                {modalState.text}
              </p>
            )}

            {modalState?.title && (
              <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-white/[0.04] px-4 py-3">
                <p className="text-xs font-medium text-yellow-100/90">
                  {modalState.title}
                </p>
              </div>
            )}

            <LabelInputContainer className="mt-6">
              <Label
                htmlFor="betAmount"
                className="text-[9px] font-bold uppercase tracking-[0.2em] text-yellow-400/80"
              >
                Select Your Bet
              </Label>

              <div className="relative">
                <select
                  id="betAmount"
                  name="betAmount"
                  value={selectedOption}
                  onChange={handleSelectChange}
                  className="h-14 w-full appearance-none rounded-2xl border border-yellow-500/25 bg-black/40 px-4 pr-12 text-base font-bold text-yellow-100 outline-none transition focus:border-yellow-400 focus:shadow-[0_0_0_3px_rgba(250,204,21,0.12)]"
                >
                  {BET_OPTIONS.map((value) => (
                    <option key={value} value={value} className="bg-[#180909]">
                      {value}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400">
                  ▼
                </div>
              </div>
            </LabelInputContainer>

            {/* stake card */}
            <div className="mt-5 rounded-2xl border border-yellow-500/25 bg-gradient-to-r from-yellow-500/10 via-red-600/10 to-yellow-500/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-yellow-400/80">
                Current Stake
              </p>
              <p className="mt-1 text-2xl font-extrabold text-yellow-100">
                {selectedOption}
              </p>
            </div>

            {/* actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="h-12 rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-950 to-red-900/60 text-sm font-bold text-red-100 transition hover:brightness-110"
              >
                {isWinner ? "Cash Out" : "Leave Table"}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="h-12 rounded-2xl bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 text-sm font-extrabold text-[#2b1200] shadow-[0_12px_30px_rgba(250,204,21,0.28)] transition hover:-translate-y-[1px] hover:brightness-105"
              >
                Play Again
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

export default PlayAgain;