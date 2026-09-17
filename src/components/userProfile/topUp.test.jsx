import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import TopUpModal from "./topUp";

test("validates a top-up before calling the payment API", async () => {
  const redirect = jest.fn();
  render(
    <TopUpModal
      open
      onClose={jest.fn()}
      wallet={{todayDeposited: 0, monthDeposited: 0}}
      onRedirectToPayment={redirect}
    />
  );
  fireEvent.change(screen.getByLabelText(/top-up amount/i), {target: {value: "5"}});
  fireEvent.click(screen.getByRole("button", {name: /proceed to pay/i}));
  expect(await screen.findByRole("alert")).toHaveTextContent(/minimum deposit/i);
  expect(redirect).not.toHaveBeenCalled();
});

test("locks the action while creating a valid checkout", async () => {
  const redirect = jest.fn(() => Promise.resolve());
  render(
    <TopUpModal
      open
      onClose={jest.fn()}
      wallet={{todayDeposited: 0, monthDeposited: 0}}
      onRedirectToPayment={redirect}
    />
  );
  fireEvent.change(screen.getByLabelText(/top-up amount/i), {target: {value: "50"}});
  fireEvent.click(screen.getByRole("button", {name: /proceed to pay/i}));
  await waitFor(() => expect(redirect).toHaveBeenCalledWith(50));
});
