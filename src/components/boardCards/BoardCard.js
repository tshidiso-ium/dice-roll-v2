export function BoardCard ({ roomId, room, countdowns, handleJoinBoard }) {
    return (
    <form
        onSubmit={(e) => {
        e.preventDefault();
        handleJoinBoard(room.bet, roomId);
        }}
        className="min-w-[280px] bg-gradient-to-br from-[#330000] to-[#0a0000] 
                text-white p-4 rounded-2xl shadow-xl border border-yellow-500 
                relative my-auto flex-shrink-0"
    >
        <h2 className="text-center text-xl font-extrabold mb-2 text-yellow-400 drop-shadow-md">
        🎰 {roomId}
        </h2>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent my-2" />

        <p className="text-sm mb-1">
        💰 Bet Amount: <span className="font-bold">R{room.bet}</span>
        </p>

        <p className="text-sm mb-1">
        👥 Players:{" "}
        <span className="font-bold">
            {Object.keys(room.players || {}).length}
        </span>
        </p>

        <p className="text-sm mb-1">
        💵 Current Stake:{" "}
        <span className="font-bold">
            R{Number(room.bet || 0) * Object.keys(room.players || {}).length}
        </span>
        </p>

        <p className="text-sm mb-4">
        ⏱ Closing In:{" "}
        <span className="font-bold">
            {countdowns[roomId]
            ? `${countdowns[roomId].minutes}m ${countdowns[roomId].seconds}s`
            : "Countdown is over!"}
        </span>
        </p>

        <button
        type="submit"
        disabled={!countdowns[roomId]}
        className={
            countdowns[roomId]
            ? "w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:brightness-125 text-black font-bold py-2 rounded-xl shadow-md transition-transform hover:-translate-y-1"
            : "w-full bg-gray-300 text-gray-500 font-bold py-2 rounded-xl shadow-md cursor-not-allowed"
        }
        >
        PLAY NOW
        </button>

        <div
        className={
            countdowns[roomId]
            ? "absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 animate-ping"
            : "absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500"
        }
        />
    </form>
    )
};
