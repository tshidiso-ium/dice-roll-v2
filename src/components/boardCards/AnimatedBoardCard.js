
import { BoardCard } from "./BoardCard";
const isBoardPlayable = (room, roomId, countdowns) =>
  room.status !== "Concluded" && countdowns[roomId] !== null;

export const AnimatedBoardCard = ({
  roomId,
  room,
  countdowns,
  handleJoinBoard
}) => {
  const playable = isBoardPlayable(room, roomId, countdowns);

  return (
    <div
      className={`
        transition-all duration-500 ease-in-out gap-6 
        ${playable
          ? "opacity-100 scale-100 translate-y-0 animate-board-in"
          : "opacity-0 scale-95 translate-y-2 pointer-events-none"}
      `}
    >
      {playable && (
        <BoardCard
          roomId={roomId}
          room={room}
          countdowns={countdowns}
          handleJoinBoard={handleJoinBoard}
        />
      )}
    </div>
  );
};