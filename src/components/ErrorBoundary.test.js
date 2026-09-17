import {render, screen} from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

const Broken = () => {
  throw new Error("boom");
};

test("renders a recovery screen when a child crashes", () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  render(<ErrorBoundary><Broken /></ErrorBoundary>);
  expect(screen.getByRole("alert")).toHaveTextContent(/could not be displayed/i);
  spy.mockRestore();
});
