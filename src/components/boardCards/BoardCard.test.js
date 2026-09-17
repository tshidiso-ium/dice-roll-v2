import {fireEvent, render, screen} from "@testing-library/react";
import {BoardCard} from "./BoardCard";

const room = {
  bet: 5,
  stake: 5,
  players: {placeholder: "player 1", human: {participantType: "human"}},
};

test("submits an available board once with its stake and ID", () => {
  const join = jest.fn();
  render(
    <BoardCard
      roomId="board-1"
      room={room}
      countdowns={{"board-1": {minutes: 0, seconds: 12}}}
      handleJoinBoard={join}
    />
  );
  fireEvent.click(screen.getByRole("button", {name: /play now/i}));
  expect(join).toHaveBeenCalledWith(5, "board-1");
  expect(screen.getByText("1")).toBeInTheDocument();
});

test("disables repeat submission while a join is pending", () => {
  render(
    <BoardCard
      roomId="board-1"
      room={room}
      countdowns={{"board-1": {minutes: 0, seconds: 12}}}
      handleJoinBoard={jest.fn()}
      joining
    />
  );
  expect(screen.getByRole("button", {name: /joining/i})).toBeDisabled();
});
